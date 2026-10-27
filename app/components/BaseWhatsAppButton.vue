<script setup lang="ts">
const props = withDefaults(defineProps<{ phone?: string | null, variant?: 'floating' | 'inline', message?: string }>(), { variant: 'floating', message: '' })
const route = useRoute()
const whatsappUrl = computed(() => {
  const digits = props.phone?.replace(/\D/g, '') || ''
  const number = /^\d{10,11}$/.test(digits) ? `55${digits}` : digits
  if (!/^55\d{10,11}$/.test(number)) return null
  const url = new URL(`https://wa.me/${number}`)
  if (props.message) url.searchParams.set('text', props.message)
  return url.href
})
const hasPurchaseBar = computed(() => route.path.startsWith('/produto/'))
</script>

<template>
  <a
    v-if="whatsappUrl"
    class="whatsapp-button"
    :class="{ 'above-purchase-bar': variant === 'floating' && hasPurchaseBar, 'whatsapp-button--inline': variant === 'inline' }"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    :aria-label="variant === 'inline' ? 'Comprar este produto pelo WhatsApp (abre em nova aba)' : 'Falar com a loja pelo WhatsApp (abre em nova aba)'"
    title="Fale com a loja pelo WhatsApp"
  >
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path d="M27.5 15.6a11.5 11.5 0 0 1-17 10.1L4 27.5l1.8-6.2A11.5 11.5 0 1 1 27.5 15.6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
      <path d="m11.2 9.6 1.6-.1c.3 0 .5.2.6.5l1.1 2.6c.1.3.1.5-.1.8l-1 1.2c.8 1.7 2.1 3 3.8 3.8l1.2-1c.2-.2.5-.2.8-.1l2.6 1.2c.3.1.4.3.4.6 0 1.4-.8 2.7-2.4 2.8-2.5.2-5.2-1.4-7.1-3.3-1.9-1.9-3.5-4.6-3.3-7.1.1-.9.8-1.7 1.8-1.9Z" fill="currentColor" />
    </svg>
    <span v-if="variant === 'inline'">Comprar pelo Whatsapp</span>
  </a>
</template>

<style scoped>
.whatsapp-button{position:fixed;right:24px;bottom:calc(24px + env(safe-area-inset-bottom,0px));z-index:40;display:grid;width:56px;height:56px;place-items:center;border:2px solid #fff;border-radius:50%;background:#128c4a;color:#fff;box-shadow:0 4px 16px #102a2230;text-decoration:none;transition:background .2s,box-shadow .2s}
.whatsapp-button svg{display:block;flex-shrink:0}
.whatsapp-button:hover{background:#0d713a;box-shadow:0 6px 20px #102a2240}
.whatsapp-button:focus-visible{outline:3px solid #128c4a;outline-offset:4px}
@media(max-width:640px){.whatsapp-button{right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px))}}
@media(max-width:520px){.whatsapp-button.above-purchase-bar{bottom:calc(88px + env(safe-area-inset-bottom,0px))}}
.whatsapp-button--inline{position:static;z-index:auto;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:auto;min-height:52px;margin-top:12px;padding:12px 16px;border:1px solid #128c4a;border-radius:999px;background:#fff;color:#128c4a;box-shadow:none;font-size:14px;font-weight:700;line-height:1.5;text-align:center}
.whatsapp-button--inline svg{width:22px;height:22px}
.whatsapp-button--inline:hover{background:#effcf4;box-shadow:none}
@media(prefers-reduced-motion:reduce){.whatsapp-button{transition:none}}
</style>
