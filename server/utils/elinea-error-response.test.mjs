import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AuthenticationError, ElineaError, NotFoundError, ValidationError } from '@elinea/sdk'
import { elineaErrorResponse, rateLimitMessage } from './elinea-error-response.ts'

test('rate limit responses become a friendly 429 regardless of the API message', () => {
  const error = new ElineaError('Too Many Attempts.', { status: 429, details: { message: 'Too Many Attempts.' } })

  assert.deepEqual(elineaErrorResponse(error), { statusCode: 429, message: rateLimitMessage })
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
