import assert from 'node:assert/strict'
import { fetchNodeRequestHandler } from 'node-mock-http'

const apiOrigin = 'https://fixture.test'
const output = new URL('../../.output-ssr-test/server/index.mjs', import.meta.url)

export async function startStorefront(fixture) {
  const originalFetch = globalThis.fetch
  const previousConfig = new Map()
  for (const [name, value] of Object.entries({
    NUXT_API_BASE: `${apiOrigin}/api/v1`,
    NUXT_TRUST_PROXY_HEADERS: 'false',
  })) {
    previousConfig.set(name, process.env[name])
    process.env[name] = value
  }

  const close = () => {
    globalThis.fetch = originalFetch
    for (const [name, value] of previousConfig) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }

  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    assert.equal(url.origin, apiOrigin, 'SSR tests must only reach the mock API')
    return fetchNodeRequestHandler(fixture, url.pathname + url.search, {
      method: request.method,
      headers: request.headers,
    })
  }

  try {
    const { listener } = await import(output)
    assert.equal(typeof listener, 'function', 'Build the node-listener preset with npm run build:ssr-test')
    return {
      load: (path, domain) => fetchNodeRequestHandler(listener, path, { host: domain }),
      close,
    }
  } catch (error) {
    close()
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.url === output.href) {
      throw new Error('Build the SSR test server first with npm run build:ssr-test', { cause: error })
    }
    throw error
  }
}
