export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 400, message: 'Pedido inválido.' })
  try {
    return { data: await createServerElineaClient(event).orders.get(id) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
