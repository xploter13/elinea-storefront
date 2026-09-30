<script setup lang="ts">
import { ArrowLeft, Check, CreditCard, ShieldCheck } from '@lucide/vue'
import type { HostedPayment, Order, PaymentMethod } from '@elinea/sdk'
import type { StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import { hostedPaymentUrl, paymentMethodsLabel } from '#shared/utils/checkout-payment'
import SharedCommerceHeader from './SharedCommerceHeader.vue'

const props = defineProps<{ storefront: StorefrontPayload }>()
const route = useRoute()
const orderId = Number(route.params.id)
if (!Number.isSafeInteger(orderId) || orderId < 1) throw createError({ statusCode: 404, message: 'Pedido não encontrado.' })
const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { money } = useStorefrontCatalog(props.storefront)
const { data: orderResponse, error: orderError, refresh: refreshOrder } = await useFetch<{ data: Order }>(`/api/orders/${orderId}`, { headers })
if (orderError.value) throw createError({ statusCode: orderError.value.statusCode || 502, message: (orderError.value.data as { message?: string } | undefined)?.message || 'Não foi possível carregar o pedido.' })
const order = computed(() => orderResponse.value?.data)
const { data: methodsResponse, error: methodsError, refresh: refreshMethods } = await useFetch<{ data: PaymentMethod[] }>('/api/payment/methods', { headers })
const methods = computed(() => methodsResponse.value?.data || [])
const selectedMethod = ref<number | null>(Number(route.query.metodo) || null)
watch(methods, value => {
  if (!value.some(method => method.id === selectedMethod.value)) selectedMethod.value = value[0]?.id || null
}, { immediate: true })
const attempts = useCookie<Record<string, string>>(`elinea_payment_attempts_${props.storefront.site.slug}_${orderId}`, { default: () => ({}), sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 })
const paid = computed(() => order.value?.billingStatus === 'paid')
const paying = ref(false)
const refreshing = ref(false)
const errorMessage = ref('')
const returned = computed(() => route.query.retorno === '1')

async function updateStatus() {
  refreshing.value = true
  errorMessage.value = ''
  try { await Promise.all([refreshOrder(), refreshMethods()]) }
  finally { refreshing.value = false }
  if (orderError.value) errorMessage.value = 'Não foi possível atualizar o pedido. Tente novamente.'
}

async function pay() {
  if (paying.value || paid.value || !selectedMethod.value) return
  errorMessage.value = ''
  paying.value = true
  try {
    const methodId = selectedMethod.value
    const key = String(methodId)
    if (!attempts.value[key]) attempts.value = { ...attempts.value, [key]: crypto.randomUUID() }
    const response = await $fetch<{ data: HostedPayment }>('/api/payment', { method: 'POST', body: { orderId, paymentMethodId: methodId, idempotencyKey: attempts.value[key] } })
    await navigateTo(hostedPaymentUrl(response.data.redirectUrl), { external: true })
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || error?.message || 'Não foi possível iniciar o pagamento. Tente novamente.'
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="payment-shell">
    <SharedCommerceHeader :store-name="storefront.site.name" :logo-url="storefront.theme?.logo_url" step="Pagamento" />
    <main v-if="order" class="payment-layout">
      <section class="payment-main">
        <NuxtLink to="/conta/pedidos" class="back"><ArrowLeft :size="16" aria-hidden="true"/> Meus pedidos</NuxtLink>
        <div class="payment-heading"><span>Pedido {{ order.number }}</span><h1>{{ paid ? 'Pagamento confirmado' : 'Finalize seu pagamento' }}</h1><p>{{ paid ? 'Recebemos a confirmação do provedor. Seu pedido está em andamento.' : 'Escolha o provedor para pagar seu pedido com segurança.' }}</p></div>
        <div v-if="paid" class="payment-success" role="status"><Check :size="24" aria-hidden="true"/><span>Seu pagamento foi confirmado.</span></div>
        <template v-else>
          <p v-if="returned" class="payment-status" role="status">{{ order.billingStatus==='failed' ? 'O pagamento não foi aprovado. Você pode tentar novamente.' : 'Aguardando a confirmação do provedor. Se você já pagou, atualize o status antes de tentar novamente.' }}</p>
          <form v-if="methods.length" class="payment-form" @submit.prevent="pay">
            <fieldset :disabled="paying"><legend>Opção de pagamento <span aria-hidden="true">*</span></legend>
              <label v-for="method in methods" :key="method.id" :class="{selected:selectedMethod===method.id}"><input v-model="selectedMethod" type="radio" name="gateway" :value="method.id"><CreditCard :size="22" aria-hidden="true"/><span><strong>{{ method.name }}</strong><small>{{ paymentMethodsLabel(method.methods) }}</small><small v-if="method.maxInstallments>1 && method.methods.includes('CREDIT_CARD')">Até {{ method.maxInstallments }} parcelas, conforme condições do provedor.</small></span></label>
            </fieldset>
            <p class="payment-help"><ShieldCheck :size="20" aria-hidden="true"/><span>Na próxima página você informa os dados do cartão ou gera o Pix ou boleto, conforme as opções da loja.</span></p>
            <button class="pay-button" type="submit" :disabled="paying || !selectedMethod">{{ paying ? 'Preparando pagamento...' : 'Ir para pagamento' }}</button>
          </form>
          <p v-else-if="!methodsError" class="payment-status">A loja não possui uma opção de pagamento disponível no momento. Seu pedido permanece registrado.</p>
          <p v-if="methodsError" class="payment-error" role="alert">Não foi possível carregar as opções de pagamento. Tente atualizar.</p>
        </template>
        <p v-if="errorMessage" class="payment-error" role="alert">{{ errorMessage }}</p>
        <button type="button" class="refresh-button" :disabled="refreshing || paying" @click="updateStatus">{{ refreshing ? 'Atualizando...' : 'Atualizar status' }}</button>
      </section>
      <aside class="payment-summary"><span>Resumo</span><h2>Seu pedido</h2><div v-for="(item,index) in order.items" :key="index" class="payment-item"><div><strong>{{ item.name }}</strong><small>{{ item.quantity }} {{ item.quantity===1?'unidade':'unidades' }}</small></div><b>{{ money(item.total) }}</b></div><dl><div><dt>Subtotal</dt><dd>{{ money(order.subtotal) }}</dd></div><div v-if="order.discountTotal"><dt>Desconto</dt><dd>− {{ money(order.discountTotal) }}</dd></div><div><dt>Frete</dt><dd>{{ order.shippingTotal===0?'Grátis':money(order.shippingTotal) }}</dd></div><div class="payment-total"><dt>Total</dt><dd>{{ money(order.total) }}</dd></div></dl><p v-if="order.shippingAddress" class="payment-address"><strong>Entrega</strong><br>{{ order.shippingAddress.street }}, {{ order.shippingAddress.number }}<br>{{ order.shippingAddress.city }} / {{ order.shippingAddress.state }}<br>CEP {{ order.shippingAddress.zipcode }}</p></aside>
    </main>
  </div>
</template>

<style scoped>
.payment-shell{min-height:100dvh;background:#fff;color:#111827;font-family:var(--sf-body,"Segoe UI",sans-serif)}.payment-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,400px);gap:clamp(30px,6vw,80px);max-width:1200px;margin:auto;padding:48px 24px 96px}.payment-main{min-width:0}.back{display:inline-flex;align-items:center;gap:8px;color:#6b7280;font-size:13px;text-decoration:none}.payment-heading{margin:28px 0}.payment-heading>span,.payment-summary>span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:var(--sf-primary,#2563eb)}.payment-heading h1{margin:12px 0;font-size:clamp(30px,4vw,48px);letter-spacing:-.04em;line-height:1.1}.payment-heading p,.payment-status{color:#6b7280;font-size:14px;line-height:1.6}.payment-form{padding:24px;border:1px solid #e5e7eb;border-radius:16px}.payment-form fieldset{margin:0;padding:0;border:0}.payment-form legend{margin-bottom:14px;font-size:14px;font-weight:700}.payment-form legend>span{color:#b91c1c}.payment-form label{display:flex;align-items:start;gap:12px;padding:16px;margin-top:10px;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer}.payment-form label.selected{border-color:var(--sf-primary,#2563eb);background:#eff6ff}.payment-form input{margin-top:5px;accent-color:var(--sf-primary,#2563eb)}.payment-form label>span{display:grid;gap:6px}.payment-form strong{font-size:14px}.payment-form small{font-size:12px;line-height:1.5;color:#6b7280}.payment-help{display:flex;align-items:start;gap:10px;font-size:12px;line-height:1.6;color:#6b7280}.payment-help svg{flex-shrink:0;color:var(--sf-primary,#2563eb)}.pay-button{width:100%;min-height:52px;border:0;border-radius:10px;background:var(--sf-primary,#2563eb);color:#fff;font-weight:700;cursor:pointer}.refresh-button{min-height:44px;padding:0 16px;margin-top:16px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#374151;cursor:pointer}.payment-error{color:#b91c1c;font-size:13px;line-height:1.6}.payment-success{display:flex;gap:12px;align-items:center;padding:18px;border-radius:12px;background:#f0fdf4;color:#166534}.payment-summary{align-self:start;padding:28px;border:1px solid #e5e7eb;border-radius:16px;box-shadow:0 18px 48px rgba(15,23,42,.06)}.payment-summary h2{margin:10px 0 20px;font-size:28px;letter-spacing:-.03em}.payment-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #e5e7eb;font-size:13px}.payment-item>div{display:grid;gap:6px}.payment-item small{color:#6b7280}.payment-item b{white-space:nowrap}.payment-summary dl{display:grid;gap:14px;margin:24px 0}.payment-summary dl>div{display:flex;justify-content:space-between;gap:12px;font-size:13px;color:#6b7280}.payment-summary .payment-total{border-top:1px solid #e5e7eb;padding-top:18px;font-size:20px;font-weight:800;color:#111827}.payment-address{margin:0;font-size:12px;line-height:1.6;color:#6b7280}button:disabled{opacity:.6;cursor:not-allowed}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--sf-primary,#2563eb);outline-offset:4px}@media(max-width:800px){.payment-layout{grid-template-columns:1fr}.payment-summary{grid-row:1}}@media(max-width:480px){.payment-layout{padding:28px 16px 64px}.payment-form,.payment-summary{padding:20px}}
</style>
