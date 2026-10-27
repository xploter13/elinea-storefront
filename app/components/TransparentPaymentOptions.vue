<script setup lang="ts">
import { ArrowLeft, Check, Copy, CreditCard, QrCode, ReceiptText, ShieldCheck } from '@lucide/vue'
import type { AddressInput, PaymentMethod, TokenizedPaymentCard, TransparentCheckoutConfiguration, TransparentPayment, TransparentPaymentInput } from '@elinea/sdk'
import { hostedPaymentUrl, newPaymentAttemptKey, transparentPaymentTypes } from '#shared/utils/checkout-payment'
import { loadPaymentScript } from '~/utils/payment-script'
import MercadoPagoCardForm from './MercadoPagoCardForm.vue'

const props = defineProps<{ orderId: number, method: PaymentMethod, total: string, amount: number, siteSlug: string, email?: string | null, shippingAddress?: AddressInput | null }>()
const emit = defineEmits<{ updated: [] }>()
const route = useRoute()
const configuration = ref<TransparentCheckoutConfiguration | null>(null)
const loading = ref(true)
const paying = ref(false)
const preparingCard = ref(false)
const refreshing = ref(false)
const errorMessage = ref('')
const result = ref<TransparentPayment | null>(null)
const copied = ref(false)
const selectedType = computed(() => transparentPaymentTypes.find(type => type.slug === route.params.tipo))
const options = computed(() => transparentPaymentTypes.filter(type => configuration.value?.methods.includes(type.code as 'PIX' | 'BOLETO' | 'CREDIT_CARD')))
const selected = computed(() => options.value.find(type => type.slug === route.params.tipo))
const icons = { CREDIT_CARD: CreditCard, DEBIT_CARD: CreditCard, PIX: QrCode, BOLETO: ReceiptText }
const failed = computed(() => result.value && ['declined', 'cancelled', 'timeout'].includes(result.value.status))
const attempts = useCookie<Record<string, { key: string, id?: string }>>(`elinea_transparent_${props.siteSlug}_${props.orderId}_${props.method.id}`, { default: () => ({}), sameSite: 'lax', path: '/', maxAge: 86400 })
const attemptType = String(route.params.tipo)
const card = reactive({ number: '', holder: '', expiration: '', securityCode: '' })
const installments = ref(1)
const billingAddress = reactive({ street: props.shippingAddress?.street || '', number: props.shippingAddress?.number || '', district: props.shippingAddress?.district || '', city: props.shippingAddress?.city || '', state: props.shippingAddress?.state || '', zipcode: props.shippingAddress?.zipcode || '' })
let pendingInput: TransparentPaymentInput | null = null
let disposed = false

function safeUrl(value?: string | null) {
  try { return hostedPaymentUrl(value || null) } catch { return null }
}
const pixImage = computed(() => result.value?.pix?.qrCodeBase64 ? `data:image/png;base64,${result.value.pix.qrCodeBase64}` : safeUrl(result.value?.pix?.imageUrl))
const boletoUrl = computed(() => safeUrl(result.value?.boleto?.url))
const copyValue = computed(() => result.value?.pix?.code || result.value?.boleto?.barcode || '')

onMounted(async () => {
  try {
    configuration.value = (await $fetch<{ data: TransparentCheckoutConfiguration }>(`/api/payment/configuration/${props.method.id}`, { cache: 'no-store' })).data
    if (attempts.value[attemptType]?.id) await refreshPayment()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || 'Não foi possível carregar o pagamento. Recarregue a página.'
  } finally { loading.value = false }
})
onBeforeUnmount(() => { disposed = true; pendingInput = null; card.number = ''; card.securityCode = '' })

async function submitPayment(input?: { card: TokenizedPaymentCard, installments: number }) {
  if (paying.value || !selected.value || selected.value.code === 'DEBIT_CARD' || result.value) return
  const type = selected.value.code
  if (!attempts.value[attemptType]) attempts.value = { ...attempts.value, [attemptType]: { key: newPaymentAttemptKey() } }
  if (!pendingInput) {
    const common = { paymentMethodId: props.method.id, idempotencyKey: attempts.value[attemptType]!.key }
    pendingInput = type === 'CREDIT_CARD' && input ? { ...common, type, card: input.card, installments: input.installments }
      : type === 'BOLETO' ? { ...common, type, billingAddress: { ...billingAddress, zipcode: billingAddress.zipcode.replace(/\D/g, ''), state: billingAddress.state.toUpperCase() } }
      : type === 'PIX' ? { ...common, type } : null
  }
  if (!pendingInput) return
  paying.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<{ data: TransparentPayment }>('/api/payment/transparent', { method: 'POST', body: { orderId: props.orderId, ...pendingInput } })
    if (disposed) return
    result.value = response.data
    attempts.value = { ...attempts.value, [attemptType]: { ...attempts.value[attemptType]!, id: response.data.id } }
    pendingInput = null
    if (response.data.status === 'paid') emit('updated')
  } catch (error: any) {
    if (disposed) return
    errorMessage.value = error?.data?.message || error?.data?.statusMessage || 'Não foi possível confirmar o pagamento. Tente novamente com a mesma tentativa.'
    if (error?.statusCode === 422) { pendingInput = null; attempts.value = { ...attempts.value, [attemptType]: { key: newPaymentAttemptKey() } } }
  } finally { if (!disposed) paying.value = false }
}

async function payPagBank() {
  if (paying.value || preparingCard.value) return
  preparingCard.value = true
  errorMessage.value = ''
  try {
    await loadPaymentScript('https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js')
    if (disposed) return
    const sdk = (window as unknown as { PagSeguro: { encryptCard(data: object): { encryptedCard: string, hasErrors: boolean } } }).PagSeguro
    const [month, year] = card.expiration.split('/')
    const encrypted = sdk.encryptCard({ publicKey: configuration.value?.publicKey, holder: card.holder, number: card.number.replace(/\D/g, ''), expMonth: month?.trim(), expYear: year?.trim().length === 2 ? `20${year.trim()}` : year?.trim(), securityCode: card.securityCode })
    if (encrypted.hasErrors || !encrypted.encryptedCard) { errorMessage.value = 'Confira o número, a validade e o código de segurança do cartão.'; return }
    card.number = ''; card.securityCode = ''; card.expiration = ''
    await submitPayment({ card: { encrypted: encrypted.encryptedCard, holderName: card.holder }, installments: installments.value })
  } catch { errorMessage.value = 'Não foi possível preparar o cartão. Confira os dados e tente novamente.' }
  finally { preparingCard.value = false }
}

async function refreshPayment() {
  const id = attempts.value[attemptType]?.id
  if (!id || refreshing.value) return
  refreshing.value = true
  errorMessage.value = ''
  try {
    const response = await $fetch<{ data: TransparentPayment }>(`/api/payment/transparent/${props.orderId}/${encodeURIComponent(id)}`, { cache: 'no-store' })
    if (disposed) return
    result.value = response.data
    if (response.data.status === 'paid') emit('updated')
  } catch (error: any) { errorMessage.value = error?.data?.message || error?.data?.statusMessage || 'Não foi possível atualizar o pagamento. Tente novamente.' }
  finally { refreshing.value = false }
}

async function copyCode() {
  try { await navigator.clipboard.writeText(copyValue.value); copied.value = true }
  catch { errorMessage.value = 'Selecione e copie o código abaixo para pagar no aplicativo do banco.' }
}
function retryPayment() {
  result.value = null
  pendingInput = null
  attempts.value = { ...attempts.value, [attemptType]: { key: newPaymentAttemptKey() } }
  errorMessage.value = ''
}
</script>

<template>
  <section class="transparent-payment" aria-labelledby="payment-type-heading">
    <NuxtLink class="change-provider" :to="{ path: `/pagamento/${orderId}`, query: { metodo: method.id } }"><ArrowLeft :size="16" aria-hidden="true" /> Trocar opção de pagamento</NuxtLink>
    <p v-if="loading" role="status">Carregando as formas de pagamento...</p>
    <template v-else>
      <nav class="payment-types" aria-label="Forma de pagamento"><NuxtLink v-for="option in options" :key="option.code" :to="{ path: `/pagamento/checkout/${orderId}/${option.slug}`, query: { metodo: method.id } }" :aria-current="selected?.code === option.code ? 'page' : undefined" :class="{ active: selected?.code === option.code }" @click="paying && $event.preventDefault()"><component :is="icons[option.code]" :size="22" aria-hidden="true" /><span>{{ option.label }}</span></NuxtLink></nav>
      <div class="type-heading"><h2 id="payment-type-heading">{{ selectedType?.label }}</h2><span>{{ method.name }}</span></div>
      <div class="amount"><span>Valor do pedido</span><strong>{{ total }}</strong></div>
      <template v-if="result">
        <div v-if="result.status === 'paid'" class="payment-confirmed" role="status"><Check :size="24" aria-hidden="true" /> Pagamento confirmado. Seu pedido está em andamento.</div>
        <p v-else-if="failed" class="payment-error" role="alert">O pagamento não foi concluído. Você pode tentar novamente.</p>
        <p v-else-if="['on_hold', 'authorized'].includes(result.status)" role="status">Seu pagamento está em análise. Aguarde a confirmação antes de tentar novamente.</p>
        <template v-else-if="result.type === 'PIX'">
          <h3>Escaneie o código QR no aplicativo do banco</h3>
          <img v-if="pixImage" class="pix-code" :src="pixImage" alt="código QR para pagar seu pedido com Pix" width="224" height="224" />
          <p>{{ result.pix?.code ? 'Ou copie o código Pix abaixo. Confira o valor e o destinatário antes de pagar.' : 'O provedor está preparando seu código Pix. Atualize o pagamento em alguns instantes.' }}</p>
          <p v-if="result.pix?.expiresAt" class="method-help">Válido até {{ new Date(result.pix.expiresAt).toLocaleString('pt-BR') }}.</p>
        </template>
        <template v-else-if="result.type === 'BOLETO'">
          <h3>Seu boleto está pronto</h3>
          <p>Pague pelo aplicativo do banco ou em uma agência ou lotérica. A confirmação depende da compensação bancária.</p>
          <p v-if="result.boleto?.dueDate" class="method-help">Vencimento: {{ result.boleto.dueDate.slice(0, 10).split('-').reverse().join('/') }}.</p>
          <a v-if="boletoUrl" class="download-boleto" :href="boletoUrl" target="_blank" rel="noopener noreferrer">Abrir boleto para impressão</a>
          <p v-else>O provedor está preparando seu boleto. Atualize o pagamento em alguns instantes.</p>
        </template>
        <p v-else role="status">Aguardando a confirmação do pagamento.</p>
        <div v-if="copyValue && !failed && result.status === 'pending'" class="copy-payment"><label for="payment-code">{{ result.type === 'PIX' ? 'Pix Copia e Cola' : 'Linha digitável' }}</label><textarea id="payment-code" :value="copyValue" readonly rows="3" /><button type="button" @click="copyCode"><Copy :size="18" aria-hidden="true" />{{ copied ? 'Código copiado' : 'Copiar código' }}</button><span v-if="copied" role="status" class="method-help">Código copiado.</span></div>
        <button v-if="failed" class="continue-payment" type="button" @click="retryPayment">Tentar novamente</button>
        <button v-else-if="result.status !== 'paid'" class="continue-payment" type="button" :disabled="refreshing" @click="refreshPayment">{{ refreshing ? 'Atualizando...' : 'Atualizar pagamento' }}</button>
      </template>
      <template v-else-if="selected && !attempts[attemptType]?.id">
        <div v-if="pendingInput && errorMessage" class="alert alert-warning alert-soft payment-retry" role="alert">
          <div><strong>Não conseguimos confirmar o pagamento</strong><p>Sua tentativa foi preservada. Verifique novamente para consultar o provedor sem iniciar outra cobrança.</p><small>{{ errorMessage }}</small></div>
          <button class="btn" type="button" :disabled="paying" @click="submitPayment()">{{ paying ? 'Verificando...' : 'Verificar pagamento' }}</button>
        </div>
        <template v-else-if="selected.code === 'CREDIT_CARD' && configuration?.publicKey">
          <MercadoPagoCardForm v-if="configuration.provider === 'mercado_pago'" :public-key="configuration.publicKey" :amount="amount" :email="email" :busy="paying" :max-installments="configuration.maxInstallments" @tokenized="(card, installments) => submitPayment({ card, installments })" />
          <form v-else class="card-fields" @submit.prevent="payPagBank">
            <label class="full">Número do cartão<input v-model="card.number" inputmode="numeric" autocomplete="cc-number" maxlength="23" required /></label>
            <label class="full">Nome impresso no cartão<input v-model="card.holder" autocomplete="cc-name" maxlength="255" required /></label>
            <label>Validade<input v-model="card.expiration" placeholder="MM/AA" autocomplete="cc-exp" maxlength="7" required /></label>
            <label>Código de segurança<input v-model="card.securityCode" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" required /></label>
            <label class="full">Parcelas<select v-model="installments"><option v-for="count in configuration.maxInstallments" :key="count" :value="count">{{ count === 1 ? 'À vista' : `${count} parcelas` }}</option></select></label>
            <button class="continue-payment full" type="submit" :disabled="paying || preparingCard">{{ paying || preparingCard ? 'Processando pagamento...' : 'Pagar com cartão' }}</button>
          </form>
        </template>
        <p v-else-if="selected.code === 'CREDIT_CARD'" class="availability" role="status">O pagamento com cartão está temporariamente indisponível nesta loja. Escolha outra forma de pagamento ou entre em contato com a loja.</p>
        <form v-else-if="selected.code === 'BOLETO'" class="card-fields" @submit.prevent="submitPayment()">
          <p class="method-help full">Confirme seu endereço de cobrança para emitir o boleto.</p>
          <label class="full">Rua<input v-model="billingAddress.street" autocomplete="billing address-line1" required /></label>
          <label>Número<input v-model="billingAddress.number" required /></label><label>CEP<input v-model="billingAddress.zipcode" inputmode="numeric" autocomplete="billing postal-code" required /></label>
          <label class="full">Bairro<input v-model="billingAddress.district" required /></label><label>Cidade<input v-model="billingAddress.city" autocomplete="billing address-level2" required /></label><label>Estado (UF)<input v-model="billingAddress.state" maxlength="2" autocomplete="billing address-level1" required /></label>
          <button class="continue-payment full" type="submit" :disabled="paying">{{ paying ? 'Gerando boleto...' : 'Gerar boleto' }}</button>
        </form>
        <div v-else-if="selected.code === 'PIX'" class="method-instructions"><QrCode :size="38" aria-hidden="true" /><h3>Pague com Pix</h3><p>Gere o código QR ou o código Pix Copia e Cola e pague pelo aplicativo do seu banco.</p><button class="continue-payment" type="button" :disabled="paying" @click="submitPayment()">{{ paying ? 'Gerando Pix...' : 'Gerar código Pix' }}</button></div>
      </template>
      <button v-else-if="attempts[attemptType]?.id" class="continue-payment" type="button" :disabled="refreshing" @click="refreshPayment">{{ refreshing ? 'Atualizando...' : 'Consultar pagamento existente' }}</button>
      <p v-else class="availability" role="status">Esta forma de pagamento não está disponível. Escolha uma das formas acima ou troque a opção de pagamento.</p>
    </template>
    <div v-if="errorMessage && !pendingInput" class="alert alert-error alert-soft payment-error" role="alert">{{ errorMessage }}</div>
    <p class="secure-note"><ShieldCheck :size="18" aria-hidden="true" /> Seus dados de cartão são protegidos pelo provedor de pagamento.</p>
  </section>
</template>

<style scoped>
.transparent-payment{border:1px solid #e5e7eb;border-radius:16px;padding:24px}.change-provider{display:inline-flex;align-items:center;gap:8px;min-height:44px;color:#4b5563;font-size:14px;text-decoration:none}.payment-types{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0 28px}.payment-types a{display:flex;flex:1 1 120px;align-items:center;justify-content:center;gap:8px;min-height:56px;padding:12px;border:1px solid #d1d5db;border-radius:10px;color:#374151;font-size:14px;font-weight:600;text-decoration:none}.payment-types a.active{border-color:var(--sf-primary,#2563eb);box-shadow:inset 0 0 0 1px var(--sf-primary,#2563eb)}.type-heading{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px}.type-heading h2{font-size:24px;letter-spacing:-.03em;margin:0}.type-heading>span{font-size:14px;color:#6b7280}.availability{margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;color:#475569;font-size:14px;line-height:1.6}.card-fields{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0 12px;padding:0;border:0;min-width:0}.card-fields label{display:grid;gap:8px;font-size:14px;color:#4b5563;min-width:0}.full{grid-column:1/-1}.card-fields input,.card-fields select,.copy-payment textarea{box-sizing:border-box;width:100%;min-width:0;min-height:48px;padding:12px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111827;font:inherit}.method-help,.method-instructions p{font-size:14px;line-height:1.6;color:#6b7280}.method-instructions{padding:8px 0}.method-instructions h3{font-size:18px;line-height:1.4}.amount{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 0;margin-top:16px;border-top:1px solid #e5e7eb;font-size:14px;color:#4b5563}.amount strong{font-size:24px;color:#111827}.continue-payment,.copy-payment button,.download-boleto{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;padding:12px 16px;border:0;border-radius:10px;background:var(--sf-primary,#2563eb);color:white;font:inherit;font-weight:700;cursor:pointer;box-sizing:border-box;text-decoration:none}.continue-payment:disabled{opacity:.6;cursor:wait}.secure-note{display:flex;align-items:start;justify-content:center;gap:8px;color:#6b7280;font-size:14px;line-height:1.6}.secure-note svg{flex-shrink:0}.payment-error{font-size:14px;line-height:1.6}.payment-retry{margin:20px 0;align-items:center}.payment-retry div{display:grid;gap:4px}.payment-retry p,.payment-retry small{margin:0;line-height:1.5}.payment-retry .btn{white-space:nowrap}.payment-confirmed{display:flex;align-items:center;gap:12px;padding:18px;background:#f0fdf4;color:#166534;border-radius:10px}.pix-code{display:block;max-width:100%;margin:20px auto;object-fit:contain}.copy-payment{display:grid;gap:12px;margin:20px 0}.copy-payment label{font-size:14px;font-weight:600}.copy-payment textarea{resize:vertical;font-size:14px}.copy-payment button{background:#f8fafc;color:#374151;border:1px solid #d1d5db}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--sf-primary,#2563eb);outline-offset:4px}@media(max-width:640px){.payment-retry{align-items:stretch}.payment-retry .btn{width:100%}}@media(max-width:480px){.transparent-payment{padding:20px}.payment-types a{flex-basis:100px;font-size:14px}.card-fields{grid-template-columns:1fr}}
</style>
