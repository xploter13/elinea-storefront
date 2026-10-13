import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transpileModule, ModuleKind } from 'typescript'
import { ref, computed, reactive } from 'vue'

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
  let options
  let destroyed = false
  const emitted = []
  globalThis.ref = ref
  globalThis.defineProps = () => ({ publicKey: 'public-key', amount: 68.5, busy: false, maxInstallments: 6, email: 'customer@example.test' })
  globalThis.defineEmits = () => (...args) => emitted.push(args)
  globalThis.onMounted = callback => { mount = callback }
  globalThis.onBeforeUnmount = callback => { unmount = callback }
  globalThis.window = { MercadoPago: class { cardForm(input) {
    options = input
    return { getCardFormData: () => ({ token: 'card-token', paymentMethodId: 'visa', installments: '3', cardNumber: 'never-send', securityCode: 'never-send' }), unmount: () => { destroyed = true } }
  } } }
  const stub = `data:text/javascript;base64,${Buffer.from('export async function loadPaymentScript() {}').toString('base64')}`
  const code = transpileModule(script + '\nexport { loading, initializationError, errorMessage }', { compilerOptions: { module: ModuleKind.ESNext } }).outputText.replace("'~/utils/payment-script'", JSON.stringify(stub))
  const component = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  await mount()
  assert.equal(options.iframe, true)
  for (const field of ['issuer', 'installments', 'identificationType', 'cardNumber', 'expirationDate', 'securityCode']) assert.ok(options.form[field].id)
  assert.equal(component.loading.value, true)
  options.callbacks.onReady()
  assert.equal(component.loading.value, false)
  options.callbacks.onSubmit({ preventDefault() {} })
  assert.deepEqual(emitted, [['tokenized', { token: 'card-token', paymentMethodId: 'visa' }, 3]])
  options.callbacks.onError(new Error('token failed'), 'onCardTokenReceived')
  assert.match(component.errorMessage.value, /validar o cartão/)
  options.callbacks.onError(new Error('iframe failed'), 'onIframeLoad')
  assert.equal(component.initializationError.value, true)
  assert.match(component.errorMessage.value, /campos seguros/)
  unmount()
  assert.equal(destroyed, true)
})


test('credit remains selected without a public key and mounts the secure form when configured', async () => {
  const source = await readFile(new URL('../app/components/TransparentPaymentOptions.vue', import.meta.url), 'utf8')
  const script = source.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]
  let mount
  globalThis.ref = ref
  globalThis.CreditCard = {}
  globalThis.QrCode = {}
  globalThis.ReceiptText = {}
  globalThis.computed = computed
  globalThis.reactive = reactive
  globalThis.defineProps = () => ({ orderId: 7, method: { id: 2 }, siteSlug: 'store', amount: 68.5 })
  globalThis.defineEmits = () => () => {}
  globalThis.useRoute = () => ({ params: { tipo: 'cartao' } })
  globalThis.useCookie = () => ref({})
  globalThis.onMounted = callback => { mount = callback }
  globalThis.onBeforeUnmount = () => {}
  globalThis.$fetch = async () => ({ data: { provider: 'mercado_pago', publicKey: null, methods: ['PIX', 'CREDIT_CARD'], maxInstallments: 12 } })
  const helper = await readFile(new URL('../shared/utils/checkout-payment.ts', import.meta.url), 'utf8')
  const helperUrl = `data:text/javascript;base64,${Buffer.from(transpileModule(helper, { compilerOptions: { module: ModuleKind.ESNext } }).outputText).toString('base64')}`
  const code = transpileModule(script.replace(/^import .* from '(?!#shared)[^']+'$/gm, '') + '\nexport { configuration, options, selected, loading }', { compilerOptions: { module: ModuleKind.ESNext } }).outputText.replace("'#shared/utils/checkout-payment'", JSON.stringify(helperUrl))
  const component = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  await mount()
  assert.equal(component.loading.value, false)
  assert.equal(component.selected.value.code, 'CREDIT_CARD')
  assert.deepEqual(component.options.value.map(option => option.code), ['CREDIT_CARD', 'PIX'])
  assert.equal(component.configuration.value.publicKey, null)
  assert.match(source, /selected.code === 'CREDIT_CARD' && configuration\?\.publicKey/)
  assert.match(source, /v-else-if="selected.code === 'CREDIT_CARD'" class="availability"/)
  component.configuration.value.publicKey = 'configured-public-key'
  assert.ok(component.selected.value && component.configuration.value.publicKey)
})
