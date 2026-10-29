<script setup lang="ts">
import { ArrowRight, Baby, Dumbbell, HeartPulse, House, Laptop, LayoutGrid, Shirt, ShoppingBag, Smile, Sparkles } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontBranding } from '#shared/types/branding'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import { blogArticlesForStore } from '~/data/blog'
import { productsInCategory } from '~/utils/category-products'
import BaseProductCard from './BaseProductCard.vue'
import { StorefrontBannerSlideshow } from '@elinea/ui/storefront'

const props = defineProps<{ storefront: StorefrontPayload, theme: StorefrontBranding }>()
const { productImage, usePlaceholder } = useStorefrontCatalog()
const activeCategories = computed(() => props.storefront.categories.filter(category => category.is_active))
const featured = computed(() => (props.storefront.products.some(item => item.is_featured) ? props.storefront.products.filter(item => item.is_featured) : props.storefront.products).slice(0, 12))
const homeCategories = computed(() => {
  const populated = activeCategories.value.filter(category => productsInCategory(category.id, activeCategories.value, props.storefront.products).length > 0)
  const roots = populated.filter(category => category.parent_id === null)
  return (roots.length ? roots : populated).slice(0, 8)
})
const categoryCards = computed(() => homeCategories.value.map(category => {
  const products = productsInCategory(category.id, activeCategories.value, props.storefront.products)
  const product = products.find(item => item.is_featured && item.stock > 0 && productImage(item))
    || products.find(item => item.stock > 0 && productImage(item))
    || products.find(item => productImage(item))
  return { ...category, count: products.length, image: productImage(product) }
}))
const categoryIcon = (name: string) => {
  if (/eletr|tech|inform|comput/i.test(name)) return Laptop
  if (/moda|roupa|acess|vestu/i.test(name)) return Shirt
  if (/casa|decor|m[oó]ve/i.test(name)) return House
  if (/esporte|fitness|outdoor/i.test(name)) return Dumbbell
  if (/kids|baby|beb[eê]|infantil/i.test(name)) return Baby
  if (/odonto|dent/i.test(name)) return Smile
  if (/beleza|cosm[eé]t/i.test(name)) return Sparkles
  if (/medic|farm|sa[uú]de/i.test(name)) return HeartPulse
  return LayoutGrid
}
const categoriesTitle = computed(() => props.theme.categories_title && props.theme.categories_title !== 'Compre por necessidade'
  ? props.theme.categories_title
  : 'Explore por categoria')
const homeBlogArticles = computed(() => blogArticlesForStore(props.storefront).slice(0, 3))
const activeDealTab = ref<'best' | 'new' | 'sale'>('best')
const saleProducts = computed(() => props.storefront.products.filter(product => product.original_price && product.original_price > product.price))
const dealProducts = computed(() => {
  if (activeDealTab.value === 'sale') return saleProducts.value.slice(0, 8)
  if (activeDealTab.value === 'new') return [...props.storefront.products].reverse().slice(0, 8)
  return featured.value.slice(0, 8)
})

</script>

<template>
  <main>
    <h1 class="sr-only">{{ storefront.site.name }}</h1>
    <StorefrontBannerSlideshow class="home-banners page-width" :banners="storefront.banners || []" />

    <section class="categories page-width">
      <div class="section-title">
        <h2>{{ categoriesTitle }}</h2>
        <NuxtLink to="/categorias">Ver todas
          <ArrowRight :size="15" />
        </NuxtLink>
      </div>
      <div v-if="categoryCards.length" class="category-rail">
        <NuxtLink v-for="category in categoryCards" :key="category.id" :to="`/categoria/${category.slug}`" class="category-card">
          <span class="category-art">
            <img v-if="category.image" :src="category.image" alt="" loading="lazy" decoding="async" @error="usePlaceholder" />
            <component :is="categoryIcon(category.name)" v-else :size="42" aria-hidden="true" />
          </span>
          <span class="category-name">{{ category.name }}</span>
          <small>{{ category.count }} {{ category.count === 1 ? 'produto' : 'produtos' }}</small>
        </NuxtLink>
      </div>
      <div v-else class="empty-row">As categorias estão sendo organizadas.</div>
    </section>

    <section class="deals page-width">
      <div class="deals-heading">
        <h2>Ofertas do dia</h2>
        <nav aria-label="Vitrines de produtos">
          <button type="button" :class="{ active: activeDealTab === 'best' }" @click="activeDealTab = 'best'">Mais vendidos</button>
          <button type="button" :class="{ active: activeDealTab === 'new' }" @click="activeDealTab = 'new'">Novidades</button>
          <button type="button" :class="{ active: activeDealTab === 'sale' }" @click="activeDealTab = 'sale'">Em promoção</button>
          <NuxtLink to="/produtos">Ver todos</NuxtLink>
        </nav>
      </div>
      <TransitionGroup v-if="dealProducts.length" name="product-list" tag="div" class="product-grid deals-grid">
        <BaseProductCard v-for="product in dealProducts" :key="product.id" :product="product" :storefront="storefront" />
      </TransitionGroup>
      <div v-else class="empty-row">Nenhum produto nesta seleção.</div>
    </section>

    <section v-if="featured.length" class="popular page-width">
      <div class="section-title">
        <h2>{{ theme?.popular_title || 'Mais procurados' }}</h2>
        <NuxtLink to="/produtos">Ver todos
          <ArrowRight :size="15" />
        </NuxtLink>
      </div>
      <div class="compact-products">
        <NuxtLink v-for="product in featured.slice(0, 5)" :key="product.id" :to="`/produto/${product.slug}`"><span><img
              v-if="productImage(product)" :src="productImage(product)!" :alt="product.name" loading="lazy">
            <ShoppingBag v-else :size="30" />
          </span>
          <div><small>{{ product.categories[0]?.name || 'Cuidado diário' }}</small><strong>{{ product.name }}</strong>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section v-if="homeBlogArticles.length" class="home-blog page-width" aria-labelledby="home-blog-title">
      <div class="home-blog-heading">
        <div><span>Blog da loja</span><h2 id="home-blog-title">Ideias para descobrir com calma.</h2></div>
        <NuxtLink to="/blog">Ver todas as matérias <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
      </div>
      <div class="home-blog-grid" :class="{ 'home-blog-grid--single': homeBlogArticles.length === 1 }">
        <NuxtLink class="home-blog-lead" :to="`/blog/${homeBlogArticles[0]!.slug}`">
          <span class="home-blog-lead-image"><img :src="homeBlogArticles[0]!.image" :alt="homeBlogArticles[0]!.imageAlt" loading="lazy"></span>
          <span class="home-blog-lead-content"><small>{{ homeBlogArticles[0]!.category }} · {{ homeBlogArticles[0]!.readingMinutes }} min de leitura</small><strong>{{ homeBlogArticles[0]!.title }}</strong><span>{{ homeBlogArticles[0]!.excerpt }}</span><span class="home-blog-read">Ler matéria <ArrowRight :size="18" aria-hidden="true" /></span></span>
        </NuxtLink>
        <div v-if="homeBlogArticles.length > 1" class="home-blog-side">
          <NuxtLink v-for="article in homeBlogArticles.slice(1)" :key="article.slug" :to="`/blog/${article.slug}`" class="home-blog-mini">
            <span class="home-blog-mini-image"><img :src="article.image" :alt="article.imageAlt" loading="lazy"></span>
            <span class="home-blog-mini-content"><small>{{ article.category }} · {{ article.readingMinutes }} min de leitura</small><strong>{{ article.title }}</strong><span>Continuar lendo <ArrowRight :size="16" aria-hidden="true" /></span></span>
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page-width {
  width: min(100% - 40px, 1400px);
  margin-inline: auto
}

.home-banners { margin-top: 16px; }

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 20px;
}

.section-title h2 {
  margin: 0;
  font-size: clamp(27px, 3vw, 38px);
  line-height: 1.1;
  letter-spacing: -.045em;
  text-wrap: balance;
}

.section-title > a {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sf-primary);
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
}

.categories {
  padding-top: 40px;
}

.category-rail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  min-width: 0;
  min-height: 205px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  padding: 14px 12px 16px;
  border-radius: 10px;
  background: #d9ece7;
  color: #132b30;
  text-align: center;
  text-decoration: none;
  transition: transform .25s ease, box-shadow .25s ease;
}

.category-card:nth-child(7n + 2) { background: #efcfba; }
.category-card:nth-child(7n + 3) { background: #f5c7cb; }
.category-card:nth-child(7n + 4) { background: #f2e5b6; }
.category-card:nth-child(7n + 5) { background: #e6d2e1; }
.category-card:nth-child(7n + 6) { background: #c9dde5; }
.category-card:nth-child(7n + 7) { background: #d4e4d1; }

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 24px rgba(24, 45, 47, .11);
}

.category-card:focus-visible {
  outline: 3px solid var(--sf-primary);
  outline-offset: 3px;
}

.category-art {
  display: grid;
  width: min(100%, 136px);
  height: 128px;
  flex: 1 0 auto;
  place-items: center;
  margin-bottom: 10px;
  color: rgba(16, 48, 51, .75);
}

.category-art img {
  display: block;
  width: 114px;
  height: 114px;
  border: 5px solid rgba(255, 255, 255, .42);
  border-radius: 35% 40% 37% 42%;
  object-fit: cover;
  box-shadow: 0 9px 19px rgba(21, 36, 39, .12);
  transform: rotate(-5deg);
  transition: transform .25s ease;
}

.category-card:nth-child(even) .category-art img { transform: rotate(5deg); }
.category-card:hover .category-art img { transform: rotate(0) scale(1.05); }

.category-name {
  display: block;
  max-width: 100%;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.2;
  text-wrap: balance;
}

.category-card small {
  display: block;
  margin-top: 4px;
  color: rgba(19, 43, 48, .68);
  font-size: 11px;
  font-weight: 600;
}

.empty-row {
  padding: 45px;
  border: 1px dashed #cbd5e1;
  color: #64748b;
  text-align: center
}

.promo-grid {
  display: grid;
  grid-template-columns: 1.1fr .9fr .82fr;
  gap: 16px;
  padding-top: 38px
}

.promo {
  position: relative;
  display: grid;
  grid-template-columns: 1fr .8fr;
  min-height: 230px;
  align-items: center;
  overflow: hidden;
  padding: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  box-shadow: 0 22px 54px rgba(15, 23, 42, .05)
}

.promo.mint {
  background: #f8fafc
}

.promo.blue {
  background: #e9f2fa
}

.promo.peach {
  background: #fbede7
}

.promo h2 {
  max-width: 240px;
  margin: 0 0 9px;
  font-size: 19px;
  line-height: 1.15
}

.promo p {
  max-width: 210px;
  margin: 0;
  color: #64748b;
  font-size: 10px;
  line-height: 1.5
}

.promo a {
  display: inline-flex;
  margin-top: 19px;
  padding: 9px 12px;
  border-radius: 5px;
  background: var(--sf-primary);
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  text-decoration: none
}

.promo img {
  position: absolute;
  right: 3%;
  bottom: 0;
  width: 43%;
  height: 90%;
  object-fit: contain
}

.promo>svg {
  justify-self: center;
  color: var(--sf-accent)
}

.deals {
  padding-top: 72px
}

.deals-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-bottom: 32px
}

.deals-heading h2 {
  margin: 0;
  color: #0f172a;
  font-size: 25px;
  font-weight: 760;
  letter-spacing: -.025em
}

.deals-heading nav {
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 999px;
  background: #e5e7eb
}

.deals-heading nav button,
.deals-heading nav a {
  display: inline-flex;
  height: 36px;
  align-items: center;
  padding: 0 19px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #7a7f87;
  font-size: 14px;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer
}

.deals-heading nav button.active {
  background: #fff;
  color: #111827
}

.deals-heading nav a {
  margin-left: 8px;
  background: #f3f4f6;
  color: #858b95
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px
}

.deals-grid {
  grid-template-columns: repeat(4, 1fr);
  gap: 28px 24px
}

.popular {
  padding-top: 58px
}

.compact-products {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: rgba(255, 255, 255, .78)
}

.compact-products>a {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  color: var(--sf-ink);
  text-decoration: none
}

.compact-products>a+* {
  border-left: 1px solid #e5e7eb
}

.compact-products>a>span {
  display: grid;
  width: 62px;
  height: 62px;
  flex: 0 0 auto;
  place-items: center;
  background: #f8fafc;
  color: var(--sf-primary)
}

.compact-products img {
  width: 100%;
  height: 100%;
  object-fit: contain
}

.compact-products div {
  display: grid;
  gap: 4px
}

.compact-products small {
  color: var(--sf-primary);
  font-size: 8px
}

.compact-products strong {
  font-size: 10px;
  line-height: 1.35
}

.home-blog {
  margin-top: 84px;
  padding-top: 54px;
  border-top: 1px solid #e2e9ee;
}

.home-blog-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
  margin-bottom: 27px;
}

.home-blog-heading span {
  display: inline-block;
  margin-bottom: 14px;
  color: var(--sf-primary);
  font-size: 14px;
  font-weight: 750;
}

.home-blog-heading h2 {
  max-width: 17ch;
  margin: 0;
  color: var(--sf-ink);
  font-size: clamp(35px, 4vw, 54px);
  font-weight: 740;
  line-height: 1.08;
  letter-spacing: -.05em;
  text-wrap: balance;
}

.home-blog-heading > a {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 10px;
  flex: none;
  color: var(--sf-primary);
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
}

.home-blog-heading > a:hover { text-decoration: underline; text-underline-offset: 4px; }

.home-blog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr);
  gap: 18px;
}

.home-blog-lead,
.home-blog-mini {
  min-width: 0;
  background: #fff;
  color: var(--sf-ink);
  text-decoration: none;
}

.home-blog-lead { display: flex; flex-direction: column; }
.home-blog-lead-image { display: block; height: 290px; overflow: hidden; border-radius: 12px; }
.home-blog-lead-image img,
.home-blog-mini-image img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
.home-blog-lead:hover img,
.home-blog-mini:hover img { transform: scale(1.035); }
.home-blog-lead-content { display: flex; flex: 1; flex-direction: column; align-items: flex-start; padding: 24px 4px 0; }
.home-blog-lead-content small,
.home-blog-mini-content small { color: #657184; font-size: 14px; font-weight: 680; }
.home-blog-lead-content strong { max-width: 20ch; margin-top: 11px; font-size: clamp(27px, 2.5vw, 36px); font-weight: 730; line-height: 1.12; letter-spacing: -.04em; }
.home-blog-lead-content > span:not(.home-blog-read) { max-width: 54ch; margin-top: 10px; color: #596a7d; font-size: 14px; line-height: 1.55; }
.home-blog-read { display: inline-flex; align-items: center; gap: 10px; margin-top: auto; padding-top: 19px; color: var(--sf-primary); font-size: 14px; font-weight: 750; }
.home-blog-side { display: grid; grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 18px; }
.home-blog-mini { display: grid; grid-template-columns: minmax(0, .43fr) minmax(0, .57fr); min-height: 0; }
.home-blog-mini:first-child { padding-bottom: 18px; border-bottom: 1px solid #e4e9ed; }
.home-blog-mini-image { display: block; min-height: 0; overflow: hidden; border-radius: 10px; }
.home-blog-mini-content { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 18px 0 18px 22px; }
.home-blog-mini-content strong { max-width: 16ch; margin-top: 12px; font-size: clamp(20px, 2vw, 28px); font-weight: 720; line-height: 1.16; letter-spacing: -.035em; }
.home-blog-mini-content > span { display: inline-flex; align-items: center; gap: 8px; margin-top: 16px; color: var(--sf-primary); font-size: 14px; font-weight: 750; }
.home-blog-grid--single { grid-template-columns: 1fr; }
.home-blog-grid--single .home-blog-lead { display: grid; grid-template-columns: 1fr 1fr; min-height: 340px; }
.home-blog-grid--single .home-blog-lead-image { height: 100%; }
.home-blog-grid--single .home-blog-lead-content { justify-content: center; padding: 42px; }
.home-blog a:focus-visible { outline: 3px solid var(--sf-primary); outline-offset: 4px; }

@media(max-width:1000px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr)
  }

  .promo-grid {
    grid-template-columns: 1fr 1fr
  }

  .promo:last-child {
    display: none
  }

  .compact-products {
    grid-template-columns: repeat(3, 1fr)
  }

  .compact-products>a:nth-child(n+4) {
    display: none
  }
}

@media(max-width:760px) {
  .page-width {
    width: min(100% - 24px, 1400px)
  }

  .promo-grid {
    grid-template-columns: 1fr
  }

  .promo:nth-child(2) {
    display: none
  }

  .deals-heading nav {
    display: none
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr)
  }

  .deals-heading {
    align-items: start;
    flex-direction: column
  }


}

@media(max-width:520px) {
  .promo {
    min-height: 170px
  }

  .section-title h2 {
    font-size: 20px
  }

  .product-grid {
    gap: 8px;
    background: #fff
  }

  .compact-products {
    grid-template-columns: 1fr
  }

  .compact-products>a:nth-child(n+3) {
    display: none
  }

  .compact-products>a+* {
    border-left: 0
  }


}

.product-list-enter-active,
.product-list-leave-active {
  transition: opacity .18s, transform .18s
}

.product-list-enter-from,
.product-list-leave-to {
  opacity: 0;
  transform: translateY(8px)
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (max-width: 1000px) {
  .category-rail {
    display: flex;
    overflow-x: auto;
    padding-bottom: 8px;
    scroll-snap-type: x mandatory;
    scrollbar-width: thin;
  }
  .category-card { flex: 0 0 170px; scroll-snap-align: start; }
}

@media (max-width: 760px) {
  .category-rail { display: flex; }
}

@media (max-width: 520px) {
  .categories { padding-top: 31px; }
  .category-rail { display: flex; gap: 9px; margin-right: -12px; padding-right: 12px; }
  .category-card { min-height: 178px; flex-basis: 142px; padding: 10px 8px 13px; }
  .category-art { height: 105px; margin-bottom: 7px; }
  .category-art img { width: 95px; height: 95px; }
  .category-name { font-size: 14px; }
  .category-card small { font-size: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .category-card, .category-art img { transition: none; }
}

@media (max-width: 1000px) {
  .home-blog-mini-content { padding: 17px; }
  .home-blog-mini-content strong { font-size: 21px; }
  .home-blog-mini-content > span { margin-top: 10px; }
}

@media (max-width: 760px) {
  .home-blog { margin-top: 62px; padding-top: 38px; }
  .home-blog-grid { grid-template-columns: 1fr; }
  .home-blog-lead-image { height: 320px; }
  .home-blog-side { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: auto; }
  .home-blog-mini { display: flex; flex-direction: column; }
  .home-blog-mini-image { aspect-ratio: 1.5; }
  .home-blog-mini-content { flex: 1; padding: 18px 2px; }
  .home-blog-grid--single .home-blog-lead { grid-template-columns: 1fr; }
  .home-blog-grid--single .home-blog-lead-image { height: 320px; }
  .home-blog-grid--single .home-blog-lead-content { padding: 26px; }
}

@media (max-width: 520px) {
  .home-blog-heading { align-items: flex-start; flex-direction: column; gap: 13px; }
  .home-blog-heading h2 { font-size: 37px; }
  .home-blog-lead-image { height: 240px; }
  .home-blog-lead-content { padding: 20px 2px 0; }
  .home-blog-lead-content strong { font-size: 28px; }
  .home-blog-side { grid-template-columns: 1fr; }
  .home-blog-mini { display: grid; grid-template-columns: 42% 58%; min-height: 160px; }
  .home-blog-mini-image { aspect-ratio: auto; }
  .home-blog-mini-content { padding: 14px; }
  .home-blog-mini-content strong { font-size: 19px; }
  .home-blog-mini-content > span { font-size: 11px; }
  .home-blog-grid--single .home-blog-lead-image { height: 240px; }
}

@media (prefers-reduced-motion: reduce) {
  .home-blog-lead-image img, .home-blog-mini-image img { transition: none; }
}
</style>
