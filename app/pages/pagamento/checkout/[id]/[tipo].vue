<script setup lang="ts">
import BasePayment from '~/components/BasePayment.vue'
import { transparentPaymentTypes } from '#shared/utils/checkout-payment'

definePageMeta({ middleware: ['customer-auth'] })
const route = useRoute()
if (!transparentPaymentTypes.some(type => type.slug === route.params.tipo)) {
  throw createError({ statusCode: 404, message: 'Forma de pagamento não encontrada.' })
}
const storefront = await useStorefrontPage({ kind: 'checkout' })
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template><BasePayment :storefront="storefront" transparent /></template>
