import type { StoreSite, StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontBranding } from '#shared/types/branding'
import { defaultBranding } from '#shared/utils/default-branding'
import { ElineaError } from '@elinea/sdk'

function warningFor(resource: string, reason: unknown): string {
  const status = reason && typeof reason === 'object' && 'statusCode' in reason ? String(reason.statusCode) : 'indisponível'
  return `${resource}: ${status}`
}

export default defineEventHandler(async (event): Promise<StorefrontPayload> => {
  const elinea = createServerElineaClient(event)
  let site: StoreSite
  let theme: StorefrontBranding

  try {
    const store = await elinea.store.get()
    site = toLegacyStore(store)
    theme = store.theme ? toLegacyBranding(store.theme) : { ...defaultBranding }
  } catch (error) {
    const upstreamStatus = error instanceof ElineaError
      ? error.status
      : error && typeof error === 'object' && 'statusCode' in error
        ? Number(error.statusCode)
        : 502
    const notFound = upstreamStatus === 404
    throw createError({
      statusCode: notFound ? 404 : 502,
      statusMessage: notFound ? 'Loja não encontrada' : 'API da loja indisponível',
      message: notFound ? 'A loja configurada neste storefront não foi encontrada.' : 'Não foi possível consultar a API da Elinea.',
    })
  }

  const [productsResult, categoriesResult, analyticsResult, newsletterResult] = await Promise.allSettled([
    elinea.catalog.products.list({ perPage: 100 }),
    elinea.catalog.categories.list({ perPage: 100 }),
    elinea.analytics.get(),
    elinea.marketing.newsletterPopup.get(),
  ])
  const warnings: string[] = []
  if (productsResult.status === 'rejected') warnings.push(warningFor('products', productsResult.reason))
  if (categoriesResult.status === 'rejected') warnings.push(warningFor('categories', categoriesResult.reason))
  if (analyticsResult.status === 'rejected') warnings.push(warningFor('analytics', analyticsResult.reason))
  if (newsletterResult.status === 'rejected') warnings.push(warningFor('newsletter', newsletterResult.reason))

  return {
    site,
    theme,
    products: productsResult.status === 'fulfilled' ? productsResult.value.data.map(toLegacyProduct) : [],
    categories: categoriesResult.status === 'fulfilled' ? categoriesResult.value.data.map(toLegacyCategory) : [],
    analytics: analyticsResult.status === 'fulfilled' ? toLegacyAnalytics(analyticsResult.value) : null,
    newsletter: newsletterResult.status === 'fulfilled' ? newsletterResult.value : null,
    warnings,
  }
})
