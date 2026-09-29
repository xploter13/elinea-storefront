import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatInput, maskSelection, vMask } from './input-mask.ts'

for (const [mask, input, expected] of [
  ['phone', '11987654321', '(11) 98765-4321'],
  ['phone', '1134567890', '(11) 3456-7890'],
  ['phone', '+55 (11) 98765-4321', '+55 (11) 98765-4321'],
  ['phone', '+1 202 555 0123', '+12025550123'],
  ['cpf', '12345678901', '123.456.789-01'],
  ['cpf', 'abc123.456.789-01999', '123.456.789-01'],
  ['zipcode', '01234567', '01234-567'],
  ['zipcode', '01234-567', '01234-567'],
  ['card', '4111111111111111', '4111 1111 1111 1111'],
  ['card', '378282246310005', '3782 822463 10005'],
  ['card', '1234567890123456789', '1234 5678 9012 3456 789'],
  ['expiry', '1229', '12/29'],
  ['cvv', '0123xyz4', '0123'],
  ['otp', '012 345678', '012345'],
  ['cpf', '1234', '123.4'],
  ['zipcode', '01234', '01234'],
]) {
  test(`${mask}: ${input}`, () => {
    assert.equal(formatInput(input, mask), expected)
    assert.equal(formatInput(expected, mask), expected)
  })
}

test('empty fields stay empty', () => {
  for (const mask of ['phone', 'cpf', 'zipcode', 'card', 'expiry', 'cvv', 'otp']) {
    assert.equal(formatInput('', mask), '')
  }
})

test('caret follows digits during middle insertion and separator deletion', () => {
  assert.deepEqual(maskSelection('1234.56', 4, 'cpf'), { value: '123.456', cursor: 5 })
  assert.deepEqual(maskSelection('123456', 3, 'cpf'), { value: '123.456', cursor: 3 })
  assert.deepEqual(maskSelection('', 0, 'cpf'), { value: '', cursor: 0 })
})

test('directive formats input before v-model and handles loading and cleanup', () => {
  const handlers = new Map()
  const element = {
    value: '11987654321', selectionStart: 11, dataset: {},
    addEventListener(type, handler, capture) { assert.equal(capture, true); handlers.set(type, handler) },
    removeEventListener(type, handler) { assert.equal(handlers.get(type), handler); handlers.delete(type) },
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end },
  }
  vMask.created(element, { value: 'phone' })
  vMask.mounted(element, { value: 'phone' })
  assert.equal(element.value, '(11) 98765-4321')
  element.value = '1134567890'
  vMask.updated(element, { value: 'phone' })
  assert.equal(element.value, '(11) 3456-7890')
  element.value = '11987654321'
  handlers.get('input')({ isComposing: false })
  assert.equal(element.value, '(11) 98765-4321')
  element.value = 'composing'
  handlers.get('input')({ isComposing: true })
  assert.equal(element.value, 'composing')
  vMask.beforeUnmount(element)
  assert.equal(handlers.size, 0)
})

test('SSR formats saved values', () => {
  assert.deepEqual(vMask.getSSRProps({ value: 'phone' }, { props: { value: '11987654321' } }), { value: '(11) 98765-4321' })
})

test('compiled SSR can call the directive without a vnode', () => {
  assert.deepEqual(vMask.getSSRProps({ value: 'phone' }, null), {})
})
