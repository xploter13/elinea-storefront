import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
let fixture, runtime, origin
let mode = 'demo'
const contexts = []
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)))
before(async () => {
  fixture = createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture.test')
    const domain = req.headers['x-store-domain'] || 'local.test'
    contexts.push({ path: url.pathname, domain })
    res.setHeader('Content-Type', 'application/json')
    const send = body => res.end(JSON.stringify(body))
    if (url.pathname.endsWith('/site')) return send({ data: { id: domain === 'a.test' ? 1 : 2, name: `Loja ${domain}`, slug: domain, domain, segment: 'general', status: 'active' } })
    if (url.pathname.endsWith('/products')) return send({ data: [{ id: 1, name: 'Caneca completa', slug: 'caneca-completa', sku: 'EXEMPLO-1-1', price: 29.9, stock: 24, state: 'active', is_demo: mode === 'demo', is_featured: true, description: 'Descrição completa com cuidados de uso.', excerpt: 'Caneca para sua rotina.', categories: [{ id: 1, name: 'Casa', slug: 'casa', parent_id: null, is_active: true }], specifications: [{ name: 'Material', value: 'Cerâmica' }, { name: 'Capacidade', value: '300 ml' }], faqs: [{ question: 'Como limpar a caneca?', answer: 'Use esponja macia.' }], demo_reviews: [{ author: 'Pessoa de exemplo', rating: 5, title: 'Avaliação ilustrativa', comment: 'Amostra sem compra real.' }], reviews: mode === 'real' ? [{ author: 'Cliente publicado', rating: 4, title: 'Experiência publicada', comment: 'Comentário público.' }] : [] }] })
    if (url.pathname.endsWith('/categories')) return send({ data: [{ id: 1, name: 'Casa', slug: 'casa', parent_id: null, is_active: true }] })
    if (url.pathname.endsWith('/banners')) {
      if (mode === 'unavailable') { res.statusCode = 503; return send({ message: 'Unavailable' }) }
      return send({ data: mode === 'empty' ? [] : [{ id: 1, name: `Oferta ${domain}`, image_url: `https://images.test/${domain}/desktop.jpg`, mobile_image_url: `https://images.test/${domain}/mobile.jpg`, image_alt: `Banner ${domain}`, link_url: '/produtos', position: 0 }, { id: 2, name: 'Segundo banner', image_url: 'https://images.test/second.jpg', image_alt: 'Oferta adicional', link_url: null, position: 1 }] })
    }
    if (url.pathname.endsWith('/integrations/analytics')) return send({ data: { enabled: false } })
    if (url.pathname.endsWith('/newsletter-popup')) return send({ data: { enabled: false } })
    return send({ data: [] })
  })
  const upstreamPort = await listen(fixture)
  const reservation = createServer()
  const port = await listen(reservation)
  await new Promise(resolve => reservation.close(resolve))
  origin = `http://127.0.0.1:${port}`
  runtime = spawn(process.execPath, ['.output/server/index.mjs'], { cwd: root, env: { ...process.env, HOST: '127.0.0.1', PORT: String(port), NUXT_API_BASE: `http://127.0.0.1:${upstreamPort}/api/v1`, NUXT_TRUST_PROXY_HEADERS: 'false' }, stdio: ['ignore', 'ignore', 'pipe'] })
  let diagnostics = ''
  runtime.stderr.on('data', chunk => { diagnostics += chunk })
  for (let attempt = 0; attempt < 100; attempt++) {
    try { const response = await fetch(`${origin}/api/storefront`); if (response.ok) return } catch {}
    if (runtime.exitCode !== null) throw new Error(`Nuxt exited: ${diagnostics}`)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Nuxt did not start: ${diagnostics}`)
})
after(async () => { runtime?.kill('SIGTERM'); if (fixture) await new Promise(resolve => fixture.close(resolve)) })
const load = (path, domain = 'a.test') => new Promise((resolve, reject) => {
  const req = httpRequest(`${origin}${path}`, { headers: { host: domain } }, res => {
    const chunks = []
    res.on('data', chunk => chunks.push(chunk))
    res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })))
  })
  req.on('error', reject); req.end()
})
test('SSR presents a complete demo product with labeled sample reviews and disabled purchase', async () => {
  const response = await load('/produto/caneca-completa')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /Descrição completa com cuidados de uso/)
  assert.match(html, /Cerâmica/)
  assert.match(html, /300 ml/)
  assert.match(html, /Como limpar a caneca/)
  assert.match(html, /Use esponja macia/)
  assert.match(html, /Avaliações ilustrativas do kit inicial/)
  assert.match(html, /Avaliação ilustrativa/)
  assert.match(html, /24 unidades de exemplo/)
  assert.match(html, /role="tablist"/)
  assert.match(html, /class="primary-buy"[^>]*disabled/)
})
test('SSR presents real published reviews without sample testimonials after conversion', async () => {
  mode = 'real'
  const html = await (await load('/produto/caneca-completa')).text()
  assert.match(html, /Experiência publicada/)
  assert.match(html, /Cliente publicado/)
  assert.doesNotMatch(html, /Avaliação ilustrativa|Pessoa de exemplo|Avaliações ilustrativas do kit inicial/)
  assert.doesNotMatch(html, /class="primary-buy"[^>]*disabled/)
})
