import { shippingDestinationCookie, type ShippingDestination } from '#shared/utils/checkout-shipping'

export function useShippingDestination(siteSlug: string) {
  return useCookie<ShippingDestination | null>(shippingDestinationCookie(siteSlug), {
    default: () => null,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}
