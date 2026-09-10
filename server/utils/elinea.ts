import { AuthenticationError, createElineaClient, ElineaError, NotFoundError, ValidationError, type AnalyticsConfiguration, type Cart, type Category, type Product, type Store } from '@elinea/sdk'
import type { H3Event } from 'h3'
import type { StoreCart } from '#shared/types/commerce'
import type { StoreCategory, StoreProduct, StoreSite } from '#shared/types/storefront'

export function createServerElineaClient(event: H3Event) {
  const config = useRuntimeConfig(event)
  const storeDomain = resolveStoreDomain(event, String(config.elineaStoreSite || 'default'), config.trustProxyHeaders)
  const authorization = getRequestHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '').trim() || getCookie(event, 'elinea_customer_token')
  const cartSession = getRequestHeader(event, 'x-cart-session')?.trim() || getCookie(event, 'elinea_cart_session')

  return createElineaClient({
    baseUrl: config.apiBase,
    ...(storeDomain.includes('.') ? { storeDomain } : { site: storeDomain }),
    getAccessToken: () => authorization,
    getCartSession: () => cartSession,
  }) as any
}

export function rethrowElineaError(error: unknown): never {
  if (!(error instanceof ElineaError)) throw error
  const statusCode = error instanceof NotFoundError ? 404 : error instanceof ValidationError ? 422 : error instanceof AuthenticationError ? (error.status || 401) : (error.status || 502)
  throw createError({ statusCode, statusMessage: error.message, message: error.message, data: error.details })
}

export function persistCartSession(event: H3Event) {
  const session = getRequestHeader(event, 'x-cart-session')?.trim()
  if (session) setCookie(event, 'elinea_cart_session', session, { sameSite: 'lax', secure: !import.meta.dev, path: '/', maxAge: 60 * 60 * 24 * 30 })
}

export const toLegacyCategory = (category: Category): StoreCategory => ({ id: category.id, parent_id: category.parentId, name: category.name, slug: category.slug, description: category.description, priority: category.priority, is_active: category.isActive })
export const toLegacyProduct = (product: Product): StoreProduct => ({ id: product.id, name: product.name, slug: product.slug, sku: product.sku, price: product.price, original_price: product.originalPrice, stock: product.stock, variations: product.variations.map(variation => ({ name: variation.name, sku: variation.sku, price: variation.price, original_price: variation.originalPrice, stock: variation.stock, image_path: variation.imageUrl, attributes: variation.attributes })), state: product.state, is_featured: product.isFeatured, description: product.description, excerpt: product.excerpt, image_path: product.imageUrl, image_url: product.imageUrl, meta_description: product.metaDescription, brand_id: product.brandId, categories: product.categories.map(toLegacyCategory) })
export const toLegacyStore = (store: Store): StoreSite => ({ id: store.id, name: store.name, slug: store.slug, domain: store.domain, segment: store.segment, plan_id: store.planId, status: store.status, billing_status: store.billingStatus, billing_ends_at: store.billingEndsAt, trial_ends_at: store.trialEndsAt })
export const toLegacyBranding = (theme: NonNullable<Store['theme']>): import('#shared/types/branding').StorefrontBranding => ({ logo_url: theme.logoUrl, favicon_url: theme.faviconUrl, hero_image_url: theme.heroImageUrl, primary_color: theme.primaryColor, secondary_color: theme.secondaryColor, accent_color: theme.accentColor, font_family: theme.fontFamily, hero_title: theme.heroTitle, hero_subtitle: theme.heroSubtitle, featured_title: theme.featuredTitle, show_newsletter: theme.showNewsletter, header_message: theme.headerMessage, contact_phone: theme.contactPhone, service_hours: theme.serviceHours, hero_eyebrow: theme.heroEyebrow, hero_cta_label: theme.heroCtaLabel, categories_title: theme.categoriesTitle, promo_primary_title: theme.promoPrimaryTitle, promo_primary_text: theme.promoPrimaryText, promo_secondary_title: theme.promoSecondaryTitle, promo_secondary_text: theme.promoSecondaryText, promo_tertiary_title: theme.promoTertiaryTitle, promo_tertiary_text: theme.promoTertiaryText, offers_callout_title: theme.offersCalloutTitle, offers_callout_text: theme.offersCalloutText, popular_title: theme.popularTitle, newsletter_eyebrow: theme.newsletterEyebrow, newsletter_title: theme.newsletterTitle, newsletter_text: theme.newsletterText, newsletter_button_label: theme.newsletterButtonLabel, footer_tagline: theme.footerTagline, footer_description: theme.footerDescription, version: theme.version })
export const toLegacyCart = (cart: Cart): StoreCart => ({ id: cart.id, coupon_code: cart.couponCode, items: cart.items.map(item => ({ id: item.id, product_id: item.productId, name: item.name, quantity: item.quantity, unit_price: item.unitPrice, total: item.total })), totals: { items_count: cart.totals.itemsCount, items_total: cart.totals.itemsTotal, discount: cart.totals.discount, shipping: cart.totals.shipping, total: cart.totals.total } })
export const toLegacyAnalytics = (analytics: AnalyticsConfiguration) => ({ enabled: analytics.enabled, google_analytics_4: { enabled: analytics.googleAnalytics4.enabled, measurement_id: analytics.googleAnalytics4.measurementId }, facebook_pixel: { enabled: analytics.facebookPixel.enabled, pixel_id: analytics.facebookPixel.pixelId } })
