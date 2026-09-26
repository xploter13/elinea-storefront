import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(getQuery(event).page || 1)
    if (!Number.isInteger(page) || page < 1) throw createError({ statusCode: 400, statusMessage: 'Página inválida' })
    return await createServerElineaClient(event).orders.list({ page, perPage: 10 })
  } catch (error) {
    rethrowElineaError(error)
  }
})
