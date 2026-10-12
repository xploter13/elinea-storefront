export function paymentMethodsLabel(methods: string[]): string {
  const labels: Record<string, string> = { PIX: 'Pix', CREDIT_CARD: 'Cartão de crédito', DEBIT_CARD: 'Cartão de débito', BOLETO: 'Boleto' }
  return methods.map(method => labels[method] || method).join(' · ')
}

export function canResumePayment(billingStatus?: string | null, orderStatus?: string | null): boolean {
  if (billingStatus) return billingStatus === 'pending' || billingStatus === 'failed'

  return orderStatus === 'pending'
}

export function isValidCpf(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  for (let length = 9; length <= 10; length++) {
    const sum = [...digits.slice(0, length)].reduce((total, digit, index) => total + Number(digit) * (length + 1 - index), 0)
    const check = (sum * 10) % 11
    if (Number(digits[length]) !== (check === 10 ? 0 : check)) return false
  }
  return true
}

export function hostedPaymentUrl(value: string | null): string {
  if (!value) throw new Error('O provedor não retornou o endereço de pagamento. Tente novamente.')
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('O endereço de pagamento retornado é inválido.')
  return url.href
}

export const transparentPaymentTypes = [
  { code: 'CREDIT_CARD', slug: 'cartao', label: 'Cartão de crédito' },
  { code: 'DEBIT_CARD', slug: 'debito', label: 'Cartão de débito' },
  { code: 'PIX', slug: 'pix', label: 'Pix' },
  { code: 'BOLETO', slug: 'boleto', label: 'Boleto' },
] as const

export function transparentCheckoutDestination(orderId: number, method: { id: number, methods: string[] }) {
  const type = transparentPaymentTypes.find(type => method.methods.includes(type.code))
  if (!Number.isSafeInteger(orderId) || orderId < 1 || !Number.isSafeInteger(method.id) || method.id < 1 || !type) {
    throw new Error('Esta opção não possui uma forma de pagamento disponível.')
  }
  return { path: `/pagamento/checkout/${orderId}/${type.slug}`, query: { metodo: method.id } }
}

export function newPaymentAttemptKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 15) | 64
  bytes[8] = (bytes[8]! & 63) | 128
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
