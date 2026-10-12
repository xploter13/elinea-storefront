export default defineEventHandler(async (event) => {
  const orderId = Number(getRouterParam(event, 'orderId'))
  const paymentId = getRouterParam(event, 'paymentId') || ''
  if (!Number.isSafeInteger(orderId) || orderId < 1 || !/^[a-zA-Z0-9_-]{1,100}$/.test(paymentId)) throw createError({ statusCode: 422, message: 'Pagamento inválido.' })
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')
  try {
    return { data: await createServerElineaClient(event).payments.getTransparent(orderId, paymentId) }
  } catch (error) { rethrowElineaError(error) }
})
