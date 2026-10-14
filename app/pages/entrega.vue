<script setup lang="ts">
import BaseInformationPage from '~/components/BaseInformationPage.vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'information', section: 'delivery' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
</script>

<template><BaseTemplate :storefront="storefront" :page="page"><BaseInformationPage :storefront="storefront" section="delivery" /></BaseTemplate></template>
