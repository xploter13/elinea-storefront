import { createElineaClient, ElineaError } from '@elinea/sdk'
import type { H3Event } from 'h3'

export async function forwardPasswordRequest(event: H3Event, action: 'forgot' | 'reset', body: Record<string, string>) {
  const config = useRuntimeConfig(event)
  const client = createElineaClient({ baseUrl: String(config.apiBase) })
  try {
    return action === 'forgot'
      ? await client.customer.requestPasswordReset(body.email || '')
      : await client.customer.resetPassword({ email: body.email || '', token: body.token || '', password: body.password || '', password_confirmation: body.password_confirmation || '' })
  } catch (error: unknown) {
    const details = error instanceof ElineaError ? error.details as { errors?: Record<string, string[]> } | null : null
    throw createError({
      statusCode: error instanceof ElineaError ? error.status || 502 : 502,
      message: error instanceof ElineaError && error.status ? error.message : 'Não foi possível processar a solicitação.',
      data: details?.errors,
    })
  }
}
