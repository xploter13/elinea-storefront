<script setup lang="ts">
import SharedCustomerArea from '~/components/SharedCustomerArea.vue'

definePageMeta({ middleware: ['customer-auth'] })

const storefront = await useStorefrontPage({ kind: 'account', section: 'overview' })
</script>

<template><SharedCustomerArea :storefront="storefront" section="overview" /></template>
