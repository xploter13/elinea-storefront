import assert from 'node:assert/strict'
import { test } from 'node:test'
import { categoryBranchIds, productsInCategory } from './category-products.ts'

const category = (id, parent_id = null) => ({ id, parent_id })
const categories = [category(1), category(2, 1), category(3, 2), category(4)]
const product = (id, ...categoryIds) => ({ id, categories: categoryIds.map(categoryId => ({ id: categoryId })) })
const products = [
  product(10, 1),
  product(11, 2),
  product(12, 3),
  product(13, 1, 3),
  product(14, 4),
]

test('parent categories include descendants without duplicating products', () => {
  assert.deepEqual([...categoryBranchIds(1, categories)].sort(), [1, 2, 3])
  assert.deepEqual(productsInCategory(1, categories, products).map(item => item.id), [10, 11, 12, 13])
})

test('leaf categories only include their own products', () => {
  assert.deepEqual(productsInCategory(3, categories, products).map(item => item.id), [12, 13])
  assert.deepEqual(productsInCategory(4, categories, products).map(item => item.id), [14])
})

test('cyclic parent references do not loop forever', () => {
  assert.deepEqual([...categoryBranchIds(1, [category(1, 2), category(2, 1)])].sort(), [1, 2])
})
