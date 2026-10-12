import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { transpileModule } from 'typescript'
import { newPaymentAttemptKey, transparentCheckoutDestination, transparentPaymentTypes } from '../shared/utils/checkout-payment.ts'

test('routes each configured payment type to a local checkout page with the selected provider', () => {
  for (const type of transparentPaymentTypes) {
    assert.deepEqual(transparentCheckoutDestination(42, { id: 7, methods: [type.code] }), {
      path: `/pagamento/checkout/42/${type.slug}`, query: { metodo: 7 },
    })
  }
})

test('does not create destinations for invalid orders, providers or unsupported methods', () => {
  for (const id of [0, -1, NaN, 1.5]) {
    assert.throws(() => transparentCheckoutDestination(id, { id: 7, methods: ['PIX'] }))
    assert.throws(() => transparentCheckoutDestination(42, { id, methods: ['PIX'] }))
  }
  for (const methods of [[], ['UNKNOWN']]) assert.throws(() => transparentCheckoutDestination(42, { id: 7, methods }))
})

test('checkout navigation does not initiate a payment or leave the storefront', async () => {
  const source = await readFile(new URL('../app/components/BasePayment.vue', import.meta.url), 'utf8')
  const script = source.match(/async function openCheckout\(\) \{([\s\S]*?)\n\}/)[1]
  const destinations = []
  const body = transpileModule(`async function run() {${script}}`, {}).outputText
  const openCheckout = new Function('selectedPaymentMethod', 'paid', 'orderId', 'navigateTo', 'transparentCheckoutDestination', 'errorMessage', `${body}; return run`)
  const run = openCheckout({ value: { id: 7, methods: ['PIX'] } }, { value: false }, 42, async value => destinations.push(value), transparentCheckoutDestination, { value: '' })
  await run()
  assert.equal(destinations[0].path, '/pagamento/checkout/42/pix')
  assert.match(source, /@submit\.prevent="openCheckout"/)
  assert.doesNotMatch(script, /\$fetch|external/)
  const paidRun = openCheckout({ value: { id: 7, methods: ['PIX'] } }, { value: true }, 42, async value => destinations.push(value), transparentCheckoutDestination, { value: '' })
  await paidRun()
  assert.equal(destinations.length, 1)
})

test('generates valid attempt keys on local HTTP domains without randomUUID', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto')
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: { getRandomValues: bytes => bytes.fill(0) } })
  try { assert.equal(newPaymentAttemptKey(), '00000000-0000-4000-8000-000000000000') }
  finally { Object.defineProperty(globalThis, 'crypto', descriptor) }
})
