import type { StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontPage } from '~/utils/storefront-page'
import { pageTitle } from '~/utils/storefront-page'
import { blogArticlesForStore } from '~/data/blog'

export function useStorefrontPage(page: StorefrontPage) {
  const nuxtApp = useNuxtApp()
  const requestUrl = useRequestURL()
  const requestHeaders = import.meta.server ? useRequestHeaders(['host', 'x-forwarded-host']) : undefined
  const route = useRoute()
  const blogPage = page.kind === 'blog' ? Math.max(1, Number(route.query.page) || 1) : 1
  const blogSlug = page.kind === 'blog-article' ? page.slug : undefined
  const request = useFetch<StorefrontPayload>('/api/storefront', {
    headers: requestHeaders,
    key: `storefront:${requestUrl.hostname}:${blogPage}:${blogSlug ?? ''}`,
    query: { blog_page: blogPage, blog_slug: blogSlug },
  })

  const { data, error } = request
  useSeoMeta({
    title: () => data.value ? `${pageTitle(page, data.value)} | ${data.value.site.name}` : 'Elínea',
    description: () => data.value ? `Conheça ${pageTitle(page, data.value)} em ${data.value.site.name}.` : undefined,
    ogTitle: () => data.value ? `${pageTitle(page, data.value)} | ${data.value.site.name}` : 'Elínea',
  })
  useHead({
    link: () => data.value?.theme.favicon_url
      ? [{ rel: 'icon', href: data.value.theme.favicon_url }]
      : [],
  })

  return request.then(async ({ data: resolvedData, error: resolvedError }) => {
    if (resolvedError.value || !resolvedData.value) {
      throw createError({
        statusCode: resolvedError.value?.statusCode || 502,
        statusMessage: resolvedError.value?.statusMessage || 'Loja indisponível',
        message: resolvedError.value?.message || 'Não foi possível carregar a loja.',
      })
    }

    const storefront = resolvedData.value
    if (storefront.site.online_checkout_enabled === false && (page.kind === 'cart' || page.kind === 'checkout')) {
      await nuxtApp.runWithContext(() => navigateTo('/produtos', { replace: true }))
    }
    if (page.kind === 'product' && !storefront.products.some(product => product.slug === page.slug)) {
      throw createError({ statusCode: 404, statusMessage: 'Página não encontrada', message: 'O produto solicitado não existe nesta loja.' })
    }
    if (page.kind === 'category' && !storefront.categories.some(category => category.slug === page.slug)) {
      throw createError({ statusCode: 404, statusMessage: 'Página não encontrada', message: 'A categoria solicitada não existe nesta loja.' })
    }
    if (page.kind === 'blog-article' && !blogArticlesForStore(storefront).some(article => article.slug === page.slug)) {
      throw createError({ statusCode: 404, statusMessage: 'Página não encontrada', message: 'A matéria solicitada não está disponível nesta loja.' })
    }

    return storefront
  })
}
