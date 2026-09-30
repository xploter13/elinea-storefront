export interface DeliveryOption {
  provider: string
  serviceCode: string
  serviceName: string
  price: number
  deadlineText: string
}

export function shippingContext(zipcode: string, items: Array<{ product_id: number, quantity: number }>): string {
  return JSON.stringify([zipcode.replace(/\D/g, ''), items.map(item => [item.product_id, item.quantity]).sort((a, b) => a[0]! - b[0]!)])
}

export function selectShippingOption(options: DeliveryOption[], provider: string, serviceCode: string, expectedPrice: number): DeliveryOption {
  const selected = options.find(option => option.provider === provider && option.serviceCode === serviceCode)
  if (!selected) throw new Error('A entrega selecionada não está mais disponível. Calcule o frete novamente.')
  if (!Number.isFinite(expectedPrice) || Math.round(selected.price * 100) !== Math.round(expectedPrice * 100)) {
    throw new Error('O preço da entrega mudou. Calcule o frete novamente antes de confirmar.')
  }
  return selected
}

export function checkoutTotal(total: number, shipping: number): number {
  return Math.round((total + shipping) * 100) / 100
}

export interface ShippingDestination {
  zipcode: string
  provider: string
  serviceCode: string
}

export function shippingDestinationCookie(siteSlug: string): string {
  return `elinea_shipping_${encodeURIComponent(siteSlug)}`
}

export function preferredShippingOption<T extends DeliveryOption>(options: T[], destination?: ShippingDestination | null): T | null {
  const preferred = options.find(option => option.provider === destination?.provider && option.serviceCode === destination?.serviceCode)
  return preferred || [...options].sort((a, b) => a.price - b.price)[0] || null
}
