<script setup lang="ts">
import { ArrowRight, KeyRound } from '@lucide/vue'
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
    <main class="auth-page">
      <section class="auth-panel">
        <div class="auth-mark"><KeyRound :size="25" /></div>
        <span class="eyebrow">Segurança · {{ storefront.site.name }}</span>
        <h1>{{ token ? 'Crie uma nova senha.' : 'Redefina sua senha.' }}</h1>
        <p>{{ token ? 'Escolha uma senha forte para continuar.' : 'Informe seu e-mail e enviaremos as instruções.' }}</p>
        <form @submit.prevent="submit">
          <label>E-mail<input v-model.trim="email" type="email" autocomplete="email" required></label>
          <template v-if="token">
            <label>Nova senha<input v-model="password" type="password" autocomplete="new-password" minlength="8" required></label>
            <label>Confirme a senha<input v-model="confirmation" type="password" autocomplete="new-password" minlength="8" required></label>
          </template>
          <p v-if="message" role="status" class="success">{{ message }}</p>
          <p v-if="errorMessage" role="alert" class="error">{{ errorMessage }}</p>
          <button type="submit" :disabled="pending || sent">{{ pending ? 'Aguarde...' : token ? 'Redefinir senha' : 'Enviar instruções' }} <ArrowRight :size="17" /></button>
        </form>
        <NuxtLink to="/login" class="back-link">Voltar para o login</NuxtLink>
      </section>
    </main>
  </BaseTemplate>
</template>

<style scoped>
.auth-page{display:grid;min-height:580px;place-items:center;padding:64px 24px;background:#f8fafc;color:#111827;font-family:var(--sf-body,"Segoe UI",Arial,sans-serif)}
.auth-panel{width:min(100%,460px);padding:42px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.1)}
.auth-mark{display:grid;width:52px;height:52px;place-items:center;margin-bottom:28px;border-radius:14px;background:var(--sf-primary);color:#fff}
.eyebrow{color:var(--sf-primary);font:700 11px ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
.auth-panel h1{margin:10px 0;font-size:38px;line-height:1;letter-spacing:-.045em}.auth-panel>p{margin:0 0 28px;color:#6b7280;line-height:1.6}
.auth-panel form{display:grid;gap:16px}.auth-panel label{display:grid;gap:8px;font-size:12px;font-weight:700}.auth-panel input{width:100%;height:50px;padding:0 14px;border:1px solid #d1d5db;border-radius:10px;font:inherit;outline:0}
.auth-panel button{display:flex;width:100%;height:50px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;background:var(--sf-primary);color:#fff;font-weight:750;cursor:pointer}.auth-panel button:disabled{cursor:wait;opacity:.6}
.back-link{display:block;margin-top:24px;color:var(--sf-primary);font-size:12px;font-weight:700;text-align:center;text-decoration:none}.error{margin:0;color:#b91c1c;font-size:12px}.success{margin:0;color:#15803d;font-size:12px}
@media(max-width:540px){.auth-page{padding:40px 18px}.auth-panel{padding:28px}}
</style>
