import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shippingContext, selectShippingOption, checkoutTotal } from '../shared/utils/checkout-shipping.ts'

const options = [
  { provider: 'correios', serviceCode: '03298', serviceName: 'PAC', price: 18.5, deadlineText: '5 dias úteis' },
  { provider: 'correios', serviceCode: '03220', serviceName: 'SEDEX', price: 30, deadlineText: '2 dias úteis' },
]

test('delivery selection preserves service and quoted amount, including free delivery', () => {
  assert.equal(selectShippingOption(options, 'correios', '03298', 18.5), options[0])
  assert.equal(selectShippingOption(options, 'correios', '03220', 30), options[1])
  const free = [{ ...options[0], price: 0 }]
  assert.equal(selectShippingOption(free, 'correios', '03298', 0).price, 0)
})
test('rejects altered prices and unavailable delivery before creating an order', () => {
  for (const price of [0, 18, NaN, Infinity]) assert.throws(() => selectShippingOption(options, 'correios', '03298', price), /preço/)
  assert.throws(() => selectShippingOption(options, 'other', '03298', 18.5), /disponível/)
  assert.throws(() => selectShippingOption([], 'correios', '03298', 18.5), /disponível/)
})
test('changing CEP, product or quantity invalidates the shipping context', () => {
  const items = [{ product_id: 1, quantity: 2 }, { product_id: 2, quantity: 1 }]
  const initial = shippingContext('01001-000', items)
  assert.equal(initial, shippingContext('01001000', [...items].reverse()))
  assert.notEqual(initial, shippingContext('20000000', items))
  assert.notEqual(initial, shippingContext('01001000', [{ product_id: 1, quantity: 3 }]))
  assert.notEqual(initial, shippingContext('01001000', [{ product_id: 3, quantity: 2 }]))
})
test('order summary adds selected shipping to cart total with cent precision', () => {
  assert.equal(checkoutTotal(91, 18.5), 109.5)
  assert.equal(checkoutTotal(91, 0), 91)
  assert.equal(checkoutTotal(0.1, 0.2), 0.3)
})
