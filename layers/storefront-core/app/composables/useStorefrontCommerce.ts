import type { ApiEnvelope } from '#shared/types/storefront'
import type { StoreCart } from '#shared/types/commerce'
import type { StoreProduct, StorefrontPayload } from '#shared/types/storefront'

function emptyCart(): StoreCart {
  return {
    id: 0,
    coupon_code: null,
    items: [],
    totals: { items_count: 0, items_total: 0, discount: 0, shipping: 0, total: 0 },
  }
}

export const useStorefrontCommerce = (storefront: StorefrontPayload) => {
  const namespace = storefront.site.slug
  const canPurchase = computed(() => storefront.site.online_checkout_enabled !== false)
  const cart = useState<StoreCart>(`commerce:cart:${namespace}`, emptyCart)
  const initialized = useState<boolean>(`commerce:initialized:${namespace}`, () => false)
  const cartOpen = useState<boolean>(`commerce:cart-open:${namespace}`, () => false)
  const wishlistOpen = useState<boolean>(`commerce:wishlist-open:${namespace}`, () => false)
  const wishlist = useState<number[]>(`commerce:wishlist:${namespace}`, () => [])
  const wishlistHydrated = useState<boolean>(`commerce:wishlist-hydrated:${namespace}`, () => false)
  const busyProducts = useState<number[]>(`commerce:busy:${namespace}`, () => [])
  const notice = useState<{ message: string, type: 'success' | 'error' } | null>(`commerce:notice:${namespace}`, () => null)
  let noticeTimer: ReturnType<typeof setTimeout> | undefined

  const sessionKey = `elinea:cart-session:${namespace}`
  const wishlistKey = `elinea:wishlist:${namespace}`
  const sessionCookie = useCookie<string | null>('elinea_cart_session', { sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })

  const ensureSession = () => {
    if (!import.meta.client) return sessionCookie.value || ''
    const current = sessionCookie.value || localStorage.getItem(sessionKey)
    if (current) {
      sessionCookie.value = current
      localStorage.setItem(sessionKey, current)
      return current
    }
    const generated = globalThis.crypto?.randomUUID?.() || `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`
    sessionCookie.value = generated
    localStorage.setItem(sessionKey, generated)
    return generated
  }

  const headers = () => ({ 'X-Cart-Session': ensureSession() })

  const notify = (message: string, type: 'success' | 'error' = 'success') => {
    notice.value = { message, type }
    if (noticeTimer) clearTimeout(noticeTimer)
    noticeTimer = setTimeout(() => { notice.value = null }, 3200)
  }

  const hydrateWishlist = () => {
    if (!import.meta.client || wishlistHydrated.value) return
    try {
      const saved = JSON.parse(localStorage.getItem(wishlistKey) || '[]')
      wishlist.value = Array.isArray(saved) ? saved.filter(Number.isInteger) : []
    } catch {
      wishlist.value = []
    }
    wishlistHydrated.value = true
  }

  const initialize = async () => {
    hydrateWishlist()
    if (!canPurchase.value || !import.meta.client || initialized.value) return
    try {
      const response = await $fetch<ApiEnvelope<StoreCart>>('/api/cart', { headers: headers() })
      cart.value = response.data
      initialized.value = true
    } catch {
      notify('Não foi possível carregar seu carrinho.', 'error')
    }
  }

  const setBusy = (productId: number, busy: boolean) => {
    busyProducts.value = busy
      ? Array.from(new Set([...busyProducts.value, productId]))
      : busyProducts.value.filter(id => id !== productId)
  }

  const addToCart = async (product: StoreProduct, quantity = 1) => {
    if (!canPurchase.value || product.stock < 1 || busyProducts.value.includes(product.id)) return
    setBusy(product.id, true)
    try {
      const response = await $fetch<ApiEnvelope<StoreCart>>('/api/cart/items', {
        method: 'POST',
        headers: headers(),
        body: { product_id: product.id, quantity },
      })
      cart.value = response.data
      initialized.value = true
      cartOpen.value = true
      notify(`${product.name} foi adicionado ao carrinho.`)
    } catch (error: any) {
      notify(error?.data?.message || 'Não foi possível adicionar o produto.', 'error')
    } finally {
      setBusy(product.id, false)
    }
  }

  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity < 1) return removeFromCart(productId)
    setBusy(productId, true)
    try {
      const response = await $fetch<ApiEnvelope<StoreCart>>('/api/cart/items', {
        method: 'PUT', headers: headers(), body: { product_id: productId, quantity },
      })
      cart.value = response.data
    } catch (error: any) {
      notify(error?.data?.message || 'Não foi possível atualizar a quantidade.', 'error')
    } finally {
      setBusy(productId, false)
    }
  }

  const removeFromCart = async (productId: number) => {
    setBusy(productId, true)
    try {
      const response = await $fetch<ApiEnvelope<StoreCart>>(`/api/cart/items/${productId}`, {
        method: 'DELETE', headers: headers(),
      })
      cart.value = response.data
      notify('Produto removido do carrinho.')
    } catch (error: any) {
      notify(error?.data?.message || 'Não foi possível remover o produto.', 'error')
    } finally {
      setBusy(productId, false)
    }
  }

  const clearCartSession = () => {
    cart.value = emptyCart()
    initialized.value = true
    cartOpen.value = false
    if (import.meta.client) localStorage.removeItem(sessionKey)
    sessionCookie.value = null
  }

  const toggleWishlist = (product: StoreProduct) => {
    hydrateWishlist()
    const active = wishlist.value.includes(product.id)
    wishlist.value = active ? wishlist.value.filter(id => id !== product.id) : [...wishlist.value, product.id]
    if (import.meta.client) localStorage.setItem(wishlistKey, JSON.stringify(wishlist.value))
    notify(active ? `${product.name} saiu da sua lista.` : `${product.name} foi salvo na sua lista.`)
  }

  const isWishlisted = (productId: number) => wishlist.value.includes(productId)
  const cartProducts = computed(() => cart.value.items.map(item => ({
    item,
    product: storefront.products.find(product => product.id === item.product_id),
  })))
  const wishlistProducts = computed(() => storefront.products.filter(product => wishlist.value.includes(product.id)))

  return {
    cart,
    canPurchase,
    cartProducts,
    wishlist,
    wishlistProducts,
    wishlistHydrated,
    hydrateWishlist,
    cartOpen,
    wishlistOpen,
    busyProducts,
    notice,
    initialize,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCartSession,
    toggleWishlist,
    isWishlisted,
  }
}
