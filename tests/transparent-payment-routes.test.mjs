import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transpileModule, ModuleKind } from 'typescript'
import { ref } from 'vue'

globalThis.defineEventHandler = handler => handler
globalThis.readBody = async event => event.body
globalThis.getRouterParam = (event, name) => event.params?.[name]
globalThis.setResponseHeader = (event, name, value) => { event.headers ??= {}; event.headers[name] = value }
globalThis.createServerElineaClient = event => event.client
globalThis.rethrowElineaError = error => { throw error }
globalThis.createError = details => Object.assign(new Error(details.message), details)

async function handler(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } }).outputText
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default
}
const create = await handler('../server/api/payment/transparent.post.ts')
const configuration = await handler('../server/api/payment/configuration/[id].get.ts')
const get = await handler('../server/api/payment/transparent/[orderId]/[paymentId].get.ts')
const attempt = { orderId: 42, paymentMethodId: 7, idempotencyKey: 'b507c320-5b12-44bb-a2ac-4db2ca31ef87', type: 'PIX' }

test('creates transparent payments through the SDK without initiating hosted checkout', async () => {
  const calls = []
  const event = { body: attempt, client: { payments: { createTransparent: async (id, body) => { calls.push([id, body]); return { id: 'hash', type: body.type, pix: { code: 'pix-code' } } } } } }
  assert.equal((await create(event)).data.pix.code, 'pix-code')
  assert.deepEqual(calls[0], [42, attempt])
})

test('rejects raw card data, client amounts and malformed attempts before the SDK call', async () => {
  let calls = 0
  const client = { payments: { createTransparent: async () => calls++ } }
  for (const body of [null, { ...attempt, amount: 1 }, { ...attempt, orderId: -1 }, { ...attempt, type: 'DEBIT_CARD' }, { ...attempt, idempotencyKey: 'invalid' }, { ...attempt, type: 'CREDIT_CARD', card: { number: '4111111111111111', cvv: '123' } }, { ...attempt, type: 'BOLETO' }]) {
    await assert.rejects(() => create({ body, client }), { statusCode: 422 })
  }
  assert.equal(calls, 0)
})

test('loads public configuration and payment status without caching', async () => {
  const calls = []
  const client = { payments: {
    checkoutConfiguration: async id => { calls.push(['configuration', id]); return { publicKey: 'public-key' } },
    getTransparent: async (id, hash) => { calls.push(['get', id, hash]); return { status: 'paid' } },
  } }
  const configEvent = { params: { id: '7' }, client }
  assert.equal((await configuration(configEvent)).data.publicKey, 'public-key')
  assert.equal(configEvent.headers['Cache-Control'], 'no-store, max-age=0')
  const getEvent = { params: { orderId: '42', paymentId: 'payment-hash' }, client }
  assert.equal((await get(getEvent)).data.status, 'paid')
  assert.equal(getEvent.headers['Cache-Control'], 'no-store, max-age=0')
  assert.deepEqual(calls, [['configuration', 7], ['get', 42, 'payment-hash']])
  await assert.rejects(() => get({ params: { orderId: '42', paymentId: '../other' }, client }), { statusCode: 422 })
})

test('preserves gateway errors so the customer can retry the same attempt', async () => {
  const error = Object.assign(new Error('Tente novamente com a mesma tentativa.'), { statusCode: 502 })
  await assert.rejects(() => create({ body: attempt, client: { payments: { createTransparent: async () => { throw error } } } }), { statusCode: 502 })
})

test('Mercado Pago mounts secure fields and emits only the tokenized card', async () => {
  const source = await readFile(new URL('../app/components/MercadoPagoCardForm.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  let mount
  let unmount
  let interval
  let options
  let destroyed = false
  const emitted = []
  const timers = { setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval }
  globalThis.ref = ref
  globalThis.defineProps = () => ({ publicKey: 'public-key', amount: 68.5, busy: false, maxInstallments: 6, email: 'customer@example.test' })
  globalThis.defineEmits = () => (...args) => emitted.push(args)
  globalThis.onMounted = callback => { mount = callback }
  globalThis.onBeforeUnmount = callback => { unmount = callback }
  globalThis.window = { MercadoPago: class { cardForm(input) {
    options = input
    return { getCardFormData: () => ({ token: 'card-token', paymentMethodId: 'visa', cardNumber: 'never-send', securityCode: 'never-send' }), unmount: () => { destroyed = true } }
  } } }
  globalThis.setInterval = callback => { interval = callback; return 1 }
  globalThis.clearInterval = () => {}
  const stub = `data:text/javascript;base64,${Buffer.from('export async function loadPaymentScript() {}').toString('base64')}`
  const code = transpileModule(script + '\nexport { form, loading }', { compilerOptions: { module: ModuleKind.ESNext } }).outputText.replace("'~/utils/payment-script'", JSON.stringify(stub))
  try {
    const component = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
    await mount()
    assert.equal(options.iframe, true)
    for (const field of ['issuer', 'installments', 'identificationType', 'cardNumber', 'expirationDate', 'securityCode']) assert.ok(options.form[field].id)
    component.form.value = { querySelector: () => ({}) }
    interval()
    assert.equal(component.loading.value, false)
    options.callbacks.onSubmit({ preventDefault() {} })
    assert.deepEqual(emitted, [['tokenized', { token: 'card-token', paymentMethodId: 'visa' }, 1]])
    unmount()
    assert.equal(destroyed, true)
  } finally { globalThis.setInterval = timers.setInterval; globalThis.clearInterval = timers.clearInterval }
})
