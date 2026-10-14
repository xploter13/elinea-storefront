<script setup lang="ts">
import { ArrowRight, Headset, MapPin, PackageCheck, Phone, ShoppingBag, Truck, UserRound } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'

type InformationSection = 'help' | 'delivery' | 'contact'
const props = defineProps<{ storefront: StorefrontPayload, section: InformationSection }>()

const copy = {
  help: {
    eyebrow: 'CENTRAL DE AJUDA',
    title: 'Como podemos ajudar?',
    lead: 'Encontre o caminho certo para acompanhar uma compra, consultar a entrega ou cuidar da sua conta.',
  },
  delivery: {
    eyebrow: 'ENTREGA E FRETE',
    title: 'Sua entrega, passo a passo.',
    lead: 'Consulte as opções disponíveis para o seu endereço antes de finalizar a compra e acompanhe seus pedidos depois.',
  },
  contact: {
    eyebrow: 'FALE COM A LOJA',
    title: 'Vamos conversar?',
    lead: 'Use os canais informados pela loja ou consulte sua área do cliente para resolver o que precisa.',
  },
} as const

const helpCards = [
  { title: 'Acompanhar pedido', description: 'Consulte o histórico e o status das suas compras.', to: '/conta/pedidos', icon: PackageCheck },
  { title: 'Entrega e frete', description: 'Saiba como consultar valores e prazos para o seu CEP.', to: '/entrega', icon: Truck },
  { title: 'Dados da conta', description: 'Atualize suas informações e endereços salvos.', to: '/conta', icon: UserRound },
  { title: 'Falar com a loja', description: 'Veja o contato e os horários cadastrados pela loja.', to: '/contato', icon: Headset },
]

const deliverySteps = [
  { number: '01', title: 'Escolha seus produtos', description: 'Adicione ao carrinho os itens que você deseja comprar.', icon: ShoppingBag },
  { number: '02', title: 'Informe o endereço', description: 'No checkout, informe o CEP para consultar as opções de entrega, seus preços e prazos disponíveis.', icon: MapPin },
  { number: '03', title: 'Acompanhe a compra', description: 'Depois de concluir o pedido, veja o status e os detalhes na sua área do cliente.', icon: PackageCheck },
]

const phoneHref = computed(() => {
  const digits = props.storefront.theme.contact_phone?.replace(/\D/g, '')
  return digits ? `tel:${digits}` : null
})
</script>

<template>
  <main class="information-page">
    <div class="information-container">
      <nav class="breadcrumbs" aria-label="Navegação estrutural"><NuxtLink to="/">Início</NuxtLink><span aria-hidden="true">/</span><span aria-current="page">{{ section === 'help' ? 'Ajuda' : section === 'delivery' ? 'Entrega e frete' : 'Contato' }}</span></nav>

      <header class="information-intro">
        <span class="eyebrow">{{ copy[section].eyebrow }}</span>
        <h1>{{ copy[section].title }}</h1>
        <p>{{ copy[section].lead }}</p>
      </header>

      <section v-if="section === 'help'" class="information-section" aria-labelledby="help-options">
        <div class="section-heading"><h2 id="help-options">O que você precisa?</h2><p>Selecione um assunto para continuar.</p></div>
        <div class="help-grid">
          <NuxtLink v-for="card in helpCards" :key="card.to" class="help-card" :to="card.to">
            <span class="card-icon"><component :is="card.icon" :size="23" aria-hidden="true" /></span>
            <span class="card-copy"><strong>{{ card.title }}</strong><span>{{ card.description }}</span></span>
            <ArrowRight class="card-arrow" :size="19" aria-hidden="true" />
          </NuxtLink>
        </div>
      </section>

      <section v-else-if="section === 'delivery'" class="information-section" aria-labelledby="delivery-steps">
        <div class="section-heading"><h2 id="delivery-steps">Como consultar sua entrega</h2><p>As opções são calculadas para cada compra e endereço.</p></div>
        <div class="steps-grid">
          <article v-for="step in deliverySteps" :key="step.number" class="step-card">
            <div class="step-top"><span>{{ step.number }}</span><component :is="step.icon" :size="24" aria-hidden="true" /></div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </article>
        </div>
        <div class="information-note"><strong>Já fez uma compra?</strong><span>Confira o status e os detalhes da entrega em <NuxtLink to="/conta/pedidos">Meus pedidos</NuxtLink>. Para futuras compras, você pode atualizar os endereços salvos em <NuxtLink to="/conta/enderecos">Minha conta</NuxtLink>.</span></div>
      </section>

      <section v-else class="information-section" aria-labelledby="contact-options">
        <div class="section-heading"><h2 id="contact-options">Canais e caminhos úteis</h2><p>Escolha a melhor forma de continuar.</p></div>
        <div class="contact-grid">
          <div class="contact-card">
            <span class="card-icon"><Phone :size="23" aria-hidden="true" /></span>
            <h3>Atendimento da loja</h3>
            <template v-if="phoneHref">
              <a class="contact-number" :href="phoneHref">{{ storefront.theme.contact_phone }} <ArrowRight :size="18" aria-hidden="true" /></a>
              <p v-if="storefront.theme.service_hours">{{ storefront.theme.service_hours }}</p>
            </template>
            <p v-else>O telefone de atendimento ainda não foi informado por esta loja.</p>
          </div>
          <NuxtLink class="contact-card contact-card-link" to="/conta/pedidos">
            <span class="card-icon"><PackageCheck :size="23" aria-hidden="true" /></span>
            <h3>Sobre uma compra</h3>
            <p>Veja o status e os detalhes do seu pedido na área do cliente.</p>
            <span class="card-action">Ver meus pedidos <ArrowRight :size="18" aria-hidden="true" /></span>
          </NuxtLink>
        </div>
      </section>

      <div v-if="section !== 'help'" class="information-next">
        <div><span>AINDA TEM DÚVIDAS?</span><h2>Encontre mais respostas na central de ajuda.</h2></div>
        <NuxtLink to="/ajuda">Acessar ajuda <ArrowRight :size="18" aria-hidden="true" /></NuxtLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.information-page{background:#fff;color:#172033}
.information-container{width:min(100% - 48px,1180px);margin:auto;padding:34px 0 34px}
.breadcrumbs{display:flex;align-items:center;gap:10px;color:#64748b;font-size:13px}
.breadcrumbs a{color:#536174;text-decoration:none}.breadcrumbs a:hover{text-decoration:underline}
.information-intro{max-width:760px;padding:72px 0 58px}
.eyebrow{color:var(--sf-primary);font-size:12px;font-weight:800;letter-spacing:.14em}
.information-intro h1{margin:16px 0;font-size:clamp(38px,5vw,64px);font-weight:750;letter-spacing:-.055em;line-height:1.08;text-wrap:balance}
.information-intro p{max-width:690px;margin:0;color:#536174;font-size:18px;line-height:1.65}
.information-section{padding-bottom:42px}
.section-heading{margin-bottom:24px}.section-heading h2{margin:0;font-size:clamp(24px,3vw,32px);font-weight:750;letter-spacing:-.035em}.section-heading p{margin:6px 0 0;color:#64748b}
.help-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.help-card{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:18px;min-height:132px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:22px;color:#172033;text-decoration:none;transition:border-color .2s,transform .2s,box-shadow .2s}
.help-card:hover,.contact-card-link:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--sf-primary) 35%,#e2e8f0);box-shadow:0 14px 30px #0f172a0d}
.card-icon{display:grid;width:48px;height:48px;flex:none;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--sf-primary) 10%,white);color:var(--sf-primary)}
.card-copy{display:grid;gap:6px}.card-copy strong{font-size:17px;font-weight:750}.card-copy>span{color:#64748b;font-size:14px;line-height:1.5}.card-arrow{color:var(--sf-primary)}
.steps-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.step-card{min-height:230px;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;padding:26px}
.step-top{display:flex;align-items:center;justify-content:space-between;color:var(--sf-primary)}.step-top span{font-size:13px;font-weight:800;letter-spacing:.1em}
.step-card h3{margin:40px 0 8px;font-size:19px;font-weight:750;letter-spacing:-.025em}.step-card p{margin:0;color:#536174;font-size:14px;line-height:1.6}
.information-note{display:flex;gap:18px;margin-top:16px;border-left:3px solid var(--sf-primary);border-radius:0 11px 11px 0;background:#f8fafc;padding:20px 24px;color:#536174;font-size:14px;line-height:1.65}
.information-note strong{flex:none;color:#172033}.information-note a{color:var(--sf-primary);font-weight:700;text-underline-offset:3px}
.contact-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.contact-card{min-height:230px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:28px}
.contact-card h3{margin:24px 0 10px;font-size:20px;font-weight:750}.contact-card p{margin:8px 0 0;color:#536174;font-size:14px;line-height:1.6}
.contact-number,.card-action{display:inline-flex;min-height:44px;align-items:center;gap:8px;color:var(--sf-primary);font-size:17px;font-weight:750;text-decoration:none}
.contact-number:hover{text-decoration:underline}.contact-card-link{color:#172033;text-decoration:none;transition:border-color .2s,transform .2s,box-shadow .2s}.contact-card-link .card-action{margin-top:22px;font-size:14px}
.information-next{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-top:28px;border-radius:16px;background:color-mix(in srgb,var(--sf-primary) 8%,white);padding:28px 32px}
.information-next span{color:var(--sf-primary);font-size:11px;font-weight:800;letter-spacing:.12em}.information-next h2{margin:7px 0 0;font-size:21px;font-weight:750;letter-spacing:-.025em}
.information-next a{display:inline-flex;min-height:44px;align-items:center;gap:8px;flex:none;border-radius:9px;background:var(--sf-primary);padding:0 18px;color:#fff;font-size:14px;font-weight:700;text-decoration:none}
.information-page a:focus-visible{outline:3px solid var(--sf-primary);outline-offset:4px}
@media(max-width:780px){.steps-grid{grid-template-columns:1fr}.step-card{min-height:0}.step-card h3{margin-top:24px}.information-note{display:grid;gap:4px}}
@media(max-width:640px){.information-container{width:min(100% - 32px,1180px);padding-top:24px}.information-intro{padding:48px 0 42px}.information-intro p{font-size:16px}.help-grid,.contact-grid{grid-template-columns:1fr}.help-card{min-height:112px;padding:18px;gap:14px}.information-next{align-items:flex-start;flex-direction:column;padding:24px}.information-next h2{font-size:19px}}
</style>
