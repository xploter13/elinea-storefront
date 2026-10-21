<script setup lang="ts">
definePageMeta({ key: route => route.fullPath })
import BaseBlogIndex from '~/components/BaseBlogIndex.vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'blog' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
useSeoMeta({
  description: 'Ideias, guias e inspirações para descobrir o que faz sentido na sua rotina.',
  ogDescription: 'Ideias, guias e inspirações para descobrir o que faz sentido na sua rotina.',
})
</script>

<template><BaseTemplate :storefront="storefront" :page="page"><BaseBlogIndex :storefront="storefront" /></BaseTemplate></template>
