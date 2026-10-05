import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthenticationError, ElineaError, NotFoundError, RateLimitError, ValidationError } from '@elinea/sdk'
import { elineaErrorResponse, rateLimitMessage } from './elinea-error-response.ts'

const genericRateLimitMessage = 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'

test('rate limit tells the customer how long to wait when the API sends Retry-After', () => {
  const error = new RateLimitError('Too Many Attempts.', { status: 429, retryAfterSeconds: 30 })

  assert.deepEqual(elineaErrorResponse(error), { statusCode: 429, message: 'Muitas tentativas em pouco tempo. Tente novamente em 30 segundos.' })
})

test('rate limit uses the singular for a one second wait', () => {
  const error = new RateLimitError('Too Many Attempts.', { status: 429, retryAfterSeconds: 1 })

  assert.equal(elineaErrorResponse(error).message, 'Muitas tentativas em pouco tempo. Tente novamente em 1 segundo.')
})

for (const [name, error] of [
  ['without Retry-After', new RateLimitError('Too Many Attempts.', { status: 429 })],
  ['with a zero wait', new RateLimitError('Too Many Attempts.', { status: 429, retryAfterSeconds: 0 })],
  ['from an SDK that only raises ElineaError', new ElineaError('Too Many Attempts.', { status: 429, details: { message: 'Too Many Attempts.' } })],
]) {
  test(`rate limit falls back to a generic 429 message ${name}`, () => {
    assert.deepEqual(elineaErrorResponse(error), { statusCode: 429, message: genericRateLimitMessage })
  })
}

test('rate limit exports the generic message for the no-wait case', () => {
  assert.equal(rateLimitMessage(), genericRateLimitMessage)
})

for (const [name, error, statusCode] of [
  ['not found', new NotFoundError('Pedido não encontrado.', { status: 404 }), 404],
  ['validation', new ValidationError('Dados inválidos.', { status: 422 }), 422],
  ['unauthenticated', new AuthenticationError('Token inválido.', { status: 401 }), 401],
  ['forbidden', new AuthenticationError('Acesso negado.', { status: 403 }), 403],
  ['authentication without status', new AuthenticationError('Sessão expirada.'), 401],
  ['upstream failure', new ElineaError('Falha no gateway.', { status: 500 }), 500],
  ['network failure without status', new ElineaError('Não foi possível conectar à API da Elínea.', { code: 'NETWORK_ERROR' }), 502],
]) {
  test(`keeps the existing mapping for ${name}`, () => {
    assert.deepEqual(elineaErrorResponse(error), { statusCode, message: error.message })
  })
}
