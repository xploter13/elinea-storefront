import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transpileModule, ModuleKind } from 'typescript'

// Exercise the real Nitro handlers with the SDK boundary replaced by a test client.
globalThis.defineEventHandler = handler => handler
globalThis.readBody = async event => event.body
globalThis.persistCartSession = event => { event.sessionPersisted = true }
globalThis.createServerElineaClient = event => event.client
globalThis.rethrowElineaError = error => { throw error }
globalThis.createError = details => Object.assign(new Error(details.message), details)

async function loadHandler(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const helperUrl = new URL('../shared/utils/checkout-shipping.ts', import.meta.url).href
  const code = transpileModule(source, { compilerOptions: { module: ModuleKind.ESNext } }).outputText
    .replace("'../../shared/utils/checkout-shipping'", JSON.stringify(helperUrl))
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default
}
const quote = await loadHandler('../server/api/shipping/quote.post.ts')
const checkout = await loadHandler('../server/api/checkout.post.ts')
const option = { provider: 'correios', serviceCode: '03298', serviceName: 'PAC', price: 18.5, deadlineText: '5 dias úteis' }
function fixture() {
  const calls = []
  const event = { body: { customer: { name: 'Cliente', email: 'cliente@example.com' }, shippingAddress: { zipcode: '01001-000', street: 'Rua Teste', number: '1', city: 'São Paulo', state: 'SP', complement: 'Apto 2', district: 'Centro' }, shippingProvider: 'correios', shippingServiceCode: '03298', shippingTotal: 18.5 }, client: {
    cart: { get: async () => ({ items: [{ productId: 10, quantity: 2 }] }) },
    checkout: {
      calculateShipping: async input => { calls.push(['quote', input]); return [option] },
      createOrder: async input => { calls.push(['order', input]); return { id: 1, number: 'TEST-1', shippingTotal: input.shippingTotal, total: 109.5 } },
    },
  } }
  return { event, calls }
}
test('checkout quotes the server cart and creates an order with the verified freight', async () => {
  const { event, calls } = fixture()
  const response = await checkout(event)
  assert.equal(event.sessionPersisted, true)
  assert.deepEqual(calls[0][1].items, [{ productId: 10, quantity: 2 }])
  assert.equal(calls[1][1].shippingTotal, 18.5)
  assert.equal(calls[1][1].shippingProvider, 'correios')
  assert.match(calls[1][1].notes, /PAC \(03298\)/)
  assert.match(calls[1][1].notes, /Apto 2/)
  assert.equal(response.data.total, 109.5)
})
test('checkout rejects changed price or unavailable service without creating an order', async () => {
  for (const body of [{ shippingTotal: 0 }, { shippingServiceCode: 'unavailable' }]) {
    const { event, calls } = fixture()
    Object.assign(event.body, body)
    await assert.rejects(() => checkout(event), { statusCode: 422 })
    assert.equal(calls.some(([name]) => name === 'order'), false)
  }
})
test('checkout rejects empty cart and forwards API validation failure', async () => {
  const { event, calls } = fixture()
  event.client.cart.get = async () => ({ items: [] })
  await assert.rejects(() => checkout(event), { statusCode: 422 })
  assert.equal(calls.length, 0)
  const failed = fixture().event
  failed.client.checkout.createOrder = async () => { throw Object.assign(new Error('E-mail inválido'), { statusCode: 422 }) }
  await assert.rejects(() => checkout(failed), /E-mail inválido/)
})
test('shipping quote supports current checkout cart and standalone product estimation', async () => {
  const { event, calls } = fixture()
  event.body = { provider: 'correios', zipcode: '01001-000' }
  await quote(event)
  assert.deepEqual(calls[0][1].items, [{ productId: 10, quantity: 2 }])
  event.body.items = [{ productId: 99, quantity: 1 }]
  await quote(event)
  assert.deepEqual(calls[1][1].items, [{ productId: 99, quantity: 1 }])
})
test('shipping quote rejects invalid CEP and quantities', async () => {
  const { event } = fixture()
  event.body = { provider: 'correios', zipcode: '123' }
  await assert.rejects(() => quote(event), { statusCode: 422 })
  event.body = { provider: 'correios', zipcode: '01001000', items: [{ productId: 1, quantity: 0 }] }
  await assert.rejects(() => quote(event), { statusCode: 422 })
})
