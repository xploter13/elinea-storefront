<script setup lang="ts">
import { ArrowRight, Eye, EyeOff, Headset, MapPin, PackageCheck, ShieldCheck, UserRoundPlus } from '@lucide/vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'register' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
const route = useRoute()
const form = reactive({ name: '', email: '', phone: '', password: '', confirmation: '' })
const fieldErrors = reactive<Partial<Record<keyof typeof form, string>>>({})
const pending = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const primary = computed(() => storefront.theme?.primary_color || '#2563eb')
const font = computed(() => `"${storefront.theme?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`)
const supportPhone = computed(() => storefront.theme?.contact_phone?.trim() || '')
const supportPhoneHref = computed(() => `tel:${supportPhone.value.replace(/\D/g, '')}`)

function clearError(field: keyof typeof form) {
  fieldErrors[field] = undefined
  errorMessage.value = ''
}

async function submit() {
  for (const field of Object.keys(form) as (keyof typeof form)[]) fieldErrors[field] = undefined
  errorMessage.value = ''

  if (form.password.length < 8) fieldErrors.password = 'Use pelo menos 8 caracteres.'
  if (form.confirmation !== form.password) fieldErrors.confirmation = 'As senhas não coincidem.'
  if (fieldErrors.password || fieldErrors.confirmation) return

  pending.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      },
    })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') && !route.query.redirect.startsWith('//')
      ? route.query.redirect : '/conta'
    await navigateTo(redirect)
  } catch (error: any) {
    const errors = error?.data?.data?.errors || error?.data?.errors
    if (errors && typeof errors === 'object') {
      for (const field of ['name', 'email', 'phone', 'password'] as const) {
        if (Array.isArray(errors[field])) fieldErrors[field] = String(errors[field][0])
      }
    }
    errorMessage.value = error?.data?.message || 'Não foi possível criar sua conta. Confira os dados e tente novamente.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <BaseTemplate :storefront="storefront" :page="page">
    <main class="register-page" :style="{ '--account-primary': primary, '--account-font': font }">
      <div class="register-layout">
        <section class="register-intro" aria-labelledby="register-title">
          <span class="intro-label"><UserRoundPlus :size="17" /> Sua conta em {{ storefront.site.name }}</span>
          <h1 id="register-title">Suas próximas compras começam aqui.</h1>
          <p class="intro-lead">Crie sua conta para acompanhar pedidos, guardar seus endereços e manter seus dados prontos para quando voltar à loja.</p>

          <div class="account-benefits" aria-label="Vantagens da sua conta">
            <div class="benefit"><span><PackageCheck :size="21" /></span><div><h2>Acompanhe seus pedidos</h2><p>Consulte suas compras e veja o andamento de cada uma.</p></div></div>
            <div class="benefit"><span><MapPin :size="21" /></span><div><h2>Seus endereços em um lugar</h2><p>Salve e atualize os locais de entrega na sua conta.</p></div></div>
            <div class="benefit"><span><ShieldCheck :size="21" /></span><div><h2>Dados sob seu controle</h2><p>Atualize suas informações e proteja seu acesso.</p></div></div>
          </div>

          <div v-if="supportPhone" class="support-note"><Headset :size="20" /><p>Precisa de ajuda? <a :href="supportPhoneHref">Fale com a loja: {{ supportPhone }}</a></p></div>
        </section>

        <div class="register-column">
          <section class="register-card" aria-labelledby="form-title">
            <span class="card-kicker">CRIAR CONTA</span>
            <h2 id="form-title">Boas-vindas à loja</h2>
            <p class="card-description">Preencha seus dados para começar. O telefone é opcional.</p>

            <form @submit.prevent="submit">
              <label for="register-name">Nome completo</label>
              <input id="register-name" v-model="form.name" type="text" autocomplete="name" placeholder="Seu nome e sobrenome" required :aria-invalid="Boolean(fieldErrors.name)" @input="clearError('name')">
              <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>

              <label for="register-email">E-mail</label>
              <input id="register-email" v-model="form.email" type="email" autocomplete="email" placeholder="seu@email.com" required :aria-invalid="Boolean(fieldErrors.email)" @input="clearError('email')">
              <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>

              <label for="register-phone">Telefone <span class="optional">opcional</span></label>
              <input id="register-phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000" :aria-invalid="Boolean(fieldErrors.phone)" @input="clearError('phone')">
              <span v-if="fieldErrors.phone" class="field-error">{{ fieldErrors.phone }}</span>

              <label for="register-password">Senha</label>
              <div class="password-field"><input id="register-password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" minlength="8" required :aria-invalid="Boolean(fieldErrors.password)" @input="clearError('password')"><button type="button" :aria-label="showPassword ? 'Ocultar senhas' : 'Mostrar senhas'" :aria-pressed="showPassword" @click="showPassword=!showPassword"><EyeOff v-if="showPassword" :size="19" /><Eye v-else :size="19" /></button></div>
              <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span><span v-else class="field-hint">Use pelo menos 8 caracteres.</span>

              <label for="register-confirmation">Confirme a senha</label>
              <input id="register-confirmation" v-model="form.confirmation" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" required :aria-invalid="Boolean(fieldErrors.confirmation)" @input="clearError('confirmation')">
              <span v-if="fieldErrors.confirmation" class="field-error">{{ fieldErrors.confirmation }}</span>

              <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
              <button class="submit" type="submit" :disabled="pending">{{ pending ? 'Criando conta...' : 'Criar minha conta' }} <ArrowRight :size="18" /></button>
            </form>
            <p class="account-note"><ShieldCheck :size="17" /> Seus dados ficam vinculados à sua conta nesta loja.</p>
          </section>
          <p class="login-note">Já tem uma conta? <NuxtLink :to="{ path: '/login', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : {} }">Entrar <ArrowRight :size="16" /></NuxtLink></p>
        </div>
      </div>
    </main>
  </BaseTemplate>
</template>

<style scoped>
.register-page{position:relative;overflow:hidden;background:#f7f9fc;color:#111827;font:16px/1.5 var(--account-font)}
.register-page:before{position:absolute;top:-250px;left:-200px;width:650px;height:650px;border-radius:50%;background:color-mix(in srgb,var(--account-primary) 7%,transparent);content:"";pointer-events:none}
.register-layout{position:relative;display:grid;grid-template-columns:minmax(0,1fr) minmax(380px,.93fr);align-items:center;gap:clamp(48px,8vw,124px);width:min(100% - 48px,1180px);margin:auto;padding:clamp(55px,7vw,96px) 0}
.register-intro{max-width:570px}.intro-label{display:inline-flex;align-items:center;gap:10px;color:var(--account-primary);font-size:13px;font-weight:750}.intro-label svg{flex:none}
.register-intro h1{max-width:570px;margin:23px 0 18px;font-size:clamp(38px,4.4vw,58px);font-weight:750;line-height:1.08;letter-spacing:-.045em;text-wrap:balance}.intro-lead{max-width:520px;margin:0;color:#475569;font-size:17px;line-height:1.7}
.account-benefits{display:grid;gap:22px;margin-top:42px}.benefit{display:flex;align-items:flex-start;gap:16px}.benefit>span{display:grid;width:46px;height:46px;flex:none;place-items:center;border:1px solid color-mix(in srgb,var(--account-primary) 16%,white);border-radius:13px;background:color-mix(in srgb,var(--account-primary) 9%,white);color:var(--account-primary)}
.benefit h2{margin:1px 0 4px;font-size:16px;font-weight:700}.benefit p{margin:0;color:#64748b;font-size:14px;line-height:1.55}.support-note{display:flex;align-items:flex-start;gap:11px;margin-top:39px;border-top:1px solid #e2e8f0;padding-top:22px;color:#475569;font-size:13px}.support-note svg{flex:none;color:var(--account-primary)}.support-note p{margin:0}.support-note a{color:var(--account-primary);font-weight:700;text-decoration:none}.support-note a:hover{text-decoration:underline}
.register-column{min-width:0}.register-card{border:1px solid #e2e8f0;border-radius:22px;background:#fff;padding:clamp(28px,4vw,46px);box-shadow:0 18px 58px #0f172a0d,0 2px 8px #0f172a08}
.card-kicker{color:var(--account-primary);font-size:11px;font-weight:800;letter-spacing:.16em}.register-card h2{margin:14px 0 8px;font-size:clamp(28px,2.7vw,35px);font-weight:750;letter-spacing:-.035em}.card-description{margin:0;color:#64748b;font-size:14px;line-height:1.6}
form{display:grid;gap:8px;margin-top:28px}label{margin-top:11px;color:#253044;font-size:14px;font-weight:700}label:first-child{margin-top:0}.optional{margin-left:5px;color:#64748b;font-size:12px;font-weight:400}
input{width:100%;min-height:50px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;padding:0 15px;color:#111827;font:inherit;font-size:15px}input::placeholder{color:#94a3b8}input:focus{border-color:var(--account-primary);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--account-primary) 16%,transparent)}input[aria-invalid=true]{border-color:#dc2626}
.password-field{position:relative}.password-field input{padding-right:48px}.password-field button{position:absolute;top:0;right:4px;display:grid;width:42px;height:50px;place-items:center;border:0;background:transparent;color:#64748b;cursor:pointer}.password-field button:hover{color:var(--account-primary)}
.field-hint,.field-error{font-size:12px}.field-hint{color:#64748b}.field-error{color:#b91c1c}.form-error{margin:10px 0 0;border-radius:10px;background:#fef2f2;padding:12px;color:#991b1b;font-size:13px;line-height:1.5}
.submit{display:flex;min-height:52px;align-items:center;justify-content:center;gap:9px;margin-top:18px;border:0;border-radius:11px;background:var(--account-primary);color:#fff;font:700 15px var(--account-font);cursor:pointer}.submit:disabled{cursor:wait;opacity:.65}.account-note{display:flex;align-items:flex-start;gap:8px;margin:23px 0 0;border-top:1px solid #e9edf3;padding-top:19px;color:#64748b;font-size:12px}.account-note svg{flex:none;color:var(--account-primary)}
.login-note{display:flex;justify-content:center;gap:6px;margin:22px 0 0;color:#64748b;font-size:13px}.login-note a{display:inline-flex;align-items:center;gap:4px;color:var(--account-primary);font-weight:700;text-decoration:none}.login-note a:hover{text-decoration:underline}.register-page :is(a,button,input):focus-visible{outline:3px solid var(--account-primary);outline-offset:3px}
@media(max-width:900px){.register-layout{grid-template-columns:1fr;gap:45px;max-width:630px;padding:55px 0}.register-intro h1{font-size:clamp(36px,7vw,49px)}.account-benefits{grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.benefit{display:block}.benefit>span{margin-bottom:12px}.support-note{margin-top:28px}}
@media(max-width:630px){.register-layout{width:min(100% - 32px,520px);gap:34px;padding:40px 0}.register-intro h1{margin:16px 0 12px;font-size:34px}.intro-lead{font-size:15px}.account-benefits{grid-template-columns:1fr;gap:16px;margin-top:28px}.benefit{display:flex;gap:12px}.benefit>span{width:40px;height:40px;margin:0}.benefit h2{font-size:14px}.benefit p{font-size:13px}.register-card{padding:27px 22px}.register-card h2{font-size:28px}}
</style>
