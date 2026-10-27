<script setup lang="ts">
import { BadgePercent, ChevronRight, Grid2X2, Grid3X3, LayoutGrid, PackageCheck, Search, SlidersHorizontal, Sparkles, Star, X } from '@lucide/vue'
import type { StoreProduct, StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import BaseProductCard from './BaseProductCard.vue'
const props = defineProps<{ products: StoreProduct[], storefront: StorefrontPayload, title?: string, description?: string }>()
const route = useRoute()
const router = useRouter()
const { money, productImage } = useStorefrontCatalog(props.storefront)
const search = ref(String(route.query.busca || ''))
const selectedCategories = ref<number[]>([])
const inStockOnly = ref(false)
const onSaleOnly = ref(false)
const featuredOnly = ref(false)
const sort = ref<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance')
const filtersOpen = ref(false)
const categories = computed(() => {
  const map = new Map<number, StoreProduct['categories'][number]>()
  props.products.forEach(product => product.categories.forEach(category => map.set(category.id, category)))
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
})
const categoryCount = (categoryId: number) => props.products.filter(product => product.categories.some(category => category.id === categoryId)).length
const categoryPreviewProduct = (categoryId: number) => props.products.find(product => product.categories.some(category => category.id === categoryId) && productImage(product)) || props.products.find(product => product.categories.some(category => category.id === categoryId))
const maxProductPrice = computed(() => Math.max(0, ...props.products.map(product => product.price)))
const priceLimit = ref(0)
const priceCeiling = computed(() => Math.max(1, Math.ceil(maxProductPrice.value)))
const activeFilterCount = computed(() => selectedCategories.value.length + Number(inStockOnly.value) + Number(onSaleOnly.value) + Number(featuredOnly.value) + Number(priceLimit.value > 0 && priceLimit.value < priceCeiling.value))
const displayPriceLimit = computed(() => priceLimit.value > 0 ? priceLimit.value : priceCeiling.value)
const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('pt-BR')
  const result = props.products.filter((item) => {
    const matchesTerm = !term || `${item.name} ${item.categories.map(category => category.name).join(' ')}`.toLocaleLowerCase('pt-BR').includes(term)
    const matchesCategory = !selectedCategories.value.length || item.categories.some(category => selectedCategories.value.includes(category.id))
    const matchesStock = !inStockOnly.value || item.stock > 0
    const matchesSale = !onSaleOnly.value || Boolean(item.original_price && item.original_price > item.price)
    const matchesFeatured = !featuredOnly.value || item.is_featured
    const matchesPrice = !priceLimit.value || item.price <= priceLimit.value
    return matchesTerm && matchesCategory && matchesStock && matchesSale && matchesFeatured && matchesPrice
  })
  return [...result].sort((a, b) => {
    if (sort.value === 'price-asc') return a.price - b.price
    if (sort.value === 'price-desc') return b.price - a.price
    if (sort.value === 'name') return a.name.localeCompare(b.name, 'pt-BR')
    return Number(b.is_featured) - Number(a.is_featured)
  })
})
const resetFilters = () => { selectedCategories.value = []; inStockOnly.value = false; onSaleOnly.value = false; featuredOnly.value = false; priceLimit.value = priceCeiling.value }
const syncSearch = () => router.replace({ query: { ...route.query, busca: search.value.trim() || undefined } })
watch(() => route.query.busca, value => { search.value = String(value || '') })
watch(priceCeiling, value => { priceLimit.value = value }, { immediate: true })
</script>

<template>
  <main class="catalog">
    <nav class="breadcrumbs" aria-label="Navegação estrutural">
      <NuxtLink to="/">Início</NuxtLink>
      <ChevronRight :size="16" />
      <span>Produtos</span>
    </nav>

    <section v-if="categories.length" class="category-strip" aria-label="Categorias em destaque">
      <NuxtLink v-for="category in categories.slice(0, 8)" :key="category.id" :to="`/categoria/${category.slug}`">
        <span>
          <img v-if="categoryPreviewProduct(category.id) && productImage(categoryPreviewProduct(category.id))" :src="productImage(categoryPreviewProduct(category.id))!" :alt="category.name">
          <PackageCheck v-else :size="34" />
        </span>
        <strong>{{ category.name }}</strong>
      </NuxtLink>
    </section>

    <div class="catalog-divider"></div>

    <div class="shop-layout">
      <aside class="filter-sidebar" :class="{ open: filtersOpen }" aria-label="Filtros do catálogo">
        <div class="filter-head">
          <strong><SlidersHorizontal :size="17" /> Filtrar</strong>
          <button type="button" aria-label="Fechar filtros" @click="filtersOpen = false"><X :size="18" /></button>
        </div>

        <section class="filter-block">
          <h2>Categorias</h2>
          <label v-for="category in categories" :key="category.id" class="check-row">
            <input v-model="selectedCategories" type="checkbox" :value="category.id">
            <span>{{ category.name }}</span>
            <small>({{ categoryCount(category.id) }})</small>
          </label>
        </section>

        <section class="filter-block">
          <h2>Compra rápida</h2>
          <label class="check-row"><input v-model="featuredOnly" type="checkbox"><span>Destaques</span><Sparkles :size="15" /></label>
          <label class="check-row"><input v-model="onSaleOnly" type="checkbox"><span>Em oferta</span><BadgePercent :size="15" /></label>
          <label class="check-row"><input v-model="inStockOnly" type="checkbox"><span>Em estoque</span><PackageCheck :size="15" /></label>
        </section>

        <section class="filter-block price-filter">
          <h2>Faixa de preço</h2>
          <div class="price-readout"><span>Até</span><strong>{{ money(displayPriceLimit) }}</strong></div>
          <input v-model.number="priceLimit" type="range" min="0" :max="priceCeiling" step="1" aria-label="Preço máximo">
        </section>

        <button class="clear-filters" type="button" :disabled="!activeFilterCount" @click="resetFilters">Limpar filtros</button>
      </aside>

      <section class="products-panel">
        <div class="fast-filter">
          <span>Filtro rápido:</span>
          <button type="button" :class="{ active: featuredOnly }" @click="featuredOnly = !featuredOnly"><Sparkles :size="14" /> Destaques</button>
          <button type="button" :class="{ active: onSaleOnly }" @click="onSaleOnly = !onSaleOnly"><BadgePercent :size="14" /> Ofertas</button>
          <button type="button" :class="{ active: inStockOnly }" @click="inStockOnly = !inStockOnly"><PackageCheck :size="14" /> Em estoque</button>
          <button type="button"><Star :size="14" /> Mais vendidos</button>
        </div>

        <div class="result-toolbar">
          <div class="result-count">Mostrando {{ filtered.length }} de {{ products.length }} produtos</div>
          <div class="view-buttons" aria-hidden="true"><Grid2X2 :size="17" /><LayoutGrid :size="17" /><Grid3X3 :size="17" /></div>
          <label>Ordenar:
            <select v-model="sort" aria-label="Ordenar produtos">
              <option value="relevance">Mais relevantes</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </label>
          <label class="search-products">
            <input v-model="search" placeholder="Buscar produtos" @keyup.enter="syncSearch" @blur="syncSearch">
            <Search :size="18" />
          </label>
          <button class="mobile-filter" type="button" @click="filtersOpen = true"><SlidersHorizontal :size="16" /> Filtros<span v-if="activeFilterCount">{{ activeFilterCount }}</span></button>
        </div>

        <div v-if="activeFilterCount" class="filter-summary">
          <span v-for="categoryId in selectedCategories" :key="categoryId">{{ categories.find(category => category.id === categoryId)?.name }}<button aria-label="Remover filtro" @click="selectedCategories = selectedCategories.filter(id => id !== categoryId)">x</button></span>
          <span v-if="featuredOnly">Destaques</span>
          <span v-if="onSaleOnly">Ofertas</span>
          <span v-if="inStockOnly">Em estoque</span>
          <span v-if="priceLimit > 0 && priceLimit < priceCeiling">Até {{ money(priceLimit) }}</span>
          <button type="button" @click="resetFilters">Limpar</button>
        </div>

        <div v-if="filtered.length" class="catalog-grid">
          <BaseProductCard v-for="product in filtered" :key="product.id" :product="product" :storefront="storefront" />
        </div>
        <div v-else class="no-results">
          <Search :size="28" />
          <div><h2>Nenhum produto encontrado.</h2><p>Tente remover filtros ou buscar com menos palavras.</p></div>
          <button type="button" @click="search = ''; resetFilters(); syncSearch()">Limpar busca e filtros</button>
        </div>
      </section>
    </div>

    <button v-if="filtersOpen" class="filter-backdrop" type="button" aria-label="Fechar filtros" @click="filtersOpen = false"></button>
  </main>
</template>

<style scoped>
.catalog{max-width:1320px;margin:auto;padding:28px 24px 54px;background:#fff;color:#111827}.breadcrumbs{display:flex;align-items:center;gap:10px;margin-bottom:24px;color:#6b7280;font-size:14px}.breadcrumbs a{color:#111827;text-decoration:none}.catalog-promo{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto 190px;align-items:center;min-height:142px;overflow:hidden;padding:30px 34px;border-radius:6px;background:linear-gradient(90deg,#dceeff,#eef7ff);isolation:isolate}.catalog-promo:before{position:absolute;inset:0;content:"";background-image:linear-gradient(rgba(37,99,235,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.07) 1px,transparent 1px);background-size:32px 32px;opacity:.8;z-index:-1}.catalog-promo h1{max-width:620px;margin:0 0 10px;font-size:24px;font-weight:750;letter-spacing:-.02em;line-height:1.15}.catalog-promo p{max-width:540px;margin:0;color:#4b5563;font-size:14px;line-height:1.5}.promo-price{display:flex;align-items:center;gap:10px}.promo-price strong{color:var(--sf-primary);font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}.promo-price s{color:#4b5563;font-size:14px}.promo-price a{display:inline-flex;height:38px;align-items:center;padding:0 28px;border-radius:999px;background:#050505;color:#fff;font-size:14px;font-weight:700;text-decoration:none}.catalog-promo img{justify-self:end;width:150px;height:120px;object-fit:contain;filter:drop-shadow(0 18px 24px rgba(15,23,42,.16))}.category-strip{display:grid;grid-template-columns:repeat(8,1fr);gap:22px;margin-top:34px;padding-bottom:28px}.category-strip a{display:grid;justify-items:center;gap:14px;color:#111827;text-align:center;text-decoration:none}.category-strip span{display:grid;width:126px;height:126px;place-items:center;overflow:hidden;border-radius:50%;background:#f3f4f6;color:var(--sf-primary)}.category-strip img{width:100%;height:100%;object-fit:cover}.category-strip strong{max-width:130px;font-size:14px;font-weight:550;line-height:1.25}.catalog-divider{height:1px;background:#e5e7eb}.shop-layout{display:grid;grid-template-columns:296px minmax(0,1fr);gap:34px;margin-top:32px}.filter-sidebar{align-self:start;position:sticky;top:150px;border:1px solid #e5e7eb;border-radius:12px;background:#fff}.filter-head{display:flex;align-items:center;justify-content:space-between;height:62px;padding:0 16px;border-bottom:1px solid #e5e7eb}.filter-head strong{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:650}.filter-head button{display:none;width:34px;height:34px;place-items:center;border:0;border-radius:8px;background:#f3f4f6;color:#111827}.filter-block{display:grid;gap:10px;padding:18px 16px;border-bottom:1px solid #e5e7eb}.filter-block h2{margin:0 0 5px;font-size:14px;font-weight:650}.check-row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;min-height:30px;color:#374151;font-size:14px;font-weight:400;cursor:pointer}.check-row input{width:16px;height:16px;accent-color:var(--sf-primary)}.check-row small{color:#111827;font-size:14px;font-variant-numeric:tabular-nums}.check-row svg{color:var(--sf-primary)}.price-readout{display:flex;justify-content:space-between;color:#6b7280;font-size:14px}.price-readout strong{color:var(--sf-primary);font-size:17px;font-weight:650;font-variant-numeric:tabular-nums}.price-filter input{width:100%;accent-color:var(--sf-primary)}.clear-filters{width:calc(100% - 32px);height:42px;margin:16px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;color:#111827;font-size:14px;font-weight:550}.clear-filters:disabled{cursor:not-allowed;opacity:.45}.products-panel{min-width:0}.fast-filter{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:22px;color:#8a8f98;font-size:14px}.fast-filter button{display:inline-flex;height:36px;align-items:center;gap:6px;padding:0 14px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;color:#111827;font-size:14px;font-weight:500}.fast-filter button.active{border-color:#dbeafe;background:#eff6ff;color:var(--sf-primary)}.result-toolbar{display:flex;align-items:center;gap:22px;margin-bottom:18px;color:#858b95;font-size:14px}.result-count{margin-right:auto}.view-buttons{display:flex;align-items:center;gap:13px;color:#111827}.view-buttons svg:nth-child(3){padding:7px;border-radius:50%;box-sizing:content-box;background:#dbeafe;color:var(--sf-primary)}.result-toolbar label{display:flex;align-items:center;gap:7px;white-space:nowrap}.result-toolbar select{height:38px;border:0;background:transparent;color:#111827;font:inherit;font-weight:550;outline:0}.search-products{height:42px;min-width:270px;padding:0 14px;border:1px solid #d9dce1!important;border-radius:999px;background:#fff}.search-products input{min-width:0;flex:1;border:0;outline:0}.mobile-filter{display:none;height:40px;align-items:center;gap:7px;padding:0 14px;border:1px solid #e5e7eb;border-radius:999px;background:#fff;color:#111827;font-size:14px;font-weight:550}.mobile-filter span{display:grid;min-width:18px;height:18px;place-items:center;border-radius:50%;background:var(--sf-primary);color:#fff;font-size:10px}.filter-summary{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:22px}.filter-summary span{display:inline-flex;height:30px;align-items:center;gap:7px;padding:0 11px;border-radius:999px;background:#eef5ff;color:#111827;font-size:14px;font-weight:500}.filter-summary button{border:0;background:transparent;color:#111827;font-size:14px;text-decoration:underline}.filter-summary span button{text-decoration:none;font-weight:650}.catalog-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.no-results{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;padding:52px 24px;border:1px dashed #d1d5db;border-radius:12px;color:#6b7280}.no-results h2{margin:0 0 4px;color:#111827;font-size:22px;font-weight:650}.no-results p{margin:0}.no-results button{height:42px;padding:0 16px;border:0;border-radius:999px;background:var(--sf-primary);color:#fff;font-weight:650}.filter-backdrop{display:none}@media(max-width:1150px){.category-strip{grid-template-columns:repeat(4,1fr)}.shop-layout{grid-template-columns:270px minmax(0,1fr)}.catalog-grid{grid-template-columns:repeat(2,1fr)}.catalog-promo{grid-template-columns:1fr auto}.catalog-promo img{display:none}.result-toolbar{flex-wrap:wrap}.result-count{width:100%}}@media(max-width:820px){.catalog{padding:22px 14px 44px}.catalog-promo{grid-template-columns:1fr;gap:18px;padding:24px 20px}.promo-price{flex-wrap:wrap}.category-strip{display:flex;overflow:auto;padding-bottom:20px}.category-strip a{min-width:118px}.category-strip span{width:104px;height:104px}.shop-layout{display:block}.filter-sidebar{position:fixed;left:14px;right:14px;top:82px;z-index:70;max-height:calc(100dvh - 102px);overflow:auto;opacity:0;pointer-events:none;transform:translateY(14px);transition:opacity .2s,transform .2s}.filter-sidebar.open{opacity:1;pointer-events:auto;transform:translateY(0)}.filter-head button{display:grid}.filter-backdrop{position:fixed;inset:0;z-index:60;display:block;border:0;background:rgba(15,23,42,.38)}.fast-filter{margin-top:24px}.mobile-filter{display:inline-flex}.search-products{min-width:0;flex:1}.catalog-grid{gap:14px}}@media(max-width:560px){.catalog-promo h1{font-size:22px}.result-toolbar{gap:12px}.view-buttons{display:none}.result-toolbar label:not(.search-products){order:3}.catalog-grid{grid-template-columns:repeat(2,1fr);gap:12px}.no-results{grid-template-columns:1fr;justify-items:center;text-align:center}}
</style>
