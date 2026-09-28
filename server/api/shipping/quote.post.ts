import type { ShippingQuoteInput } from '@elinea/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody<ShippingQuoteInput>(event)
  if (!body || !Array.isArray(body.items)) {
    throw createError({ statusCode: 422, statusMessage: 'Informe os produtos para calcular o frete.' })
  }

  try {
    return { data: await createServerElineaClient(event).checkout.calculateShipping(body) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
