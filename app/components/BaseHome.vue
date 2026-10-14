<script setup lang="ts">
import { ArrowRight, Baby, BadgePercent, Bandage, Cross, HeartPulse, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Truck } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontBranding } from '#shared/types/branding'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import BaseEditorialSpotlight from './BaseEditorialSpotlight.vue'
import BaseProductCard from './BaseProductCard.vue'
import BaseServiceRibbon from './BaseServiceRibbon.vue'

const props = defineProps<{ storefront: StorefrontPayload, theme: StorefrontBranding }>()
const { activeCategories, productImage, usePlaceholder, money } = useStorefrontCatalog(props.storefront)
const featured = computed(() => (props.storefront.products.some(item => item.is_featured) ? props.storefront.products.filter(item => item.is_featured) : props.storefront.products).slice(0, 12))
const heroProduct = computed(() => featured.value.find(item => productImage(item)) || featured.value[0])
const secondaryProduct = computed(() => featured.value.find(item => item.id !== heroProduct.value?.id && productImage(item)))
const updatesProduct = computed(() =>
  props.storefront.products.find(item => !item.is_featured && item.stock > 0 && productImage(item))
  || props.storefront.products.find(item => item.stock > 0 && productImage(item))
  || props.storefront.products[0]
)
const categoryIcons = [HeartPulse, Sparkles, Baby, Bandage, Cross, BadgePercent]
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
    <section class="benefit-bar page-width">
      <div>
        <Truck /><span><strong>Entrega para sua região</strong><small>Consulte pelo CEP</small></span>
      </div>
      <div>
        <PackageCheck /><span><strong>Acompanhe seu pedido</strong><small>Do preparo à entrega</small></span>
      </div>
      <div>
        <ShieldCheck /><span><strong>Compra protegida</strong><small>Seus dados seguros</small></span>
      </div>
      <div>
        <HeartPulse /><span><strong>Cuidado todos os dias</strong><small>Encontre o que precisa</small></span>
      </div>
    </section>

    <section class="hero page-width">
      <div class="hero-copy"><span>{{ theme?.hero_eyebrow || 'Farmácia online' }}</span>
        <h1>{{ theme?.hero_title || 'Cuidado perto de você.' }}</h1>
        <p>{{ theme?.hero_subtitle || 'Medicamentos, higiene e bem-estar com entrega para a sua região.' }}</p>
        <NuxtLink to="/produtos">{{ theme?.hero_cta_label || 'Ver ofertas' }}
          <ArrowRight :size="17" />
        </NuxtLink>
        <div class="hero-trust"><span>Produtos selecionados</span><i></i><span>Preços justos</span><i></i><span>Compra
            segura</span></div>
      </div>
      <div class="hero-products">
        <div class="medical-pattern" aria-hidden="true"><b v-for="n in 10" :key="n">+</b></div><img
          v-if="theme?.hero_image_url" class="hero-primary" :src="theme.hero_image_url" alt="Destaque principal da loja"
          fetchpriority="high"><img v-else-if="heroProduct && productImage(heroProduct)" class="hero-primary"
          :src="productImage(heroProduct)!" :alt="heroProduct.name" fetchpriority="high" @error="usePlaceholder"><img
          v-if="secondaryProduct && productImage(secondaryProduct)" class="hero-secondary"
          :src="productImage(secondaryProduct)!" :alt="secondaryProduct.name" fetchpriority="high"
          @error="usePlaceholder"><span v-if="!theme?.hero_image_url && !heroProduct" class="hero-empty">+</span>
      </div>
    </section>

    <BaseServiceRibbon />

    <section class="categories page-width">
      <div class="section-title">
        <h2>{{ theme?.categories_title || 'Compre por necessidade' }}</h2>
        <NuxtLink to="/categorias">Ver todas
          <ArrowRight :size="15" />
        </NuxtLink>
      </div>
      <div v-if="activeCategories.length" class="category-rail">
        <NuxtLink v-for="(category, index) in activeCategories.slice(0, 8)" :key="category.id"
          :to="`/categoria/${category.slug}`">
          <component :is="categoryIcons[index % categoryIcons.length]" :size="30" /><strong>{{ category.name
            }}</strong><small>{{storefront.products.filter(item => item.categories.some(value => value.id ===
              category.id)).length }} produtos</small>
        </NuxtLink>
        <NuxtLink to="/produtos" class="offer-category">
          <BadgePercent :size="30" /><strong>Ofertas</strong><small>Economize hoje</small>
        </NuxtLink>
      </div>
      <div v-else class="empty-row">As categorias estão sendo organizadas.</div>
    </section>

    <BaseEditorialSpotlight :storefront="storefront" />

    <section class="deals page-width">
      <div class="deals-heading">
        <h2>Deals of The Day</h2>
        <nav aria-label="Vitrines de produtos">
          <button type="button" :class="{ active: activeDealTab === 'best' }" @click="activeDealTab = 'best'">Best Sellers</button>
          <button type="button" :class="{ active: activeDealTab === 'new' }" @click="activeDealTab = 'new'">New Arrivals</button>
          <button type="button" :class="{ active: activeDealTab === 'sale' }" @click="activeDealTab = 'sale'">On Sale</button>
          <NuxtLink to="/produtos">View All</NuxtLink>
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

    <section v-if="theme?.show_newsletter !== false && updatesProduct" class="store-updates page-width" aria-labelledby="store-updates-title">
      <div class="updates-copy">
        <span class="updates-label"><span aria-hidden="true"></span>{{ theme?.newsletter_eyebrow || 'Novidades da loja' }}</span>
        <h2 id="store-updates-title">{{ theme?.newsletter_title || 'Cuide da sua rotina sem sair de casa.' }}</h2>
        <p>Explore produtos da {{ storefront.site.name }} e encontre novas escolhas para a sua rotina.</p>
        <NuxtLink class="updates-cta" to="/produtos">Explorar produtos <ArrowRight :size="19" aria-hidden="true" /></NuxtLink>
      </div>

      <div class="updates-display">
        <span class="display-label">Uma escolha para conhecer</span>
        <NuxtLink class="updates-product" :to="`/produto/${updatesProduct.slug}`">
          <span class="updates-media">
            <img v-if="productImage(updatesProduct)" :src="productImage(updatesProduct)!" alt="" loading="lazy" @error="usePlaceholder">
            <ShoppingBag v-else :size="56" aria-hidden="true" />
          </span>
          <span class="updates-product-info">
            <small>{{ updatesProduct.categories[0]?.name || 'Produtos da loja' }}</small>
            <strong>{{ updatesProduct.name }}</strong>
            <span class="updates-price">{{ updatesProduct.stock > 0 ? money(updatesProduct.price) : 'Indisponível' }} <ArrowRight :size="18" aria-hidden="true" /></span>
          </span>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.page-width {
  width: min(100% - 40px, 1400px);
  margin-inline: auto
}

.benefit-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 0 0 14px 14px;
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 20px 54px rgba(15, 23, 42, .04);
  backdrop-filter: blur(14px)
}

.benefit-bar>div {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 11px;
  min-height: 66px;
  padding: 10px;
  color: var(--sf-primary)
}

.benefit-bar>div+div {
  border-left: 1px solid #e5e7eb
}

.benefit-bar span {
  display: grid;
  gap: 3px
}

.benefit-bar strong {
  color: var(--sf-ink);
  font-size: 10px
}

.benefit-bar small {
  color: #758884;
  font-size: 8px
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
  min-height: 560px;
  margin-top: 24px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, .94), rgba(248, 250, 252, .9)),
    #fff;
  box-shadow: 0 32px 90px rgba(15, 23, 42, .07)
}

.hero-copy {
  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: center;
  padding: clamp(44px, 6vw, 84px)
}

.hero-copy>span {
  color: var(--sf-primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: .14em;
  text-transform: uppercase
}

.hero-copy h1 {
  max-width: 650px;
  margin: 14px 0 18px;
  font-family: "Nunito Sans", "Segoe UI", sans-serif;
  font-size: clamp(48px, 5.3vw, 82px);
  font-weight: 900;
  line-height: .9;
  letter-spacing: -.05em;
  text-wrap: balance
}

.hero-copy p {
  max-width: 500px;
  margin: 0;
  color: #475569;
  font-size: 17px;
  line-height: 1.65
}

.hero-copy>a {
  display: flex;
  height: 46px;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
  padding: 0 20px;
  border-radius: 8px;
  background: var(--sf-primary);
  box-shadow: 0 16px 34px rgba(37, 99, 235, .16);
  color: #fff;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
  transition: transform .22s, box-shadow .22s, background .22s
}

.hero-copy>a:hover {
  background: #1d4ed8;
  box-shadow: 0 20px 40px rgba(37, 99, 235, .2);
  transform: translateY(-2px)
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 35px;
  color: #64748b;
  font-size: 8px;
  font-weight: 700
}

.hero-trust i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--sf-primary)
}

.hero-products {
  position: relative;
  min-height: 560px;
  background:
    radial-gradient(circle at 28% 22%, rgba(255, 255, 255, .92), transparent 19rem),
    linear-gradient(135deg, #f8fafc, #eff6ff)
}

.medical-pattern {
  position: absolute;
  inset: 25px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: center;
  justify-items: center;
  color: #cae0ec;
  font-size: 45px;
  opacity: .38
}

.hero-products img {
  position: absolute;
  object-fit: contain;
  filter: drop-shadow(0 28px 34px rgba(15, 23, 42, .14))
}

.hero-primary {
  right: 11%;
  bottom: 6%;
  width: 48%;
  height: 78%
}

.hero-secondary {
  left: 6%;
  bottom: 3%;
  width: 42%;
  height: 57%
}

.hero-empty {
  display: grid;
  width: 100%;
  height: 100%;
  place-items: center;
  color: #d1e3ec;
  font-size: 180px
}

.section-title {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 25px;
  margin-bottom: 20px
}

.section-title h2 {
  margin: 0;
  font-size: clamp(27px, 3vw, 42px);
  line-height: 1;
  letter-spacing: -.04em;
  text-wrap: balance
}

.section-title>a {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--sf-primary);
  font-size: 10px;
  font-weight: 800;
  text-decoration: none
}

.categories {
  padding-top: 54px
}

.category-rail {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
  gap: 12px
}

.category-rail>a {
  display: grid;
  min-height: 148px;
  align-content: center;
  justify-items: center;
  gap: 8px;
  padding: 18px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 14px 34px rgba(15, 23, 42, .04);
  color: var(--sf-primary);
  text-align: center;
  text-decoration: none;
  transition: transform .22s, border-color .22s, box-shadow .22s
}

.category-rail>a:hover {
  border-color: rgba(37, 99, 235, .28);
  box-shadow: 0 20px 44px rgba(15, 23, 42, .08);
  transform: translateY(-3px)
}

.category-rail strong {
  color: var(--sf-ink);
  font-size: 10px
}

.category-rail small {
  color: #84948f;
  font-size: 8px
}

.category-rail .offer-category {
  color: var(--sf-accent)
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
  font-size: 12px;
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

.store-updates {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(310px, .85fr);
  align-items: center;
  gap: clamp(32px, 6vw, 92px);
  min-height: 420px;
  margin-top: 78px;
  padding: clamp(36px, 5vw, 68px) 0;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: #fff
}

.updates-copy {
  max-width: 610px
}

.updates-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--sf-primary);
  color: var(--sf-ink);
  font-size: 14px;
  font-weight: 700
}

.updates-label>span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sf-primary)
}

.updates-copy h2 {
  max-width: 13ch;
  margin: 24px 0 16px;
  color: var(--sf-ink);
  font-size: clamp(36px, 4.2vw, 58px);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -.045em;
  text-wrap: balance
}

.updates-copy p {
  max-width: 47ch;
  margin: 0;
  color: #475467;
  font-size: 16px;
  line-height: 1.65
}

.updates-cta {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 28px;
  padding: 0 20px;
  border-radius: 10px;
  background: #172336;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none
}

.updates-cta:hover {
  background: #263b58
}

.updates-display {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e4e9ee;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 20px 48px rgba(15, 23, 42, .08)
}

.display-label {
  display: block;
  margin: 2px 4px 14px;
  color: #475467;
  font-size: 13px;
  font-weight: 700
}

.updates-product {
  display: grid;
  grid-template-columns: minmax(130px, .95fr) minmax(0, 1fr);
  min-height: 222px;
  overflow: hidden;
  border-radius: 12px;
  background: #f4f7fa;
  color: var(--sf-ink);
  text-decoration: none
}

.updates-media {
  display: grid;
  min-width: 0;
  place-items: center;
  padding: 20px;
  color: #8b9aa9
}

.updates-media img {
  display: block;
  width: 100%;
  max-height: 200px;
  object-fit: contain
}

.updates-product-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  padding: 20px 20px 20px 4px
}

.updates-product-info small {
  color: var(--sf-primary);
  font-size: 12px;
  font-weight: 700
}

.updates-product-info strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: clamp(16px, 1.6vw, 20px);
  font-weight: 750;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3
}

.updates-product:hover .updates-product-info strong {
  text-decoration: underline;
  text-underline-offset: 3px
}

.updates-price {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: var(--sf-ink);
  font-size: 18px;
  font-weight: 800
}

.updates-price svg {
  color: var(--sf-primary)
}

.store-updates a:focus-visible {
  outline: 3px solid var(--sf-primary);
  outline-offset: 3px
}

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

  .benefit-bar {
    grid-template-columns: 1fr 1fr
  }

  .benefit-bar>div:nth-child(3) {
    border-left: 0
  }

  .benefit-bar>div:nth-child(n+3) {
    border-top: 1px solid #e5e7eb
  }

  .hero {
    grid-template-columns: 1fr
  }

  .hero-copy {
    padding: 42px 28px
  }

  .hero-copy h1 {
    font-size: 48px
  }

  .hero-products {
    min-height: 330px
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

  .store-updates {
    grid-template-columns: 1fr;
    gap: 32px
  }
}

@media(max-width:520px) {
  .benefit-bar>div {
    justify-content: start
  }

  .category-rail {
    display: flex;
    overflow: auto
  }

  .category-rail>a {
    min-width: 120px
  }

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

  .store-updates {
    margin-top: 56px;
    padding: 34px 0
  }

  .updates-copy h2 {
    margin-top: 18px;
    font-size: clamp(32px, 9vw, 42px)
  }

  .updates-display {
    padding: 12px
  }

  .updates-product {
    grid-template-columns: minmax(100px, .8fr) minmax(0, 1fr);
    min-height: 188px
  }

  .updates-media {
    padding: 12px
  }

  .updates-product-info {
    padding: 14px 12px 14px 0
  }

  .updates-price {
    font-size: 16px
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
</style>
