<script setup lang="ts">
import { ArrowRight, ChevronRight } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import { blogArticlesForStore } from '~/data/blog'

const props = defineProps<{ storefront: StorefrontPayload }>()
const articles = computed(() => blogArticlesForStore(props.storefront))
const featured = computed(() => articles.value[0]!)
const moreArticles = computed(() => articles.value.slice(1))
</script>

<template>
  <main class="blog-page">
    <div class="blog-wrap">
      <nav class="breadcrumb" aria-label="Caminho de navegação">
        <NuxtLink to="/">Início</NuxtLink><ChevronRight :size="15" aria-hidden="true" /><span aria-current="page">Blog</span>
      </nav>

      <header class="page-intro">
        <div>
          <span class="intro-label">Blog da loja</span>
          <h1>Para descobrir<br>com calma.</h1>
        </div>
        <p>Ideias e guias para encontrar o que faz sentido na sua rotina. Uma boa descoberta merece tempo.</p>
      </header>

      <section class="featured-story" aria-labelledby="featured-story-title">
        <NuxtLink class="featured-image" :to="`/blog/${featured.slug}`" :aria-label="`Ler ${featured.title}`">
          <img :src="featured.image" :alt="featured.imageAlt" fetchpriority="high" loading="eager">
        </NuxtLink>
        <div class="featured-content">
          <span class="story-meta"><span>{{ featured.category }}</span><span aria-hidden="true" class="meta-divider"></span>{{ featured.readingMinutes }} min de leitura</span>
          <h2 id="featured-story-title"><NuxtLink :to="`/blog/${featured.slug}`">{{ featured.title }}</NuxtLink></h2>
          <p>{{ featured.excerpt }}</p>
          <NuxtLink class="read-link" :to="`/blog/${featured.slug}`">Ler matéria <ArrowRight :size="19" aria-hidden="true" /></NuxtLink>
        </div>
      </section>

      <section v-if="moreArticles.length" class="more-stories" aria-labelledby="more-stories-title">
        <div class="section-heading"><h2 id="more-stories-title">Outras leituras</h2><p>Novas ideias para explorar</p></div>
        <div class="story-grid">
          <article v-for="article in moreArticles" :key="article.slug" class="story-card">
            <NuxtLink class="story-image" :to="`/blog/${article.slug}`" :aria-label="`Ler ${article.title}`"><img :src="article.image" :alt="article.imageAlt" loading="lazy"></NuxtLink>
            <div class="story-card-content">
              <span class="story-meta"><span>{{ article.category }}</span><span aria-hidden="true" class="meta-divider"></span>{{ article.readingMinutes }} min de leitura</span>
              <h3><NuxtLink :to="`/blog/${article.slug}`">{{ article.title }}</NuxtLink></h3>
              <p>{{ article.excerpt }}</p>
              <NuxtLink class="card-link" :to="`/blog/${article.slug}`">Continuar lendo <ArrowRight :size="17" aria-hidden="true" /></NuxtLink>
            </div>
          </article>
        </div>
      </section>

      <div class="blog-endnote"><span>Continue a descoberta na loja.</span><NuxtLink to="/produtos">Explorar produtos <ArrowRight :size="18" aria-hidden="true" /></NuxtLink></div>
    </div>
  </main>
</template>

<style scoped>
.blog-page{color:var(--sf-ink);background:#fff}
.blog-wrap{width:min(100% - 40px,1320px);margin-inline:auto}
.breadcrumb{display:flex;align-items:center;gap:9px;padding-top:30px;color:#667487;font-size:13px}
.breadcrumb a{color:inherit;text-decoration:none}.breadcrumb a:hover{color:var(--sf-primary)}
.page-intro{display:flex;align-items:end;justify-content:space-between;gap:40px;padding:60px 0 56px}
.intro-label{display:inline-block;margin-bottom:20px;color:var(--sf-primary);font-size:14px;font-weight:750}
.page-intro h1{margin:0;font-size:clamp(52px,6.4vw,94px);font-weight:740;line-height:.99;letter-spacing:-.065em}
.blog-page .page-intro>p{max-width:370px;margin:0 0 6px;color:#526173;font-size:17px;line-height:1.6}
.featured-story{display:grid;grid-template-columns:minmax(0,1.16fr) minmax(0,.84fr);min-height:490px;overflow:hidden;border:1px solid #e5e9ed;border-radius:16px;background:#fff}
.featured-image{position:relative;display:block;min-height:490px;overflow:hidden}
.featured-image img{position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
.featured-image:hover img{transform:scale(1.035)}
.featured-content{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:clamp(36px,5vw,76px)}
.story-meta{display:inline-flex;align-items:center;flex-wrap:wrap;gap:11px;color:#526173;font-size:12px;font-weight:650}
.story-meta>span:first-child{color:var(--sf-primary)}
.meta-divider{width:3px;height:3px;border-radius:50%;background:#8390a0}
.featured-content h2{max-width:13ch;margin:25px 0 17px;font-size:clamp(37px,4vw,58px);font-weight:720;line-height:1.08;letter-spacing:-.05em;text-wrap:balance}
.featured-content h2 a,.story-card h3 a{color:inherit;text-decoration:none}
.featured-content h2 a:hover,.story-card h3 a:hover{color:var(--sf-primary)}
.blog-page .featured-content p{max-width:42ch;margin:0;color:#526173;font-size:16px;line-height:1.65}
.read-link{display:inline-flex;min-height:48px;align-items:center;gap:15px;margin-top:30px;padding:0 19px;border-radius:6px;background:var(--sf-ink);color:#fff;font-size:14px;font-weight:750;text-decoration:none;transition:background .2s ease}
.read-link:hover{background:var(--sf-primary)}
.more-stories{padding-top:84px}
.section-heading{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:26px;padding-bottom:20px;border-bottom:1px solid #e5ebef}
.section-heading h2{margin:0;font-size:clamp(29px,3vw,42px);font-weight:730;letter-spacing:-.045em}
.section-heading p{margin:0;color:#69778a;font-size:14px}
.story-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}
.story-card{min-width:0}
.story-image{display:block;aspect-ratio:1.35;overflow:hidden;border-radius:10px;background:#edf2f6}
.story-image img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .4s ease}
.story-image:hover img{transform:scale(1.04)}
.story-card-content{padding:23px 1px 0}
.story-card h3{max-width:22ch;margin:15px 0 10px;font-size:clamp(23px,2.2vw,31px);font-weight:720;line-height:1.16;letter-spacing:-.04em;text-wrap:balance}
.blog-page .story-card p{max-width:43ch;margin:0;color:#607084;font-size:14px;line-height:1.6}
.card-link{display:inline-flex;min-height:40px;align-items:center;gap:9px;margin-top:15px;color:var(--sf-primary);font-size:13px;font-weight:750;text-decoration:none}
.card-link:hover{text-decoration:underline;text-underline-offset:4px}
.blog-endnote{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:86px;padding:28px 0;border-top:1px solid #e5ebef;color:#536174;font-size:15px}
.blog-endnote a{display:inline-flex;align-items:center;gap:10px;color:var(--sf-primary);font-weight:750;text-decoration:none}
.blog-endnote a:hover{text-decoration:underline;text-underline-offset:4px}
.blog-page a:focus-visible{outline:3px solid var(--sf-primary);outline-offset:4px}
@media(max-width:960px){.featured-story{grid-template-columns:1fr 1fr;min-height:430px}.featured-image{min-height:430px}.featured-content{padding:34px}.featured-content h2{font-size:clamp(32px,4.3vw,46px)}.story-grid{gap:16px}}
@media(max-width:700px){.blog-wrap{width:min(100% - 28px,1320px)}.page-intro{display:block;padding:42px 0 36px}.page-intro h1{font-size:clamp(47px,11vw,69px)}.blog-page .page-intro>p{max-width:480px;margin-top:25px;font-size:15px}.featured-story{grid-template-columns:1fr}.featured-image{min-height:0;aspect-ratio:1.5}.featured-content{padding:28px 24px 34px}.featured-content h2{margin-top:17px;font-size:clamp(34px,8vw,46px)}.more-stories{padding-top:58px}.story-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.section-heading p{display:none}.blog-endnote{margin-top:60px}}
@media(max-width:510px){.breadcrumb{padding-top:20px}.story-grid{grid-template-columns:1fr;gap:36px}.story-image{aspect-ratio:1.48}.story-card-content{padding-top:18px}.story-card h3{font-size:26px}.blog-endnote{align-items:flex-start;flex-direction:column;gap:12px}}
@media(prefers-reduced-motion:reduce){.featured-image img,.story-image img,.read-link{transition:none}}
</style>
