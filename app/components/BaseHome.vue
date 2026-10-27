<script setup lang="ts">
import { ArrowLeft, ArrowRight, Baby, Dumbbell, HeartPulse, House, Laptop, LayoutGrid, Pause, Play, Shirt, ShoppingBag, Smile, Sparkles } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import type { StorefrontBranding } from '#shared/types/branding'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import { blogArticlesForStore } from '~/data/blog'
import { productsInCategory } from '~/utils/category-products'
import BaseProductCard from './BaseProductCard.vue'

const props = defineProps<{ storefront: StorefrontPayload, theme: StorefrontBranding }>()
const heroElement = ref<HTMLElement | null>(null)
const heroImageFailed = ref(false)
const activeSlideIndex = ref(0)
const heroHovered = ref(false)
const heroFocused = ref(false)
const autoplayPaused = ref(false)
const reducedMotion = ref(false)
const slideAnnouncement = ref('')
let slideTimer: ReturnType<typeof setTimeout> | undefined
let motion: typeof import('gsap')['gsap'] | undefined
let motionPreference: MediaQueryList | undefined
const { productImage, usePlaceholder } = useStorefrontCatalog()
const activeCategories = computed(() => props.storefront.categories.filter(category => category.is_active))
const heroImageUrl = computed(() => heroImageFailed.value ? null : props.theme.hero_image_url?.trim() || null)
watch(() => props.theme.hero_image_url, () => { heroImageFailed.value = false })
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
const heroTitle = computed(() => props.theme.hero_title && !['Cuidado perto de você.', 'Descubra o que combina com o seu dia.'].includes(props.theme.hero_title)
  ? props.theme.hero_title
  : 'Uma loja. Muitas descobertas.')
const heroSubtitle = computed(() => props.theme.hero_subtitle && ![
  'Medicamentos, higiene e bem-estar com entrega para a sua região.',
  'Explore a seleção da loja e encontre novas escolhas para diferentes momentos.',
].includes(props.theme.hero_subtitle)
  ? props.theme.hero_subtitle
  : 'Explore produtos para diferentes momentos e encontre a sua próxima escolha.')
const heroEyebrow = computed(() => props.theme.hero_eyebrow && !['Farmácia online', 'Um lugar para descobrir'].includes(props.theme.hero_eyebrow)
  ? props.theme.hero_eyebrow
  : 'Seleção da loja')
const heroCtaLabel = computed(() => props.theme.hero_cta_label && props.theme.hero_cta_label !== 'Ver ofertas'
  ? props.theme.hero_cta_label
  : 'Explorar produtos')
interface HomeSlide {
  id: string
  image: string | null
  eyebrow: string
  title: string
  subtitle: string
  cta: string
  to: string
}
const heroSlides = computed<HomeSlide[]>(() => {
  const slides: HomeSlide[] = []
  if (heroImageUrl.value) slides.push({
    id: 'store', image: heroImageUrl.value, eyebrow: heroEyebrow.value,
    title: heroTitle.value, subtitle: heroSubtitle.value, cta: heroCtaLabel.value, to: '/produtos',
  })

  const campaigns = [
    { id: 'tech', pattern: /eletr|tech|inform|comput|smart|gadget/i, image: '/images/home/slide-tech.png', eyebrow: 'Descubra a seleção', title: 'Tecnologia no seu ritmo.', subtitle: 'Escolhas para acompanhar você em todos os momentos.', cta: 'Explorar tecnologia' },
    { id: 'home', pattern: /casa|decor|m[oó]ve|lar/i, image: '/images/home/slide-home.png', eyebrow: 'Sua casa, seu lugar', title: 'Seu espaço, novas possibilidades.', subtitle: 'Peças para deixar cada ambiente com a sua cara.', cta: 'Explorar casa' },
    { id: 'beauty', pattern: /beleza|cosm[eé]t|skincare|autocuidado/i, image: '/images/home/slide-beauty.png', eyebrow: 'Um tempo para você', title: 'Um ritual só seu.', subtitle: 'Descubra uma seleção para seus momentos de cuidado.', cta: 'Explorar beleza' },
  ]
  for (const campaign of campaigns) {
    const category = homeCategories.value.find(item => campaign.pattern.test(`${item.name} ${item.slug}`))
    if (category) slides.push({ ...campaign, to: `/categoria/${category.slug}` })
  }

  if (!slides.length) slides.push({
    id: 'catalog', image: productImage(props.storefront.products.find(item => item.is_featured && productImage(item)) || props.storefront.products.find(item => productImage(item))),
    eyebrow: heroEyebrow.value, title: heroTitle.value, subtitle: heroSubtitle.value, cta: heroCtaLabel.value, to: '/produtos',
  })
  return slides
})
const activeSlide = computed(() => heroSlides.value[activeSlideIndex.value] || heroSlides.value[0]!)
const warmedImages = new Set<string>()
watch(heroSlides, slides => {
  if (activeSlideIndex.value >= slides.length) activeSlideIndex.value = 0
  warmNextSlide()
  scheduleNextSlide()
})
watch(activeSlideIndex, () => {
  warmNextSlide()
  scheduleNextSlide()
})
function warmNextSlide() {
  if (!import.meta.client || heroSlides.value.length < 2) return
  const nextImage = heroSlides.value[(activeSlideIndex.value + 1) % heroSlides.value.length]?.image
  if (!nextImage || warmedImages.has(nextImage)) return
  warmedImages.add(nextImage)
  const preload = new Image()
  preload.src = nextImage
}
function scheduleNextSlide() {
  if (slideTimer) clearTimeout(slideTimer)
  if (!import.meta.client || heroSlides.value.length < 2 || reducedMotion.value) return
  slideTimer = setTimeout(() => {
    if (!heroHovered.value && !heroFocused.value && !autoplayPaused.value && document.visibilityState === 'visible') {
      goToSlide(activeSlideIndex.value + 1)
    } else {
      scheduleNextSlide()
    }
  }, 6500)
}
function goToSlide(index: number, announce = false) {
  if (!heroSlides.value.length) return
  const previousIndex = activeSlideIndex.value
  activeSlideIndex.value = (index + heroSlides.value.length) % heroSlides.value.length
  if (announce) slideAnnouncement.value = `Destaque ${activeSlideIndex.value + 1} de ${heroSlides.value.length}: ${activeSlide.value.eyebrow}`
  if (announce && previousIndex === activeSlideIndex.value) scheduleNextSlide()
}
function animateSlideEnter(element: Element, done: () => void) {
  if (!motion || reducedMotion.value) return done()
  motion.fromTo(element, { opacity: 0 }, { opacity: 1, duration: .65, ease: 'power2.out', onComplete: done })
  const image = element.querySelector('.hero-backdrop')
  if (image) motion.fromTo(image, { scale: 1.045 }, { scale: 1, duration: 1.3, ease: 'power2.out' })
  const copy = element.querySelectorAll('.hero-eyebrow, .hero-copy h1, .hero-copy p, .hero-actions')
  if (copy.length) motion.fromTo(copy, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .58, stagger: .08, delay: .12, ease: 'power2.out' })
}
function animateSlideLeave(element: Element, done: () => void) {
  if (!motion || reducedMotion.value) return done()
  motion.to(element, { opacity: 0, duration: .4, ease: 'power2.inOut', onComplete: done })
}
const homeBlogArticles = computed(() => blogArticlesForStore(props.storefront).slice(0, 3))
const activeDealTab = ref<'best' | 'new' | 'sale'>('best')
const saleProducts = computed(() => props.storefront.products.filter(product => product.original_price && product.original_price > product.price))
const dealProducts = computed(() => {
  if (activeDealTab.value === 'sale') return saleProducts.value.slice(0, 8)
  if (activeDealTab.value === 'new') return [...props.storefront.products].reverse().slice(0, 8)
  return featured.value.slice(0, 8)
})

onMounted(async () => {
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionPreference.matches
  motionPreference.addEventListener('change', onMotionPreferenceChange)
  warmNextSlide()
  scheduleNextSlide()
  motion = (await import('gsap')).gsap
  if (heroElement.value && !reducedMotion.value) {
    motion.fromTo(heroElement.value.querySelectorAll('.hero-slide .hero-copy > *'), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .72, stagger: .09, ease: 'power2.out' })
  }
})
function onMotionPreferenceChange(event: MediaQueryListEvent) {
  reducedMotion.value = event.matches
  scheduleNextSlide()
}
onBeforeUnmount(() => {
  if (slideTimer) clearTimeout(slideTimer)
  motionPreference?.removeEventListener('change', onMotionPreferenceChange)
  if (heroElement.value && motion) motion.killTweensOf(heroElement.value.querySelectorAll('.hero-slide, .hero-backdrop, .hero-copy > *'))
})
</script>

<template>
  <main>
    <section ref="heroElement" class="hero page-width" aria-label="Destaques da loja" aria-roledescription="carrossel" @mouseenter="heroHovered = true" @mouseleave="heroHovered = false">
      <Transition :css="false" @enter="animateSlideEnter" @leave="animateSlideLeave">
        <div :key="activeSlide.id" class="hero-slide">
          <img v-if="activeSlide.image" class="hero-backdrop" :src="activeSlide.image" alt="" :fetchpriority="activeSlideIndex === 0 ? 'high' : undefined" :loading="activeSlideIndex === 0 ? 'eager' : 'lazy'" decoding="async" @error="activeSlide.id === 'store' ? heroImageFailed = true : usePlaceholder($event)" />
          <div class="hero-scrim" aria-hidden="true"></div>
          <div class="hero-copy" @focusin="heroFocused = true" @focusout="heroFocused = false">
            <span class="hero-eyebrow">{{ activeSlide.eyebrow }}</span>
            <h1 id="home-hero-title">{{ activeSlide.title }}</h1>
            <p>{{ activeSlide.subtitle }}</p>
            <div class="hero-actions">
              <NuxtLink class="hero-cta" :to="activeSlide.to">{{ activeSlide.cta }} <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
              <NuxtLink class="hero-secondary-link" to="/categorias">Ver categorias <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
            </div>
          </div>
        </div>
      </Transition>
      <div v-if="heroSlides.length > 1" class="hero-controls" aria-label="Controles dos destaques">
        <button type="button" class="hero-arrow" aria-label="Destaque anterior" @click="goToSlide(activeSlideIndex - 1, true)"><ArrowLeft :size="18" aria-hidden="true" /></button>
        <div class="hero-dots" role="group" aria-label="Selecionar destaque">
          <button v-for="(slide, index) in heroSlides" :key="slide.id" type="button" :class="{ active: index === activeSlideIndex }" :aria-label="`Mostrar destaque ${index + 1}: ${slide.eyebrow}`" :aria-current="index === activeSlideIndex ? 'true' : undefined" @click="goToSlide(index, true)"><span></span></button>
        </div>
        <button type="button" class="hero-arrow" aria-label="Próximo destaque" @click="goToSlide(activeSlideIndex + 1, true)"><ArrowRight :size="18" aria-hidden="true" /></button>
        <button v-if="!reducedMotion" type="button" class="hero-arrow hero-playback" :aria-label="autoplayPaused ? 'Retomar apresentação automática' : 'Pausar apresentação automática'" @click="autoplayPaused = !autoplayPaused"><Play v-if="autoplayPaused" :size="16" aria-hidden="true" /><Pause v-else :size="16" aria-hidden="true" /></button>
      </div>
      <span class="sr-only" aria-live="polite">{{ slideAnnouncement }}</span>
    </section>

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

.hero {
  position: relative;
  height: clamp(400px, 34vw, 480px);
  margin-top: 16px;
  overflow: hidden;
  border-radius: 14px;
  background: #173228;
  color: #fff;
  isolation: isolate;
}

.hero-slide {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: linear-gradient(110deg, #18352c, #547a65);
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(10, 24, 22, .48) 0%, rgba(10, 24, 22, .22) 41%, transparent 72%);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(58%, 750px);
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(42px, 5.4vw, 76px);
}

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hero-eyebrow::before {
  width: 23px;
  height: 1px;
  background: currentColor;
  content: '';
}

.hero-copy h1 {
  max-width: 12ch;
  margin: 24px 0 18px;
  font-size: clamp(47px, 5vw, 72px);
  font-weight: 760;
  line-height: 1.025;
  letter-spacing: -.055em;
  text-wrap: balance;
}

.hero-copy p {
  max-width: 41ch;
  margin: 0;
  color: rgba(255, 255, 255, .91);
  font-size: clamp(14px, 1.25vw, 17px);
  line-height: 1.55;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 22px;
  margin-top: 31px;
}

.hero-actions a {
  display: inline-flex;
  min-height: 45px;
  align-items: center;
  justify-content: center;
  gap: 13px;
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
}

.hero-cta {
  padding: 0 17px;
  border: 1px solid #fff;
  border-radius: 5px;
  background: #fff;
  color: #18342e;
  transition: background .2s ease, color .2s ease, transform .2s ease;
}

.hero-cta:hover {
  transform: translateY(-2px);
  background: transparent;
  color: #fff;
}

.hero-secondary-link {
  color: #fff;
}

.hero-secondary-link:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
}

.hero-controls {
  position: absolute;
  z-index: 3;
  right: 24px;
  bottom: 22px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, .24);
  border-radius: 999px;
  background: rgba(15, 24, 23, .28);
  backdrop-filter: blur(12px);
}

.hero-arrow,
.hero-dots button {
  display: grid;
  flex: none;
  place-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}

.hero-arrow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.hero-arrow:hover {
  background: rgba(255, 255, 255, .18);
}

.hero-dots {
  display: flex;
  align-items: center;
  gap: 2px;
}

.hero-dots button {
  width: 22px;
  height: 32px;
}

.hero-dots span {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .58);
  transition: width .25s ease, background .25s ease;
}

.hero-dots button.active span {
  width: 19px;
  background: #fff;
}

.hero a:focus-visible,
.hero button:focus-visible {
  outline: 3px solid #fff;
  outline-offset: 3px;
}

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
  .hero-copy { width: min(67%, 620px); }
  .hero-copy h1 { font-size: clamp(44px, 5.2vw, 62px); }
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
  .hero { display: block; height: 480px; min-height: 0; }
  .hero-backdrop { object-position: 68% center; }
  .hero-scrim { background: linear-gradient(90deg, rgba(9, 22, 21, .79), rgba(9, 22, 21, .3) 88%); }
  .hero-copy { width: min(82%, 600px); padding: 42px; }
  .hero-copy h1 { font-size: clamp(42px, 7.2vw, 57px); }
  .category-rail { display: flex; }
}

@media (max-width: 520px) {
  .hero { height: 530px; margin-top: 10px; border-radius: 10px; }
  .hero-backdrop { object-position: 72% center; }
  .hero-scrim { background: linear-gradient(180deg, rgba(9, 22, 21, .84), rgba(9, 22, 21, .61) 60%, rgba(9, 22, 21, .12)); }
  .hero-copy { width: 100%; height: auto; justify-content: flex-start; padding: 40px 25px 90px; }
  .hero-copy h1 { max-width: 11ch; margin: 21px 0 16px; font-size: clamp(40px, 10vw, 51px); }
  .hero-copy p { max-width: 34ch; font-size: 14px; }
  .hero-actions { gap: 8px 16px; margin-top: 25px; }
  .hero-actions a { min-height: 43px; font-size: 14px; }
  .hero-cta { padding-inline: 12px; }
  .hero-controls { right: 12px; bottom: 12px; }
  .categories { padding-top: 31px; }
  .category-rail { display: flex; gap: 9px; margin-right: -12px; padding-right: 12px; }
  .category-card { min-height: 178px; flex-basis: 142px; padding: 10px 8px 13px; }
  .category-art { height: 105px; margin-bottom: 7px; }
  .category-art img { width: 95px; height: 95px; }
  .category-name { font-size: 14px; }
  .category-card small { font-size: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-cta, .hero-dots span, .category-card, .category-art img { transition: none; }
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
