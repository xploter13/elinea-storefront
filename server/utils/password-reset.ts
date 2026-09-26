import type { H3Event } from 'h3'

export async function forwardPasswordRequest(event: H3Event, action: 'forgot' | 'reset', body: Record<string, string>) {
  const config = useRuntimeConfig(event)
  try {
    return await $fetch(`${String(config.apiBase).replace(/\/$/, '')}/auth/password/${action}`, {
      method: 'POST',
      body,
    })
  } catch (error: any) {
    const statusCode = Number(error?.response?.status || error?.statusCode || 502)
    throw createError({
      statusCode,
      message: error?.data?.message || 'Não foi possível processar a solicitação.',
      data: error?.data?.errors,
    })
  }
}
