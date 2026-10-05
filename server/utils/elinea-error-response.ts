import { AuthenticationError, NotFoundError, RateLimitError, ValidationError, type ElineaError } from '@elinea/sdk'

export function rateLimitMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds || retryAfterSeconds < 1) return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'
  return `Muitas tentativas em pouco tempo. Tente novamente em ${retryAfterSeconds} ${retryAfterSeconds === 1 ? 'segundo' : 'segundos'}.`
}

export function elineaErrorResponse(error: ElineaError): { statusCode: number, message: string } {
  if (error.status === 429) return { statusCode: 429, message: rateLimitMessage(error instanceof RateLimitError ? error.retryAfterSeconds : undefined) }
  const statusCode = error instanceof NotFoundError ? 404 : error instanceof ValidationError ? 422 : error instanceof AuthenticationError ? (error.status || 401) : (error.status || 502)
  return { statusCode, message: error.message }
}
