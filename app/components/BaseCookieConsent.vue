<script setup lang="ts">
import { Cookie, X } from '@lucide/vue'

const storageKey = 'elinea:base-cookie-consent'
const visible = ref(false)

onMounted(() => {
  visible.value = localStorage.getItem(storageKey) !== 'accepted' && localStorage.getItem(storageKey) !== 'declined'
})

const close = (value: 'accepted' | 'declined') => {
  localStorage.setItem(storageKey, value)
  visible.value = false
}
</script>

<template>
  <aside v-if="visible" class="cookie-consent" aria-label="Aviso de cookies">
    <button class="cookie-close" type="button" aria-label="Fechar aviso" @click="close('declined')"><X :size="16" /></button>
    <div class="cookie-icon"><Cookie :size="30" /></div>
    <div class="cookie-copy">
      <strong>Sua privacidade é importante para nós</strong>
      <p>Usamos cookies e tecnologias semelhantes para oferecer a melhor experiência em nosso site. <NuxtLink to="/privacidade">Política de privacidade</NuxtLink></p>
    </div>
    <button class="decline" type="button" @click="close('declined')">Recusar</button>
    <button class="accept" type="button" @click="close('accepted')">Aceitar</button>
  </aside>
</template>

<style scoped>
.cookie-consent{position:fixed;left:50%;bottom:24px;z-index:85;display:grid;grid-template-columns:auto minmax(230px,1fr) 116px 116px;align-items:center;gap:16px;width:min(92vw,760px);min-height:86px;padding:18px 24px;border:1px solid #e5e7eb;border-radius:999px;background:rgba(255,255,255,.96);box-shadow:0 18px 54px rgba(15,23,42,.16);transform:translateX(-50%);backdrop-filter:blur(14px)}.cookie-close{position:absolute;right:10px;top:8px;display:grid;width:25px;height:25px;place-items:center;border:1px solid #e5e7eb;border-radius:50%;background:#fff;color:#111827}.cookie-icon{display:grid;width:52px;height:52px;place-items:center;border-radius:50%;background:#f0d39a;color:#7a4a11;box-shadow:inset 0 0 0 1px rgba(122,74,17,.08)}.cookie-copy{display:grid;gap:5px}.cookie-copy strong{color:#111827;font-size:16px;font-weight:760;letter-spacing:-.01em}.cookie-copy p{max-width:390px;margin:0;color:#4b5563;font-size:14px!important;line-height:1.45}.cookie-copy a{color:#111827;font-weight:700;text-decoration:none}.decline,.accept{height:42px;border:0;border-radius:999px;font-size:15px;font-weight:650}.decline{background:#e5e5e5;color:#525252}.accept{background:var(--sf-primary);color:#fff}@media(max-width:720px){.cookie-consent{grid-template-columns:auto 1fr;gap:12px;border-radius:22px}.decline,.accept{width:100%}.decline{grid-column:1/2}.accept{grid-column:2/3}.cookie-copy p{max-width:none}}@media(max-width:480px){.cookie-consent{left:12px;right:12px;bottom:12px;width:auto;transform:none;padding:16px}.cookie-icon{width:44px;height:44px}.cookie-copy strong{font-size:14px}.cookie-copy p{font-size:14px!important}}
</style>
