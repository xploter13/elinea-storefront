import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    return { data: await createServerElineaClient(event).customer.addresses.list() }
  } catch (error) {
    rethrowElineaError(error)
  }
})
