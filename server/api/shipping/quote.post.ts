import type { Cart, ShippingQuoteInput } from '@elinea/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody<Pick<ShippingQuoteInput, 'zipcode' | 'provider'> & { items?: ShippingQuoteInput['items'] }>(event)
  if (!body || typeof body.zipcode !== 'string' || !/^\d{8}$/.test(body.zipcode.replace(/\D/g, '')) || typeof body.provider !== 'string') {
    throw createError({ statusCode: 422, message: 'Informe um CEP válido e selecione a transportadora.' })
  }
  persistCartSession(event)
  try {
    const client = createServerElineaClient(event)
    let items = body.items
    if (items !== undefined && (!Array.isArray(items) || !items.length || items.some(item => !Number.isInteger(item?.productId) || !Number.isInteger(item?.quantity) || item.quantity < 1))) {
      throw createError({ statusCode: 422, message: 'Informe produtos e quantidades válidos.' })
    }
    if (items === undefined) {
      const cart: Cart = await client.cart.get()
      items = cart.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
    }
    if (!items.length) throw createError({ statusCode: 422, message: 'Adicione produtos ao carrinho antes de calcular o frete.' })
    return { data: await client.checkout.calculateShipping({ provider: body.provider, zipcode: body.zipcode, items }) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
