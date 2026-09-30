import type { PaymentMethod, Order } from '@elinea/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ orderId: number, paymentMethodId: number, idempotencyKey: string }>(event)
  if (!body || !Number.isSafeInteger(body.orderId) || body.orderId < 1 || !Number.isSafeInteger(body.paymentMethodId) || body.paymentMethodId < 1 ||
      typeof body.idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey)) {
    throw createError({ statusCode: 422, message: 'Selecione uma opção de pagamento válida.' })
  }
  try {
    const client = createServerElineaClient(event)
    const order: Order = await client.orders.get(body.orderId)
    if (order.billingStatus === 'paid') throw createError({ statusCode: 422, message: 'Este pedido já está pago.' })
    const methods: PaymentMethod[] = await client.payments.methods()
    if (!methods.some(method => method.id === body.paymentMethodId)) {
      throw createError({ statusCode: 422, message: 'Esta opção de pagamento não está mais disponível.' })
    }
    const config = useRuntimeConfig(event)
    const requestUrl = getRequestURL(event, { xForwardedHost: Boolean(config.trustProxyHeaders), xForwardedProto: Boolean(config.trustProxyHeaders) })
    const returnUrl = new URL(`/pagamento/${order.id}?retorno=1`, requestUrl.origin).href
    return { data: await client.payments.createHosted(order.id, { paymentMethodId: body.paymentMethodId, returnUrl, idempotencyKey: body.idempotencyKey }) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
