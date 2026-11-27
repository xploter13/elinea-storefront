import assert from 'node:assert/strict'
import { test } from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
const source = fileURLToPath(new URL('../../elinea-sdk/src/index.ts', import.meta.url))
const compiled = await build({ entryPoints: ['server/utils/password-reset.ts'], bundle: true, write: false, format: 'esm', platform: 'node', alias: { '@elinea/sdk': source } })
const { forwardPasswordRequest } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`)

test('password proxy preserves the unauthenticated payload and response contract through the SDK', async () => {
  const originals = new Map(['useRuntimeConfig', 'createError', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const requests = []
  let status = 200, payload = { message: 'Processado.' }
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({ apiBase: 'https://api.example.test/api/v1/' }),
    createError: fields => Object.assign(new Error(fields.message), fields),
    fetch: async (url, init) => { requests.push(new Request(url, init)); return Response.json(payload, { status }) },
  })
  try {
    assert.deepEqual(await forwardPasswordRequest({}, 'forgot', { email: ' example@example.test ' }), payload)
    const reset = { email: 'example@example.test', token: 'example-token', password: 'example-only', password_confirmation: 'example-only' }
    await forwardPasswordRequest({}, 'reset', reset)
    assert.deepEqual(await requests[0].json(), { email: ' example@example.test ' })
    assert.deepEqual(await requests[1].json(), reset)
    assert.equal(new URL(requests[1].url).pathname, '/api/v1/auth/password/reset')
    for (const request of requests) for (const header of ['Authorization', 'X-Site', 'X-Store-Secret', 'X-Cart-Session']) assert.equal(request.headers.has(header), false)
    status = 422; payload = { message: 'Dados inválidos.', errors: { email: ['Confira o e-mail.'] } }
    await assert.rejects(() => forwardPasswordRequest({}, 'forgot', { email: '' }), error => error.statusCode === 422 && error.message === payload.message && error.data.email[0] === 'Confira o e-mail.')
    assert.equal(requests.length, 3)
    status = 429; payload = { message: 'Aguarde.' }
    await assert.rejects(() => forwardPasswordRequest({}, 'forgot', { email: '' }), { statusCode: 429, message: 'Aguarde.' })
    globalThis.fetch = async () => { throw new Error('offline') }
    await assert.rejects(() => forwardPasswordRequest({}, 'forgot', { email: '' }), { statusCode: 502, message: 'Não foi possível processar a solicitação.' })
  } finally {
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
  }
})
