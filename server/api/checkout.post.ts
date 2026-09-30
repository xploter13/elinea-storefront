import type { Cart, CheckoutInput, ShippingOption, PaymentMethod } from '@elinea/sdk'
import { isValidCpf } from '../../shared/utils/checkout-payment'
import { selectShippingOption } from '../../shared/utils/checkout-shipping'

export default defineEventHandler(async (event) => {
  const body = await readBody<CheckoutInput & { shippingServiceCode: string, paymentMethodId?: number }>(event)
  if (!body?.customer || !body.shippingAddress || typeof body.shippingAddress.zipcode !== 'string' ||
      !/^\d{8}$/.test(body.shippingAddress.zipcode.replace(/\D/g, '')) ||
      typeof body.shippingProvider !== 'string' || typeof body.shippingServiceCode !== 'string' || typeof body.shippingTotal !== 'number') {
    throw createError({ statusCode: 422, message: 'Informe os dados do pedido e selecione uma entrega.' })
  }
  persistCartSession(event)
  try {
    const client = createServerElineaClient(event)
    const paymentMethods: PaymentMethod[] = await client.payments.methods()
    if (paymentMethods.length) {
      if (!paymentMethods.some(method => method.id === body.paymentMethodId)) throw createError({ statusCode: 422, message: 'Selecione uma opção de pagamento disponível.' })
      if (!isValidCpf(body.customer.document || '') || !/^\d{10,11}$/.test((body.customer.phone || '').replace(/\D/g, ''))) {
        throw createError({ statusCode: 422, message: 'Informe CPF válido e telefone com DDD para o pagamento.' })
      }
      await client.customer.getProfile()
    }
    const cart: Cart = await client.cart.get()
    if (!cart.items.length) throw createError({ statusCode: 422, message: 'Seu carrinho está vazio.' })
    const options: ShippingOption[] = await client.checkout.calculateShipping({
      provider: body.shippingProvider,
      zipcode: body.shippingAddress.zipcode,
      items: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
    })
    let selected: ShippingOption
    try {
      selected = selectShippingOption(options, body.shippingProvider, body.shippingServiceCode, body.shippingTotal) as ShippingOption
    } catch (error) {
      throw createError({ statusCode: 422, message: (error as Error).message })
    }
    return { data: await client.checkout.createOrder({
      customer: body.customer,
      shippingAddress: body.shippingAddress,
      shippingProvider: selected.provider,
      shippingTotal: selected.price,
      notes: [
        `Entrega: ${selected.provider} / ${selected.serviceName} (${selected.serviceCode}) — ${selected.deadlineText}`,
        body.shippingAddress.district ? `Bairro: ${body.shippingAddress.district}` : '',
        body.shippingAddress.complement ? `Complemento: ${body.shippingAddress.complement}` : '',
      ].filter(Boolean).join('\n'),
    }) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
