<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, CreditCard, Package } from '@lucide/vue'
import type { Order, Paginated } from '@elinea/sdk'
import { canResumePayment } from '#shared/utils/checkout-payment'
import { orderStatusLabel } from '~/utils/order-display'

const currentPage = ref(1)
const { data: response, pending, error, refresh } = await useFetch<Paginated<Order>>('/api/orders', {
  query: computed(() => ({ page: currentPage.value })),
})
const orders = computed(() => response.value?.data ?? [])
const meta = computed(() => response.value?.meta)
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string | null) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(new Date(value))
}
const address = (order: Order) => {
  const delivery = order.shippingAddress
  if (!delivery) return ''
  const street = [delivery.street, delivery.number].filter(Boolean).join(', ')
  const city = [delivery.city, delivery.state].filter(Boolean).join(' - ')
  return [street, delivery.complement, delivery.district, city, delivery.zipcode].filter(Boolean).join(' · ')
}
const statusTone = (status: string) => {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'order_shipped') return 'info'
  return 'neutral'
}
</script>

<template>
  <section class="orders-history" :aria-busy="pending">
    <div class="history-heading">
      <div>
        <h2>Histórico de pedidos</h2>
        <p>Acompanhe suas compras e consulte os detalhes de cada pedido.</p>
      </div>
      <span v-if="meta && !error" class="history-count">{{ meta.total }} {{ meta.total === 1 ? 'pedido' : 'pedidos' }}</span>
    </div>

    <div v-if="pending" class="history-message" role="status">Carregando pedidos...</div>
    <div v-else-if="error" class="history-message" role="alert">
      <h3>Não foi possível carregar seus pedidos.</h3>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" @click="refresh()">Tentar novamente</button>
    </div>
    <div v-else-if="orders.length" class="history-list">
      <details v-for="order in orders" :key="order.id" class="history-card">
        <summary>
          <span class="order-identity">
            <strong>Pedido {{ order.number }}</strong>
            <small>Realizado em {{ date(order.createdAt) }}</small>
          </span>
          <span class="order-status" :class="statusTone(order.status)">{{ orderStatusLabel(order.status) }}</span>
          <span class="order-total"><small>Total</small><strong>{{ money(order.total) }}</strong></span>
          <ChevronDown class="summary-chevron" :size="18" aria-hidden="true" />
        </summary>
        <div class="order-details">
          <div class="details-section">
            <h3>Itens do pedido</h3>
            <ul v-if="order.items.length" class="item-list">
              <li v-for="(item, index) in order.items" :key="`${item.productId}-${index}`">
                <span><strong>{{ item.name }}</strong><small>{{ item.quantity }} × {{ money(item.unitPrice) }}</small></span>
                <strong>{{ money(item.total) }}</strong>
              </li>
            </ul>
            <p v-else class="detail-muted">Itens indisponíveis.</p>
          </div>
          <div class="details-footer">
            <div v-if="order.shippingAddress" class="delivery-address">
              <h3>Endereço de entrega</h3>
              <p>{{ address(order) }}</p>
            </div>
            <dl class="order-totals">
              <div><dt>Produtos</dt><dd>{{ money(order.subtotal) }}</dd></div>
              <div v-if="order.discountTotal"><dt>Desconto</dt><dd>− {{ money(order.discountTotal) }}</dd></div>
              <div><dt>Entrega</dt><dd>{{ order.shippingTotal ? money(order.shippingTotal) : 'Grátis' }}</dd></div>
              <div class="grand-total"><dt>Total do pedido</dt><dd>{{ money(order.total) }}</dd></div>
            </dl>
          </div>
          <NuxtLink v-if="canResumePayment(order.billingStatus, order.status)" class="payment-link" :to="`/pagamento/${order.id}`">
            <CreditCard :size="17" aria-hidden="true" />{{ order.billingStatus === 'failed' ? 'Tentar pagamento novamente' : 'Concluir pagamento' }}
          </NuxtLink>
        </div>
      </details>
    </div>
    <div v-else class="history-message history-empty">
      <span class="empty-icon"><Package :size="27" aria-hidden="true" /></span>
      <h3>Você ainda não fez pedidos.</h3>
      <p>Quando fizer uma compra, ela aparecerá aqui para você acompanhar.</p>
      <NuxtLink to="/produtos">Explorar produtos <ChevronRight :size="17" aria-hidden="true" /></NuxtLink>
    </div>

    <nav v-if="!pending && !error && meta && meta.last_page > 1" class="history-pagination" aria-label="Páginas do histórico de pedidos">
      <button type="button" :disabled="currentPage <= 1" @click="currentPage--"><ChevronLeft :size="17" aria-hidden="true" /> Anterior</button>
      <span aria-live="polite">Página {{ meta.current_page }} de {{ meta.last_page }}</span>
      <button type="button" :disabled="currentPage >= meta.last_page" @click="currentPage++">Próxima <ChevronRight :size="17" aria-hidden="true" /></button>
    </nav>
  </section>
</template>

<style scoped>
.orders-history{margin-top:1rem}
.history-heading{display:flex;align-items:start;justify-content:space-between;gap:1rem;padding:1.25rem 1.5rem;border:1px solid var(--border);border-radius:1rem;background:var(--card);box-shadow:var(--shadow-soft)}
.history-heading h2{margin:0;color:var(--foreground);font-size:1.15rem;line-height:1.3}
.history-heading p{margin:.35rem 0 0;color:var(--muted-foreground);font-size:.875rem;line-height:1.5}
.history-count{flex:none;border-radius:999px;background:var(--muted);padding:.45rem .75rem;color:var(--foreground);font-size:.75rem;font-weight:700}
.history-list{display:grid;gap:.75rem;margin-top:.75rem}
.history-card{overflow:hidden;border:1px solid var(--border);border-radius:1rem;background:var(--card);box-shadow:var(--shadow-soft)}
.history-card summary{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(7rem,auto) auto;align-items:center;gap:1rem;min-height:5.5rem;padding:1rem 1.25rem;cursor:pointer;list-style:none}
.history-card summary::-webkit-details-marker{display:none}
.history-card summary:hover{background:var(--surface-2)}
.history-card summary:focus-visible,.orders-history :is(a,button):focus-visible{outline:3px solid var(--primary);outline-offset:-3px}
.order-identity{display:grid;min-width:0;gap:.3rem;overflow-wrap:anywhere}
.order-identity strong{font-size:.95rem;color:var(--foreground)}
.order-identity small,.order-total small{font-size:.75rem;color:var(--muted-foreground)}
.order-status{border-radius:999px;background:var(--muted);padding:.4rem .7rem;color:var(--foreground);font-size:.75rem;font-weight:700;white-space:nowrap}
.order-status.success{background:#dcfce7;color:#166534}.order-status.danger{background:#fee2e2;color:#991b1b}.order-status.info{background:#dbeafe;color:#1e40af}
.order-total{display:grid;gap:.2rem;justify-items:end;white-space:nowrap;font-variant-numeric:tabular-nums}
.order-total strong{font-size:.95rem;color:var(--foreground)}
.summary-chevron{color:var(--muted-foreground);transition:transform .18s ease}.history-card[open] .summary-chevron{transform:rotate(180deg)}
.order-details{border-top:1px solid var(--border);padding:1.25rem}
.details-section h3,.delivery-address h3{margin:0 0 .75rem;font-size:.85rem;color:var(--foreground)}
.item-list{margin:0;padding:0;list-style:none}.item-list li{display:flex;justify-content:space-between;gap:1rem;padding:.7rem 0;border-bottom:1px solid var(--border);font-size:.875rem}.item-list li>span{display:grid;gap:.25rem;min-width:0}.item-list li>span strong{font-weight:600;overflow-wrap:anywhere}.item-list li small,.detail-muted,.delivery-address p{color:var(--muted-foreground);font-size:.8rem;line-height:1.5}.item-list li>strong{white-space:nowrap;font-variant-numeric:tabular-nums}
.details-footer{display:flex;align-items:start;justify-content:space-between;gap:2rem;margin-top:1.25rem}.delivery-address{max-width:24rem}.delivery-address p{margin:0}.order-totals{display:grid;gap:.55rem;width:min(100%,16rem);margin:0}.order-totals>div{display:flex;justify-content:space-between;gap:1rem;color:var(--muted-foreground);font-size:.8rem}.order-totals dd{margin:0;font-variant-numeric:tabular-nums;white-space:nowrap}.order-totals .grand-total{margin-top:.35rem;padding-top:.75rem;border-top:1px solid var(--border);color:var(--foreground);font-size:.9rem;font-weight:700}
.payment-link,.history-message button,.history-empty a{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:44px;border:0;border-radius:.7rem;background:var(--primary);padding:0 1rem;color:var(--primary-foreground);font:inherit;font-size:.8rem;font-weight:700;text-decoration:none;cursor:pointer}.payment-link{margin-top:1.25rem}.payment-link:hover,.history-message button:hover,.history-empty a:hover{filter:brightness(.95)}
.history-message{margin-top:.75rem;padding:2rem;border:1px solid var(--border);border-radius:1rem;background:var(--card);color:var(--muted-foreground);box-shadow:var(--shadow-soft)}.history-message h3{margin:0 0 .5rem;color:var(--foreground);font-size:1.15rem}.history-message p{margin:0 0 1.25rem;font-size:.875rem;line-height:1.5}.history-empty{display:grid;justify-items:start}.empty-icon{display:grid;width:3rem;height:3rem;place-items:center;margin-bottom:1rem;border-radius:.75rem;background:var(--muted);color:var(--primary)}
.history-pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1rem;font-size:.8rem}.history-pagination button{display:inline-flex;align-items:center;gap:.3rem;min-height:44px;border:1px solid var(--border);border-radius:.7rem;background:var(--card);padding:0 .8rem;color:var(--foreground);font:inherit;cursor:pointer}.history-pagination button:disabled{cursor:not-allowed;opacity:.5}
@media(max-width:700px){.history-heading{padding:1rem;flex-wrap:wrap}.history-card summary{grid-template-columns:minmax(0,1fr) auto;gap:.65rem;padding:1rem}.order-status{grid-column:1;grid-row:2;justify-self:start}.order-total{grid-column:2;grid-row:1;align-self:start}.summary-chevron{grid-column:2;grid-row:2;justify-self:end}.details-footer{display:grid;gap:1.25rem}.order-totals{width:100%}.history-pagination{gap:.5rem}.history-pagination button{padding:0 .6rem}}
@media(prefers-reduced-motion:reduce){.summary-chevron{transition:none}}
</style>
