import type { CustomerAddressInput } from '@elinea/sdk'
import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Endereço inválido' })
    const body = await readBody<CustomerAddressInput>(event)
    return { data: await createServerElineaClient(event).customer.addresses.update(id, body) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
