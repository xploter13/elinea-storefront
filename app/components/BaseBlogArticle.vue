<script setup lang="ts">
import { ArrowLeft, ArrowRight, ChevronRight } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import { blogArticlesForStore } from '~/data/blog'

const props = defineProps<{ storefront: StorefrontPayload, slug: string }>()
const articles = computed(() => blogArticlesForStore(props.storefront))
const article = computed(() => articles.value.find(item => item.slug === props.slug)!)
const related = computed(() => articles.value.filter(item => item.slug !== props.slug).slice(0, 3))
const contentsInner = ref<HTMLElement | null>(null)
const articleBody = ref<HTMLElement | null>(null)
let revertContentsPin: (() => void) | undefined
let refreshContentsPin: (() => void) | undefined
let isUnmounted = false

onMounted(async () => {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([
    import('gsap'),
    import('gsap/ScrollTrigger'),
  ])

  if (isUnmounted || !contentsInner.value || !articleBody.value) return

  gsap.registerPlugin(ScrollTrigger)
  const media = gsap.matchMedia()

  media.add('(min-width: 701px)', () => {
    const contents = contentsInner.value
    const body = articleBody.value
    if (!contents || !body) return

    const headerOffset = () => Math.ceil(document.querySelector<HTMLElement>('.store-header')?.getBoundingClientRect().height ?? 0) + 24

    ScrollTrigger.create({
      trigger: contents,
      start: () => `top top+=${headerOffset()}`,
      endTrigger: body,
      end: () => `bottom top+=${headerOffset() + contents.offsetHeight}`,
      pin: contents,
      pinSpacing: false,
      invalidateOnRefresh: true,
    })
  })

  revertContentsPin = () => media.revert()
  refreshContentsPin = () => ScrollTrigger.refresh()
})

watch(() => props.slug, async () => {
  await nextTick()
  refreshContentsPin?.()
})

onBeforeUnmount(() => {
  isUnmounted = true
  revertContentsPin?.()
})
</script>

<template>
  <main class="article-page">
    <div class="article-wrap">
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <NuxtLink to="/">Início</NuxtLink><ChevronRight :size="15" aria-hidden="true" />
        <NuxtLink to="/blog">Blog</NuxtLink><ChevronRight :size="15" aria-hidden="true" />
        <span aria-current="page">{{ article.category }}</span>
      </nav>

      <header class="article-header">
        <div class="header-meta"><span>{{ article.category }}</span><span aria-hidden="true" class="meta-divider"></span>{{ article.readingMinutes }} min de leitura</div>
        <h1>{{ article.title }}</h1>
        <p>{{ article.excerpt }}</p>
      </header>

      <figure class="cover"><img :src="article.image" :alt="article.imageAlt" fetchpriority="high" loading="eager"></figure>

      <div class="reading-layout">
        <aside class="article-contents" aria-label="Nesta matéria">
          <div ref="contentsInner" class="contents-inner">
            <span>Nesta matéria</span>
            <nav>
              <a v-for="section in article.sections" :key="section.id" :href="`#${section.id}`">{{ section.title }}</a>
            </nav>
            <NuxtLink to="/blog"><ArrowLeft :size="16" aria-hidden="true" /> Voltar ao blog</NuxtLink>
          </div>
        </aside>

        <article ref="articleBody" class="article-body">
          <p class="lead">{{ article.introduction }}</p>
          <template v-for="(section, index) in article.sections" :key="section.id">
            <section :id="section.id" class="body-section">
              <h2>{{ section.title }}</h2>
              <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
              <div v-if="section.points?.length" class="takeaways"><strong>Para levar com você</strong><ul><li v-for="point in section.points" :key="point">{{ point }}</li></ul></div>
            </section>
            <blockquote v-if="article.quote && (index === 1 || article.sections.length === 1)">{{ article.quote }}</blockquote>
          </template>
          <div class="article-close"><p>Gostou da leitura? Continue explorando ideias e encontre a próxima descoberta para o seu dia.</p><NuxtLink to="/produtos">Explorar produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink></div>
        </article>
      </div>

      <section v-if="related.length" class="related" aria-labelledby="related-title">
        <div class="related-heading"><div><span>Continue lendo</span><h2 id="related-title">Mais do blog</h2></div><NuxtLink to="/blog">Ver todas as matérias <ArrowRight :size="18" aria-hidden="true" /></NuxtLink></div>
        <div class="related-grid">
          <article v-for="item in related" :key="item.slug" class="related-card">
            <NuxtLink class="related-image" :to="`/blog/${item.slug}`" :aria-label="`Ler ${item.title}`"><img :src="item.image" :alt="item.imageAlt" loading="lazy"></NuxtLink>
            <span>{{ item.category }} · {{ item.readingMinutes }} min de leitura</span>
            <h3><NuxtLink :to="`/blog/${item.slug}`">{{ item.title }}</NuxtLink></h3>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.article-page{background:#fff;color:var(--sf-ink)}
.article-wrap{width:min(100% - 40px,1320px);margin-inline:auto}
.breadcrumb{display:flex;align-items:center;flex-wrap:wrap;gap:8px;padding-top:30px;color:#667487;font-size:13px}
.breadcrumb a{color:inherit;text-decoration:none}.breadcrumb a:hover{color:var(--sf-primary)}
.article-header{max-width:900px;margin:75px auto 49px;text-align:center}
.header-meta{display:flex;align-items:center;justify-content:center;gap:12px;color:#68798b;font-size:13px;font-weight:650}
.header-meta>span:first-child{color:var(--sf-primary)}
.meta-divider{width:3px;height:3px;border-radius:50%;background:#8390a0}
.article-header h1{max-width:16ch;margin:24px auto 19px;font-size:clamp(47px,5.5vw,80px);font-weight:740;line-height:1.045;letter-spacing:-.06em;text-wrap:balance}
.article-page .article-header p{max-width:650px;margin:0 auto;color:#536276;font-size:clamp(17px,1.7vw,21px);line-height:1.55}
.cover{height:clamp(360px,42vw,590px);margin:0;overflow:hidden;border-radius:15px;background:#e9eef2}
.cover img{display:block;width:100%;height:100%;object-fit:cover}
.reading-layout{display:grid;grid-template-columns:minmax(180px,245px) minmax(0,760px);justify-content:center;gap:clamp(36px,5.5vw,92px);padding:78px 0 0}
.article-contents{align-self:start}.contents-inner{padding-top:8px}
.contents-inner>span{display:block;margin-bottom:19px;color:var(--sf-ink);font-size:14px;font-weight:760}
.article-contents nav{display:grid;gap:2px;padding-left:15px;border-left:1px solid #d9e2e9}
.article-contents nav a{display:block;padding:9px 0;color:#68788b;font-size:13px;line-height:1.35;text-decoration:none}
.article-contents nav a:hover{color:var(--sf-primary)}
.contents-inner> a{display:inline-flex;align-items:center;gap:9px;margin-top:31px;color:var(--sf-primary);font-size:13px;font-weight:750;text-decoration:none}
.contents-inner> a:hover{text-decoration:underline;text-underline-offset:4px}
.article-body{min-width:0}
.article-page .article-body p{margin:0 0 24px;color:#344357;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:19px;line-height:1.74}
.article-page .article-body .lead{margin-bottom:50px;color:#24364a;font-size:clamp(21px,2vw,25px);line-height:1.62}
.body-section{margin-top:45px;scroll-margin-top:210px}
.body-section h2{margin:0 0 22px;font-size:clamp(29px,2.9vw,40px);font-weight:730;line-height:1.13;letter-spacing:-.04em}
.takeaways{margin:36px 0;padding:27px 31px;border-left:3px solid var(--sf-primary);background:color-mix(in srgb,var(--sf-primary) 6%,#f7f9fb)}
.takeaways strong{display:block;margin-bottom:13px;font-size:14px;font-weight:760}
.takeaways ul{display:grid;gap:9px;margin:0;padding-left:19px;color:#47596d;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:18px;line-height:1.5}
.article-body blockquote{margin:54px 0 61px;padding:0 0 0 28px;border-left:4px solid var(--sf-primary);color:var(--sf-ink);font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:clamp(27px,3vw,39px);line-height:1.28;letter-spacing:-.025em}
.article-close{margin-top:70px;padding:31px 0;border-top:1px solid #e2e9ee;border-bottom:1px solid #e2e9ee}
.article-page .article-close p{max-width:36ch;margin:0 0 20px;color:#526377;font-family:var(--sf-body);font-size:16px;line-height:1.55}
.article-close a{display:inline-flex;min-height:46px;align-items:center;gap:15px;padding:0 17px;border-radius:6px;background:var(--sf-ink);color:#fff;font-size:14px;font-weight:750;text-decoration:none}
.article-close a:hover{background:var(--sf-primary)}
.related{padding-top:105px}
.related-heading{display:flex;align-items:end;justify-content:space-between;gap:22px;margin-bottom:26px;padding-bottom:19px;border-bottom:1px solid #e2e9ee}
.related-heading span{color:var(--sf-primary);font-size:13px;font-weight:750}
.related-heading h2{margin:8px 0 0;font-size:clamp(29px,3vw,42px);font-weight:730;letter-spacing:-.045em}
.related-heading>a{display:inline-flex;align-items:center;gap:8px;color:var(--sf-primary);font-size:13px;font-weight:750;text-decoration:none}
.related-heading>a:hover{text-decoration:underline;text-underline-offset:4px}
.related-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:23px}
.related-card{min-width:0}.related-image{display:block;aspect-ratio:1.45;overflow:hidden;border-radius:9px;background:#eef2f5}
.related-image img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .35s ease}.related-image:hover img{transform:scale(1.04)}
.related-card>span{display:block;margin-top:17px;color:#65758a;font-size:12px;font-weight:650}
.related-card h3{max-width:24ch;margin:9px 0 0;font-size:clamp(22px,2vw,29px);font-weight:720;line-height:1.2;letter-spacing:-.035em}
.related-card h3 a{color:inherit;text-decoration:none}.related-card h3 a:hover{color:var(--sf-primary)}
.article-page a:focus-visible{outline:3px solid var(--sf-primary);outline-offset:4px}
@media(max-width:1080px){.body-section{scroll-margin-top:110px}}
@media(max-width:900px){.reading-layout{grid-template-columns:minmax(150px,190px) minmax(0,1fr);gap:36px}.article-header{margin-top:55px}.cover{height:440px}.related-grid{gap:15px}}
@media(max-width:700px){.article-wrap{width:min(100% - 28px,1320px)}.breadcrumb{padding-top:20px}.article-header{margin:52px auto 35px}.article-header h1{font-size:clamp(42px,9vw,59px)}.article-page .article-header p{font-size:16px}.cover{height:auto;aspect-ratio:1.4}.reading-layout{display:block;padding-top:45px}.article-contents{margin-bottom:38px}.contents-inner{position:static;padding:0 0 20px;border-bottom:1px solid #e4eaef}.contents-inner>span{margin-bottom:11px}.article-contents nav{display:flex;flex-wrap:wrap;gap:8px;padding:0;border:0}.article-contents nav a{padding:8px 11px;border-radius:5px;background:#f0f4f7}.contents-inner>a{margin-top:18px}.article-page .article-body p{font-size:18px}.article-page .article-body .lead{margin-bottom:37px}.related{padding-top:74px}.related-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:500px){.article-header h1{font-size:clamp(40px,10vw,51px)}.cover{aspect-ratio:1.14}.article-body blockquote{padding-left:18px;font-size:28px}.takeaways{padding:22px}.related-heading{align-items:start;flex-direction:column}.related-grid{grid-template-columns:1fr;gap:32px}.related-image{aspect-ratio:1.5}}
@media(prefers-reduced-motion:reduce){.related-image img{transition:none}}
</style>
