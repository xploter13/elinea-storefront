<script setup lang="ts">
import { ArrowRight, ChevronRight, Heart, Trash2 } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCommerce } from '~~/layers/storefront-core/app/composables/useStorefrontCommerce'
import BaseProductCard from './BaseProductCard.vue'

const props = defineProps<{ storefront: StorefrontPayload }>()
const { wishlistProducts, wishlistHydrated, hydrateWishlist, toggleWishlist } = useStorefrontCommerce(props.storefront)
onMounted(hydrateWishlist)
</script>

<template>
  <main class="favorites-page" aria-labelledby="favorites-heading">
    <nav class="favorites-breadcrumb" aria-label="Navegação estrutural">
      <NuxtLink to="/">Início</NuxtLink>
      <ChevronRight :size="16" aria-hidden="true" />
      <span aria-current="page">Favoritos</span>
    </nav>

    <header class="favorites-heading">
      <div>
        <h1 id="favorites-heading">Favoritos</h1>
        <p>Suas escolhas guardadas para quando quiser voltar.</p>
      </div>
      <NuxtLink class="catalog-link" to="/produtos">Explorar produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
    </header>

    <p v-if="!wishlistHydrated" class="favorites-loading" role="status">Carregando seus favoritos...</p>
    <template v-else>
      <p class="favorites-count" role="status">{{ wishlistProducts.length }} {{ wishlistProducts.length === 1 ? 'produto salvo' : 'produtos salvos' }}</p>
      <ul v-if="wishlistProducts.length" class="favorites-grid" aria-label="Produtos favoritos">
        <li v-for="product in wishlistProducts" :key="product.id" class="favorite-item">
          <BaseProductCard :product="product" :storefront="storefront" />
          <button class="remove-favorite" type="button" :aria-label="`Remover ${product.name} dos favoritos`" @click="toggleWishlist(product)">
            <Trash2 class="remove-favorite-icon" :size="18" :stroke-width="2" aria-hidden="true" /><span>Remover dos favoritos</span>
          </button>
        </li>
      </ul>
      <section v-else class="favorites-empty" aria-labelledby="favorites-empty-heading">
        <span class="empty-heart"><Heart :size="40" aria-hidden="true" /></span>
        <h2 id="favorites-empty-heading">Sua lista de favoritos está vazia</h2>
        <p>Toque no coração dos produtos para guardar o que você gostou e encontrar tudo aqui.</p>
        <NuxtLink class="explore-button" to="/produtos">Encontrar produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
      </section>
      <p v-if="wishlistProducts.length" class="favorites-note">Seus favoritos ficam salvos neste navegador.</p>
    </template>
  </main>
</template>

<style scoped>
.favorites-page{max-width:1400px;min-height:560px;margin:auto;padding:28px clamp(18px,4vw,52px) 72px;color:var(--sf-ink)}
.favorites-breadcrumb{display:flex;align-items:center;gap:8px;color:#667085;font-size:14px}
.favorites-breadcrumb a{color:var(--sf-primary);text-decoration:none}
.favorites-heading{display:flex;align-items:center;justify-content:space-between;gap:24px;margin:36px 0 28px;padding-bottom:28px;border-bottom:1px solid #e5e7eb}
.favorites-heading h1{margin:0;font-size:clamp(32px,4vw,48px);font-weight:750;line-height:1.1;letter-spacing:-.035em}
.favorites-heading p{margin:12px 0 0;color:#667085;line-height:1.6}
.catalog-link,.explore-button{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:44px;font-size:14px;font-weight:650;text-decoration:none}
.catalog-link{flex-shrink:0;color:var(--sf-primary)}
.catalog-link:hover{text-decoration:underline;text-underline-offset:4px}
.favorites-count,.favorites-loading,.favorites-note{color:#667085;font-size:14px;line-height:1.5}
.favorites-count{margin:0 0 20px}
.favorites-loading{padding:48px 0}
.favorites-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:24px 20px;margin:0;padding:0;list-style:none}
.favorite-item{display:flex;flex-direction:column;min-width:0}
.favorite-item :deep(.retail-product){flex:1}
.remove-favorite{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:44px;margin-top:8px;padding:8px;border:0;border-radius:8px;background:transparent;color:#475467;font:inherit;font-size:14px;cursor:pointer}
.remove-favorite-icon{display:block;flex:0 0 18px;width:18px;min-width:18px;height:18px;stroke:currentColor}.remove-favorite>span{min-width:0;text-align:left}
.remove-favorite:hover{background:#fff1f2;color:#be123c}
.favorites-note{margin:28px 0 0}
.favorites-empty{display:flex;flex-direction:column;align-items:center;padding:52px 16px 64px;text-align:center}
.empty-heart{display:grid;width:88px;height:88px;place-items:center;border-radius:50%;background:color-mix(in srgb,var(--sf-primary) 8%,white);color:var(--sf-primary)}
.favorites-empty h2{margin:24px 0 12px;font-size:clamp(24px,3vw,30px);font-weight:700;line-height:1.25;letter-spacing:-.025em}
.favorites-empty p{max-width:440px;margin:0;color:#667085;line-height:1.7}
.explore-button{margin-top:28px;padding:12px 22px;border-radius:10px;background:var(--sf-primary);color:#fff}
.explore-button:hover{filter:brightness(.93)}
@media(max-width:1000px){.favorites-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:760px){.favorites-heading{align-items:flex-start;flex-direction:column;gap:12px;margin-top:28px}.favorites-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:20px 12px}}
@media(max-width:420px){.favorites-grid{grid-template-columns:minmax(0,1fr)}.favorites-empty{padding:36px 0}.favorites-page{padding-bottom:48px}}
</style>
