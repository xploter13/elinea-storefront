import type { StoreProduct, StorefrontPayload } from '#shared/types/storefront'
import { formatMoney } from '@elinea/ui/storefront'

export function useStorefrontCatalog(storefront?: Pick<StorefrontPayload, 'categories'>) {
  const money = (value: number) => formatMoney(value)
  const productImage = (product?: StoreProduct) => product?.image_path || product?.variations?.find(variation => variation.image_path)?.image_path || null
  const usePlaceholder = (event: Event) => {
    const image = event.currentTarget
    if (!(image instanceof HTMLImageElement) || image.src.endsWith('/images/placeholders/product-default.png')) return
    image.src = '/images/placeholders/product-default.png'
  }
  const discount = (product: StoreProduct) => product.original_price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : 0
  const activeCategories = computed(() => storefront?.categories.filter(category => category.is_active) ?? [])

  return { money, productImage, usePlaceholder, discount, activeCategories }
}
