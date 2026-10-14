<script setup lang="ts">
import { ArrowRight, ArrowUpRight, PackageSearch } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'

const props = defineProps<{ storefront: StorefrontPayload }>()
const { productImage, money } = useStorefrontCatalog(props.storefront)
const products = computed(() => {
  const featured = props.storefront.products.filter(product => product.is_featured)
  const remaining = props.storefront.products.filter(product => !product.is_featured)
  return [...featured, ...remaining].slice(0, 3)
})
const unavailableImages = ref<number[]>([])

function hideImage(id: number) {
  unavailableImages.value = [...unavailableImages.value, id]
}
</script>

<template>
  <section v-if="products.length" class="editorial-spotlight" aria-labelledby="curation-title">
    <div class="story">
      <span class="section-label">Curadoria da loja</span>
      <h2 id="curation-title">Uma seleção para começar sua busca.</h2>
      <p>Conheça os produtos em destaque da {{ storefront.site.name }} e veja os detalhes antes de escolher.</p>
      <NuxtLink class="browse-link" to="/produtos">Ver todos os produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
    </div>

    <div class="showcase" :class="{ 'showcase-single': products.length === 1, 'showcase-pair': products.length === 2 }">
      <NuxtLink
        v-for="(product, index) in products"
        :key="product.id"
        class="product-card"
        :class="{ 'featured-product': index === 0 }"
        :to="`/produto/${product.slug}`"
      >
        <div class="product-media">
          <img
            v-if="productImage(product) && !unavailableImages.includes(product.id)"
            :src="productImage(product)!"
            alt=""
            width="500"
            height="500"
            loading="lazy"
            @error="hideImage(product.id)"
          >
          <PackageSearch v-else :size="48" aria-hidden="true" />
          <span v-if="product.stock < 1" class="stock-badge">Esgotado</span>
        </div>
        <div class="product-copy">
          <span class="category">{{ product.categories[0]?.name || 'Produtos da loja' }}</span>
          <h3>{{ product.name }}</h3>
          <div class="product-bottom">
            <strong>{{ money(product.price) }}</strong>
            <span class="card-arrow"><ArrowUpRight :size="17" aria-hidden="true" /></span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.editorial-spotlight {
  display: grid;
  grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
  align-items: center;
  gap: clamp(28px, 4vw, 64px);
  width: min(100% - 40px, 1400px);
  margin: 72px auto 0;
  padding: clamp(24px, 4vw, 56px);
  border: 1px solid #e4e9ed;
  border-radius: 20px;
  background: color-mix(in srgb, var(--sf-primary) 5%, #f8fafc);
}

.story { min-width: 0; }
.section-label {
  display: inline-block;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--sf-primary);
  color: var(--sf-ink);
  font-size: 14px;
  font-weight: 700;
}
.story h2 {
  max-width: 12ch;
  margin: 24px 0 18px;
  color: var(--sf-ink);
  font-size: clamp(34px, 3.5vw, 54px);
  line-height: 1.08;
  letter-spacing: -.035em;
  text-wrap: balance;
}
.story p {
  max-width: 42ch;
  margin: 0;
  color: #475467;
  font-size: 16px;
  line-height: 1.65;
}
.browse-link {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  padding: 0 20px;
  border-radius: 10px;
  background: #172336;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}
.browse-link:hover { background: #263b58; }

.showcase {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}
.product-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e3e8ed;
  border-radius: 14px;
  background: #fff;
  color: var(--sf-ink);
  text-decoration: none;
  box-shadow: 0 12px 32px rgba(15, 23, 42, .045);
  transition: border-color .2s ease, box-shadow .2s ease;
}
.product-card:hover {
  border-color: color-mix(in srgb, var(--sf-primary) 35%, #d7dfe7);
  box-shadow: 0 16px 36px rgba(15, 23, 42, .09);
}
.product-card:focus-visible, .browse-link:focus-visible {
  outline: 3px solid var(--sf-primary);
  outline-offset: 3px;
}
.featured-product { grid-row: span 2; }
.product-media {
  position: relative;
  display: grid;
  height: 132px;
  flex: none;
  place-items: center;
  overflow: hidden;
  background: #f3f6f8;
  color: #7b8b9a;
}
.featured-product .product-media { height: auto; min-height: 265px; flex: 1; }
.product-media img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 320px;
  padding: 18px;
  object-fit: contain;
  transition: transform .24s ease;
}
.product-card:hover .product-media img { transform: scale(1.035); }
.stock-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 9px;
  border-radius: 6px;
  background: #fff;
  color: #475467;
  font-size: 12px;
  font-weight: 700;
}
.product-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; padding: 16px 18px 18px; }
.category { color: #667085; font-size: 12px; font-weight: 600; line-height: 1.35; }
.product-copy h3 {
  margin: 7px 0 12px;
  color: var(--sf-ink);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
.featured-product .product-copy h3 { font-size: 20px; }
.product-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: auto; }
.product-bottom strong { color: var(--sf-ink); font-size: 18px; font-variant-numeric: tabular-nums; }
.card-arrow {
  display: grid;
  width: 32px;
  height: 32px;
  flex: none;
  place-items: center;
  border: 1px solid #e3e8ed;
  border-radius: 50%;
  color: var(--sf-ink);
}
.product-card:hover .card-arrow { border-color: var(--sf-primary); color: var(--sf-primary); }
.showcase-single { grid-template-columns: 1fr; grid-template-rows: auto; }
.showcase-pair { grid-template-rows: auto; }
.showcase-single .featured-product, .showcase-pair .featured-product { grid-row: auto; }
.showcase-single .product-media, .showcase-pair .product-media { height: 240px; flex: none; }

@media (max-width: 980px) {
  .editorial-spotlight { grid-template-columns: 1fr; }
  .story h2 { max-width: 20ch; }
}
@media (max-width: 620px) {
  .editorial-spotlight { width: min(100% - 24px, 1400px); margin-top: 48px; padding: 22px; }
  .story h2 { margin-top: 20px; font-size: clamp(30px, 8vw, 40px); }
  .browse-link { width: 100%; }
  .showcase { gap: 10px; }
  .showcase-pair { grid-template-columns: 1fr; }
  .featured-product { grid-column: 1 / -1; grid-row: auto; }
  .featured-product .product-media { height: 200px; min-height: 0; flex: none; }
  .product-copy { padding: 14px; }
}
@media (max-width: 480px) {
  .showcase, .showcase-single, .showcase-pair { grid-template-columns: 1fr; grid-template-rows: auto; }
  .product-card, .featured-product { display: grid; grid-template-columns: 110px minmax(0, 1fr); }
  .product-media, .featured-product .product-media, .showcase-single .product-media, .showcase-pair .product-media { width: 110px; height: 100%; min-height: 132px; }
  .product-media img { max-height: 150px; padding: 10px; }
  .product-copy { padding: 12px 14px; }
  .product-copy h3, .featured-product .product-copy h3 { margin: 5px 0 10px; font-size: 15px; }
  .product-bottom strong { font-size: 16px; }
  .card-arrow { width: 28px; height: 28px; }
}
@media (prefers-reduced-motion: reduce) {
  .product-card, .product-media img { transition: none; }
}
</style>
