<script setup lang="ts">
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'favorites' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template><BaseTemplate :storefront="storefront" :page="page" /></template>
