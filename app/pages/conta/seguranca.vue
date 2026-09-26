<script setup lang="ts">
import SharedCustomerArea from '~/components/SharedCustomerArea.vue'
definePageMeta({ middleware: ['customer-auth'] })
const storefront = await useStorefrontPage({ kind: 'account', section: 'security' })
</script>
<template><SharedCustomerArea :storefront="storefront" section="security" /></template>
