import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Endereço inválido' })
    await createServerElineaClient(event).customer.addresses.remove(id)
    return { success: true }
  } catch (error) {
    rethrowElineaError(error)
  }
})
