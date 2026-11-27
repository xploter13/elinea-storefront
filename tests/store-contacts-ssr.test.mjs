import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startStorefront } from './helpers/storefront-ssr.mjs'

let storefront
let mode = 'both'
const contexts = []
before(async () => {
  storefront = await startStorefront((req, res) => {
    const url = new URL(req.url, 'http://fixture.test')
    const domain = req.headers['x-store-domain'] || 'local.test'
    contexts.push({ path: url.pathname, domain })
    res.setHeader('Content-Type', 'application/json')
    const send = body => res.end(JSON.stringify(body))
    if (url.pathname.endsWith('/site')) return send({ data: { id: domain === 'a.test' ? 1 : 2, name: `Loja ${domain}`, slug: domain, domain, segment: 'general', status: 'active', theme: { contact_phone: mode === 'only-whatsapp' ? '' : '(11) 3000-1234', whatsapp_phone: mode === 'only-phone' ? '' : '5521999998888' } } })
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

test('storefront displays the fixed phone as a call link and uses a separate WhatsApp number', async () => {
  const html = await (await load('/')).text()
  assert.match(html, /href="tel:1130001234"/)
  assert.match(html, /Telefone da loja/)
  assert.match(html, /wa.me\/5521999998888/)
  assert.doesNotMatch(html, /wa.me\/551130001234/)
})
test('a fixed phone alone never becomes a WhatsApp button', async () => {
  mode = 'only-phone'
  const html = await (await load('/')).text()
  assert.match(html, /href="tel:1130001234"/)
  assert.doesNotMatch(html, /wa.me\//)
})
test('WhatsApp can be shown without publishing a fixed phone', async () => {
  mode = 'only-whatsapp'
  const html = await (await load('/')).text()
  assert.match(html, /wa.me\/5521999998888/)
  assert.doesNotMatch(html, /href="tel:/)
})
