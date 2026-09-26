<script setup lang="ts">
import BaseCheckout from '~/components/BaseCheckout.vue'

const storefront = await useStorefrontPage({ kind: 'checkout' })
</script>

<template><BaseCheckout :storefront="storefront" /></template>
