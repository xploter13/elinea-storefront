import type { RegisterInput } from '@elinea/sdk'
import { createServerElineaClient, rethrowElineaError } from '../../utils/elinea'

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<RegisterInput>>(event)
  const name = body?.name?.trim()
  const email = body?.email?.trim()
  const password = body?.password

  if (!name || !email || !password) {
    throw createError({ statusCode: 422, message: 'Nome, e-mail e senha são obrigatórios.' })
  }

  try {
    const session = await createServerElineaClient(event).customer.register({
      name,
      email,
      password,
      ...(body?.phone?.trim() ? { phone: body.phone.trim() } : {}),
    })
    setCookie(event, 'elinea_customer_token', session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: !import.meta.dev,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    setResponseStatus(event, 201)
    return { customer: session.customer }
  } catch (error) {
    rethrowElineaError(error)
  }
})
