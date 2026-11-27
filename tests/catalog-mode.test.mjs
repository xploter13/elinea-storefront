import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startStorefront } from './helpers/storefront-ssr.mjs'

let storefront
const product = { id: 1, name: 'Produto de teste', slug: 'produto-teste', sku: 'TEST-1', price: 50, stock: 10, variations: [], is_featured: true, categories: [] }

before(async () => {
  storefront = await startStorefront((req, res) => {
    const path = new URL(req.url, 'http://fixture.test').pathname
    const domain = req.headers['x-store-domain'] || 'catalog.test'
    res.setHeader('Content-Type', 'application/json')
    const send = data => res.end(JSON.stringify(data))
    if (path.endsWith('/site')) return send({ data: {
      id: domain === 'catalog.test' ? 1 : 2, name: 'Loja de teste', slug: domain, domain, segment: 'general', status: 'active',
      ...(domain !== 'legacy.test' ? { online_checkout_enabled: domain !== 'catalog.test' } : {}),
      theme: { contact_phone: '(11) 3000-1234', whatsapp_phone: '(11) 99999-1234' },
    } })
    if (path.endsWith('/products')) return send({ data: [product] })
    if (path.endsWith('/auth/me')) { res.statusCode = 401; return send({ message: 'Não autenticado.' }) }
    if (path.endsWith('/integrations/analytics') || path.endsWith('/newsletter-popup')) return send({ data: { enabled: false } })
    return send({ data: [] })
  })
})
after(() => storefront?.close())
const load = (path, domain = 'catalog.test') => storefront.load(path, domain)

test('catalog pages replace purchase actions with product WhatsApp links', async () => {
  for (const path of ['/', '/produtos', '/produto/produto-teste']) {
    const response = await load(path)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.doesNotMatch(html, /aria-label="Adicionar ao carrinho"|>Comprar agora<|aria-label="Abrir carrinho"|class="mobile-buy-bar"/)
    assert.doesNotMatch(html, /href="\/carrinho"|href="\/checkout"/)
    assert.match(html, /Comprar pelo Whatsapp/)
    assert.match(html, /whatsapp-button--header/)
    assert.match(html, /Precisa de ajuda\?/)
    assert.doesNotMatch(html, /class="utility"/)
    assert.match(html, /https:\/\/wa.me\/5511999991234\?text=/)
  }
})

test('catalog cart and checkout URLs redirect to the product catalog', async () => {
  for (const path of ['/carrinho', '/checkout']) {
    const response = await load(path)
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), '/produtos')
  }
})

test('commerce and legacy stores retain buy buttons and the header cart', async () => {
  for (const domain of ['commerce.test', 'legacy.test']) {
    for (const path of ['/', '/produtos']) {
      const response = await load(path, domain)
      assert.equal(response.status, 200)
      const cards = await response.text()
      assert.match(cards, /aria-label="Adicionar ao carrinho"/)
      assert.match(cards, /Comprar pelo Whatsapp/)
      assert.match(cards, /https:\/\/wa.me\/5511999991234\?text=/)
    }
    const html = await (await load('/produto/produto-teste', domain)).text()
    assert.match(html, /aria-label="Abrir carrinho"/)
    assert.match(html, />Comprar agora<|>Comprar agora<\/button>/)
    assert.match(html, /Adicionar ao carrinho/)
    assert.match(html, /Comprar pelo Whatsapp/)
  }
})
