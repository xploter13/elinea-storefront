import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startStorefront } from './helpers/storefront-ssr.mjs'

let storefront
let mode = 'demo'
const contexts = []
before(async () => {
  storefront = await startStorefront((req, res) => {
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
})
after(() => storefront?.close())
const load = (path, domain = 'a.test') => storefront.load(path, domain)

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
