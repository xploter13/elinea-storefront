<script setup lang="ts">
import BaseCart from '~/components/BaseCart.vue'

const storefront = await useStorefrontPage({ kind: 'cart' })
</script>

<template><BaseCart :storefront="storefront" /></template>
