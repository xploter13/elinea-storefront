<script setup lang="ts">
import { ArrowRight, Headset, MapPin, PackageCheck, ShieldCheck } from '@lucide/vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'login' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
const route = useRoute()
const form = reactive({ email: '', password: '', code: '', recoveryCode: '' })
const pending = ref(false)
const errorMessage = ref('')
const twoFactorRequired = ref(false)
const useRecoveryCode = ref(false)
const primary = computed(() => storefront.theme?.primary_color || '#2563eb')
const font = computed(() => `"${storefront.theme?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`)
const supportPhone = computed(() => storefront.theme?.contact_phone || '(11) 3000-1234')
const supportPhoneHref = computed(() => `tel:${supportPhone.value.replace(/\D/g, '')}`)

function backToPassword() {
  twoFactorRequired.value = false
  useRecoveryCode.value = false
  form.code = ''
  form.recoveryCode = ''
  errorMessage.value = ''
}

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    if (twoFactorRequired.value) {
      await $fetch('/api/auth/2fa', { method: 'POST', body: useRecoveryCode.value ? { recovery_code: form.recoveryCode } : { code: form.code } })
    } else {
      const result = await $fetch<{ two_factor_required?: boolean }>('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })
      if (result.two_factor_required) {
        twoFactorRequired.value = true
        form.password = ''
        return
      }
    }
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
      ? route.query.redirect : '/conta'
    await navigateTo(redirect)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Não foi possível entrar. Verifique seus dados.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <BaseTemplate :storefront="storefront" :page="page">
    <main class="login-page" :style="{ '--account-primary': primary, '--account-font': font }">
      <div class="login-layout">
        <section class="account-intro" aria-labelledby="account-title">
          <span class="eyebrow"><span class="eyebrow-line" /> ÁREA DO CLIENTE · {{ storefront.site.name }}</span>
          <h1 id="account-title">Suas compras, seus dados. Tudo em um só lugar.</h1>
          <p class="intro-lead">Entre para acompanhar o que acontece depois da compra e deixar suas informações prontas para a próxima visita.</p>

          <div class="benefit-list" aria-label="O que você encontra na sua conta">
            <article class="benefit"><span class="benefit-icon"><PackageCheck :size="22" /></span><div><h2>Acompanhe seus pedidos</h2><p>Consulte o histórico e veja o status de cada compra.</p></div></article>
            <article class="benefit"><span class="benefit-icon"><MapPin :size="22" /></span><div><h2>Gerencie seus endereços</h2><p>Salve e atualize seus locais de entrega com facilidade.</p></div></article>
            <article class="benefit"><span class="benefit-icon"><ShieldCheck :size="22" /></span><div><h2>Cuide da sua conta</h2><p>Atualize seus dados e ative a autenticação em duas etapas.</p></div></article>
          </div>

          <div class="support-note"><Headset :size="21" /><span>Precisa de ajuda? <a :href="supportPhoneHref">Fale com a loja: {{ supportPhone }}</a></span></div>
        </section>

        <div class="access-column">
          <section class="login-card" aria-labelledby="login-title">
            <span class="card-kicker">ACESSO À CONTA</span>
            <h2 id="login-title">{{ twoFactorRequired ? 'Confirme seu acesso' : 'Boas-vindas de volta' }}</h2>
            <p class="card-intro">{{ twoFactorRequired ? 'Use o código do seu aplicativo autenticador ou um código de recuperação.' : 'Use o e-mail e a senha da sua conta para continuar.' }}</p>
            <form @submit.prevent="submit">
              <template v-if="!twoFactorRequired">
                <label for="login-email">E-mail</label>
                <input id="login-email" v-model.trim="form.email" type="email" autocomplete="email" placeholder="seu@email.com" required>
                <div class="password-label"><label for="login-password">Senha</label><NuxtLink to="/redefinir-senha">Esqueceu a senha?</NuxtLink></div>
                <input id="login-password" v-model="form.password" type="password" autocomplete="current-password" placeholder="Digite sua senha" required>
              </template>
              <template v-else>
                <label v-if="useRecoveryCode" for="login-recovery">Código de recuperação</label>
                <input v-if="useRecoveryCode" id="login-recovery" v-model.trim="form.recoveryCode" autocomplete="off" placeholder="Digite seu código" required>
                <label v-if="!useRecoveryCode" for="login-code">Código do autenticador</label>
                <input v-if="!useRecoveryCode" id="login-code" v-model.trim="form.code" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" required>
                <div class="two-factor-actions"><button type="button" @click="useRecoveryCode = !useRecoveryCode">{{ useRecoveryCode ? 'Usar aplicativo autenticador' : 'Usar código de recuperação' }}</button><button type="button" @click="backToPassword">Voltar</button></div>
              </template>
              <p v-if="errorMessage" role="alert" class="error">{{ errorMessage }}</p>
              <button class="submit" type="submit" :disabled="pending"><span>{{ pending ? 'Entrando...' : twoFactorRequired ? 'Confirmar acesso' : 'Entrar na minha conta' }}</span><ArrowRight :size="18" /></button>
            </form>
            <p class="login-footnote"><ShieldCheck :size="17" /> Acesso protegido pela sua senha.</p>
          </section>
          <div class="browse-note"><span>Ainda não tem uma conta?</span><NuxtLink :to="{ path: '/cadastro', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {} }">Criar conta <ArrowRight :size="16" /></NuxtLink></div>
          <div class="browse-note"><span>Quer conhecer a loja primeiro?</span><NuxtLink to="/produtos">Explorar produtos <ArrowRight :size="16" /></NuxtLink></div>
        </div>
      </div>
    </main>
  </BaseTemplate>
</template>

<style scoped>
.login-page{position:relative;overflow:hidden;background:#f7f9fc;color:#111827;font:16px/1.5 var(--account-font)}
.login-page:before{position:absolute;top:-260px;left:-180px;width:650px;height:650px;border-radius:50%;background:color-mix(in srgb,var(--account-primary) 7%,transparent);content:"";pointer-events:none}
.login-layout{position:relative;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(360px,.92fr);align-items:center;gap:clamp(48px,8vw,128px);width:min(100% - 48px,1180px);min-height:610px;margin:auto;padding:clamp(56px,7vw,104px) 0}
.account-intro{max-width:570px}
.eyebrow{display:inline-flex;align-items:center;gap:10px;color:var(--account-primary);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.eyebrow-line{display:inline-block;width:24px;height:2px;background:var(--account-primary)}
.account-intro h1{max-width:560px;margin:22px 0 18px;font-size:clamp(36px,4.5vw,58px);font-weight:750;line-height:1.09;letter-spacing:-.045em;text-wrap:balance}
.intro-lead{max-width:510px;margin:0;color:#475569;font-size:17px;line-height:1.7}
.benefit-list{display:grid;gap:20px;margin-top:40px}
.benefit{display:flex;align-items:flex-start;gap:16px}
.benefit-icon{display:grid;width:46px;height:46px;flex:none;place-items:center;border:1px solid color-mix(in srgb,var(--account-primary) 16%,white);border-radius:13px;background:color-mix(in srgb,var(--account-primary) 9%,white);color:var(--account-primary)}
.benefit h2{margin:0 0 3px;font-size:16px;font-weight:700;line-height:1.35}
.benefit p{margin:0;color:#64748b;font-size:14px;line-height:1.55}
.support-note{display:flex;align-items:center;gap:12px;margin-top:42px;border-top:1px solid #e2e8f0;padding-top:24px;color:#475569;font-size:14px}
.support-note svg{flex:none;color:var(--account-primary)}
.support-note a{color:var(--account-primary);font-weight:700;text-decoration:none}
.support-note a:hover{text-decoration:underline}
.access-column{min-width:0}
.login-card{border:1px solid #e2e8f0;border-radius:22px;background:white;padding:clamp(28px,4vw,48px);box-shadow:0 18px 58px #0f172a0d,0 2px 8px #0f172a08}
.card-kicker{color:var(--account-primary);font-size:11px;font-weight:800;letter-spacing:.16em}
.login-card h2{margin:14px 0 8px;font-size:clamp(27px,2.6vw,34px);font-weight:750;line-height:1.2;letter-spacing:-.035em}
.card-intro{margin:0;color:#64748b;font-size:14px;line-height:1.6}
form{display:grid;gap:10px;margin-top:32px}
label{color:#253044;font-size:14px;font-weight:700}
input{width:100%;min-height:52px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;padding:0 15px;color:#111827;font:inherit;font-size:15px;transition:border-color .2s,box-shadow .2s}
input::placeholder{color:#94a3b8}
input:focus{border-color:var(--account-primary);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--account-primary) 16%,transparent)}
.password-label{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px}
.password-label a,.two-factor-actions button{color:var(--account-primary);font:700 13px var(--account-font);text-decoration:none}
.password-label a:hover,.two-factor-actions button:hover{text-decoration:underline}
.two-factor-actions{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:8px}
.two-factor-actions button{border:0;background:none;padding:0;cursor:pointer}
.submit{display:flex;min-height:52px;align-items:center;justify-content:center;gap:10px;margin-top:16px;border:0;border-radius:11px;background:var(--account-primary);color:#fff;font-family:inherit;font-size:15px;font-weight:700;cursor:pointer;transition:transform .2s,opacity .2s}
.submit:hover:not(:disabled){transform:translateY(-2px)}
.submit:disabled{cursor:wait;opacity:.65}
.login-footnote{display:flex;align-items:center;gap:8px;margin:24px 0 0;border-top:1px solid #e9edf3;padding-top:20px;color:#64748b;font-size:12px}
.login-footnote svg{flex:none;color:var(--account-primary)}
.browse-note{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-top:22px;color:#64748b;font-size:13px}
.browse-note a{display:inline-flex;align-items:center;gap:4px;color:var(--account-primary);font-weight:700;text-decoration:none}
.browse-note a:hover{text-decoration:underline}
.error{margin:8px 0 0;border-radius:10px;background:#fef2f2;padding:12px;color:#991b1b;font-size:14px}
.login-page :is(a,button,input):focus-visible{outline:3px solid var(--account-primary);outline-offset:3px}
@media(max-width:860px){.login-layout{grid-template-columns:1fr;gap:48px;max-width:620px;padding:56px 0}.account-intro h1{font-size:clamp(34px,7vw,48px)}.benefit-list{grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.benefit{display:block}.benefit-icon{margin-bottom:12px}.support-note{margin-top:28px}}
@media(max-width:620px){.login-layout{width:min(100% - 32px,520px);gap:36px;padding:40px 0}.account-intro h1{margin:16px 0 12px;font-size:34px}.intro-lead{font-size:15px}.benefit-list{grid-template-columns:1fr;gap:16px;margin-top:28px}.benefit{display:flex;gap:12px}.benefit-icon{width:40px;height:40px;margin:0}.benefit h2{font-size:14px}.benefit p{font-size:13px}.support-note{margin-top:24px;padding-top:18px;font-size:13px}.login-card{padding:26px 22px}.login-card h2{font-size:27px}}
</style>
