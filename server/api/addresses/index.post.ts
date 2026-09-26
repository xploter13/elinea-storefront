import type { CustomerAddressInput } from '@elinea/sdk'
import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<CustomerAddressInput>(event)
    return { data: await createServerElineaClient(event).customer.addresses.create(body) }
  } catch (error) {
    rethrowElineaError(error)
  }
})
