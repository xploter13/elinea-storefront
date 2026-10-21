import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, request as httpRequest } from 'node:http'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
let fixture, runtime, origin
let mode = 'published'
const contexts = []
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server.address().port)))
const article = (slug, domain) => ({ id: 1, slug, title: `${slug === 'older-story' ? 'Older story' : 'Published story'} ${domain}`, category: 'Guias', excerpt: 'Resumo editorial', image_url: 'https://images.test/cover.png', image_alt: 'Capa editorial', reading_minutes: 1, introduction: 'Introducao editorial', sections: [{ id: 'primeira-secao', title: 'Primeira secao', paragraphs: ['Conteudo editorial publicado'], points: ['Uma dica'] }], quote: 'Uma citacao', published_at: '2026-10-21T12:00:00Z' })
before(async () => {
  fixture = createServer((req, res) => {
    const url = new URL(req.url, 'http://fixture.test')
    const domain = req.headers['x-store-domain'] || 'local.test'
    contexts.push({ path: url.pathname, domain })
    res.setHeader('Content-Type', 'application/json')
    const send = body => res.end(JSON.stringify(body))
    if (url.pathname.endsWith('/site')) return send({ data: { id: domain === 'a.test' ? 1 : 2, name: `Loja ${domain}`, slug: domain, domain, segment: 'general', status: 'active' } })
    if (url.pathname.endsWith('/blog/articles')) {
      if (mode === 'unavailable') { res.statusCode = 503; return send({ message: 'Unavailable' }) }
      const page = Number(url.searchParams.get('page') || 1)
      return send({ data: mode === 'empty' ? [] : [article(page === 2 ? 'second-page' : 'first-story', domain)], meta: { current_page: page, last_page: mode === 'empty' ? 1 : 2, total: mode === 'empty' ? 0 : 11 } })
    }
    if (url.pathname.includes('/blog/articles/')) {
      if (url.pathname.endsWith('/older-story')) return send({ data: article('older-story', domain) })
      res.statusCode = 404
      return send({ message: 'Not found' })
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
    try { const result = await fetch(`${origin}/api/storefront`); if (result.ok) return }
    catch {}
    if (runtime.exitCode !== null) throw new Error(`Nuxt exited: ${diagnostics}`)
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(`Nuxt did not start: ${diagnostics}`)
})
after(async () => {
  runtime?.kill('SIGTERM')
  if (fixture) await new Promise(resolve => fixture.close(resolve))
})
const load = (path, domain = 'a.test') => new Promise((resolve, reject) => {
  const req = httpRequest(`${origin}${path}`, { headers: { host: domain } }, res => {
    const chunks = []
    res.on('data', chunk => chunks.push(chunk))
    res.on('end', () => resolve(new Response(Buffer.concat(chunks), { status: res.statusCode, headers: res.headers })))
  })
  req.on('error', reject)
  req.end()
})
test('blog SSR renders API publications, pagination and tenant-specific content', async () => {
  const response = await load('/blog')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes('Published story a.test'), 'publication should use request hostname: ' + JSON.stringify(contexts.slice(-7)))
  assert.match(html, /\/blog\/first-story/)
  assert.match(html, /page=2/)
  assert.doesNotMatch(html, /Escolher melhor começa antes do carrinho/)
  const other = await (await load('/blog', 'b.test')).text()
  assert.match(other, /Published story b.test/)
  assert.doesNotMatch(other, /Published story a.test/)
  assert.ok(contexts.some(item => item.path.endsWith('/blog/articles') && item.domain === 'a.test'))
  assert.ok(contexts.some(item => item.path.endsWith('/blog/articles') && item.domain === 'b.test'))
})
test('SSR fetches older articles independently of the list and renders article SEO', async () => {
  const response = await load('/blog/older-story')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.ok(html.includes('Older story a.test'), 'detail should use request hostname')
  assert.match(html, /Conteudo editorial publicado/)
  assert.match(html, /Introducao editorial/)
  assert.match(html, /property="og:type" content="article"/)
  assert.match(html, /<title>Older story a.test/)
})
test('unpublished or unknown article URLs produce HTTP 404', async () => {
  assert.equal((await load('/blog/draft-story')).status, 404)
})
test('second page is rendered from the corresponding API page', async () => {
  const html = await (await load('/blog?page=2')).text()
  assert.match(html, /\/blog\/second-page/)
  assert.match(html, /Página 2 de 2/)
})
test('empty and unavailable blogs have explicit states without demonstration content', async () => {
  mode = 'empty'
  let response = await load('/blog')
  assert.equal(response.status, 200)
  assert.match(await response.text(), /Novas leituras estão a caminho/)
  mode = 'unavailable'
  response = await load('/blog')
  assert.equal(response.status, 200)
  assert.match(await response.text(), /Não foi possível carregar as matérias/)
})
