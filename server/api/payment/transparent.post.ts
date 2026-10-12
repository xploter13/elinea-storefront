import type { TransparentPaymentInput } from '@elinea/sdk'

export default defineEventHandler(async (event) => {
  const body = await readBody<TransparentPaymentInput & { orderId: number }>(event)
  if (!body || !Number.isSafeInteger(body.orderId) || body.orderId < 1 || !Number.isSafeInteger(body.paymentMethodId) || body.paymentMethodId < 1 ||
      typeof body.idempotencyKey !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.idempotencyKey) ||
      !['PIX', 'BOLETO', 'CREDIT_CARD'].includes(body.type) || Object.keys(body).some(key => !['orderId', 'paymentMethodId', 'idempotencyKey', 'type', 'card', 'installments', 'billingAddress'].includes(key))) {
    throw createError({ statusCode: 422, message: 'Informe uma tentativa de pagamento válida.' })
  }
  if (body.type === 'CREDIT_CARD' && (!body.card || typeof body.card !== 'object' || Array.isArray(body.card) ||
      Object.keys(body.card).some(key => !['token', 'paymentMethodId', 'encrypted', 'holderName'].includes(key)))) {
    throw createError({ statusCode: 422, message: 'Informe apenas o cartão tokenizado pelo provedor.' })
  }
  if (body.type === 'BOLETO' && (!body.billingAddress || typeof body.billingAddress !== 'object' || Array.isArray(body.billingAddress))) {
    throw createError({ statusCode: 422, message: 'Informe o endereço de cobrança.' })
  }
  try {
    return { data: await createServerElineaClient(event).payments.createTransparent(body.orderId, body) }
  } catch (error) { rethrowElineaError(error) }
})
