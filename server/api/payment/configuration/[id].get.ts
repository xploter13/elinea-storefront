export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 422, message: 'Opção de pagamento inválida.' })
  setResponseHeader(event, 'Cache-Control', 'no-store, max-age=0')
  try {
    return { data: await createServerElineaClient(event).payments.checkoutConfiguration(id) }
  } catch (error) { rethrowElineaError(error) }
})
