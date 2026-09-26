import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ name?: string, email?: string, phone?: string | null, cpf?: string | null }>(event)
    const customer = await createServerElineaClient(event).customer.updateProfile({
      name: String(body?.name || '').trim(),
      email: String(body?.email || '').trim(),
      phone: body?.phone ?? null,
      cpf: body?.cpf ?? null,
    })

    return { customer }
  } catch (error) {
    rethrowElineaError(error)
  }
})
