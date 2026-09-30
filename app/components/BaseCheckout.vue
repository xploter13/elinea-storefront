<script setup lang="ts">
import { vMask } from '~/utils/input-mask'
import { Check, ChevronLeft, MapPin, PackageCheck, Truck } from '@lucide/vue'
import type { Customer, CustomerAddress, ShippingOption, ShippingProvider, Order } from '@elinea/sdk'
import type { StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCatalog } from '~~/layers/storefront-core/app/composables/useStorefrontCatalog'
import { useStorefrontCommerce } from '~~/layers/storefront-core/app/composables/useStorefrontCommerce'
import { checkoutTotal, shippingContext } from '#shared/utils/checkout-shipping'
import SharedCommerceHeader from './SharedCommerceHeader.vue'

const props = defineProps<{ storefront: StorefrontPayload }>()
const { money, productImage } = useStorefrontCatalog(props.storefront)
const { cart, cartProducts, initialize, clearCartSession } = useStorefrontCommerce(props.storefront)
const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined
const { data: session } = await useFetch<{ customer: Customer }>('/api/auth/me', { headers: requestHeaders, ignoreResponseError: true })
const customer = computed(() => session.value?.customer)
const contact = reactive({ email: '', firstName: '', lastName: '', document: '', phone: '' })
const address = reactive({ zipcode: '', street: '', number: '', complement: '', district: '', city: '', state: '' })
const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const { data: savedAddresses } = await useFetch<{ data: CustomerAddress[] }>('/api/addresses', {
  headers: requestHeaders,
  immediate: Boolean(customer.value),
  ignoreResponseError: true,
})
watch(customer, (value) => {
  if (!value) return
  const [firstName, ...lastName] = value.name.trim().split(/\s+/)
  Object.assign(contact, { email: value.email, firstName: firstName || '', lastName: lastName.join(' '), document: value.document || '', phone: value.phone || '' })
}, { immediate: true })
watch(savedAddresses, (value) => {
  const preferred = value?.data.find(item => item.isDefault) || value?.data[0]
  if (!preferred) return
  Object.assign(address, { zipcode: preferred.zipcode, street: preferred.street, number: preferred.number || '', complement: preferred.complement || '', district: preferred.district || '', city: preferred.city, state: preferred.state })
}, { immediate: true })
const currentStep = ref<1 | 2 | 3>(1)
const shippingOptions = ref<ShippingOption[]>([])
const selectedDelivery = ref<ShippingOption | null>(null)
const provider = ref('')
const shippingLoading = ref(false)
const saving = ref(false)
const shippingError = ref('')
const submitError = ref('')
const errors = reactive<Record<string, string>>({})
const createdOrder = ref<Order | null>(null)
const { data: providersResponse, error: providersError } = await useFetch<{ data: ShippingProvider[] }>('/api/shipping/providers', { headers: requestHeaders })
const providers = computed(() => providersResponse.value?.data || [])
watch(providers, value => { provider.value = value[0]?.provider || '' }, { immediate: true })
const deliveryContext = computed(() => shippingContext(address.zipcode, cart.value.items))
const total = computed(() => checkoutTotal(cart.value.totals.total, selectedDelivery.value?.price || 0))
let quoteVersion = 0
watch([deliveryContext, provider], () => {
  quoteVersion++
  shippingLoading.value = false
  shippingOptions.value = []
  selectedDelivery.value = null
  shippingError.value = ''
  if (currentStep.value === 3 && !createdOrder.value) currentStep.value = 2
}, { flush: 'sync' })
for (const key of Object.keys(contact) as Array<keyof typeof contact>) {
  watch(() => contact[key], () => { delete errors[`contact.${key}`] })
}
for (const key of Object.keys(address) as Array<keyof typeof address>) {
  watch(() => address[key], () => { delete errors[`address.${key}`] })
}
onMounted(initialize)

function errorMessage(error: any): string {
  return error?.data?.message || error?.data?.statusMessage || 'Não foi possível concluir a operação. Tente novamente.'
}

async function calculateShipping() {
  shippingError.value = ''
  selectedDelivery.value = null
  shippingOptions.value = []
  if (!/^\d{8}$/.test(address.zipcode.replace(/\D/g, ''))) {
    errors['address.zipcode'] = 'Informe um CEP com 8 dígitos.'
    return
  }
  if (!provider.value || !cart.value.items.length) {
    shippingError.value = !provider.value ? 'Nenhuma transportadora disponível para esta loja.' : 'Adicione produtos ao carrinho antes de calcular.'
    return
  }
  const version = ++quoteVersion
  shippingLoading.value = true
  try {
    const response = await $fetch<{ data: ShippingOption[] }>('/api/shipping/quote', {
      method: 'POST', body: { provider: provider.value, zipcode: address.zipcode },
    })
    if (version !== quoteVersion) return
    shippingOptions.value = response.data
    if (!response.data.length) shippingError.value = 'Nenhuma entrega disponível para este CEP.'
  } catch (error) {
    if (version === quoteVersion) shippingError.value = errorMessage(error)
  } finally {
    if (version === quoteVersion) shippingLoading.value = false
  }
}

function validateContact(): boolean {
  if (!contact.firstName.trim()) errors['contact.firstName'] = 'Informe seu nome.'
  if (!contact.lastName.trim()) errors['contact.lastName'] = 'Informe seu sobrenome.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) errors['contact.email'] = 'Informe um e-mail válido.'
  return !Object.keys(errors).some(key => key.startsWith('contact.'))
}

function validateDelivery(): boolean {
  if (!/^\d{8}$/.test(address.zipcode.replace(/\D/g, ''))) errors['address.zipcode'] = 'Informe um CEP com 8 dígitos.'
  for (const [key, label] of [['street', 'a rua'], ['number', 'o número'], ['district', 'o bairro'], ['city', 'a cidade']] as const) {
    if (!address[key].trim()) errors[`address.${key}`] = `Informe ${label}.`
  }
  if (!states.includes(address.state)) errors['address.state'] = 'Selecione o estado.'
  if (!selectedDelivery.value) shippingError.value = 'Calcule o frete e selecione uma opção de entrega.'
  return !Object.keys(errors).some(key => key.startsWith('address.')) && Boolean(selectedDelivery.value)
}

async function continueCheckout() {
  if (saving.value || createdOrder.value) return
  submitError.value = ''
  if (!cart.value.items.length) { submitError.value = 'Seu carrinho está vazio.'; return }
  if (currentStep.value === 1) {
    if (validateContact()) currentStep.value = 2
    return
  }
  if (currentStep.value === 2) {
    if (validateDelivery()) currentStep.value = 3
    return
  }
  if (!validateContact()) { currentStep.value = 1; return }
  if (!validateDelivery()) { currentStep.value = 2; return }
  saving.value = true
  try {
    const delivery = selectedDelivery.value!
    const response = await $fetch<{ data: Order }>('/api/checkout', { method: 'POST', body: {
      customer: { name: `${contact.firstName.trim()} ${contact.lastName.trim()}`, email: contact.email.trim(), phone: contact.phone, document: contact.document },
      shippingAddress: { ...address }, shippingProvider: delivery.provider, shippingServiceCode: delivery.serviceCode, shippingTotal: delivery.price,
    } })
    createdOrder.value = response.data
    clearCartSession()
  } catch (error) {
    submitError.value = errorMessage(error)
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (currentStep.value > 1) currentStep.value = (currentStep.value - 1) as 1 | 2
}
</script>

<template>
  <div class="checkout-shell">
    <SharedCommerceHeader :store-name="storefront.site.name" :logo-url="storefront.theme?.logo_url" step="Entrega e confirmação" />
    <main class="checkout-layout">
      <div class="checkout-main">
        <NuxtLink to="/carrinho" class="back"><ChevronLeft :size="17" /> Voltar ao carrinho</NuxtLink>
        <div class="title-row"><div><span>Finalizar compra</span><h1>Quase tudo pronto.</h1></div><div class="steps" aria-label="Etapas: 1 contato, 2 entrega, 3 revisão"><i :class="{done:currentStep>1}" title="Contato"><Check v-if="currentStep>1" :size="12" /><span v-else>1</span></i><b></b><i :class="{done:currentStep>2,active:currentStep===2}" title="Entrega"><Check v-if="currentStep>2" :size="12" /><span v-else>2</span></i><b></b><i :class="{active:currentStep===3}" title="Revisão">3</i></div></div>

        <form v-if="!createdOrder" @submit.prevent="continueCheckout">
          <section v-if="currentStep===1" class="form-section">
            <div class="section-title"><span>01</span><div><h2>Contato</h2><p>Usaremos estes dados para avisar sobre o pedido.</p></div></div>
            <p v-if="customer" class="customer-note">Dados de {{ customer.name }} carregados da sua conta. Você pode ajustá-los para esta compra.</p>
            <div class="field-grid"><label class="wide">E-mail <span class="required" aria-hidden="true">*</span><input v-model="contact.email" type="email" autocomplete="email" placeholder="voce@email.com" :aria-invalid="Boolean(errors['contact.email'])" :class="{invalid:errors['contact.email']}"><span v-if="errors['contact.email']" class="field-error">{{ errors['contact.email'] }}</span></label><label>Nome <span class="required" aria-hidden="true">*</span><input v-model="contact.firstName" autocomplete="given-name" placeholder="Seu nome" :aria-invalid="Boolean(errors['contact.firstName'])" :class="{invalid:errors['contact.firstName']}"><span v-if="errors['contact.firstName']" class="field-error">{{ errors['contact.firstName'] }}</span></label><label>Sobrenome <span class="required" aria-hidden="true">*</span><input v-model="contact.lastName" autocomplete="family-name" placeholder="Seu sobrenome" :aria-invalid="Boolean(errors['contact.lastName'])" :class="{invalid:errors['contact.lastName']}"><span v-if="errors['contact.lastName']" class="field-error">{{ errors['contact.lastName'] }}</span></label><label>CPF<input v-mask="'cpf'" v-model="contact.document" inputmode="numeric" placeholder="000.000.000-00"></label><label>Telefone<input inputmode="tel" v-mask="'phone'" v-model="contact.phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label></div>
          </section>

          <section v-else-if="currentStep===2" class="form-section">
            <div class="section-title"><span>02</span><div><h2>Entrega</h2><p>Etapa 2: informe onde você quer receber.</p></div></div>
            <div class="field-grid"><label>CEP <span class="required" aria-hidden="true">*</span><input v-mask="'zipcode'" v-model="address.zipcode" autocomplete="postal-code" inputmode="numeric" placeholder="00000-000" :aria-invalid="Boolean(errors['address.zipcode'])" :class="{invalid:errors['address.zipcode']}"><span v-if="errors['address.zipcode']" class="field-error">{{ errors['address.zipcode'] }}</span></label><label class="wide">Rua / avenida <span class="required" aria-hidden="true">*</span><input v-model="address.street" autocomplete="address-line1" placeholder="Nome da rua" :aria-invalid="Boolean(errors['address.street'])" :class="{invalid:errors['address.street']}"><span v-if="errors['address.street']" class="field-error">{{ errors['address.street'] }}</span></label><label>Número <span class="required" aria-hidden="true">*</span><input v-model="address.number" autocomplete="address-line2" placeholder="Número" :aria-invalid="Boolean(errors['address.number'])" :class="{invalid:errors['address.number']}"><span v-if="errors['address.number']" class="field-error">{{ errors['address.number'] }}</span></label><label>Complemento<input v-model="address.complement" placeholder="Apto, bloco (opcional)"></label><label>Bairro <span class="required" aria-hidden="true">*</span><input v-model="address.district" placeholder="Seu bairro" :aria-invalid="Boolean(errors['address.district'])" :class="{invalid:errors['address.district']}"><span v-if="errors['address.district']" class="field-error">{{ errors['address.district'] }}</span></label><label>Cidade <span class="required" aria-hidden="true">*</span><input v-model="address.city" autocomplete="address-level2" placeholder="Sua cidade" :aria-invalid="Boolean(errors['address.city'])" :class="{invalid:errors['address.city']}"><span v-if="errors['address.city']" class="field-error">{{ errors['address.city'] }}</span></label><label>Estado <span class="required" aria-hidden="true">*</span><select v-model="address.state" autocomplete="address-level1" :aria-invalid="Boolean(errors['address.state'])" :class="{invalid:errors['address.state']}"><option value="" disabled>Selecione</option><option v-for="state in states" :key="state" :value="state">{{ state }}</option></select><span v-if="errors['address.state']" class="field-error">{{ errors['address.state'] }}</span></label></div>
            <div class="shipping-calculator">
              <label v-if="providers.length > 1">Transportadora<select v-model="provider"><option v-for="item in providers" :key="item.provider" :value="item.provider">{{ item.name }}</option></select></label>
              <button type="button" class="calculate-shipping" :disabled="shippingLoading || !provider || !cart.items.length" @click="calculateShipping">{{ shippingLoading ? 'Calculando...' : 'Calcular frete' }}</button>
            </div>
            <p v-if="providersError" class="field-error" role="alert">Não foi possível carregar as transportadoras. Recarregue a página para tentar novamente.</p>
            <p v-else-if="!providers.length" class="integration-note">Esta loja ainda não possui uma transportadora disponível para calcular a entrega.</p>
            <p v-if="shippingLoading" class="integration-note" role="status">Consultando preço e prazo de entrega...</p>
            <p v-if="shippingError" class="field-error" role="alert">{{ shippingError }}</p>
            <div class="delivery-options" aria-live="polite" aria-label="Opções de entrega" :aria-busy="shippingLoading">
              <button v-for="option in shippingOptions" :key="`${option.provider}:${option.serviceCode}`" type="button" :class="{selected:selectedDelivery?.serviceCode===option.serviceCode && selectedDelivery?.provider===option.provider}" :aria-pressed="selectedDelivery?.serviceCode===option.serviceCode && selectedDelivery?.provider===option.provider" @click="selectedDelivery=option; shippingError=''">
                <Truck :size="20"/><span><strong>{{ option.serviceName }}</strong><small>{{ option.deadlineText }}</small></span><em>{{ option.price === 0 ? 'Grátis' : money(option.price) }}</em>
              </button>
            </div>
          </section>

          <section v-else class="form-section">
            <div class="section-title"><span>03</span><div><h2>Revise seu pedido</h2><p>Confira seus dados e a entrega antes de confirmar.</p></div></div>
            <div class="order-review"><p><strong>{{ contact.firstName }} {{ contact.lastName }}</strong><br>{{ contact.email }}</p><p>{{ address.street }}, {{ address.number }}<br>{{ address.complement }} {{ address.district }}<br>{{ address.city }} / {{ address.state }} — {{ address.zipcode }}</p><p><strong>{{ selectedDelivery?.serviceName }}</strong><br>{{ selectedDelivery?.deadlineText }} — {{ money(selectedDelivery?.price || 0) }}</p></div>
          </section>
          <p v-if="submitError" class="field-error" role="alert">{{ submitError }}</p>
          <div class="checkout-actions"><button v-if="currentStep>1" type="button" class="back-step" :disabled="saving" @click="goBack"><ChevronLeft :size="16"/> Voltar</button><button type="submit" class="continue" :disabled="saving || shippingLoading || !cart.items.length">{{ saving ? 'Confirmando...' : currentStep===1 ? 'Continuar para entrega' : currentStep===2 ? 'Revisar pedido' : 'Confirmar pedido' }}</button></div>
          <p class="integration-note">Ao confirmar, seu pedido será enviado à loja. Nenhuma cobrança é realizada nesta etapa.</p>
        </form>
        <section v-else class="form-section" role="status"><div class="section-title"><PackageCheck :size="30"/><div><h2>Pedido {{ createdOrder.number }} recebido</h2><p>Seu pedido foi enviado à loja com a entrega selecionada.</p></div></div><p>Total: <strong>{{ money(createdOrder.total) }}</strong></p><NuxtLink to="/" class="back">Continuar comprando</NuxtLink></section>
      </div>

      <aside v-if="!createdOrder" class="summary">
        <span class="summary-label">Resumo</span><h2>Seu pedido</h2>
        <div v-for="entry in cartProducts" :key="entry.item.id" class="summary-product"><div class="summary-image"><img v-if="entry.product&&productImage(entry.product)" :src="productImage(entry.product)!" :alt="entry.item.name"><span v-else>{{ entry.item.name.charAt(0) }}</span></div><div><strong>{{ entry.item.name }}</strong><small>{{ entry.item.quantity }} {{ entry.item.quantity===1?'unidade':'unidades' }}</small></div><b>{{ money(entry.item.total) }}</b></div>
        <p v-if="!cartProducts.length" class="empty-summary">Seu carrinho está vazio. Adicione produtos antes de finalizar.</p>
        <dl><div><dt>Subtotal</dt><dd>{{ money(cart.totals.items_total) }}</dd></div><div v-if="cart.totals.discount"><dt>Desconto</dt><dd>− {{ money(cart.totals.discount) }}</dd></div><div><dt>Entrega</dt><dd>{{ selectedDelivery ? (selectedDelivery.price === 0 ? 'Grátis' : money(selectedDelivery.price)) : 'A calcular' }}</dd></div><div class="total"><dt>Total</dt><dd>{{ money(total) }}</dd></div></dl>
        <div class="summary-safe"><MapPin :size="18"/><p><strong>Entrega protegida</strong><span>Você acompanha cada etapa do pedido.</span></p></div>
      </aside>
    </main>
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}.checkout-shell{min-height:100dvh;background:#fff;color:#111827;font-family:"Aptos","Segoe UI",Arial,sans-serif}.checkout-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,430px);gap:clamp(40px,7vw,96px);max-width:1320px;margin:auto;padding:52px clamp(18px,4vw,56px) 104px}.checkout-main{min-width:0}.back{display:inline-flex;align-items:center;gap:6px;margin-bottom:34px;color:#6b7280;font-size:13px;font-weight:700;text-decoration:none}.back:hover{color:#2563eb}.title-row{display:flex;align-items:end;justify-content:space-between;gap:30px;margin-bottom:34px;padding:34px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 46px rgba(15,23,42,.06)}.title-row span,.summary-label{font:700 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#2563eb}.title-row h1{margin:8px 0 0;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:clamp(40px,5vw,68px);font-weight:850;line-height:.94;letter-spacing:-.05em;text-wrap:balance}.steps{display:flex;align-items:center}.steps i{display:grid;width:30px;height:30px;place-items:center;border:1px solid #d1d5db;border-radius:50%;background:#fff;font-size:10px;font-style:normal;font-weight:800}.steps i.done{border-color:#2563eb;background:#2563eb;color:#fff}.steps b{width:32px;height:1px;background:#d1d5db}.form-section{margin-top:16px;padding:28px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.04)}.section-title{display:grid;grid-template-columns:40px 1fr;gap:12px;margin-bottom:25px}.section-title>span{display:grid;width:30px;height:30px;place-items:center;border-radius:8px;background:#eff6ff;font:800 11px ui-monospace,monospace;color:#2563eb}.section-title h2{margin:0;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:26px;font-weight:800;letter-spacing:-.03em}.section-title p{margin:5px 0 0;color:#6b7280;font-size:13px}.field-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.field-grid label{display:grid;gap:8px;color:#374151;font-size:12px;font-weight:700}.field-grid .wide{grid-column:1/-1}.field-grid input,.field-grid select{width:100%;height:52px;padding:0 15px;border:1px solid #d1d5db;border-radius:10px;background:#fff;color:#111827;font:inherit;outline:none;transition:border-color .2s,box-shadow .2s}.field-grid input:focus,.field-grid select:focus{border-color:#2563eb;box-shadow:0 0 0 4px #dbeafe}.delivery-options{display:grid;gap:11px;margin-top:18px}.delivery-options button{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;width:100%;padding:18px;border:1px solid #e5e7eb;border-radius:13px;background:#fff;color:#111827;text-align:left;transition:border-color .2s,box-shadow .2s,transform .2s}.delivery-options button:hover{border-color:#bfdbfe;transform:translateY(-1px)}.delivery-options button.selected{border:2px solid #2563eb;padding:17px;box-shadow:0 16px 36px rgba(37,99,235,.12)}.delivery-options span{display:grid;gap:3px}.delivery-options small{color:#6b7280}.delivery-options em{font-size:12px;font-style:normal;font-weight:750}.muted{opacity:.72}.payment-preview{display:flex;gap:10px;margin-left:52px;padding:17px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;color:#64748b;font-size:13px}.continue{width:100%;height:58px;margin-top:18px;border:0;border-radius:12px;background:#111827;color:#fff;font-weight:800}.continue:disabled{cursor:not-allowed;opacity:.65}.integration-note{text-align:center;color:#6b7280;font-size:11px}.summary{align-self:start;position:sticky;top:100px;padding:32px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 28px 74px rgba(15,23,42,.09)}.summary h2{margin:8px 0 28px;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:32px;font-weight:850;letter-spacing:-.04em}.summary-product{display:grid;grid-template-columns:68px 1fr auto;align-items:center;gap:13px;padding:14px 0;border-bottom:1px solid #e5e7eb}.summary-image{display:grid;width:68px;height:78px;place-items:center;overflow:hidden;border-radius:12px;background:#f3f4f6;color:#2563eb;font-size:24px;font-weight:800}.summary-image img{width:100%;height:100%;object-fit:contain;padding:6px}.summary-product>div:nth-child(2){display:grid;gap:6px}.summary-product strong{font-size:13px;line-height:1.35}.summary-product small{color:#6b7280}.summary-product>b{font-size:13px;font-variant-numeric:tabular-nums}.empty-summary{padding:20px 0;border-block:1px solid #e5e7eb;color:#6b7280;font-size:13px;line-height:1.6}.summary dl{display:grid;gap:14px;margin:24px 0}.summary dl div{display:flex;justify-content:space-between;color:#6b7280;font-size:13px}.summary dl .total{padding-top:18px;border-top:1px solid #e5e7eb;color:#111827;font-size:19px;font-weight:850}.summary-safe{display:flex;gap:12px;padding:16px;border-radius:12px;background:#eff6ff;color:#2563eb}.summary-safe p{display:grid;gap:3px;margin:0}.summary-safe strong{font-size:12px}.summary-safe span{color:#64748b;font-size:11px}@media(max-width:900px){.checkout-layout{grid-template-columns:1fr}.summary{position:static;grid-row:1}.checkout-main{grid-row:2}}@media(max-width:560px){.checkout-layout{padding-top:28px}.title-row{display:grid;margin-bottom:24px;padding:24px 18px}.steps{display:none}.form-section{padding:22px 16px}.field-grid{grid-template-columns:1fr}.field-grid .wide{grid-column:auto}.payment-preview{margin-left:0}.summary{padding:22px}.summary-product{grid-template-columns:58px 1fr}.summary-image{width:58px;height:68px}.summary-product>b{grid-column:2}}
.payment-fields{display:grid;gap:14px;margin:16px 0 0 52px}.payment-fields label{display:grid;gap:8px;color:#374151;font-size:12px;font-weight:700}.payment-fields>div{display:grid;grid-template-columns:1fr 1fr;gap:14px}.payment-fields input{width:100%;height:48px;padding:0 14px;border:1px solid #d1d5db;border-radius:10px;background:#fff;color:#111827;font:inherit;outline:none}@media(max-width:560px){.payment-fields{margin-left:0}}
.test-success{margin:12px 0 0;text-align:center;color:#15803d;font-size:12px;font-weight:700}
.checkout-actions{display:flex;align-items:center;gap:12px;margin-top:18px}.checkout-actions .continue{margin-top:0;flex:1}.back-step{display:inline-flex;height:58px;align-items:center;gap:5px;padding:0 18px;border:1px solid #d1d5db;border-radius:9px;background:#fff;color:#374151;font:650 13px var(--sf-body);cursor:pointer}.back-step:hover{border-color:#2563eb;color:#2563eb}.steps i.active{border-color:#2563eb;background:#eff6ff;color:#2563eb}.steps i.done{display:grid;place-items:center}
.customer-note{margin:0 0 18px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;padding:12px 14px;color:#1e40af;font-size:13px;line-height:1.45}
.required{display:inline;color:#b91c1c}.field-grid label{display:block}.field-grid label>input,.field-grid label>select{display:block;margin-top:8px}.field-grid label>.field-error{display:block;margin-top:6px}.shipping-calculator{display:flex;align-items:end;gap:14px;margin-top:18px;flex-wrap:wrap}.shipping-calculator label{display:grid;gap:8px;font-size:12px;font-weight:700}.shipping-calculator select{min-height:48px;border:1px solid #d1d5db;border-radius:10px;padding:0 12px;background:#fff}.calculate-shipping{min-height:48px;padding:0 20px;border:1px solid #2563eb;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-weight:700;cursor:pointer}.calculate-shipping:disabled{opacity:.6;cursor:not-allowed}.field-error{color:#b91c1c;font-size:12px;line-height:1.5}.field-grid input.invalid,.field-grid select.invalid{border-color:#b91c1c}.order-review{font-size:14px;line-height:1.7;color:#374151}.delivery-options button:focus-visible,.calculate-shipping:focus-visible{outline:3px solid #2563eb;outline-offset:3px}
</style>
