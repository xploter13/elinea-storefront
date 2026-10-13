<script setup lang="ts">
import type { TokenizedPaymentCard } from '@elinea/sdk'
import { loadPaymentScript } from '~/utils/payment-script'

const props = defineProps<{ publicKey: string, amount: number, email?: string | null, busy: boolean, maxInstallments: number }>()
const emit = defineEmits<{ tokenized: [card: TokenizedPaymentCard, installments: number] }>()
const loading = ref(true)
const initializationError = ref(false)
const errorMessage = ref('')
let disposed = false
interface CardFormController { getCardFormData(): { token: string, paymentMethodId: string, issuerId?: string, installments: string, identificationType: string, identificationNumber: string }, unmount(): void }
let controller: CardFormController | undefined

function handleCardFormError(_error: unknown, stage?: string) {
  if (disposed) return
  loading.value = false
  if (stage === 'onFormMounted' || stage === 'onIframeLoad' || stage === 'onIdentificationTypesReceived') {
    initializationError.value = true
    errorMessage.value = 'Não foi possível carregar os campos seguros. Recarregue a página.'
    return
  }
  errorMessage.value = stage === 'onCardTokenReceived'
    ? 'Não foi possível validar o cartão. Confira os dados e tente novamente.'
    : 'Não foi possível consultar este cartão. Confira os dados e tente novamente.'
}

onMounted(async () => {
  try {
    await loadPaymentScript('https://sdk.mercadopago.com/js/v2')
    if (disposed) return
    const sdkWindow = window as unknown as { MercadoPago: new (key: string, options: { locale: string }) => { cardForm(options: object): CardFormController } }
    const mp = new sdkWindow.MercadoPago(props.publicKey, { locale: 'pt-BR' })
    controller = mp.cardForm({
      amount: props.amount.toFixed(2), iframe: true,
      form: {
        id: 'form-checkout',
        cardNumber: { id: 'form-checkout__cardNumber', placeholder: 'Número do cartão' },
        expirationDate: { id: 'form-checkout__expirationDate', placeholder: 'MM/AA' },
        securityCode: { id: 'form-checkout__securityCode', placeholder: 'CVV' },
        cardholderName: { id: 'form-checkout__cardholderName' },
        issuer: { id: 'form-checkout__issuer' }, installments: { id: 'form-checkout__installments' },
        identificationType: { id: 'form-checkout__identificationType' }, identificationNumber: { id: 'form-checkout__identificationNumber' },
        cardholderEmail: { id: 'form-checkout__cardholderEmail' },
      },
      callbacks: {
        onFormMounted: (error?: unknown) => {
          if (disposed) return
          if (error) handleCardFormError(error, 'onFormMounted')
        },
        onReady: () => { if (!disposed) loading.value = false },
        onSubmit: (event: Event) => {
          event.preventDefault()
          if (props.busy || loading.value || !controller) return
          errorMessage.value = ''
          const data = controller.getCardFormData()
          if (!data.token || !data.paymentMethodId || !data.identificationType || !data.identificationNumber) { errorMessage.value = 'Não foi possível validar os dados do titular. Confira o CPF e tente novamente.'; return }
          const selectedInstallments = Number.parseInt(data.installments, 10)
          const installments = Number.isSafeInteger(selectedInstallments) && selectedInstallments >= 1
            ? Math.min(selectedInstallments, props.maxInstallments)
            : 1
          emit('tokenized', { token: data.token, paymentMethodId: data.paymentMethodId, issuerId: data.issuerId, identificationType: data.identificationType, identificationNumber: data.identificationNumber.replace(/\D/g, '') }, installments)
        },
        onError: handleCardFormError,
      },
    })
  } catch {
    initializationError.value = true
    loading.value = false
    errorMessage.value = 'Não foi possível carregar o pagamento seguro. Recarregue a página.'
  }
})
onBeforeUnmount(() => { disposed = true; controller?.unmount() })
</script>

<template>
  <form id="form-checkout" data-mp-public-key-source="runtime-endpoint" data-mp-payer-identification-source="form" :data-mp-payer-email-source="email ? 'application' : 'form'" data-mp-identification-type="CPF">
    <p v-if="loading" role="status">Carregando os campos seguros do cartão...</p>
    <div data-mp-field="cardNumber" class="card-field" role="group" aria-labelledby="card-number-label"><label id="card-number-label">Número do cartão</label><div id="form-checkout__cardNumber" data-mp-secure-field="cardNumber" class="secure-input" aria-labelledby="card-number-label" /></div>
    <div class="card-row">
      <div data-mp-field="expirationDate" class="card-field" role="group" aria-labelledby="expiration-label"><label id="expiration-label">Validade (MM/AA)</label><div id="form-checkout__expirationDate" data-mp-secure-field="expirationDate" class="secure-input" aria-labelledby="expiration-label" /></div>
      <div data-mp-field="securityCode" class="card-field" role="group" aria-labelledby="security-code-label"><label id="security-code-label">Código de segurança</label><div id="form-checkout__securityCode" data-mp-secure-field="securityCode" class="secure-input" aria-labelledby="security-code-label" /></div>
    </div>
    <div data-mp-field="cardholderName" class="card-field"><label for="form-checkout__cardholderName">Nome impresso no cartão</label><input id="form-checkout__cardholderName" autocomplete="cc-name" required /></div>
    <div data-mp-field="identificationNumber" class="card-field"><label for="form-checkout__identificationNumber">CPF do titular</label><input id="form-checkout__identificationNumber" inputmode="numeric" autocomplete="off" required /></div>
    <div v-if="!email" data-mp-field="cardholderEmail" class="card-field"><label for="form-checkout__cardholderEmail">E-mail do comprador</label><input id="form-checkout__cardholderEmail" type="email" autocomplete="email" required /></div>
    <input v-else id="form-checkout__cardholderEmail" type="hidden" :value="email" />
    <select id="form-checkout__issuer" data-mp-sdk-required-field="issuer" hidden aria-hidden="true" tabindex="-1" />
    <select id="form-checkout__installments" data-mp-sdk-required-field="installments" hidden aria-hidden="true" tabindex="-1" />
    <select id="form-checkout__identificationType" data-mp-sdk-required-field="identificationType" hidden aria-hidden="true" tabindex="-1" />
    <p class="card-note">Pagamento à vista no cartão de crédito.</p>
    <p v-if="errorMessage" id="checkout-init-error" class="card-error" role="alert" aria-live="assertive">{{ errorMessage }}</p>
    <button type="submit" :disabled="busy || loading || initializationError">{{ busy ? 'Processando pagamento...' : 'Pagar com cartão' }}</button>
  </form>
</template>

<style scoped>
form{display:grid;gap:18px;margin-top:24px}.card-field{display:grid;gap:8px;min-width:0;font-size:13px}.card-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.secure-input{position:relative;height:48px;min-height:48px;border:1px solid #d1d5db;border-radius:8px;background:#fff;overflow:hidden}.secure-input:deep(iframe){display:block!important;width:100%!important;height:100%!important;min-height:48px!important;border:0}.secure-input:focus-within,input:focus-visible{outline:3px solid var(--sf-primary,#2563eb);outline-offset:3px}input{box-sizing:border-box;min-width:0;width:100%;min-height:48px;border:1px solid #d1d5db;border-radius:8px;padding:12px;font:inherit}button{min-height:52px;border:0;border-radius:10px;background:var(--sf-primary,#2563eb);color:white;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.6;cursor:wait}button:focus-visible{outline:3px solid var(--sf-primary,#2563eb);outline-offset:4px}.card-error{color:#b91c1c;font-size:13px}.card-note{color:#6b7280;font-size:13px}
</style>
