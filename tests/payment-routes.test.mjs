import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transpileModule, ModuleKind } from 'typescript'
import { canResumePayment, hostedPaymentUrl, isValidCpf, paymentMethodsLabel } from '../shared/utils/checkout-payment.ts'

globalThis.defineEventHandler = handler => handler
globalThis.readBody = async event => event.body
globalThis.createServerElineaClient = event => event.client
globalThis.rethrowElineaError = error => { throw error }
globalThis.createError = details => Object.assign(new Error(details.message), details)
globalThis.useRuntimeConfig = () => ({ trustProxyHeaders: false })
globalThis.getRequestURL = event => new URL(event.requestUrl)
const source = await readFile(new URL('../server/api/payment/index.post.ts', import.meta.url), 'utf8')
const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } }).outputText
const pay = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default
function fixture() {
  const calls = []
  const event = { requestUrl: 'https://loja.example.test/api/payment', body: { orderId: 1, paymentMethodId: 7, idempotencyKey: 'b507c320-5b12-44bb-a2ac-4db2ca31ef87', returnUrl: 'https://attacker.example' }, client: {
    orders: { get: async () => ({ id: 1, billingStatus: 'pending' }) },
    payments: { methods: async () => [{ id: 7 }], createHosted: async (id, input) => { calls.push([id, input]); return { redirectUrl: 'https://pagamento.pagbank.com.br/test', amount: 68.5 } } },
  } }
  return { event, calls }
}
test('uses SDK payment contract and creates return URL from the storefront origin', async () => {
  const { event, calls } = fixture()
  const result = await pay(event)
  assert.equal(result.data.amount, 68.5)
  assert.equal(calls[0][0], 1)
  assert.equal(calls[0][1].returnUrl, 'https://loja.example.test/pagamento/1?retorno=1')
  assert.equal(calls[0][1].idempotencyKey, event.body.idempotencyKey)
})
test('rejects payment when no integration is available or order is already paid', async () => {
  const { event, calls } = fixture()
  event.client.payments.methods = async () => []
  await assert.rejects(() => pay(event), { statusCode: 422 })
  event.client.orders.get = async () => ({ id: 1, billingStatus: 'paid' })
  await assert.rejects(() => pay(event), { statusCode: 422 })
  assert.equal(calls.length, 0)
})
test('does not start payment for inaccessible orders or invalid attempt IDs', async () => {
  const { event, calls } = fixture()
  event.client.orders.get = async () => { throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 }) }
  await assert.rejects(() => pay(event), { statusCode: 404 })
  event.body.idempotencyKey = 'invalid'
  await assert.rejects(() => pay(event), { statusCode: 422 })
  assert.equal(calls.length, 0)
})
test('validates CPF and displays only configured method labels', () => {
  assert.equal(isValidCpf('529.982.247-25'), true)
  for (const cpf of ['11111111111', '52998224724', '123', '']) assert.equal(isValidCpf(cpf), false)
  assert.equal(paymentMethodsLabel(['PIX', 'CREDIT_CARD']), 'Pix · Cartão de crédito')
  assert.equal(paymentMethodsLabel(['BOLETO']), 'Boleto')
})
test('requires a valid hosted payment destination', () => {
  assert.equal(hostedPaymentUrl('https://pagamento.pagbank.com.br/test'), 'https://pagamento.pagbank.com.br/test')
  for (const url of [null, 'javascript:alert(1)', 'http://unsafe.example', 'https://user:password@example.com']) assert.throws(() => hostedPaymentUrl(url))
})

test('allows customers to resume only pending or failed payments', () => {
  assert.equal(canResumePayment('pending'), true)
  assert.equal(canResumePayment('failed'), true)
  assert.equal(canResumePayment(null, 'pending'), true)
  assert.equal(canResumePayment(undefined, 'pending'), true)
  assert.equal(canResumePayment('paid', 'pending'), false)
  for (const status of ['paid', 'refunded', 'processing', null, undefined]) assert.equal(canResumePayment(status), false)
})
