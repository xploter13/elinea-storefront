import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startStorefront } from './helpers/storefront-ssr.mjs'

let storefront
let mode = 'published'
const contexts = []
before(async () => {
  storefront = await startStorefront((req, res) => {
    const url = new URL(req.url, 'http://fixture.test')
    const domain = req.headers['x-store-domain'] || 'local.test'
    contexts.push({ path: url.pathname, domain })
    res.setHeader('Content-Type', 'application/json')
    const send = body => res.end(JSON.stringify(body))
    if (url.pathname.endsWith('/site')) return send({ data: { id: domain === 'a.test' ? 1 : 2, name: `Loja ${domain}`, slug: domain, domain, segment: 'general', status: 'active' } })
    if (url.pathname.endsWith('/banners')) {
      if (mode === 'unavailable') { res.statusCode = 503; return send({ message: 'Unavailable' }) }
      return send({ data: mode === 'empty' ? [] : [{ id: 1, name: `Oferta ${domain}`, image_url: `https://images.test/${domain}/desktop.jpg`, mobile_image_url: `https://images.test/${domain}/mobile.jpg`, image_alt: `Banner ${domain}`, link_url: '/produtos', position: 0 }, { id: 2, name: 'Segundo banner', image_url: 'https://images.test/second.jpg', image_alt: 'Oferta adicional', link_url: null, position: 1 }] })
    }
    if (url.pathname.endsWith('/integrations/analytics')) return send({ data: { enabled: false } })
    if (url.pathname.endsWith('/newsletter-popup')) return send({ data: { enabled: false } })
    return send({ data: [] })
  })
})
after(() => storefront?.close())
const load = (path, domain = 'a.test') => storefront.load(path, domain)

test('home SSR renders uploaded images, mobile source, links and accessible controls', async () => {
  const response = await load('/')
  assert.equal(response.status, 200)
  const html = await response.text()
  assert.match(html, /class="storefront-slideshow/)
  assert.match(html, /src="https:\/\/images.test\/a.test\/desktop.jpg"/)
  assert.match(html, /srcset="https:\/\/images.test\/a.test\/mobile.jpg"/)
  assert.match(html, /alt="Banner a.test"/)
  assert.match(html, /aria-label="Próximo banner"/)
  assert.match(html, /aria-label="Pausar apresentação automática"/)
  assert.doesNotMatch(html, /class="hero-copy|class="hero-scrim|slide-tech.png|slide-beauty.png/)
  assert.ok(contexts.some(item => item.path.endsWith('/banners') && item.domain === 'a.test'))
})
test('banners follow each request hostname without leaking across stores', async () => {
  const other = await (await load('/', 'b.test')).text()
  assert.match(other, /images.test\/b.test\/desktop.jpg/)
  assert.doesNotMatch(other, /images.test\/a.test\/desktop.jpg/)
})
test('no banners hides the slideshow without inserting demonstration campaigns', async () => {
  mode = 'empty'
  const html = await (await load('/')).text()
  assert.doesNotMatch(html, /class="storefront-slideshow/)
  assert.match(html, /Explore por categoria/)
})
test('unavailable banners do not prevent the rest of the shop from rendering', async () => {
  mode = 'unavailable'
  const response = await load('/')
  assert.equal(response.status, 200)
  assert.doesNotMatch(await response.text(), /class="storefront-slideshow/)
  const payload = await (await load('/api/storefront')).json()
  assert.deepEqual(payload.banners, [])
  assert.ok(payload.warnings.some(warning => warning.startsWith('banners:')))
})
