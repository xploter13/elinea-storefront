<script setup lang="ts">
import { ArrowRight, Phone } from '@lucide/vue'
import type { StorefrontBranding } from '#shared/types/branding'

const props = defineProps<{ storeName: string, theme: StorefrontBranding }>()

const footerGroups = [
  { title: 'Explore a loja', links: [
    { label: 'Página inicial', to: '/' },
    { label: 'Todos os produtos', to: '/produtos' },
    { label: 'Categorias', to: '/categorias' },
    { label: 'Blog', to: '/blog' },
    { label: 'Carrinho', to: '/carrinho' },
  ] },
  { title: 'Sua conta', links: [
    { label: 'Minha conta', to: '/conta' },
    { label: 'Meus pedidos', to: '/conta/pedidos' },
    { label: 'Meus endereços', to: '/conta/enderecos' },
  ] },
  { title: 'Atendimento', links: [
    { label: 'Central de ajuda', to: '/ajuda' },
    { label: 'Entrega e frete', to: '/entrega' },
    { label: 'Contato', to: '/contato' },
  ] },
]

const phoneHref = computed(() => {
  const digits = props.theme.contact_phone?.replace(/\D/g, '')
  return digits ? `tel:${digits}` : null
})
</script>

<template>
  <footer class="retail-footer">
    <div class="footer-container">
      <div class="footer-help">
        <div>
          <span class="footer-eyebrow">PRECISA DE AJUDA?</span>
          <h2>Estamos aqui para facilitar sua compra.</h2>
          <p>Encontre respostas sobre pedidos, entrega e sua conta.</p>
        </div>
        <NuxtLink class="help-link" to="/ajuda">Ir para a central de ajuda <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
      </div>

      <div class="footer-content">
        <div class="footer-brand">
          <NuxtLink class="brand-link" to="/" :aria-label="`Página inicial de ${storeName}`">
            <span v-if="theme.logo_url" class="brand-image"><img :src="theme.logo_url" alt=""></span>
            <span v-else class="brand-initial" aria-hidden="true">{{ storeName.charAt(0).toLocaleUpperCase('pt-BR') }}</span>
            <strong>{{ storeName }}</strong>
          </NuxtLink>
          <p>{{ theme.footer_description || `Explore os produtos da ${storeName} e compre online.` }}</p>
          <a v-if="phoneHref" class="contact-phone" :href="phoneHref"><Phone :size="18" aria-hidden="true" /><span><small>Fale com a loja</small><strong>{{ theme.contact_phone }}</strong></span></a>
          <p v-if="phoneHref && theme.service_hours" class="service-hours">{{ theme.service_hours }}</p>
        </div>

        <nav v-for="group in footerGroups" :key="group.title" class="footer-links" :aria-label="group.title">
          <h3>{{ group.title }}</h3>
          <NuxtLink v-for="link in group.links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
        </nav>
      </div>

      <div class="footer-base">
        <p>© {{ new Date().getFullYear() }} {{ storeName }}. Todos os direitos reservados.</p>
        <NuxtLink to="/">Voltar à página inicial <ArrowRight :size="15" aria-hidden="true" /></NuxtLink>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.retail-footer{margin-top:72px;border-top:1px solid #e5eaf0;background:#f8fafc;color:#172033}
.footer-container{width:min(100% - 48px,1320px);margin:auto}
.footer-help{display:flex;align-items:center;justify-content:space-between;gap:32px;margin-top:40px;padding:28px 34px;border:1px solid color-mix(in srgb,var(--sf-primary) 15%,#e2e8f0);border-radius:18px;background:color-mix(in srgb,var(--sf-primary) 7%,white)}
.footer-eyebrow{color:var(--sf-primary);font-size:11px;font-weight:800;letter-spacing:.14em}
.footer-help h2{margin:7px 0 4px;font-size:clamp(21px,2.2vw,28px);font-weight:750;letter-spacing:-.035em;line-height:1.2}
.footer-help p{margin:0;color:#536174;line-height:1.5}
.help-link{display:inline-flex;min-height:46px;align-items:center;justify-content:center;gap:10px;flex:none;border-radius:9px;background:var(--sf-primary);padding:0 18px;color:white;font-size:14px;font-weight:700;text-decoration:none;transition:transform .2s,box-shadow .2s}
.help-link:hover{transform:translateY(-2px);box-shadow:0 9px 20px color-mix(in srgb,var(--sf-primary) 22%,transparent)}
.footer-content{display:grid;grid-template-columns:minmax(240px,1.55fr) repeat(3,minmax(135px,1fr));gap:36px 56px;padding:62px 0 60px}
.footer-brand{min-width:0}
.brand-link{display:inline-flex;align-items:center;gap:12px;max-width:100%;color:#172033;text-decoration:none}
.brand-link strong{overflow:hidden;font-size:23px;font-weight:750;letter-spacing:-.035em;text-overflow:ellipsis;white-space:nowrap}
.brand-image,.brand-initial{display:grid;width:44px;height:44px;flex:none;place-items:center;border-radius:11px}
.brand-image{background:#fff}.brand-image img{display:block;max-width:100%;max-height:100%;object-fit:contain}
.brand-initial{background:var(--sf-primary);color:white;font-size:24px;font-weight:800}
.footer-brand>p{max-width:320px;margin:18px 0 0;color:#536174;font-size:14px;line-height:1.65}
.contact-phone{display:inline-flex;min-height:44px;align-items:center;gap:11px;margin-top:22px;color:#172033;text-decoration:none}
.contact-phone svg{flex:none;color:var(--sf-primary)}
.contact-phone span{display:grid;gap:2px}.contact-phone small{color:#64748b;font-size:12px}.contact-phone strong{font-size:17px;font-weight:750}
.footer-brand .service-hours{margin:4px 0 0 30px;color:#64748b;font-size:12px}
.footer-links{display:flex;flex-direction:column;align-items:flex-start;gap:2px}
.footer-links h3{margin:0 0 7px;color:#172033;font-size:15px;font-weight:750}
.footer-links a{display:inline-flex;min-height:40px;align-items:center;color:#536174;font-size:14px;line-height:1.5;text-decoration:none;text-underline-offset:4px}
.footer-links a:hover,.footer-base a:hover,.contact-phone:hover{text-decoration:underline;color:var(--sf-primary)}
.footer-base{display:flex;align-items:center;justify-content:space-between;gap:20px;border-top:1px solid #e2e8f0;padding:23px 0 28px;color:#64748b;font-size:13px}
.footer-base p{margin:0}.footer-base a{display:inline-flex;min-height:44px;align-items:center;gap:8px;color:#536174;font-weight:650;text-decoration:none}
.retail-footer a:focus-visible{outline:3px solid var(--sf-primary);outline-offset:4px}
@media(max-width:960px){.footer-content{grid-template-columns:repeat(3,minmax(0,1fr));gap:42px 24px}.footer-brand{grid-column:1/-1}}
@media(max-width:640px){.retail-footer{margin-top:56px}.footer-container{width:min(100% - 32px,1320px)}.footer-help{display:grid;gap:20px;margin-top:24px;padding:24px}.footer-help h2{font-size:23px}.help-link{justify-self:start}.footer-content{grid-template-columns:repeat(2,minmax(0,1fr));gap:36px 20px;padding:42px 0}.footer-brand{grid-column:1/-1}.footer-links:last-child{grid-column:1/-1}.footer-links a{min-height:44px}.footer-base{align-items:flex-start;flex-direction:column;padding:22px 0 28px}}
</style>
