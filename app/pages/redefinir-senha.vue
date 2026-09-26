<script setup lang="ts">
import { ArrowLeft, ArrowRight, CheckCircle2, Headset, KeyRound, LockKeyhole, Mail, ShieldCheck } from '@lucide/vue'
import BaseTemplate from '~/components/BaseTemplate.vue'
import type { StorefrontPage } from '~/utils/storefront-page'

const page = { kind: 'password-reset' } satisfies StorefrontPage
const storefront = await useStorefrontPage(page)
const route = useRoute()
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const confirmation = ref('')
const sent = ref(false)
const pending = ref(false)
const message = ref('')
const errorMessage = ref('')
const primary = computed(() => storefront.theme?.primary_color || '#2563eb')
const font = computed(() => `"${storefront.theme?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`)
const supportPhone = computed(() => storefront.theme?.contact_phone?.trim() || '')
const supportPhoneHref = computed(() => `tel:${supportPhone.value.replace(/\D/g, '')}`)
const steps = computed(() => token.value
  ? [
      { title: 'Confirme seu e-mail', description: 'Use o endereço que recebeu o link de recuperação.' },
      { title: 'Escolha uma nova senha', description: 'Crie uma senha com pelo menos 8 caracteres.' },
      { title: 'Volte para sua conta', description: 'Entre novamente com a senha atualizada.' },
    ]
  : [
      { title: 'Informe seu e-mail', description: 'Use o endereço cadastrado na sua conta.' },
      { title: 'Abra o link recebido', description: 'Enviaremos as instruções para esse endereço.' },
      { title: 'Crie uma nova senha', description: 'Depois, você poderá entrar normalmente.' },
    ])

async function submit() {
  pending.value = true
  errorMessage.value = ''
  message.value = ''
  try {
    const path = token.value ? '/api/auth/password/reset' : '/api/auth/password/forgot'
    await $fetch(path, {
      method: 'POST',
      body: token.value
        ? { token: token.value, email: email.value, password: password.value, password_confirmation: confirmation.value }
        : { email: email.value },
    })
    sent.value = true
    message.value = token.value ? 'Senha redefinida. Você já pode entrar.' : 'Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição.'
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'Não foi possível processar a solicitação.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <BaseTemplate :storefront="storefront" :page="page">
    <main class="recovery-page" :style="{ '--account-primary': primary, '--account-font': font }">
      <div class="recovery-layout">
        <section class="recovery-intro" aria-labelledby="recovery-title">
          <span class="intro-label"><LockKeyhole :size="16" /> Acesso à sua conta</span>
          <h1 id="recovery-title">{{ token ? 'Sua conta está a um passo de volta.' : 'Vamos ajudar você a voltar para sua conta.' }}</h1>
          <p class="intro-lead">{{ token ? 'Defina uma nova senha para continuar acompanhando suas compras e cuidando dos seus dados.' : 'Esquecer a senha acontece. Siga estas etapas para recuperar o acesso à sua conta em ' + storefront.site.name + '.' }}</p>

          <ol class="recovery-steps" aria-label="Etapas de recuperação">
            <li v-for="(step, index) in steps" :key="step.title">
              <span class="step-number">{{ index + 1 }}</span>
              <div><h2>{{ step.title }}</h2><p>{{ step.description }}</p></div>
            </li>
          </ol>

          <div v-if="supportPhone" class="support-note">
            <Headset :size="20" />
            <p>Precisa de ajuda? <a :href="supportPhoneHref">Fale com a loja: {{ supportPhone }}</a></p>
          </div>
        </section>

        <div class="form-column">
          <section class="recovery-card" aria-labelledby="form-title">
            <div class="card-icon"><KeyRound v-if="token" :size="25" /><Mail v-else :size="25" /></div>
            <template v-if="sent">
              <CheckCircle2 class="success-icon" :size="32" />
              <h2 id="form-title">{{ token ? 'Senha atualizada' : 'Confira seu e-mail' }}</h2>
              <p class="card-description" role="status">{{ message }}</p>
              <p v-if="!token" class="email-hint">Enviamos as instruções para <strong>{{ email }}</strong>, caso exista uma conta com esse endereço.</p>
              <NuxtLink to="/login" class="primary-link">Voltar para o login <ArrowRight :size="17" /></NuxtLink>
            </template>
            <template v-else>
              <h2 id="form-title">{{ token ? 'Defina sua nova senha' : 'Receba um link por e-mail' }}</h2>
              <p class="card-description">{{ token ? 'Preencha os dados abaixo para recuperar o acesso.' : 'Informe o e-mail usado na sua conta. Você receberá um link com as próximas instruções.' }}</p>
              <form @submit.prevent="submit">
                <label for="recovery-email">E-mail</label>
                <input id="recovery-email" v-model.trim="email" type="email" autocomplete="email" placeholder="seu@email.com" required>
                <template v-if="token">
                  <label for="recovery-password">Nova senha</label>
                  <input id="recovery-password" v-model="password" type="password" autocomplete="new-password" minlength="8" required>
                  <p class="field-hint">Use pelo menos 8 caracteres.</p>
                  <label for="recovery-confirmation">Confirme a nova senha</label>
                  <input id="recovery-confirmation" v-model="confirmation" type="password" autocomplete="new-password" minlength="8" required>
                </template>
                <p v-if="errorMessage" role="alert" class="error">{{ errorMessage }}</p>
                <button class="submit" type="submit" :disabled="pending">
                  {{ pending ? 'Aguarde...' : token ? 'Salvar nova senha' : 'Enviar link de recuperação' }} <ArrowRight :size="17" />
                </button>
              </form>
              <div class="privacy-note"><ShieldCheck :size="17" /><span>Por segurança, só enviaremos instruções ao e-mail cadastrado.</span></div>
            </template>
          </section>
          <NuxtLink v-if="!sent" to="/login" class="back-link"><ArrowLeft :size="16" /> Voltar para o login</NuxtLink>
        </div>
      </div>
    </main>
  </BaseTemplate>
</template>

<style scoped>
.recovery-page{position:relative;overflow:hidden;min-height:620px;background:#f7f9fc;color:#111827;font:16px/1.5 var(--account-font)}
.recovery-page:before{position:absolute;top:-250px;left:-190px;width:610px;height:610px;border-radius:50%;background:color-mix(in srgb,var(--account-primary) 7%,transparent);content:"";pointer-events:none}
.recovery-layout{position:relative;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);align-items:center;gap:clamp(48px,8vw,120px);width:min(100% - 48px,1160px);min-height:620px;margin:auto;padding:clamp(56px,7vw,96px) 0}
.recovery-intro{max-width:560px}.intro-label{display:inline-flex;align-items:center;gap:9px;color:var(--account-primary);font-size:13px;font-weight:750}.intro-label svg{flex:none}
.recovery-intro h1{max-width:570px;margin:24px 0 18px;font-size:clamp(38px,4.4vw,58px);font-weight:750;line-height:1.08;letter-spacing:-.045em;text-wrap:balance}
.intro-lead{max-width:520px;margin:0;color:#475569;font-size:17px;line-height:1.7}
.recovery-steps{display:grid;gap:0;max-width:490px;margin:38px 0 0;padding:0;list-style:none}
.recovery-steps li{position:relative;display:grid;grid-template-columns:40px 1fr;gap:15px;padding-bottom:24px}
.recovery-steps li:not(:last-child):before{position:absolute;top:40px;bottom:0;left:19px;width:1px;background:#cbd5e1;content:""}
.recovery-steps li:last-child{padding-bottom:0}.step-number{display:grid;width:40px;height:40px;place-items:center;border:1px solid color-mix(in srgb,var(--account-primary) 26%,white);border-radius:50%;background:#fff;color:var(--account-primary);font-size:14px;font-weight:800}
.recovery-steps h2{margin:2px 0 3px;font-size:15px;font-weight:750}.recovery-steps p{margin:0;color:#64748b;font-size:13px;line-height:1.5}
.support-note{display:flex;align-items:flex-start;gap:11px;max-width:490px;margin-top:36px;border-top:1px solid #dbe2eb;padding-top:22px;color:#475569;font-size:13px}.support-note svg{flex:none;color:var(--account-primary)}.support-note p{margin:0}.support-note a{color:var(--account-primary);font-weight:700;text-decoration:none}.support-note a:hover{text-decoration:underline}
.form-column{min-width:0}.recovery-card{border:1px solid #e2e8f0;border-radius:22px;background:#fff;padding:clamp(28px,4vw,46px);box-shadow:0 18px 58px #0f172a0d,0 2px 8px #0f172a08}
.card-icon{display:grid;width:52px;height:52px;place-items:center;margin-bottom:24px;border-radius:14px;background:color-mix(in srgb,var(--account-primary) 11%,white);color:var(--account-primary)}
.recovery-card h2{margin:0 0 9px;font-size:clamp(27px,2.6vw,34px);font-weight:750;line-height:1.16;letter-spacing:-.035em}.card-description{margin:0;color:#64748b;font-size:14px;line-height:1.65}
form{display:grid;gap:9px;margin-top:30px}label{margin-top:9px;color:#253044;font-size:14px;font-weight:700}label:first-child{margin-top:0}
input{width:100%;min-height:52px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;padding:0 15px;color:#111827;font:inherit;font-size:15px}input::placeholder{color:#94a3b8}input:focus{border-color:var(--account-primary);outline:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--account-primary) 16%,transparent)}
.field-hint{margin:0;color:#64748b;font-size:12px}.submit,.primary-link{display:flex;min-height:52px;align-items:center;justify-content:center;gap:9px;margin-top:20px;border:0;border-radius:11px;background:var(--account-primary);color:#fff;font:700 15px var(--account-font);text-align:center;text-decoration:none;cursor:pointer}.submit:disabled{cursor:wait;opacity:.65}
.privacy-note{display:flex;align-items:flex-start;gap:9px;margin-top:24px;border-top:1px solid #e9edf3;padding-top:19px;color:#64748b;font-size:12px;line-height:1.5}.privacy-note svg{flex:none;color:var(--account-primary)}
.back-link{display:flex;width:max-content;align-items:center;gap:8px;margin:22px auto 0;color:var(--account-primary);font-size:13px;font-weight:700;text-decoration:none}.back-link:hover,.primary-link:hover{text-decoration:underline}
.success-icon{margin:0 0 15px;color:#16a34a}.email-hint{margin:18px 0 0;border-radius:10px;background:#f1f5f9;padding:14px;color:#475569;font-size:13px;line-height:1.55;overflow-wrap:anywhere}.error{margin:10px 0 0;border-radius:10px;background:#fef2f2;padding:12px;color:#991b1b;font-size:13px}
.recovery-page :is(a,button,input):focus-visible{outline:3px solid var(--account-primary);outline-offset:3px}
@media(max-width:860px){.recovery-layout{grid-template-columns:1fr;gap:44px;max-width:620px;padding:54px 0}.recovery-intro h1{font-size:clamp(36px,7vw,48px)}.recovery-steps{grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;max-width:none}.recovery-steps li{display:block;padding:0}.recovery-steps li:not(:last-child):before{display:none}.step-number{margin-bottom:11px}.support-note{margin-top:28px}}
@media(max-width:620px){.recovery-layout{width:min(100% - 32px,520px);gap:34px;padding:40px 0}.recovery-intro h1{margin:16px 0 12px;font-size:34px}.intro-lead{font-size:15px}.recovery-steps{grid-template-columns:1fr;gap:14px;margin-top:28px}.recovery-steps li{display:grid;grid-template-columns:36px 1fr;gap:11px}.step-number{width:36px;height:36px;margin:0}.recovery-steps h2{margin-top:0;font-size:14px}.support-note{margin-top:24px}.recovery-card{padding:27px 22px}.recovery-card h2{font-size:27px}}
</style>
