import type { StoreCategory, StoreProduct } from '#shared/types/storefront'

export function categoryBranchIds(categoryId: number, categories: StoreCategory[]): Set<number> {
  const children = new Map<number, number[]>()
  for (const category of categories) {
    if (category.parent_id === null) continue
    const siblings = children.get(category.parent_id) || []
    siblings.push(category.id)
    children.set(category.parent_id, siblings)
  }

  const ids = new Set<number>()
  const pending = [categoryId]
  while (pending.length) {
    const id = pending.pop()!
    if (ids.has(id)) continue
    ids.add(id)
    pending.push(...(children.get(id) || []))
  }
  return ids
}

export function productsInCategory(
  categoryId: number,
  categories: StoreCategory[],
  products: StoreProduct[],
): StoreProduct[] {
  const ids = categoryBranchIds(categoryId, categories)
  return products.filter(product => product.categories.some(category => ids.has(category.id)))
}
