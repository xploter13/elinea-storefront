<script setup lang="ts">
import { ArrowRight, Heart, Minus, Plus, ShoppingBag, X } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import { useStorefrontCatalog } from '../composables/useStorefrontCatalog'
import { useStorefrontCommerce } from '../composables/useStorefrontCommerce'

const props = defineProps<{ storefront: StorefrontPayload }>()
const {
  money,
  productImage,
} = useStorefrontCatalog(props.storefront)
const {
  cart, cartProducts, wishlistProducts, cartOpen, wishlistOpen, busyProducts, notice,
  initialize, addToCart, updateQuantity, removeFromCart, toggleWishlist,
} = useStorefrontCommerce(props.storefront)

onMounted(initialize)
watch(cartOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})
onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Transition name="cart-drawer">
    <div v-if="cartOpen" class="commerce-drawer" role="dialog" aria-modal="true" aria-label="Seu carrinho">
      <button class="drawer-overlay" aria-label="Fechar carrinho" @click="cartOpen=false"></button>
      <aside class="commerce-panel">
        <header class="cart-header">
          <div class="cart-title"><ShoppingBag :size="20"/><div><strong>Seu carrinho</strong><span>{{ cart.totals.items_count }} {{ cart.totals.items_count === 1 ? 'item' : 'itens' }}</span></div></div>
          <button class="close-cart" type="button" aria-label="Fechar carrinho" @click="cartOpen=false"><X :size="19"/></button>
        </header>

        <div v-if="cartProducts.length" class="cart-items">
          <div class="cart-promo"><span>🔥</span><small>Itens reservados por tempo limitado.</small></div>
          <article v-for="entry in cartProducts" :key="entry.item.id" class="cart-item">
            <figure class="cart-item-image">
              <img v-if="entry.product && productImage(entry.product)" :src="productImage(entry.product)!" :alt="entry.item.name" class="h-full w-full object-contain">
              <ShoppingBag v-else :size="25" class="opacity-35"/><button type="button" aria-label="Remover produto" @click="removeFromCart(entry.item.product_id)"><X :size="13"/></button>
            </figure>
            <div class="cart-item-content">
              <NuxtLink :to="`/produto/${entry.product?.slug || ''}`" @click="cartOpen=false">{{ entry.item.name }}</NuxtLink>
              <strong>{{ money(entry.item.total) }}</strong>
              <div class="cart-item-actions"><div class="quantity-control"><button type="button" aria-label="Diminuir quantidade" :disabled="busyProducts.includes(entry.item.product_id)" @click="updateQuantity(entry.item.product_id,entry.item.quantity-1)"><Minus :size="13"/></button><span>{{ String(entry.item.quantity).padStart(2, '0') }}</span><button type="button" aria-label="Aumentar quantidade" :disabled="busyProducts.includes(entry.item.product_id)" @click="updateQuantity(entry.item.product_id,entry.item.quantity+1)"><Plus :size="13"/></button></div><button type="button" class="edit-item" @click="removeFromCart(entry.item.product_id)">Remover</button></div>
              </div>
          </article>
        </div>

        <div v-else class="cart-empty">
          <div><span><ShoppingBag :size="31"/></span><h3>Seu carrinho está vazio.</h3><p>Adicione produtos sem precisar criar uma conta.</p><button type="button" @click="cartOpen=false">Continuar comprando</button></div>
        </div>

        <footer v-if="cartProducts.length" class="cart-footer">
          <div class="cart-subtotal"><span>Subtotal</span><strong>{{ money(cart.totals.items_total) }}</strong></div>
          <NuxtLink to="/checkout" class="checkout-button" @click="cartOpen=false">Finalizar compra</NuxtLink>
          <NuxtLink to="/carrinho" class="view-cart" @click="cartOpen=false">Ver carrinho completo <ArrowRight :size="14"/></NuxtLink>
          <p>Frete e descontos calculados no checkout.</p>
        </footer>
      </aside>
    </div>
  </Transition>

  <dialog v-if="wishlistOpen" class="modal modal-open">
    <div class="modal-box max-w-3xl border border-base-300">
      <form method="dialog"><button class="btn btn-circle btn-ghost btn-sm absolute right-3 top-3" aria-label="Fechar lista" @click="wishlistOpen=false"><X :size="18"/></button></form>
      <span class="badge badge-secondary badge-outline"><Heart :size="13"/> Lista de desejos</span>
      <h2 class="mt-3 text-3xl font-bold">Produtos salvos</h2>
      <div v-if="wishlistProducts.length" class="mt-6 grid gap-3 sm:grid-cols-2">
        <article v-for="product in wishlistProducts" :key="product.id" class="card card-side border border-base-300 bg-base-100">
          <figure class="m-3 size-24 shrink-0 rounded-box bg-base-200"><img v-if="productImage(product)" :src="productImage(product)!" :alt="product.name" class="size-full object-contain"><ShoppingBag v-else :size="25" class="opacity-35"/></figure>
          <div class="card-body min-w-0 gap-2 p-4 pl-1"><NuxtLink :to="`/produto/${product.slug}`" class="line-clamp-2 text-sm font-bold" @click="wishlistOpen=false">{{ product.name }}</NuxtLink><strong class="text-primary">{{ money(product.price) }}</strong><div class="card-actions mt-auto"><button class="btn btn-primary btn-sm" :disabled="product.stock<1 || busyProducts.includes(product.id)" @click="addToCart(product)">Adicionar</button><button class="btn btn-ghost btn-sm text-error" @click="toggleWishlist(product)">Remover</button></div></div>
        </article>
      </div>
      <div v-else class="alert mt-6"><Heart :size="20"/><span>Sua lista ainda está vazia. Use o coração nos produtos para guardar seus favoritos.</span></div>
    </div>
    <form method="dialog" class="modal-backdrop"><button aria-label="Fechar lista" @click="wishlistOpen=false">fechar</button></form>
  </dialog>

  <div v-if="notice" class="toast toast-end toast-bottom z-[110]">
    <div class="alert shadow-xl" :class="notice.type === 'success' ? 'alert-success' : 'alert-error'"><span>{{ notice.message }}</span></div>
  </div>
</template>

<style scoped>
.commerce-drawer{position:fixed;inset:0;z-index:90;display:block;pointer-events:auto}.commerce-drawer .drawer-toggle{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.commerce-drawer .drawer-side{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) min(92vw,440px);height:100%}.commerce-drawer .drawer-overlay{width:100%;height:100%;border:0;background:rgba(15,23,42,.42);cursor:pointer}.commerce-panel{display:flex;flex-direction:column;width:min(92vw,440px);min-height:100%;margin:0;background:#fff;color:#111827;box-shadow:-24px 0 70px rgba(15,23,42,.18);overflow:hidden}.commerce-panel header{flex:0 0 auto}.commerce-panel>div{min-height:0}.commerce-panel footer{flex:0 0 auto}
@media(max-width:560px){.commerce-drawer .drawer-side{grid-template-columns:1fr}.commerce-drawer .drawer-overlay{display:none}.commerce-panel{width:100vw}}
.commerce-drawer{position:fixed;inset:0;z-index:90;display:flex;justify-content:flex-end;background:rgba(15,23,42,.42)}.drawer-overlay{position:absolute;inset:0;border:0;background:transparent;cursor:pointer}.commerce-panel{position:relative;z-index:1;display:flex;width:min(100%,470px);height:100%;min-height:100%;flex-direction:column;background:#fff;color:#111827;box-shadow:-24px 0 70px rgba(15,23,42,.2);overflow:hidden}.cart-drawer-enter-active,.cart-drawer-leave-active{transition:opacity .28s ease}.cart-drawer-enter-active .commerce-panel,.cart-drawer-leave-active .commerce-panel{transition:transform .32s cubic-bezier(.22,1,.36,1)}.cart-drawer-enter-from,.cart-drawer-leave-to{opacity:0}.cart-drawer-enter-from .commerce-panel,.cart-drawer-leave-to .commerce-panel{transform:translateX(100%)}.cart-header{display:flex;align-items:center;justify-content:space-between;padding:25px 26px 20px;border-bottom:1px solid #eaecf0}.cart-title{display:flex;align-items:center;gap:11px;color:#101828}.cart-title svg{color:var(--sf-primary)}.cart-title div{display:grid;gap:3px}.cart-title strong{font-size:18px}.cart-title span{color:#667085;font-size:11px}.close-cart{display:grid;width:34px;height:34px;place-items:center;border:0;border-radius:50%;background:#f2f4f7;color:#344054;cursor:pointer}.close-cart:hover{background:#e4e7ec;color:#1d4ed8}.cart-items{flex:1;overflow:auto;padding:0 26px}.cart-promo{display:flex;align-items:center;gap:8px;margin:16px 0;padding:10px 13px;border-radius:999px;background:#f2f4f7;color:#667085}.cart-promo span{font-size:16px}.cart-promo small{font-size:11px}.cart-item{display:grid;grid-template-columns:118px minmax(0,1fr);gap:15px;padding:17px 0;border-bottom:1px solid #eaecf0}.cart-item-image{position:relative;display:grid;width:118px;height:100px;place-items:center;margin:0;border-radius:9px;background:#f1f3f6}.cart-item-image img{width:100%;height:100%;object-fit:contain;padding:10px}.cart-item-image>button{position:absolute;right:7px;top:7px;display:grid;width:22px;height:22px;place-items:center;border:0;border-radius:50%;background:#fff;color:#101828;box-shadow:0 2px 8px rgba(15,23,42,.12);cursor:pointer}.cart-item-content{display:grid;align-content:center;gap:8px;min-width:0}.cart-item-content>a{overflow:hidden;color:#101828;font-size:13px;font-weight:700;line-height:1.35;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.cart-item-content>a:hover{color:var(--sf-primary)}.cart-item-content>strong{color:var(--sf-primary);font-size:14px}.cart-item-actions{display:flex;align-items:center;justify-content:space-between;gap:8px}.quantity-control{display:grid;grid-template-columns:28px 32px 28px;height:30px;align-items:center;border:1px solid #d0d5dd;border-radius:999px}.quantity-control button{display:grid;height:100%;place-items:center;border:0;background:none;color:#344054;cursor:pointer}.quantity-control button:disabled{cursor:wait;opacity:.5}.quantity-control span{text-align:center;font-size:11px;font-weight:700}.edit-item{border:0;background:none;color:#667085;font-size:10px;cursor:pointer}.edit-item:hover{color:#ef4444}.cart-empty{display:grid;flex:1;place-items:center;padding:30px;text-align:center}.cart-empty span{display:grid;width:72px;height:72px;margin:auto;place-items:center;border-radius:50%;background:#eff6ff;color:var(--sf-primary)}.cart-empty h3{margin:18px 0 6px;font-size:22px}.cart-empty p{margin:0;color:#667085;font-size:12px}.cart-empty button{height:40px;margin-top:18px;padding:0 17px;border:0;border-radius:999px;background:var(--sf-primary);color:#fff;font-size:12px;font-weight:700;cursor:pointer}.cart-footer{padding:20px 26px 24px;border-top:1px solid #eaecf0;background:#fff}.cart-subtotal{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:15px}.cart-subtotal span{color:#667085;font-size:13px}.cart-subtotal strong{font-size:22px}.checkout-button{display:flex;height:48px;align-items:center;justify-content:center;border-radius:999px;background:var(--sf-primary);color:#fff;font-size:13px;font-weight:750;text-decoration:none;transition:background .2s,transform .2s}.checkout-button:hover{background:#1d4ed8;transform:translateY(-1px)}.view-cart{display:flex;align-items:center;justify-content:center;gap:5px;margin-top:13px;color:var(--sf-primary);font-size:11px;font-weight:700;text-decoration:none}.cart-footer p{margin:11px 0 0;text-align:center;color:#98a2b3;font-size:10px}@media(max-width:560px){.commerce-panel{width:100vw}.cart-header,.cart-items,.cart-footer{padding-right:18px;padding-left:18px}.cart-item{grid-template-columns:96px minmax(0,1fr);gap:12px}.cart-item-image{width:96px;height:88px}}
</style>
