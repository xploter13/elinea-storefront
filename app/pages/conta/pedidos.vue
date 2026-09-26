<script setup lang="ts">
import SharedCustomerArea from '~/components/SharedCustomerArea.vue'

definePageMeta({ middleware: ['customer-auth'] })

const storefront = await useStorefrontPage({ kind: 'account', section: 'orders' })
</script>

<template><SharedCustomerArea :storefront="storefront" section="orders" /></template>
