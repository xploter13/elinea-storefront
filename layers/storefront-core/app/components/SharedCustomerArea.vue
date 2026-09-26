<script setup lang="ts">
import { ArrowRight, ChevronRight, CircleUserRound, House, LogIn, MapPin, Package, UserRound } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import type { Customer } from '@elinea/sdk'
import type { StorefrontPage } from '~/utils/storefront-page'
import SharedCommerceHeader from './SharedCommerceHeader.vue'

const props = defineProps<{ storefront: StorefrontPayload, page: StorefrontPage }>()
const section = computed(() => props.page.kind === 'account' ? props.page.section : 'overview')
const title = computed(() => ({ overview: 'Sua conta, em um só lugar.', orders: 'Meus pedidos', addresses: 'Meus endereços', profile: 'Meus dados', security: 'Segurança' })[section.value])
const email = ref('')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const { data: session } = await useFetch<{ customer: Customer }>('/api/auth/me', { ignoreResponseError: true })
const customer = ref<Customer | null>(session.value?.customer || null)

async function login() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await $fetch<{ customer: Customer }>('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    customer.value = result.customer
    password.value = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Não foi possível entrar. Verifique seus dados.'
  } finally {
    pending.value = false
  }
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  customer.value = null
}
</script>

<template>
  <div class="account-shell">
    <SharedCommerceHeader :store-name="storefront.site.name" />
    <main class="account-layout">
      <aside class="account-nav">
        <NuxtLink to="/" class="shop-link"><House :size="17"/> Voltar à loja</NuxtLink>
        <div class="avatar"><CircleUserRound :size="28"/><span><small>Área do cliente</small><strong>Bem-vindo</strong></span></div>
        <nav aria-label="Menu da conta">
          <NuxtLink to="/conta" :class="{active:section==='overview'}"><UserRound :size="18"/>Visão geral</NuxtLink>
          <NuxtLink to="/conta/pedidos" :class="{active:section==='orders'}"><Package :size="18"/>Meus pedidos</NuxtLink>
          <NuxtLink to="/conta/enderecos" :class="{active:section==='addresses'}"><MapPin :size="18"/>Endereços</NuxtLink>
          <NuxtLink to="/conta/dados" :class="{active:section==='profile'}"><CircleUserRound :size="18"/>Meus dados</NuxtLink>
        </nav>
      </aside>

      <section class="account-content">
        <div class="account-heading"><span>Área do cliente</span><h1>{{ title }}</h1><p>Acompanhe compras e mantenha seus dados atualizados.</p></div>

        <template v-if="section === 'overview'">
          <div v-if="customer" class="welcome-card"><div><span>Área autenticada</span><h2>Olá, {{ customer.name }}.</h2><p>{{ customer.email }}<br>Você já pode acompanhar seus pedidos e atualizar seus dados.</p><button type="button" class="logout-button" @click="logout">Sair</button></div><CircleUserRound :size="42"/></div>
          <template v-else>
            <div class="welcome-card"><div><span>Comece por aqui</span><h2>Entre para acompanhar seus pedidos.</h2><p>Use o mesmo e-mail informado nas suas compras.</p></div><LogIn :size="42"/></div>
            <form class="login-form" @submit.prevent="login"><label>E-mail<input v-model="email" type="email" autocomplete="email" placeholder="voce@email.com" required></label><label>Senha<input v-model="password" type="password" autocomplete="current-password" placeholder="Sua senha" required></label><button type="submit" :disabled="pending">{{ pending ? 'Entrando...' : 'Entrar' }} <ArrowRight :size="17"/></button><button type="button" class="text-button" disabled>Esqueci minha senha</button></form>
            <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
          </template>
        </template>

        <div v-else-if="section === 'orders'" class="empty-state"><div class="state-icon"><Package :size="28"/></div><h2>Nenhum pedido por aqui.</h2><p>Quando você fizer uma compra, os detalhes e o rastreamento aparecerão nesta página.</p><NuxtLink to="/produtos">Explorar produtos <ChevronRight :size="17"/></NuxtLink></div>
        <div v-else-if="section === 'addresses'" class="empty-state"><div class="state-icon"><MapPin :size="28"/></div><h2>Você ainda não salvou endereços.</h2><p>Salve seus locais de entrega para finalizar as próximas compras mais rápido.</p><button type="button" disabled>Adicionar endereço</button><small>Disponível após entrar na sua conta.</small></div>
        <form v-else class="profile-form" @submit.prevent><div class="field-row"><label>Nome<input autocomplete="given-name" placeholder="Seu nome" disabled></label><label>Sobrenome<input autocomplete="family-name" placeholder="Seu sobrenome" disabled></label></div><label>E-mail<input type="email" autocomplete="email" placeholder="voce@email.com" disabled></label><label>Telefone<input type="tel" autocomplete="tel" placeholder="(00) 00000-0000" disabled></label><button type="submit" disabled>Salvar alterações</button><small>Entre na sua conta para editar os dados.</small></form>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}.account-shell{min-height:100dvh;background:#fff;color:#111827;font-family:"Aptos","Segoe UI",Arial,sans-serif}.account-layout{display:grid;grid-template-columns:286px minmax(0,820px);gap:clamp(42px,7vw,104px);max-width:1260px;margin:auto;padding:62px clamp(18px,4vw,56px) 104px}.account-nav{align-self:start;position:sticky;top:102px;padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.shop-link{display:flex;align-items:center;gap:8px;margin-bottom:22px;color:#6b7280;font-size:12px;font-weight:650;text-decoration:none}.shop-link:hover{color:#2563eb}.avatar{display:flex;align-items:center;gap:12px;padding:18px;border-radius:12px;background:#eff6ff;color:#2563eb}.avatar span{display:grid;gap:3px}.avatar small{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280}.avatar strong{color:#111827}.account-nav nav{display:grid;gap:5px;padding-top:16px}.account-nav nav a{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:10px;color:#6b7280;font-size:13px;font-weight:650;text-decoration:none;transition:background .2s,color .2s,transform .2s}.account-nav nav a:hover{background:#f8fafc;color:#2563eb;transform:translateX(2px)}.account-nav nav a.active{background:#eff6ff;color:#2563eb}.account-heading{padding:36px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.account-heading>span,.welcome-card span{font:700 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#2563eb}.account-heading h1{margin:10px 0 12px;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:clamp(42px,5.8vw,72px);font-weight:850;line-height:.94;letter-spacing:-.052em;text-wrap:balance}.account-heading p{margin:0;color:#6b7280}.welcome-card{display:flex;justify-content:space-between;gap:30px;margin-top:22px;padding:32px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;color:#2563eb}.welcome-card h2{max-width:470px;margin:9px 0;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:30px;font-weight:800;line-height:1.04;letter-spacing:-.035em;color:#111827}.welcome-card p{margin:0;color:#64748b;font-size:13px}.login-form,.profile-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;padding:30px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.04)}.login-form label,.profile-form label{display:grid;gap:8px;color:#374151;font-size:12px;font-weight:650}.login-form input,.profile-form input{height:52px;padding:0 15px;border:1px solid #d1d5db;border-radius:10px;background:#fff;color:#111827;font:inherit;outline:none;transition:border-color .2s,box-shadow .2s}.login-form input:focus,.profile-form input:focus{border-color:#2563eb;box-shadow:0 0 0 4px #dbeafe}.login-form button,.profile-form button,.empty-state button{display:flex;height:52px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;background:#111827;color:#fff;font-weight:750}.text-button{background:transparent!important;color:#2563eb!important}.feedback{padding:13px 16px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:12px}.empty-state{display:grid;justify-items:start;margin-top:22px;padding:56px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.state-icon{display:grid;width:60px;height:60px;place-items:center;border-radius:14px;background:#eff6ff;color:#2563eb}.empty-state h2{margin:25px 0 10px;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:33px;font-weight:800;letter-spacing:-.04em}.empty-state p{max-width:500px;margin:0 0 26px;color:#6b7280;line-height:1.65}.empty-state a{display:flex;align-items:center;gap:6px;color:#2563eb;font-size:13px;font-weight:750;text-decoration:none}.empty-state button{padding:0 20px;opacity:.62}.empty-state small,.profile-form>small{margin-top:10px;color:#6b7280}.profile-form{grid-template-columns:1fr}.profile-form .field-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.profile-form input:disabled{background:#f8fafc;color:#8a8f98}.profile-form button{margin-top:8px;opacity:.62}@media(max-width:780px){.account-layout{grid-template-columns:1fr;padding-top:30px}.account-nav{position:static;display:grid}.avatar{display:none}.account-nav nav{display:flex;overflow:auto;padding-bottom:5px}.account-nav nav a{white-space:nowrap}.shop-link{margin-bottom:12px}.account-heading h1{font-size:48px}}@media(max-width:560px){.account-heading{padding:26px 18px}.login-form{grid-template-columns:1fr;padding:20px}.profile-form .field-row{grid-template-columns:1fr}.welcome-card{padding:23px}.welcome-card>svg{display:none}.empty-state{padding:30px 22px}}
.logout-button{height:38px;margin-top:18px;padding:0 16px;border:1px solid #bfdbfe;border-radius:999px;background:#fff;color:#2563eb;font-size:12px;font-weight:750;cursor:pointer}.logout-button:hover{background:#eff6ff}.login-form button:disabled{cursor:wait;opacity:.6}.feedback.error{background:#fef2f2;color:#b91c1c}
</style>
