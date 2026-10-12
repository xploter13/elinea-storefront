const scripts = new Map<string, Promise<void>>()

export function loadPaymentScript(src: 'https://sdk.mercadopago.com/js/v2' | 'https://assets.pagseguro.com.br/checkout-sdk-js/rc/dist/browser/pagseguro.min.js'): Promise<void> {
  const pending = scripts.get(src)
  if (pending) return pending
  const request = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    const timeout = setTimeout(() => { script.remove(); scripts.delete(src); reject(new Error('Não foi possível carregar o pagamento seguro. Recarregue a página.')) }, 15000)
    script.src = src
    script.async = true
    script.onload = () => { clearTimeout(timeout); resolve() }
    script.onerror = () => { clearTimeout(timeout); script.remove(); scripts.delete(src); reject(new Error('Não foi possível carregar o pagamento seguro. Recarregue a página.')) }
    document.head.appendChild(script)
  })
  scripts.set(src, request)
  return request
}
