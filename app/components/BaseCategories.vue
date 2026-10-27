<script setup lang="ts">
import { ArrowRight, ChevronRight, PackageSearch, Search, X } from '@lucide/vue'
import type { StoreCategory, StoreProduct, StorefrontPayload } from '#shared/types/storefront'
import { categoryBranchIds, productsInCategory } from '~/utils/category-products'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'

const props = defineProps<{ storefront: StorefrontPayload }>()
const search = ref('')
const { productImage, usePlaceholder } = useStorefrontCatalog(props.storefront)

type CategoryGroup = {
  root: StoreCategory
  count: number
  descendants: { category: StoreCategory, count: number }[]
  preview?: StoreProduct
}

const activeCategories = computed(() => props.storefront.categories.filter(category => category.is_active))
const groups = computed<CategoryGroup[]>(() => {
  const categories = activeCategories.value
  const activeIds = new Set(categories.map(category => category.id))
  return categories
    .filter(category => category.parent_id === null || !activeIds.has(category.parent_id))
    .map((root) => {
      const branchIds = categoryBranchIds(root.id, categories)
      const products = productsInCategory(root.id, categories, props.storefront.products)
      const descendants = categories
        .filter(category => category.id !== root.id && branchIds.has(category.id))
        .map(category => ({ category, count: productsInCategory(category.id, categories, props.storefront.products).length }))
        .filter(item => item.count > 0)
      return {
        root,
        count: products.length,
        descendants,
        preview: products.find(product => productImage(product)),
      }
    })
    .filter(group => group.count > 0)
})

const normalized = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
const filteredGroups = computed(() => {
  const term = normalized(search.value.trim())
  if (!term) return groups.value
  return groups.value.flatMap((group) => {
    if (normalized(group.root.name).includes(term)) return [group]
    const descendants = group.descendants.filter(item => normalized(item.category.name).includes(term))
    return descendants.length ? [{ ...group, descendants }] : []
  })
})
const productLabel = (count: number) => `${count} ${count === 1 ? 'produto' : 'produtos'}`
</script>

<template>
  <main class="categories-page">
    <nav class="breadcrumbs" aria-label="Navegação estrutural">
      <NuxtLink to="/">Início</NuxtLink>
      <ChevronRight :size="16" aria-hidden="true" />
      <span aria-current="page">Categorias</span>
    </nav>

    <header class="page-intro">
      <div>
        <h1>Explore por categoria.</h1>
        <p>Encontre os produtos da {{ storefront.site.name }} organizados por assunto e escolha por onde começar.</p>
      </div>
      <NuxtLink class="catalog-link" to="/produtos">Ver todos os produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
    </header>

    <section class="category-section" aria-labelledby="category-section-title">
      <div class="category-toolbar">
        <div>
          <h2 id="category-section-title">Categorias da loja</h2>
          <p aria-live="polite">{{ search ? `${filteredGroups.length} ${filteredGroups.length === 1 ? 'resultado' : 'resultados'} para “${search}”` : `${groups.length} ${groups.length === 1 ? 'área disponível' : 'áreas disponíveis'}` }}</p>
        </div>
        <div v-if="groups.length" class="search-control">
          <label for="category-search">Buscar categoria</label>
          <div class="search-field">
            <Search :size="19" aria-hidden="true" />
            <input id="category-search" v-model="search" type="search" placeholder="Ex.: beleza, casa, esporte" autocomplete="off">
            <button v-if="search" type="button" aria-label="Limpar busca" @click="search = ''"><X :size="18" aria-hidden="true" /></button>
          </div>
        </div>
      </div>

      <div v-if="filteredGroups.length" class="category-grid">
        <article v-for="group in filteredGroups" :key="group.root.id" class="category-group">
          <div class="group-media">
            <img v-if="group.preview && productImage(group.preview)" :src="productImage(group.preview)!" alt="" width="280" height="280" loading="lazy" @error="usePlaceholder">
            <PackageSearch v-else :size="58" aria-hidden="true" />
          </div>
          <div class="group-content">
            <NuxtLink class="group-title" :to="`/categoria/${group.root.slug}`">
              <h3>{{ group.root.name }}</h3>
              <ArrowRight :size="20" aria-hidden="true" />
            </NuxtLink>
            <p v-if="group.root.description" class="group-description">{{ group.root.description }}</p>
            <span class="product-count">{{ productLabel(group.count) }}</span>
            <div v-if="group.descendants.length" class="subcategories">
              <span>Explore também</span>
              <div>
                <NuxtLink v-for="item in group.descendants" :key="item.category.id" :to="`/categoria/${item.category.slug}`">
                  {{ item.category.name }} <small>{{ item.count }}</small>
                </NuxtLink>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="search" class="empty-state">
        <PackageSearch :size="34" aria-hidden="true" />
        <h3>Nenhuma categoria encontrada</h3>
        <p>Tente outro nome ou veja todas as categorias disponíveis.</p>
        <button type="button" @click="search = ''">Limpar busca</button>
      </div>
      <div v-else class="empty-state">
        <PackageSearch :size="34" aria-hidden="true" />
        <h3>Ainda não há categorias com produtos</h3>
        <p>Explore o catálogo para conhecer o que está disponível na loja.</p>
        <NuxtLink to="/produtos">Ver produtos <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.categories-page{width:min(100% - 48px,1320px);margin:auto;padding:30px 0 88px;color:var(--sf-ink)}
.breadcrumbs{display:flex;align-items:center;gap:8px;color:#667085;font-size:14px}
.breadcrumbs a{color:#475467;text-decoration:none}.breadcrumbs a:hover{text-decoration:underline}
.page-intro{display:flex;align-items:end;justify-content:space-between;gap:32px;padding:58px 0 56px;border-bottom:1px solid #e2e8f0}
.page-intro h1{max-width:13ch;margin:0;color:var(--sf-ink);font-size:clamp(42px,5vw,72px);font-weight:760;line-height:1.04;letter-spacing:-.05em;text-wrap:balance}
.page-intro p{max-width:62ch;margin:20px 0 0;color:#475467;font-size:17px;line-height:1.6}
.catalog-link{display:inline-flex;min-height:48px;align-items:center;justify-content:center;gap:12px;flex:none;padding:0 18px;border-radius:10px;background:var(--sf-ink);color:#fff;font-size:14px;font-weight:700;text-decoration:none}
.catalog-link:hover{background:#344054}
.category-section{padding-top:34px}
.category-toolbar{display:flex;align-items:end;justify-content:space-between;gap:32px;margin-bottom:26px}
.category-toolbar h2{margin:0;font-size:26px;font-weight:740;letter-spacing:-.03em}
.category-toolbar p{margin:5px 0 0;color:#667085;font-size:14px}
.search-control{display:grid;width:min(100%,340px);gap:8px}.search-control label{color:#344054;font-size:14px;font-weight:700}
.search-field{display:flex;min-height:48px;align-items:center;gap:10px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;padding:0 13px;color:#667085}
.search-field:focus-within{border-color:var(--sf-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--sf-primary) 15%,transparent)}
.search-field input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:var(--sf-ink);font:inherit;font-size:14px}
.search-field input::placeholder{color:#98a2b3}.search-field button{display:grid;width:44px;height:44px;flex:none;place-items:center;border:0;border-radius:6px;background:transparent;color:#667085;cursor:pointer}
.category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.category-group{display:grid;grid-template-columns:165px minmax(0,1fr);min-height:260px;overflow:hidden;border:1px solid #e2e8f0;border-radius:16px;background:#fff}
.group-media{display:grid;min-width:0;place-items:center;overflow:hidden;background:color-mix(in srgb,var(--sf-primary) 6%,#f8fafc);color:color-mix(in srgb,var(--sf-primary) 60%,#667085)}
.group-media img{display:block;width:100%;height:100%;max-height:320px;object-fit:contain;padding:20px}
.group-content{display:flex;min-width:0;flex-direction:column;align-items:flex-start;padding:26px}
.group-title{display:flex;width:100%;min-height:44px;align-items:start;justify-content:space-between;gap:12px;color:var(--sf-ink);text-decoration:none}
.group-title h3{margin:0;font-size:clamp(21px,2vw,27px);font-weight:730;line-height:1.2;letter-spacing:-.025em;text-wrap:balance}
.group-title svg{flex:none;margin-top:4px;color:var(--sf-primary)}
.group-title:hover h3{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:4px}
.group-description{display:-webkit-box;overflow:hidden;margin:8px 0 0;color:#667085;font-size:14px;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.product-count{display:inline-block;margin-top:10px;color:#475467;font-size:14px;font-weight:650}
.subcategories{width:100%;margin-top:auto;padding-top:20px}
.subcategories>span{display:block;margin-bottom:10px;border-top:1px solid #e9edf2;padding-top:16px;color:#667085;font-size:14px;font-weight:700}
.subcategories>div{display:flex;flex-wrap:wrap;gap:7px}
.subcategories a{display:inline-flex;min-height:44px;align-items:center;gap:8px;border:1px solid #dbe2ea;border-radius:8px;background:#fff;padding:0 10px;color:#344054;font-size:14px;font-weight:650;text-decoration:none}
.subcategories a:hover{border-color:var(--sf-primary);color:var(--sf-primary)}
.subcategories small{color:#667085;font-size:11px;font-variant-numeric:tabular-nums}
.empty-state{display:grid;justify-items:center;gap:10px;margin-top:18px;border:1px dashed #cbd5e1;border-radius:16px;background:#f8fafc;padding:66px 24px;text-align:center}
.empty-state svg{color:var(--sf-primary)}.empty-state h3{margin:8px 0 0;font-size:22px}.empty-state p{margin:0;color:#667085}
.empty-state button,.empty-state a{display:inline-flex;min-height:44px;align-items:center;gap:8px;margin-top:10px;border:0;border-radius:9px;background:var(--sf-primary);padding:0 18px;color:#fff;font:700 14px var(--sf-body);text-decoration:none;cursor:pointer}
.categories-page :is(a,button):focus-visible{outline:3px solid var(--sf-primary);outline-offset:3px}
@media(max-width:1000px){.category-grid{grid-template-columns:1fr}.category-group{grid-template-columns:190px minmax(0,1fr)}}
@media(max-width:700px){.categories-page{width:min(100% - 32px,1320px);padding-top:22px}.page-intro{align-items:start;flex-direction:column;gap:24px;padding:42px 0}.page-intro p{font-size:15px}.category-toolbar{align-items:start;flex-direction:column;gap:22px}.search-control{width:100%}.category-group{grid-template-columns:145px minmax(0,1fr)}.group-content{padding:20px}.subcategories a{min-height:44px}}
@media(max-width:520px){.page-intro h1{font-size:42px}.category-grid{gap:14px}.category-group{grid-template-columns:1fr}.group-media{height:160px}.group-media img{max-height:160px;padding:12px}.group-content{padding:20px}.group-title h3{font-size:24px}.empty-state{padding:48px 20px}}
</style>
