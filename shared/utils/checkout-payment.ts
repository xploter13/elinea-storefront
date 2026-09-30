export function paymentMethodsLabel(methods: string[]): string {
  const labels: Record<string, string> = { PIX: 'Pix', CREDIT_CARD: 'Cartão de crédito', DEBIT_CARD: 'Cartão de débito', BOLETO: 'Boleto' }
  return methods.map(method => labels[method] || method).join(' · ')
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
