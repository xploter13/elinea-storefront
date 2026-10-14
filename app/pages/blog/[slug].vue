<script setup lang="ts">
import BaseBlogArticle from '~/components/BaseBlogArticle.vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import { blogArticlesForStore } from '~/data/blog'
import type { StorefrontPage } from '~/utils/storefront-page'

definePageMeta({ key: route => route.fullPath })
const route = useRoute()
const page = { kind: 'blog-article', slug: String(route.params.slug) } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
const article = blogArticlesForStore(storefront).find(item => item.slug === page.slug)!
const requestUrl = useRequestURL()
useSeoMeta({
  description: article.excerpt,
  ogDescription: article.excerpt,
  ogImage: new URL(article.image, requestUrl.origin).href,
  ogType: 'article',
})
</script>

<template><BaseTemplate :storefront="storefront" :page="page"><BaseBlogArticle :storefront="storefront" :slug="page.slug" /></BaseTemplate></template>
