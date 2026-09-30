import type { Cart, CheckoutInput, ShippingOption } from '@elinea/sdk'
import { selectShippingOption } from '../../shared/utils/checkout-shipping'

export default defineEventHandler(async (event) => {
  const body = await readBody<CheckoutInput & { shippingServiceCode: string }>(event)
  if (!body?.customer || !body.shippingAddress || typeof body.shippingAddress.zipcode !== 'string' ||
      !/^\d{8}$/.test(body.shippingAddress.zipcode.replace(/\D/g, '')) ||
      typeof body.shippingProvider !== 'string' || typeof body.shippingServiceCode !== 'string' || typeof body.shippingTotal !== 'number') {
    throw createError({ statusCode: 422, message: 'Informe os dados do pedido e selecione uma entrega.' })
  }
  persistCartSession(event)
  try {
    const client = createServerElineaClient(event)
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
