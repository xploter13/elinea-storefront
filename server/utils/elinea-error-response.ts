import { AuthenticationError, NotFoundError, ValidationError, type ElineaError } from '@elinea/sdk'

export const rateLimitMessage = 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'

export function elineaErrorResponse(error: ElineaError): { statusCode: number, message: string } {
  if (error.status === 429) return { statusCode: 429, message: rateLimitMessage }
  const statusCode = error instanceof NotFoundError ? 404 : error instanceof ValidationError ? 422 : error instanceof AuthenticationError ? (error.status || 401) : (error.status || 502)
  return { statusCode, message: error.message }
}
