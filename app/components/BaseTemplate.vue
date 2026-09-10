<script setup lang="ts">
import type { StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontPage } from '~/utils/storefront-page'
import BaseCookieConsent from './BaseCookieConsent.vue'
import BaseFooter from './BaseFooter.vue'
import BaseHeader from './BaseHeader.vue'
import StorefrontCommerceOverlay from '~~/layers/storefront-core/app/components/StorefrontCommerceOverlay.vue'
import BaseCart from './BaseCart.vue'
import BaseCategories from './BaseCategories.vue'
import BaseHome from './BaseHome.vue'
import BaseProductDetail from './BaseProductDetail.vue'
import BaseProducts from './BaseProducts.vue'

const props = defineProps<{ storefront: StorefrontPayload, page: StorefrontPage }>()
const product = computed(() => {
  const page = props.page
  return page.kind === 'product' ? props.storefront.products.find(item => item.slug === page.slug) : undefined
})
const category = computed(() => {
  const page = props.page
  return page.kind === 'category' ? props.storefront.categories.find(item => item.slug === page.slug) : undefined
})
const categoryProducts = computed(() => category.value ? props.storefront.products.filter(item => item.categories.some(value => value.id === category.value?.id)) : [])
const theme = computed(() => props.storefront.theme)
const themeStyle = computed(() => ({
  '--sf-primary': theme.value?.primary_color || '#2563eb',
  '--sf-ink': theme.value?.secondary_color || '#111827',
  '--sf-accent': theme.value?.accent_color || '#ff7a1a',
  '--sf-body': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--sf-display': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--elinea-primary': theme.value?.primary_color || '#2563eb',
  '--elinea-secondary': theme.value?.secondary_color || '#111827',
  '--elinea-accent': theme.value?.accent_color || '#ff7a1a',
  '--elinea-font-body': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--elinea-font-heading': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--elinea-container-width': '1400px',
  '--color-primary': theme.value?.primary_color || '#2563eb',
  '--color-primary-content': '#ffffff',
  '--color-secondary': theme.value?.accent_color || '#ff7a1a',
  '--color-secondary-content': '#ffffff',
  '--color-base-100': '#ffffff',
  '--color-base-200': '#f8fafc',
  '--color-base-300': '#e5e7eb',
  '--color-base-content': theme.value?.secondary_color || '#111827',
  '--radius-box': '0.75rem',
  '--radius-field': '0.5rem',
}))
</script>

<template>
  <div class="base-shell" data-theme="light" :style="themeStyle">
    <BaseHeader :storefront="storefront" :store-name="storefront.site.name" :logo-url="theme?.logo_url" :categories="storefront.categories" :theme="theme" />
    <BaseHome v-if="page.kind === 'home'" :storefront="storefront" :theme="theme" />
    <BaseProducts v-else-if="page.kind === 'products'" :storefront="storefront" :products="storefront.products" />
    <BaseCategories v-else-if="page.kind === 'categories'" :categories="storefront.categories" />
    <BaseProducts v-else-if="page.kind === 'category' && category" :storefront="storefront" :products="categoryProducts" :title="category.name" :description="category.description || undefined" />
    <BaseProductDetail v-else-if="page.kind === 'product' && product" :product="product" :storefront="storefront" />
    <BaseCart v-else-if="page.kind === 'cart'" :storefront="storefront" />
    <BaseFooter :store-name="storefront.site.name" :theme="theme" />
    <BaseCookieConsent />
    <StorefrontCommerceOverlay :storefront="storefront" />
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}
:global(body){margin:0}
.base-shell{
  min-height:100dvh;
  background:#fff;
  color:var(--sf-ink);
  font-family:var(--sf-body);
  font-size:16px;
}
:global(.base-shell button),
:global(.base-shell input),
:global(.base-shell select),
:global(.base-shell textarea){font-family:var(--sf-body)}
:global(.base-shell h1),
:global(.base-shell h2),
:global(.base-shell h3),
:global(.base-shell h4),
:global(.base-shell .brand strong){font-family:var(--sf-display)!important}
:global(.base-shell p){font-size:max(0.9375rem,15px)}
:global(.base-shell .utility){font-size:12px}
:global(.base-shell .category-select),
:global(.base-shell .desktop-search input),
:global(.base-shell .mobile-search input){font-size:14px}
:global(.base-shell .location small){font-size:10px}
:global(.base-shell .location strong){font-size:12px}
:global(.base-shell .icon-action),
:global(.base-shell .cart){font-size:10px}
:global(.base-shell .category-nav a){font-size:13px}
:global(.base-shell .benefit-bar strong){font-size:13px}
:global(.base-shell .benefit-bar small){font-size:11px}
:global(.base-shell .hero-copy>span){font-size:13px}
:global(.base-shell .hero-copy p){font-size:17px}
:global(.base-shell .hero-trust){font-size:11px}
:global(.base-shell .section-title h2){font-size:28px}
:global(.base-shell .section-title>a){font-size:13px}
:global(.base-shell .category-rail strong){font-size:13px}
:global(.base-shell .category-rail small){font-size:11px}
:global(.base-shell .promo h2){font-size:23px}
:global(.base-shell .promo p){font-size:13px}
:global(.base-shell .promo a){font-size:12px}
:global(.base-shell .deals-heading nav button),
:global(.base-shell .deals-heading nav a){font-size:13px}
:global(.base-shell .retail-product .category){font-size:11px}
:global(.base-shell .retail-product h3){font-size:16px}
:global(.base-shell .retail-product .product-content>p){font-size:12px}
:global(.base-shell .retail-product .product-price strong){font-size:20px}
:global(.base-shell .retail-product .product-price button){font-size:12px}
:global(.base-shell .compact-products small){font-size:10px}
:global(.base-shell .compact-products strong){font-size:13px}
:global(.base-shell .newsletter h2){font-size:34px}
:global(.base-shell .newsletter p){font-size:13px}
:global(.base-shell .footer-benefits strong){font-size:12px}
:global(.base-shell .footer-benefits small){font-size:10px}
:global(.base-shell .footer-main h3){font-size:14px}
:global(.base-shell .footer-main a),
:global(.base-shell .footer-main nav span){font-size:12px}
:global(.base-shell .footer-brand p){font-size:13px}
:global(.base-shell .footer-bottom){font-size:10px}
</style>
