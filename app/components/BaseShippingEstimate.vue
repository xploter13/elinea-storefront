<script setup lang="ts">
import { vMask } from '~/utils/input-mask'
import { Truck } from '@lucide/vue'
import type { ShippingOption, ShippingProvider } from '@elinea/sdk'

const props = defineProps<{
  productId: number
  quantity: number
  provider: ShippingProvider
}>()

const zipcode = ref('')
const options = ref<ShippingOption[]>([])
const errorMessage = ref('')
const loading = ref(false)
let requestSequence = 0

watch([zipcode, () => props.quantity, () => props.productId], () => {
  requestSequence++
  options.value = []
  errorMessage.value = ''
  loading.value = false
})

const calculateShipping = async () => {
  const normalizedZipcode = zipcode.value.replace(/\D/g, '')
  options.value = []
  errorMessage.value = ''

  if (normalizedZipcode.length !== 8) {
    errorMessage.value = 'Informe um CEP com 8 números.'
    return
  }

  const sequence = ++requestSequence
  loading.value = true

  try {
    const response = await $fetch<{ data: ShippingOption[] }>('/api/shipping/quote', {
      method: 'POST',
      body: {
        provider: props.provider.provider,
        zipcode: normalizedZipcode,
        items: [{ productId: props.productId, quantity: props.quantity }],
      },
    })

    if (sequence === requestSequence) options.value = response.data
  } catch (error) {
    if (sequence === requestSequence) {
      const failure = error as { data?: { message?: string } }
      errorMessage.value = failure.data?.message || 'Não foi possível calcular o frete. Tente novamente.'
    }
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
</script>

<template>
  <section class="shipping-estimate" aria-labelledby="shipping-estimate-title">
    <div class="shipping-heading">
      <Truck :size="19" aria-hidden="true" />
      <div>
        <h2 id="shipping-estimate-title">Calcule o frete</h2>
        <p>Veja preço e prazo para o seu CEP.</p>
      </div>
    </div>

    <form class="shipping-form" @submit.prevent="calculateShipping">
      <label for="shipping-zipcode">CEP de entrega</label>
      <div class="shipping-controls">
        <input v-mask="'zipcode'" id="shipping-zipcode" v-model="zipcode" type="text" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" :aria-invalid="Boolean(errorMessage)" aria-describedby="shipping-feedback">
        <button type="submit" :disabled="loading">{{ loading ? 'Calculando...' : 'Calcular' }}</button>
      </div>
    </form>

    <p v-if="errorMessage" id="shipping-feedback" class="shipping-error" role="alert">{{ errorMessage }}</p>
    <div v-else id="shipping-feedback" aria-live="polite">
      <p v-if="loading" class="shipping-status">Consultando {{ provider.name }}...</p>
      <ul v-else-if="options.length" class="shipping-options" aria-label="Opções de frete">
        <li v-for="option in options" :key="`${option.provider}-${option.serviceCode}`">
          <span><strong>{{ option.serviceName }}</strong><small>{{ option.deadlineText }}</small></span>
          <strong>{{ money(option.price) }}</strong>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.shipping-estimate{margin:22px 0;padding:20px;border:1px solid #e1e6ee;border-radius:14px;background:#f8fafc}
.shipping-heading{display:flex;align-items:flex-start;gap:11px;color:var(--sf-primary)}
.shipping-heading h2{margin:0;color:var(--sf-ink);font-size:16px;font-weight:750}
.shipping-heading p{margin:4px 0 0;color:#667085;font-size:13px}
.shipping-form{margin-top:18px}
.shipping-form label{display:block;margin-bottom:8px;color:var(--sf-ink);font-size:13px;font-weight:650}
.shipping-controls{display:flex;gap:9px}
.shipping-controls input{width:100%;min-width:0;height:44px;padding:0 13px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:var(--sf-ink);font-size:16px;outline:none}
.shipping-controls input:focus-visible{border-color:var(--sf-primary);box-shadow:0 0 0 3px color-mix(in srgb,var(--sf-primary) 18%,transparent)}
.shipping-controls input[aria-invalid="true"]{border-color:#b42318}
.shipping-controls button{min-width:112px;min-height:44px;padding:0 16px;border:0;border-radius:9px;background:var(--sf-primary);color:#fff;font-size:13px;font-weight:700;cursor:pointer}
.shipping-controls button:focus-visible{outline:3px solid var(--sf-ink);outline-offset:2px}
.shipping-controls button:disabled{cursor:wait;opacity:.65}
.shipping-error{margin:10px 0 0;color:#b42318;font-size:13px}
.shipping-status{margin:12px 0 0;color:#667085;font-size:13px}
.shipping-options{display:grid;gap:0;margin:14px 0 0;padding:0;list-style:none;border-top:1px solid #e1e6ee}
.shipping-options li{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid #e1e6ee;font-size:14px}
.shipping-options li span{display:grid;gap:3px}
.shipping-options li small{color:#667085;font-size:12px}
.shipping-options li>strong{white-space:nowrap;color:var(--sf-ink)}
@media(max-width:520px){.shipping-estimate{padding:16px}.shipping-controls button{min-width:98px;padding:0 12px}}
</style>
