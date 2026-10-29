<script setup lang="ts">
import type { StoreProduct } from '#shared/types/storefront'
const props = defineProps<{ product: StoreProduct }>()
const active = ref('description')
const tabs = [{ id: 'description', label: 'Descrição' }, { id: 'specifications', label: 'Especificações' }, { id: 'reviews', label: 'Avaliações' }, { id: 'faqs', label: 'Dúvidas' }]
const identifier = (tab: string) => `product-${props.product.id}-${tab}`
const description = computed(() => (props.product.description || props.product.excerpt || 'As informações deste produto serão atualizadas pela loja.').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim())
const specifications = computed(() => [
  ...(props.product.specifications ?? []),
  { name: 'SKU', value: props.product.sku },
  { name: 'Categoria', value: props.product.categories[0]?.name || 'Não informada' },
  { name: props.product.is_demo ? 'Estoque ilustrativo' : 'Estoque', value: `${props.product.stock} unidades` },
])
const reviews = computed(() => props.product.is_demo ? props.product.demo_reviews ?? [] : props.product.reviews ?? [])
const changeTab = (event: KeyboardEvent) => {
  const current = tabs.findIndex(tab => tab.id === active.value)
  const next = event.key === 'ArrowRight' ? (current + 1) % tabs.length : event.key === 'ArrowLeft' ? (current - 1 + tabs.length) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
  if (next < 0) return
  event.preventDefault()
  active.value = tabs[next]!.id
  document.getElementById(identifier(`${active.value}-tab`))?.focus()
}
watch(() => props.product.id, () => { active.value = 'description' })
</script>
<template>
  <section class="product-content-panel">
    <div class="content-tabs" role="tablist" aria-label="Informações do produto" @keydown="changeTab">
      <button v-for="tab in tabs" :id="identifier(`${tab.id}-tab`)" :key="tab.id" type="button" role="tab" :aria-selected="active === tab.id" :aria-controls="identifier(tab.id)" :tabindex="active === tab.id ? 0 : -1" @click="active = tab.id">{{ tab.label }}</button>
    </div>
    <section :id="identifier('description')" v-show="active === 'description'" role="tabpanel" :aria-labelledby="identifier('description-tab')" tabindex="0" class="content-panel">
      <h2>Sobre este produto</h2>
      <p class="product-description">{{ description }}</p>
      <p v-if="product.is_demo" class="demo-note">Produto de demonstração. Informações, preço e estoque ilustrativos para apresentar a loja.</p>
    </section>
    <section :id="identifier('specifications')" v-show="active === 'specifications'" role="tabpanel" :aria-labelledby="identifier('specifications-tab')" tabindex="0" class="content-panel">
      <h2>Informações do produto</h2>
      <dl class="content-specifications"><div v-for="(row, index) in specifications" :key="index"><dt>{{ row.name }}</dt><dd>{{ row.value }}</dd></div></dl>
    </section>
    <section :id="identifier('reviews')" v-show="active === 'reviews'" role="tabpanel" :aria-labelledby="identifier('reviews-tab')" tabindex="0" class="content-panel">
      <h2>Avaliações{{ product.is_demo ? ' de exemplo' : '' }}</h2>
      <p v-if="product.is_demo" class="demo-note">Avaliações ilustrativas do kit inicial. Não representam compras ou experiências reais de clientes.</p>
      <article v-for="(review, index) in reviews" :key="index" class="example-review"><div><strong>{{ review.author }}</strong><span :aria-label="`${review.rating} de 5 estrelas`">{{ review.rating }}/5{{ product.is_demo ? ' · Exemplo' : '' }}</span></div><h3>{{ review.title }}</h3><p>{{ review.comment }}</p></article>
      <p v-if="!reviews.length">Nenhuma avaliação disponível para este produto.</p>
    </section>
    <section :id="identifier('faqs')" v-show="active === 'faqs'" role="tabpanel" :aria-labelledby="identifier('faqs-tab')" tabindex="0" class="content-panel">
      <h2>Dúvidas frequentes</h2>
      <details v-for="(faq, index) in product.faqs || []" :key="index" class="product-faq"><summary>{{ faq.question }}</summary><p>{{ faq.answer }}</p></details>
      <p v-if="!product.faqs?.length">As respostas às dúvidas mais comuns serão publicadas aqui.</p>
    </section>
  </section>
</template>
<style scoped>
.product-content-panel{min-width:0;border:1px solid #eaecf0;border-radius:16px;background:#fff;overflow:hidden}.content-tabs{display:flex;overflow-x:auto;gap:26px;padding:0 28px;border-bottom:1px solid #eaecf0}.content-tabs button{position:relative;flex-shrink:0;min-height:56px;padding:16px 0;border:0;background:none;color:#667085;font:inherit;font-size:14px;cursor:pointer}.content-tabs [aria-selected=true]{color:var(--sf-primary,#2563eb);font-weight:700;box-shadow:inset 0 -2px currentColor}.content-tabs button:focus-visible,.content-panel:focus-visible,.product-faq summary:focus-visible{outline:2px solid var(--sf-primary,#2563eb);outline-offset:-2px}.content-panel{min-height:250px;padding:28px}.content-panel h2{margin:0 0 17px;font-size:19px;font-weight:750}.content-panel p{margin:0 0 15px;color:#475467;font-size:14px;line-height:1.75}.product-description{white-space:pre-line}.content-panel .demo-note{padding:12px 14px;border-radius:8px;background:#eff6ff;color:#1e3a8a;font-size:13px}.content-specifications{display:grid;margin:0}.content-specifications>div{display:grid;grid-template-columns:minmax(110px,180px) minmax(0,1fr);gap:16px;padding:13px 0;border-bottom:1px solid #eaecf0;font-size:14px}.content-specifications dt{color:#667085}.content-specifications dd{margin:0;overflow-wrap:anywhere;font-weight:600}.example-review{padding:18px 0;border-bottom:1px solid #eaecf0}.example-review>div{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;font-size:13px}.example-review>div span{color:#667085}.example-review h3{margin:12px 0 6px;font-size:15px}.example-review p{margin:0}.product-faq{border-bottom:1px solid #eaecf0;padding:16px 0}.product-faq summary{font-size:14px;font-weight:600;cursor:pointer;line-height:1.5}.product-faq p{margin:12px 0 0}@media(max-width:560px){.content-tabs{gap:20px;padding:0 18px}.content-panel{padding:20px 18px}.content-specifications>div{grid-template-columns:minmax(90px,1fr) minmax(0,1.3fr)}}
</style>
