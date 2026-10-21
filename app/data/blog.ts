import type { StorefrontPayload } from '#shared/types/storefront'
export type { BlogArticle, BlogSection } from '@elinea/sdk'
export function blogArticlesForStore(storefront: StorefrontPayload) {
  return storefront.blog.articles
}
