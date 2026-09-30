<script setup lang="ts">
import BasePayment from '~/components/BasePayment.vue'

definePageMeta({ middleware: ['customer-auth'] })
const storefront = await useStorefrontPage({ kind: 'checkout' })
</script>

<template><BasePayment :storefront="storefront" /></template>
