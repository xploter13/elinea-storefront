<script setup lang="ts">
import { vMask } from '~/utils/input-mask'
import { ArrowRight, ChevronDown, ChevronRight, CircleUserRound, CreditCard, House, LogIn, LogOut, MapPin, Package, Pencil, Plus, ShieldCheck, Trash2, UserRound, X } from '@lucide/vue'
import type { StorefrontPayload } from '#shared/types/storefront'
import type { Customer, CustomerAddress, CustomerAddressInput, Order, Paginated } from '@elinea/sdk'
import { ElineaButton } from '@elinea/ui'
import { canResumePayment } from '#shared/utils/checkout-payment'

type AccountSection = 'overview' | 'orders' | 'addresses' | 'profile' | 'security'
const props = defineProps<{ storefront: StorefrontPayload, section: AccountSection }>()
const theme = computed(() => props.storefront.theme)
const themeStyle = computed(() => ({
  '--sf-primary': theme.value?.primary_color || '#2563eb',
  '--sf-ink': theme.value?.secondary_color || '#111827',
  '--sf-accent': theme.value?.accent_color || '#ff7a1a',
  '--sf-body': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--sf-display': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
  '--elinea-primary': theme.value?.primary_color || '#2563eb',
  '--elinea-primary-contrast': '#ffffff',
  '--elinea-font-body': `"${theme.value?.font_family || 'Aptos'}", "Segoe UI", Arial, sans-serif`,
}))
const section = computed(() => props.section)
const title = computed(() => ({ overview: 'Sua conta, em um só lugar.', orders: 'Meus pedidos', addresses: 'Meus endereços', profile: 'Meus dados', security: 'Segurança' })[section.value])
const { data: session } = await useFetch<{ customer: Customer }>('/api/auth/me', { ignoreResponseError: true })
const customer = ref<Customer | null>(session.value?.customer || null)
const { clearCartSession } = useStorefrontCommerce(props.storefront)
const twoFactorEnabled = computed(() => Boolean(customer.value?.twoFactorEnabled))
const twoFactorSetup = ref<{ secret: string, otpauth_url: string, recovery_codes: string[] } | null>(null)
const twoFactorCode = ref('')
const securityMessage = ref('')
const securityError = ref('')
const securityPending = ref(false)
const userMenuOpen = ref(false)
const profileForm = reactive({ name: '', email: '', phone: '', cpf: '' })
const profilePending = ref(false)
const profileMessage = ref('')
const profileError = ref('')
const addressFormOpen = ref(false)
const editingAddressId = ref<number | null>(null)
const addressSaving = ref(false)
const addressError = ref('')
const addressMessage = ref('')
const addressToRemove = ref<number | null>(null)
const brazilianStates = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const blankAddress = () => ({ label: 'Casa', recipient: customer.value?.name || '', phone: customer.value?.phone || '', zipcode: '', street: '', number: '', complement: '', district: '', city: '', state: '', isDefault: false })
const addressForm = reactive(blankAddress())
const { data: initialAddresses, pending: addressesPending } = await useFetch<{ data: CustomerAddress[] }>('/api/addresses', {
  immediate: (section.value === 'addresses' || section.value === 'overview') && Boolean(customer.value),
  ignoreResponseError: true,
})
const addresses = ref<CustomerAddress[]>(initialAddresses.value?.data || [])
const currentPage = ref(1)
const { data: initialOrders, pending: ordersPending, error: ordersError } = await useFetch<Paginated<Order>>('/api/orders', {
  immediate: (section.value === 'overview' || section.value === 'orders') && Boolean(customer.value),
  query: { page: currentPage },
})
const orders = computed(() => initialOrders.value?.data || [])
const orderCount = computed(() => initialOrders.value?.meta?.total ?? orders.value.length)
const money = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
const date = (value: string | null) => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value)) : 'Data indisponível'

function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function closeUserMenu() {
  userMenuOpen.value = false
}

watch(customer, (value) => {
  if (!value) return

  profileForm.name = value.name || ''
  profileForm.email = value.email || ''
  profileForm.phone = value.phone || ''
  profileForm.cpf = value.document || ''
}, { immediate: true })

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
  customer.value = null
  closeUserMenu()
  clearCartSession()
  await navigateTo('/login')
}

async function saveProfile() {
  profilePending.value = true
  profileMessage.value = ''
  profileError.value = ''

  try {
    const result = await $fetch<{ customer: Customer }>('/api/auth/profile', {
      method: 'PATCH',
      body: {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone || null,
        cpf: profileForm.cpf || null,
      },
    })
    customer.value = result.customer
    profileMessage.value = 'Dados atualizados com sucesso.'
  } catch (error: any) {
    profileError.value = error?.data?.message || error?.message || 'Não foi possível atualizar seus dados.'
  } finally {
    profilePending.value = false
  }
}

function openNewAddress() {
  Object.assign(addressForm, blankAddress(), { isDefault: addresses.value.length === 0 })
  editingAddressId.value = null
  addressToRemove.value = null
  addressError.value = ''
  addressMessage.value = ''
  addressFormOpen.value = true
}

function editAddress(address: CustomerAddress) {
  Object.assign(addressForm, {
    label: address.label,
    recipient: address.recipient,
    phone: address.phone || '',
    zipcode: address.zipcode,
    street: address.street,
    number: address.number || '',
    complement: address.complement || '',
    district: address.district || '',
    city: address.city,
    state: address.state,
    isDefault: address.isDefault,
  })
  editingAddressId.value = address.id
  addressToRemove.value = null
  addressError.value = ''
  addressMessage.value = ''
  addressFormOpen.value = true
}

function closeAddressForm() {
  addressFormOpen.value = false
  editingAddressId.value = null
  addressError.value = ''
}

async function loadAddresses() {
  const result = await $fetch<{ data: CustomerAddress[] }>('/api/addresses')
  addresses.value = result.data
}

async function saveAddress() {
  addressSaving.value = true
  addressError.value = ''
  addressMessage.value = ''
  const body: CustomerAddressInput = {
    ...addressForm,
    phone: addressForm.phone || null,
    number: addressForm.number || undefined,
    complement: addressForm.complement || undefined,
    district: addressForm.district || undefined,
  }

  try {
    const path = editingAddressId.value ? `/api/addresses/${editingAddressId.value}` : '/api/addresses'
    await $fetch(path, { method: editingAddressId.value ? 'PUT' : 'POST', body })
    await loadAddresses()
    addressMessage.value = editingAddressId.value ? 'Endereço atualizado com sucesso.' : 'Endereço adicionado com sucesso.'
    addressFormOpen.value = false
    editingAddressId.value = null
  } catch (error: any) {
    addressError.value = error?.data?.message || error?.message || 'Não foi possível salvar o endereço.'
  } finally {
    addressSaving.value = false
  }
}

async function removeAddress(id: number) {
  if (addressToRemove.value !== id) {
    addressToRemove.value = id
    return
  }

  addressError.value = ''
  try {
    await $fetch(`/api/addresses/${id}`, { method: 'DELETE' })
    await loadAddresses()
    addressToRemove.value = null
    addressMessage.value = 'Endereço removido.'
  } catch (error: any) {
    addressError.value = error?.data?.message || error?.message || 'Não foi possível remover o endereço.'
  }
}

function formatZipcode(zipcode: string) {
  const digits = zipcode.replace(/\D/g, '')
  return digits.length === 8 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : zipcode
}
async function enableTwoFactor() {
  securityPending.value = true; securityError.value = ''
  try { const result = await $fetch<{ data: typeof twoFactorSetup.value }>('/api/auth/2fa/setup', { method: 'POST' }); twoFactorSetup.value = result.data } catch (error: any) { securityError.value = error?.data?.message || 'Não foi possível iniciar a configuração.' } finally { securityPending.value = false }
}
async function confirmTwoFactor() {
  securityPending.value = true; securityError.value = ''
  try { await $fetch('/api/auth/2fa/confirm', { method: 'POST', body: { code: twoFactorCode.value } }); customer.value = { ...customer.value!, twoFactorEnabled: true }; twoFactorCode.value = ''; securityMessage.value = 'Autenticação em duas etapas ativada. Guarde os códigos de recuperação em um local seguro.' } catch (error: any) { securityError.value = error?.data?.message || 'Código inválido.' } finally { securityPending.value = false }
}

onMounted(() => window.addEventListener('click', closeUserMenu))
onBeforeUnmount(() => window.removeEventListener('click', closeUserMenu))
</script>

<template>
  <div class="account-shell" :style="themeStyle">
    <div class="dashboard-frame">
      <header class="dashboard-topbar">
        <div class="dashboard-brand"><span class="brand-mark"><img v-if="storefront.theme?.logo_url" :src="storefront.theme.logo_url" :alt="`Logo da ${storefront.site.name}`"><template v-else>+</template></span><span><strong>{{ storefront.site.name }}</strong><small>Área do cliente</small></span></div>
        <div class="dashboard-actions"><NuxtLink class="store-action" to="/"><House :size="16" /> Voltar à loja</NuxtLink><div class="user-menu" @click.stop><ElineaButton variant="ghost" class="user-chip" :aria-expanded="userMenuOpen" aria-label="Abrir menu da conta" @click="toggleUserMenu"><span class="user-avatar">{{ customer?.name?.slice(0, 1).toUpperCase() || 'C' }}</span><span class="user-chip-copy"><strong>{{ customer?.name || 'Minha conta' }}</strong><small>{{ customer?.email || storefront.site.domain }}</small></span><ChevronDown :size="14" /></ElineaButton><div v-if="userMenuOpen" class="user-dropdown"><div class="dropdown-profile"><span class="user-avatar large">{{ customer?.name?.slice(0, 1).toUpperCase() || 'C' }}</span><span><strong>{{ customer?.name || 'Minha conta' }}</strong><small>{{ customer?.email || storefront.site.domain }}</small></span></div><NuxtLink to="/conta/dados" @click="closeUserMenu"><UserRound :size="15" /> Meus dados</NuxtLink><NuxtLink to="/conta/seguranca" @click="closeUserMenu"><ShieldCheck :size="15" /> Segurança</NuxtLink><ElineaButton variant="ghost" class="dropdown-logout" @click="logout"><LogOut :size="15" /> Sair</ElineaButton></div></div></div>
      </header>
      <main class="dashboard-main">
        <aside class="account-nav">
          <div class="workspace-label">Minha conta</div>
          <div class="avatar"><CircleUserRound :size="22"/><span><small>Área do cliente</small><strong>{{ customer?.name || 'Minha conta' }}</strong></span></div>
          <nav aria-label="Menu da conta">
            <NuxtLink to="/conta" :class="{active:section==='overview'}"><House :size="17"/>Visão geral</NuxtLink>
            <NuxtLink to="/conta/pedidos" :class="{active:section==='orders'}"><Package :size="17"/>Meus pedidos</NuxtLink>
            <NuxtLink to="/conta/enderecos" :class="{active:section==='addresses'}"><MapPin :size="17"/>Endereços</NuxtLink>
            <NuxtLink to="/conta/dados" :class="{active:section==='profile'}"><CircleUserRound :size="17"/>Meus dados</NuxtLink>
            <NuxtLink to="/conta/seguranca" :class="{active:section==='security'}"><ShieldCheck :size="17"/>Segurança</NuxtLink>
          </nav>
          <div class="sidebar-footer"><NuxtLink to="/"><ArrowRight :size="15"/> Ir para a loja</NuxtLink><ElineaButton variant="ghost" @click="logout"><LogIn :size="15"/> Sair</ElineaButton></div>
        </aside>

        <section class="account-content">
          <div class="account-heading"><div><span>Painel da conta</span><h1>{{ title }}</h1><p>Uma visão simples das suas compras, dados e preferências.</p></div><div class="heading-meta"><span class="status-dot" /> Conta ativa</div></div>

          <template v-if="section === 'overview'">
            <div class="metric-grid">
              <div class="metric-card"><span class="metric-icon blue"><Package :size="18"/></span><span><small>Pedidos realizados</small><strong>{{ ordersPending || ordersError ? '—' : orderCount }}</strong><em>Histórico completo</em></span></div>
              <div class="metric-card"><span class="metric-icon green"><MapPin :size="18"/></span><span><small>Endereços salvos</small><strong>{{ addressesPending ? '—' : addresses.length }}</strong><em>Facilite a entrega</em></span></div>
              <div class="metric-card"><span class="metric-icon violet"><ShieldCheck :size="18"/></span><span><small>Segurança da conta</small><strong>{{ twoFactorEnabled ? '2FA ativo' : 'Protegida' }}</strong><em>{{ twoFactorEnabled ? 'Camada extra habilitada' : 'Senha protegida' }}</em></span></div>
            </div>
            <div v-if="customer" class="welcome-card"><div><span>Bem-vindo de volta</span><h2>Olá, {{ customer.name }}.</h2><p>{{ customer.email }}<br>Use o painel para acompanhar seus pedidos e manter seus dados atualizados.</p></div><CircleUserRound :size="42"/></div>
            <template v-else>
              <div class="welcome-card"><div><span>Comece por aqui</span><h2>Entre para acompanhar seus pedidos.</h2><p>Use o mesmo e-mail informado nas suas compras.</p></div><LogIn :size="42"/></div>
              <NuxtLink to="/login">Entrar na conta <ArrowRight :size="17" /></NuxtLink>
            </template>
            <div class="activity-grid"><div class="panel-card"><div class="panel-heading"><span>Atividade recente</span><NuxtLink to="/conta/pedidos">Ver pedidos</NuxtLink></div><div v-if="orders.length" class="order-list"><article v-for="order in orders.slice(0, 3)" :key="order.id" class="order-row"><span><strong>Pedido {{ order.number }}</strong><small>{{ date(order.createdAt) }} · {{ order.status }}</small></span><strong>{{ money(order.total) }}</strong></article></div><div v-else class="panel-empty"><Package :size="20"/><span>{{ ordersError ? 'Não foi possível carregar os pedidos.' : 'Nenhuma atividade recente' }}</span><small v-if="!ordersError">Seus pedidos aparecerão aqui.</small></div></div><div class="panel-card"><div class="panel-heading"><span>Acesso rápido</span></div><div class="quick-links"><NuxtLink to="/conta/dados"><CircleUserRound :size="17"/>Atualizar meus dados<ArrowRight :size="15"/></NuxtLink><NuxtLink to="/conta/enderecos"><MapPin :size="17"/>Gerenciar endereços<ArrowRight :size="15"/></NuxtLink><NuxtLink to="/conta/seguranca"><ShieldCheck :size="17"/>Revisar segurança<ArrowRight :size="15"/></NuxtLink></div></div></div>
          </template>

          <template v-else>
            <section v-if="section === 'orders'" class="orders-panel"><div v-if="ordersPending" class="addresses-loading">Carregando pedidos...</div><div v-else-if="ordersError" class="empty-state"><h2>Não foi possível carregar seus pedidos.</h2><p>Tente atualizar a página.</p></div><div v-else-if="orders.length" class="order-list"><article v-for="order in orders" :key="order.id" class="order-card"><div><span>Pedido {{ order.number }}</span><strong>{{ money(order.total) }}</strong></div><p>{{ date(order.createdAt) }} · {{ order.status }}</p><ul><li v-for="item in order.items" :key="item.productId">{{ item.quantity }} × {{ item.name }}</li></ul><NuxtLink v-if="canResumePayment(order.billingStatus, order.status)" class="order-payment-link" :to="`/pagamento/${order.id}`"><CreditCard :size="17" />{{ order.billingStatus === 'failed' ? 'Tentar pagamento novamente' : 'Concluir pagamento' }}</NuxtLink></article></div><div v-else class="empty-state"><div class="state-icon"><Package :size="28"/></div><h2>Nenhum pedido por aqui.</h2><p>Quando você fizer uma compra, seus pedidos aparecerão nesta página.</p><NuxtLink to="/produtos">Explorar produtos <ChevronRight :size="17"/></NuxtLink></div><nav v-if="initialOrders?.meta && initialOrders.meta.last_page > 1" class="order-pagination" aria-label="Páginas de pedidos"><button type="button" :disabled="currentPage === 1 || ordersPending" @click="currentPage--">Anterior</button><span>Página {{ currentPage }} de {{ initialOrders.meta.last_page }}</span><button type="button" :disabled="currentPage >= initialOrders.meta.last_page || ordersPending" @click="currentPage++">Próxima</button></nav></section>
            <section v-else-if="section === 'addresses'" class="addresses-panel">
              <div class="addresses-toolbar">
                <div><h2>Locais de entrega</h2><p>Gerencie os endereços usados nas suas compras.</p></div>
                <ElineaButton v-if="!addressFormOpen" variant="primary" @click="openNewAddress"><Plus :size="17" /> Adicionar endereço</ElineaButton>
              </div>

              <form v-if="addressFormOpen" class="address-form" @submit.prevent="saveAddress">
                <div class="address-form-heading"><div><span>{{ editingAddressId ? 'Editar endereço' : 'Novo endereço' }}</span><h2>{{ editingAddressId ? 'Atualize os dados de entrega.' : 'Cadastre um local de entrega.' }}</h2></div><ElineaButton type="button" variant="ghost" class="close-address" aria-label="Fechar formulário" @click="closeAddressForm"><X :size="18" /></ElineaButton></div>
                <div class="address-fields">
                  <label>Identificação<input v-model="addressForm.label" placeholder="Casa, trabalho..." required></label>
                  <label>Nome de quem recebe<input v-model="addressForm.recipient" autocomplete="name" placeholder="Nome completo" required></label>
                  <label>Telefone<input inputmode="tel" v-mask="'phone'" v-model="addressForm.phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label>
                  <label>CEP<input v-mask="'zipcode'" v-model="addressForm.zipcode" inputmode="numeric" autocomplete="postal-code" placeholder="00000-000" required></label>
                  <label class="field-wide">Rua / avenida<input v-model="addressForm.street" autocomplete="address-line1" placeholder="Nome da rua" required></label>
                  <label>Número<input v-model="addressForm.number" autocomplete="address-line2" placeholder="123"></label>
                  <label>Complemento<input v-model="addressForm.complement" placeholder="Apto, bloco..."></label>
                  <label>Bairro<input v-model="addressForm.district" placeholder="Seu bairro"></label>
                  <label>Cidade<input v-model="addressForm.city" autocomplete="address-level2" placeholder="Sua cidade" required></label>
                  <label>Estado<select v-model="addressForm.state" autocomplete="address-level1" required><option value="" disabled>Selecione</option><option v-for="state in brazilianStates" :key="state" :value="state">{{ state }}</option></select></label>
                </div>
                <label class="default-address"><input v-model="addressForm.isDefault" type="checkbox"> Usar como meu endereço principal</label>
                <div class="address-form-actions"><ElineaButton type="button" variant="ghost" @click="closeAddressForm">Cancelar</ElineaButton><ElineaButton type="submit" variant="primary" :busy="addressSaving">{{ addressSaving ? 'Salvando...' : 'Salvar endereço' }} <ArrowRight :size="17" /></ElineaButton></div>
              </form>

              <p v-if="addressMessage" class="feedback success">{{ addressMessage }}</p>
              <p v-if="addressError" class="feedback error">{{ addressError }}</p>
              <div v-if="addressesPending" class="addresses-loading">Carregando endereços...</div>
              <div v-else-if="addresses.length" class="address-grid">
                <article v-for="address in addresses" :key="address.id" class="address-card">
                  <div class="address-card-heading"><span class="address-icon"><MapPin :size="18" /></span><div><h3>{{ address.label }}</h3><span v-if="address.isDefault" class="default-badge">Principal</span></div></div>
                  <div class="address-copy"><strong>{{ address.recipient }}</strong><p>{{ address.street }}<template v-if="address.number">, {{ address.number }}</template><br><template v-if="address.complement">{{ address.complement }}<br></template><template v-if="address.district">{{ address.district }} · </template>{{ address.city }} / {{ address.state }}<br>CEP {{ formatZipcode(address.zipcode) }}</p><small v-if="address.phone">{{ address.phone }}</small></div>
                  <div class="address-card-actions"><ElineaButton variant="outline" @click="editAddress(address)"><Pencil :size="15" /> Editar</ElineaButton><ElineaButton variant="danger" @click="removeAddress(address.id)"><Trash2 :size="15" /> {{ addressToRemove === address.id ? 'Confirmar exclusão' : 'Excluir' }}</ElineaButton><ElineaButton v-if="addressToRemove === address.id" variant="ghost" @click="addressToRemove = null">Cancelar</ElineaButton></div>
                </article>
              </div>
              <div v-else-if="!addressFormOpen" class="empty-state address-empty"><div class="state-icon"><MapPin :size="28"/></div><h2>Você ainda não salvou endereços.</h2><p>Use o botão no topo da página para cadastrar seu primeiro local de entrega.</p></div>
            </section>
            <div v-else-if="section === 'security'" class="security-panel"><div class="security-row"><div><h2>Autenticação em duas etapas</h2><p>{{ twoFactorEnabled ? 'Sua conta está protegida por um código adicional no login.' : 'Adicione uma camada extra de proteção à sua conta.' }}</p></div><span :class="['security-status', {enabled:twoFactorEnabled}]">{{ twoFactorEnabled ? 'Ativa' : 'Inativa' }}</span></div><ElineaButton v-if="!twoFactorEnabled && !twoFactorSetup" variant="primary" :busy="securityPending" @click="enableTwoFactor">Habilitar 2FA</ElineaButton><div v-if="twoFactorSetup" class="security-setup"><template v-if="!twoFactorEnabled"><p>Adicione esta chave no seu aplicativo autenticador:</p><code>{{ twoFactorSetup.secret }}</code><label>Código de confirmação<input v-mask="'otp'" v-model="twoFactorCode" inputmode="numeric" autocomplete="one-time-code" placeholder="000000"></label><ElineaButton variant="primary" :busy="securityPending" @click="confirmTwoFactor">Confirmar ativação</ElineaButton></template><template v-else><p>Guarde seus códigos de recuperação. Eles não serão exibidos novamente.</p><ul><li v-for="code in twoFactorSetup.recovery_codes" :key="code"><code>{{ code }}</code></li></ul><ElineaButton variant="ghost" @click="twoFactorSetup = null">Já salvei os códigos</ElineaButton></template></div><p v-if="securityMessage" class="feedback success">{{ securityMessage }}</p><p v-if="securityError" class="feedback error">{{ securityError }}</p></div>
            <form v-else class="profile-form" @submit.prevent="saveProfile"><div class="field-row"><label>Nome<input v-model="profileForm.name" autocomplete="name" placeholder="Seu nome" required></label><label>CPF<input v-mask="'cpf'" v-model="profileForm.cpf" inputmode="numeric" placeholder="000.000.000-00"></label></div><label>E-mail<input v-model="profileForm.email" type="email" autocomplete="email" placeholder="voce@email.com" required></label><label>Telefone<input inputmode="tel" v-mask="'phone'" v-model="profileForm.phone" type="tel" autocomplete="tel" placeholder="(00) 00000-0000"></label><ElineaButton type="submit" variant="primary" block :busy="profilePending">{{ profilePending ? 'Salvando...' : 'Salvar alterações' }} <ArrowRight :size="17"/></ElineaButton><p v-if="profileMessage" class="feedback success">{{ profileMessage }}</p><p v-if="profileError" class="feedback error">{{ profileError }}</p></form>
          </template>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
:global(*){box-sizing:border-box}.account-shell{min-height:100dvh;background:#fff;color:#111827;font-family:"Aptos","Segoe UI",Arial,sans-serif}.account-layout{display:grid;grid-template-columns:286px minmax(0,820px);gap:clamp(42px,7vw,104px);max-width:1260px;margin:auto;padding:62px clamp(18px,4vw,56px) 104px}.account-nav{align-self:start;position:sticky;top:102px;padding:18px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.shop-link{display:flex;align-items:center;gap:8px;margin-bottom:22px;color:#6b7280;font-size:12px;font-weight:650;text-decoration:none}.shop-link:hover{color:#2563eb}.avatar{display:flex;align-items:center;gap:12px;padding:18px;border-radius:12px;background:#eff6ff;color:#2563eb}.avatar span{display:grid;gap:3px}.avatar small{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280}.avatar strong{color:#111827}.account-nav nav{display:grid;gap:5px;padding-top:16px}.account-nav nav a{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:10px;color:#6b7280;font-size:13px;font-weight:650;text-decoration:none;transition:background .2s,color .2s,transform .2s}.account-nav nav a:hover{background:#f8fafc;color:#2563eb;transform:translateX(2px)}.account-nav nav a.active{background:#eff6ff;color:#2563eb}.account-heading{padding:36px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.account-heading>span,.welcome-card span{font:700 11px ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:#2563eb}.account-heading h1{margin:10px 0 12px;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:clamp(42px,5.8vw,72px);font-weight:850;line-height:.94;letter-spacing:-.052em;text-wrap:balance}.account-heading p{margin:0;color:#6b7280}.welcome-card{display:flex;justify-content:space-between;gap:30px;margin-top:22px;padding:32px;border:1px solid #dbeafe;border-radius:14px;background:#eff6ff;color:#2563eb}.welcome-card h2{max-width:470px;margin:9px 0;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:30px;font-weight:800;line-height:1.04;letter-spacing:-.035em;color:#111827}.welcome-card p{margin:0;color:#64748b;font-size:13px}.login-form,.profile-form{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;padding:30px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.04)}.login-form label,.profile-form label{display:grid;gap:8px;color:#374151;font-size:12px;font-weight:650}.login-form input,.profile-form input{height:52px;padding:0 15px;border:1px solid #d1d5db;border-radius:10px;background:#fff;color:#111827;font:inherit;outline:none;transition:border-color .2s,box-shadow .2s}.login-form input:focus,.profile-form input:focus{border-color:#2563eb;box-shadow:0 0 0 4px #dbeafe}.login-form button,.empty-state button{display:flex;height:52px;align-items:center;justify-content:center;gap:8px;border:0;border-radius:10px;color:#fff;font-weight:750}.text-button{background:transparent!important;color:#2563eb!important}.feedback{padding:13px 16px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:12px}.empty-state{display:grid;justify-items:start;margin-top:22px;padding:56px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;box-shadow:0 18px 44px rgba(15,23,42,.05)}.state-icon{display:grid;width:60px;height:60px;place-items:center;border-radius:14px;background:#eff6ff;color:#2563eb}.empty-state h2{margin:25px 0 10px;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:33px;font-weight:800;letter-spacing:-.04em}.empty-state p{max-width:500px;margin:0 0 26px;color:#6b7280;line-height:1.65}.empty-state a{display:flex;align-items:center;gap:6px;color:#2563eb;font-size:13px;font-weight:750;text-decoration:none}.empty-state button{padding:0 20px;opacity:.62}.empty-state small,.profile-form>small{margin-top:10px;color:#6b7280}.profile-form{grid-template-columns:1fr}.profile-form .field-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.profile-form input:disabled{background:#f8fafc;color:#8a8f98}@media(max-width:780px){.account-layout{grid-template-columns:1fr;padding-top:30px}.account-nav{position:static;display:grid}.avatar{display:none}.account-nav nav{display:flex;overflow:auto;padding-bottom:5px}.account-nav nav a{white-space:nowrap}.shop-link{margin-bottom:12px}.account-heading h1{font-size:48px}}@media(max-width:560px){.account-heading{padding:26px 18px}.login-form{grid-template-columns:1fr;padding:20px}.profile-form .field-row{grid-template-columns:1fr}.welcome-card{padding:23px}.welcome-card>svg{display:none}.empty-state{padding:30px 22px}}
.logout-button{height:38px;margin-top:18px;padding:0 16px;border:1px solid #bfdbfe;border-radius:999px;background:#fff;color:#2563eb;font-size:12px;font-weight:750;cursor:pointer}.logout-button:hover{background:#eff6ff}.login-form button:disabled{cursor:wait;opacity:.6}.feedback.error{background:#fef2f2;color:#b91c1c}
.account-shell{background:#f8fafc}.account-layout{grid-template-columns:250px minmax(0,1fr);gap:36px;max-width:1240px;padding-top:46px}.account-nav{top:98px;padding:14px;border-color:#e4e7ec;border-radius:12px;box-shadow:0 12px 30px rgba(15,23,42,.04)}.avatar{padding:15px;border-radius:9px}.account-nav nav{padding-top:12px}.account-nav nav a{border-radius:8px}.account-content{min-width:0}.account-heading{padding:30px 34px;border-radius:12px;box-shadow:0 12px 30px rgba(15,23,42,.04)}.account-heading h1{font-size:clamp(38px,5vw,62px)}.welcome-card{align-items:center;border-radius:12px;box-shadow:0 12px 30px rgba(37,99,235,.06)}.login-form,.profile-form,.empty-state{border-radius:12px;box-shadow:0 12px 30px rgba(15,23,42,.04)}@media(max-width:780px){.account-layout{gap:20px}.account-heading{padding:26px 22px}}
.security-panel{display:grid;gap:22px;margin-top:22px;padding:30px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.04)}.security-row{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}.security-row h2{margin:0 0 8px;font-size:22px}.security-row p,.security-setup p{margin:0;color:#6b7280;font-size:13px;line-height:1.5}.security-status{padding:6px 10px;border-radius:999px;background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:750}.security-status.enabled{background:#dcfce7;color:#15803d}.security-button{width:max-content;height:44px;padding:0 18px;border:0;border-radius:999px;background:#2563eb;color:#fff;font-size:13px;font-weight:750}.security-button:disabled{opacity:.6}.security-setup{display:grid;gap:14px;padding-top:20px;border-top:1px solid #e5e7eb}.security-setup code{padding:12px;border-radius:8px;background:#f8fafc;color:#111827;font-size:14px;word-break:break-all}.security-setup label{display:grid;gap:8px;font-size:12px;font-weight:700}.security-setup input{height:46px;padding:0 12px;border:1px solid #d1d5db;border-radius:9px;font:inherit}
.account-shell{
  --background:#f8f9fa;--foreground:var(--sf-ink);--surface:#fff;--surface-2:#f8fafc;
  --card:#fff;--popover:#fff;--popover-foreground:var(--sf-ink);
  --primary:var(--sf-primary);--primary-foreground:#fff;--muted:#f1f5f9;
  --muted-foreground:#64748b;--accent:#eff6ff;--border:#e5e7eb;
  --input:#fff;--success:#15803d;--destructive:#b91c1c;
  --sidebar:#fff;--sidebar-foreground:var(--sf-ink);--sidebar-accent:#eff6ff;
  --gradient-primary:linear-gradient(135deg,var(--sf-primary),var(--sf-primary));
  --gradient-card:linear-gradient(180deg,#fff,#fafbfc);
  --shadow-soft:0 1px 1px #0f172a08,0 12px 28px -26px #0f172a4d;
  --shadow-control:0 1px 2px #0f172a12;
  --shadow-popover:0 18px 40px -26px #0f172a60;
  --shadow-topbar:0 1px 0 #0f172a08;
  --shadow-sidebar:0 20px 27px #0000000d;
  --shadow-menu-active:inset 0 0 0 1px #ffffffb8;
  --shadow-glow:0 8px 18px -14px var(--sf-primary);
  --font-sans:var(--sf-body);--font-display:var(--sf-display);
  --elinea-surface:#fff;--elinea-border:#e5e7eb;--elinea-text:var(--sf-ink);
  --elinea-danger:#b91c1c;
}
.brand-mark img{display:block;width:100%;height:100%;border-radius:inherit;background:white;object-fit:contain}
.orders-panel{margin-top:1rem}
.order-list{display:grid;gap:.75rem;margin-top:1rem}
.order-row,.order-card{border:1px solid var(--border);border-radius:.85rem;background:var(--card);padding:1rem}
.order-row{display:flex;align-items:center;justify-content:space-between;gap:1rem}
.order-row span{display:grid;gap:.25rem}
.order-row small,.order-card p,.order-card li{color:var(--muted-foreground);font-size:13px}
.order-card>div{display:flex;justify-content:space-between;gap:1rem;font-weight:650}
.order-card p{margin:.35rem 0 .8rem}
.order-card ul{margin:0;padding-left:1.25rem}
.order-payment-link{display:inline-flex;min-height:42px;align-items:center;gap:.5rem;margin-top:1rem;border-radius:.75rem;background:var(--gradient-primary);padding:0 1rem;color:var(--primary-foreground);font-size:13px;font-weight:700;text-decoration:none;box-shadow:var(--shadow-glow)}
.order-payment-link:hover{filter:brightness(.97)}
.order-pagination{display:flex;align-items:center;justify-content:center;gap:1rem;margin-top:1.25rem;font-size:13px}
.order-pagination button{min-height:44px;border:1px solid var(--border);border-radius:.7rem;background:var(--card);padding:0 1rem;color:var(--foreground);cursor:pointer}
.order-pagination button:disabled{cursor:not-allowed;opacity:.5}
.account-shell :is(a,button,input,select):focus-visible{outline:3px solid var(--primary);outline-offset:2px}
@media(max-width:700px){.order-row,.order-card>div{align-items:flex-start;flex-direction:column}}
</style>

<style>
.dashboard-frame{min-height:100dvh;background:var(--background)}.dashboard-topbar{position:sticky;top:0;z-index:20;display:flex;height:4.25rem;align-items:center;gap:1rem;border-bottom:1px solid var(--border);background:color-mix(in oklch,var(--surface) 92%,transparent);padding:0 clamp(1rem,3vw,2rem);box-shadow:var(--shadow-topbar);backdrop-filter:blur(18px)}.dashboard-brand{display:flex;min-width:14rem;align-items:center;gap:.65rem}.dashboard-brand>span:last-child{display:grid;line-height:1.1}.dashboard-brand strong{font-size:.9rem;font-weight:700}.dashboard-brand small{margin-top:.25rem;color:var(--muted-foreground);font-size:.65rem}.brand-mark{display:grid;height:2rem;width:2rem;place-items:center;border-radius:.65rem;background:var(--gradient-primary);color:var(--primary-foreground);font-size:1.4rem;font-weight:700;box-shadow:var(--shadow-glow)}.dashboard-search{position:relative;display:flex;max-width:32rem;flex:1;align-items:center}.dashboard-search span{position:absolute;left:.75rem;color:var(--muted-foreground);font-size:1.3rem}.dashboard-search input{height:2.5rem;width:100%;border:1px solid var(--border);border-radius:.75rem;background:var(--input);padding:0 1rem 0 2.3rem;color:var(--foreground);font-size:.8rem;outline:0}.dashboard-search input:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 16%,transparent)}.dashboard-actions{display:flex;align-items:center;gap:.5rem;margin-left:auto}.store-action,.icon-action{display:inline-flex;height:2.35rem;align-items:center;gap:.4rem;border:1px solid var(--border);border-radius:.7rem;background:var(--input);padding:0 .75rem;color:var(--foreground);font-size:.75rem;text-decoration:none}.icon-action{width:2.35rem;justify-content:center;padding:0}.store-action:hover,.icon-action:hover{background:var(--accent)}.user-chip{display:flex;align-items:center;gap:.5rem;padding-left:.35rem}.user-avatar{display:grid;height:2rem;width:2rem;place-items:center;border-radius:999px;background:color-mix(in oklch,var(--primary) 18%,var(--surface));color:var(--primary);font-size:.8rem;font-weight:700}.user-chip-copy{display:grid;line-height:1.1}.user-chip-copy strong{max-width:9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.75rem}.user-chip-copy small{margin-top:.2rem;color:var(--muted-foreground);font-size:.65rem}.dashboard-main{display:grid;grid-template-columns:15.5rem minmax(0,1fr);gap:1.5rem;max-width:1440px;margin:0 auto;padding:1.5rem clamp(1rem,3vw,2rem) 4rem}.account-nav{position:sticky;top:5.75rem;align-self:start;min-height:calc(100dvh - 7.25rem);display:flex;flex-direction:column;padding:.75rem;border:1px solid color-mix(in oklch,var(--border) 72%,transparent);border-radius:1rem;background:var(--sidebar);box-shadow:var(--shadow-sidebar)}.workspace-label{padding:.5rem .75rem;color:var(--muted-foreground);font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.account-nav .avatar{margin:.25rem 0 .5rem}.account-nav nav{display:grid;gap:.2rem;padding-top:.5rem}.account-nav nav a{font-size:.75rem}.sidebar-footer{display:grid;gap:.25rem;margin-top:auto;padding-top:1rem;border-top:1px solid var(--border)}.sidebar-footer a,.sidebar-footer button{display:flex;align-items:center;gap:.5rem;border:0;border-radius:.65rem;background:transparent;padding:.65rem .75rem;color:var(--muted-foreground);font:inherit;font-size:.72rem;text-decoration:none;cursor:pointer}.sidebar-footer a:hover,.sidebar-footer button:hover{background:var(--sidebar-accent);color:var(--sidebar-foreground)}.account-content{min-width:0}.account-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.heading-meta{display:flex;align-items:center;gap:.4rem;color:var(--muted-foreground);font-size:.7rem;white-space:nowrap}.status-dot{height:.45rem;width:.45rem;border-radius:999px;background:var(--success);box-shadow:0 0 0 3px color-mix(in oklch,var(--success) 15%,transparent)}.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin-top:1rem}.metric-card{display:flex;align-items:flex-start;gap:.8rem;border:1px solid var(--border);border-radius:1rem;background:var(--card);padding:1rem;box-shadow:var(--shadow-soft)}.metric-card>span:last-child{display:grid;min-width:0}.metric-card small{color:var(--muted-foreground);font-size:.7rem}.metric-card strong{margin-top:.25rem;font-size:1.35rem;font-weight:700}.metric-card em{margin-top:.2rem;color:var(--muted-foreground);font-size:.65rem;font-style:normal}.metric-icon{display:grid;height:2.25rem;width:2.25rem;flex:none;place-items:center;border-radius:.65rem}.metric-icon.blue{background:color-mix(in oklch,var(--primary) 12%,var(--surface));color:var(--primary)}.metric-icon.green{background:color-mix(in oklch,var(--success) 12%,var(--surface));color:var(--success)}.metric-icon.violet{background:color-mix(in oklch,#8b5cf6 12%,var(--surface));color:#8b5cf6}.activity-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:1rem;margin-top:1rem}.panel-card{border:1px solid var(--border);border-radius:1rem;background:var(--card);padding:1.25rem;box-shadow:var(--shadow-soft)}.panel-heading{display:flex;align-items:center;justify-content:space-between;font-size:.8rem;font-weight:600}.panel-heading a{color:var(--primary);font-size:.7rem;text-decoration:none}.panel-empty{display:grid;justify-items:center;gap:.4rem;padding:2.5rem 1rem;color:var(--muted-foreground);text-align:center}.panel-empty span{font-size:.75rem}.panel-empty small{font-size:.68rem}.quick-links{display:grid;gap:.35rem;margin-top:1rem}.quick-links a{display:flex;align-items:center;gap:.6rem;border-radius:.65rem;padding:.7rem;color:var(--muted-foreground);font-size:.72rem;text-decoration:none}.quick-links a svg:last-child{margin-left:auto}.quick-links a:hover{background:var(--accent);color:var(--foreground)}
.account-shell{background:var(--background);color:var(--foreground);font-family:var(--font-sans)}
.account-shell .shared-header{border-color:var(--border);background:color-mix(in oklch,var(--surface) 92%,transparent);box-shadow:var(--shadow-topbar);backdrop-filter:blur(18px)}
.account-layout{grid-template-columns:248px minmax(0,1fr);gap:1.5rem;max-width:1360px;padding:2rem clamp(1rem,3vw,2rem) 4rem}
.account-nav{top:6.5rem;padding:.75rem;border-color:color-mix(in oklch,var(--border) 72%,transparent);border-radius:1rem;background:var(--sidebar);box-shadow:var(--shadow-sidebar)}
.shop-link{margin-bottom:.75rem;padding:.65rem .75rem;color:color-mix(in oklch,var(--sidebar-foreground) 65%,transparent)}
.shop-link:hover{background:var(--sidebar-accent);color:var(--sidebar-foreground)}
.avatar{padding:.85rem;border-radius:.75rem;background:var(--sidebar-accent);color:var(--primary)}.avatar strong{color:var(--sidebar-foreground)}.avatar small{color:color-mix(in oklch,var(--sidebar-foreground) 52%,transparent)}
.account-nav nav{gap:.25rem;padding-top:.75rem}.account-nav nav a{border-radius:.75rem;color:color-mix(in oklch,var(--sidebar-foreground) 76%,transparent);font-weight:500}.account-nav nav a:hover{background:color-mix(in oklch,var(--sidebar-foreground) 7%,transparent);color:var(--sidebar-foreground);transform:none}.account-nav nav a.active{background:color-mix(in oklch,var(--sidebar-foreground) 8%,transparent);color:var(--sidebar-foreground);box-shadow:var(--shadow-menu-active)}.account-nav nav a.active svg{color:var(--primary)}
.account-heading,.welcome-card,.login-form,.profile-form,.empty-state,.security-panel{border-color:color-mix(in oklch,var(--border) 70%,transparent);border-radius:1rem;background:var(--card);box-shadow:var(--shadow-soft)}
.account-heading{padding:1.75rem 2rem}.account-heading>span,.welcome-card span{color:var(--primary)}.account-heading h1{margin:.45rem 0 .55rem;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);font-weight:700;line-height:1.05;letter-spacing:-.03em}.account-heading p,.welcome-card p,.empty-state p{color:var(--muted-foreground)}
.welcome-card{margin-top:1rem;padding:1.5rem;background:var(--gradient-card)}.welcome-card h2,.empty-state h2,.security-row h2{font-family:var(--font-display);color:var(--foreground);letter-spacing:-.02em}
.login-form,.profile-form{padding:1.5rem;background:var(--surface)}.login-form input,.profile-form input,.security-setup input{border-color:var(--border);background:var(--input);color:var(--foreground);box-shadow:var(--shadow-control)}.login-form button,.empty-state button,.security-button{border-radius:.75rem;background:var(--gradient-primary);color:var(--primary-foreground);box-shadow:var(--shadow-glow)}
.empty-state,.security-panel{padding:2rem;background:var(--surface)}.state-icon{background:color-mix(in oklch,var(--primary) 10%,var(--surface));color:var(--primary)}.security-status{background:var(--muted);color:var(--muted-foreground)}.security-status.enabled{background:color-mix(in oklch,var(--success) 18%,var(--surface));color:var(--success)}.security-setup code{background:var(--surface-2);color:var(--foreground)}
@media(max-width:780px){.account-layout{padding-top:1rem}.account-nav{background:var(--surface)}.account-nav nav a{color:var(--muted-foreground)}.account-nav nav a.active{background:color-mix(in oklch,var(--primary) 12%,var(--surface));color:var(--primary)}}
@media(max-width:980px){.dashboard-brand{min-width:auto}.dashboard-brand small,.user-chip-copy,.store-action{display:none}.dashboard-main{grid-template-columns:13rem  minmax(0,1fr)}.metric-grid{grid-template-columns:1fr}.activity-grid{grid-template-columns:1fr}}
@media(max-width:700px){.dashboard-topbar{height:auto;min-height:4.25rem;flex-wrap:wrap;padding-block:.7rem}.dashboard-search{order:3;flex-basis:100%;max-width:none}.dashboard-main{display:block;padding-top:1rem}.account-nav{position:static;min-height:0;margin-bottom:1rem}.sidebar-footer{display:none}.account-nav nav{display:flex;overflow:auto}.account-nav nav a{white-space:nowrap}.account-heading{padding:1.25rem}.heading-meta{display:none}.activity-grid{grid-template-columns:1fr}}
.user-menu{position:relative}.user-chip{display:flex;align-items:center;gap:.5rem;border:1px solid var(--border);border-radius:.75rem;background:var(--input);padding:.3rem .55rem .3rem .35rem;color:var(--foreground);cursor:pointer;text-align:left}.user-chip:hover{background:var(--accent)}.user-chip .user-chip-copy{flex:1}.user-menu>.user-chip>svg{color:var(--muted-foreground)}.user-dropdown{position:absolute;right:0;top:calc(100% + .55rem);z-index:50;width:17rem;overflow:hidden;border:1px solid var(--border);border-radius:1rem;background:var(--popover);color:var(--popover-foreground);box-shadow:var(--shadow-popover)}.dropdown-profile{display:flex;align-items:center;gap:.7rem;border-bottom:1px solid var(--border);padding:1rem}.dropdown-profile>span:last-child{display:grid;min-width:0}.dropdown-profile strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.78rem}.dropdown-profile small{margin-top:.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted-foreground);font-size:.68rem}.user-avatar.large{height:2.5rem;width:2.5rem;flex:none}.user-dropdown>a,.user-dropdown>button{display:flex;width:100%;align-items:center;gap:.55rem;border:0;background:transparent;padding:.75rem 1rem;color:var(--foreground);font:inherit;font-size:.75rem;text-align:left;text-decoration:none;cursor:pointer}.user-dropdown>a:hover,.user-dropdown>button:hover{background:var(--accent)}.user-dropdown .dropdown-logout{border-top:1px solid var(--border);color:var(--destructive)}
.status-dot{background:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 15%,transparent)}.metric-icon.green{background:color-mix(in oklch,var(--primary) 12%,var(--surface));color:var(--primary)}.security-status.enabled{background:color-mix(in oklch,var(--primary) 12%,var(--surface));color:var(--primary)}
.dashboard-main{width:100%;max-width:none;grid-template-columns:minmax(220px,16rem) minmax(0,1fr);padding-inline:clamp(1rem,4vw,3.5rem)}.account-content{width:100%;max-width:none}.account-heading,.metric-card,.panel-card,.welcome-card,.empty-state,.profile-form,.security-panel{width:100%}
.account-shell .elinea-button{display:inline-flex;height:auto;min-height:42px;align-items:center;justify-content:center;gap:8px;padding:0 18px;border:1px solid transparent;border-radius:999px;font:650 13px/1 var(--elinea-font-body);opacity:1;cursor:pointer;transition:background .2s,color .2s,border-color .2s,transform .2s}.account-shell .elinea-button:hover:not(:disabled){transform:translateY(-1px)}.account-shell .elinea-button:disabled{cursor:not-allowed;opacity:.6}.account-shell .elinea-button--primary{background:var(--elinea-primary);color:var(--elinea-primary-contrast);box-shadow:none}.account-shell .elinea-button--ghost{border-color:var(--elinea-border);background:transparent;color:var(--elinea-text);box-shadow:none}.account-shell .profile-form>.elinea-button{width:100%;margin-top:8px;opacity:1}.account-shell .security-panel>.elinea-button,.account-shell .security-setup>.elinea-button{width:max-content}.account-shell .icon-action.elinea-button{height:2.35rem;min-height:2.35rem;width:2.35rem;padding:0;border-radius:.7rem;background:var(--input);color:var(--foreground)}.account-shell .user-chip.elinea-button{height:auto;min-height:2.35rem;justify-content:flex-start;border-color:var(--border);border-radius:.75rem;background:var(--input);padding:.3rem .55rem .3rem .35rem;color:var(--foreground)}.account-shell .user-chip.elinea-button:hover,.account-shell .icon-action.elinea-button:hover{background:var(--accent)}.account-shell .dropdown-logout.elinea-button{min-height:0;justify-content:flex-start;border-width:1px 0 0;border-color:var(--border);border-radius:0;padding:.75rem 1rem;color:var(--destructive)}.account-shell .sidebar-footer .elinea-button{min-height:0;justify-content:flex-start;border:0;border-radius:.65rem;padding:.65rem .75rem;color:var(--muted-foreground)}
.account-shell{font-size:16px}.dashboard-brand strong{font-size:14px}.dashboard-brand small,.user-chip-copy small,.dropdown-profile small{font-size:12px}.dashboard-search input,.store-action{font-size:14px}.user-chip-copy strong,.dropdown-profile strong{font-size:14px}.workspace-label{font-size:11px}.avatar small{font-size:11px}.avatar strong{font-size:14px}.account-nav nav a,.sidebar-footer a,.account-shell .sidebar-footer .elinea-button{font-size:14px}.account-heading>div>span,.welcome-card span{font-size:11px}.account-heading h1{font-size:clamp(24px,2vw,28px);font-weight:600;line-height:1.2;letter-spacing:-.02em}.account-heading p,.welcome-card p,.empty-state p,.security-row p,.security-setup p{font-size:14px;line-height:1.55}.heading-meta,.metric-card small,.metric-card em,.panel-heading a,.panel-empty small,.security-status{font-size:12px}.metric-card strong{font-size:20px}.panel-heading{font-size:14px}.panel-empty span,.quick-links a,.user-dropdown>a,.account-shell .dropdown-logout.elinea-button{font-size:14px}.welcome-card h2,.empty-state h2,.security-row h2{font-size:24px;line-height:1.25}.login-form label,.profile-form label,.security-setup label{font-size:14px}.login-form input,.profile-form input,.security-setup input{font-size:14px}.feedback,.empty-state small{font-size:13px}.account-shell .elinea-button{font-size:14px}
.dashboard-brand strong,.account-heading h1,.welcome-card h2,.empty-state h2,.security-row h2,.panel-heading,.metric-card strong{font-family:var(--sf-display,"Nunito Sans","Segoe UI",sans-serif)}
.user-chip>.user-chip-copy small{font-weight:400}
.addresses-panel{display:grid;gap:1rem;margin-top:1rem}.addresses-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;border:1px solid var(--border);border-radius:1rem;background:var(--card);padding:1.25rem 1.5rem;box-shadow:var(--shadow-soft)}.addresses-toolbar h2,.address-form-heading h2{margin:0;font-family:var(--sf-display,"Nunito Sans","Segoe UI",sans-serif);font-size:20px;font-weight:600;line-height:1.25}.addresses-toolbar p{margin:.3rem 0 0;color:var(--muted-foreground);font-size:14px}.address-form{display:grid;gap:1.25rem;border:1px solid var(--border);border-radius:1rem;background:var(--surface);padding:1.5rem;box-shadow:var(--shadow-soft)}.address-form-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}.address-form-heading span{display:block;margin-bottom:.35rem;color:var(--primary);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}.account-shell .close-address.elinea-button{width:42px;padding:0}.address-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.address-fields label{display:grid;gap:.5rem;color:var(--foreground);font-size:14px;font-weight:600}.address-fields .field-wide{grid-column:1/-1}.address-fields input,.address-fields select{width:100%;height:48px;border:1px solid var(--border);border-radius:.75rem;background:var(--input);padding:0 .85rem;color:var(--foreground);font:400 14px var(--font-sans);outline:0;box-shadow:var(--shadow-control);transition:border-color .2s,box-shadow .2s}.address-fields input:focus,.address-fields select:focus{border-color:var(--primary);box-shadow:0 0 0 3px color-mix(in oklch,var(--primary) 16%,transparent)}.default-address{display:flex;align-items:center;gap:.6rem;width:max-content;color:var(--foreground);font-size:14px;font-weight:500}.default-address input{width:16px;height:16px;accent-color:var(--primary)}.address-form-actions{display:flex;justify-content:flex-end;gap:.65rem;border-top:1px solid var(--border);padding-top:1.1rem}.address-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.address-card{display:flex;min-height:245px;flex-direction:column;border:1px solid var(--border);border-radius:1rem;background:var(--card);padding:1.25rem;box-shadow:var(--shadow-soft)}.address-card-heading{display:flex;align-items:center;gap:.75rem}.address-card-heading>div{display:flex;min-width:0;align-items:center;gap:.6rem}.address-card h3{overflow:hidden;margin:0;text-overflow:ellipsis;white-space:nowrap;font-family:var(--sf-display,"Nunito Sans","Segoe UI",sans-serif);font-size:17px;font-weight:650}.address-icon{display:grid;width:38px;height:38px;flex:none;place-items:center;border-radius:.7rem;background:color-mix(in oklch,var(--primary) 11%,var(--surface));color:var(--primary)}.default-badge{display:inline-flex;min-height:22px;align-items:center;border-radius:999px;background:color-mix(in oklch,var(--primary) 11%,var(--surface));padding:0 .55rem;color:var(--primary);font-size:11px;font-weight:700}.address-copy{margin-top:1rem}.address-copy strong{font-size:14px;font-weight:650}.address-copy p{margin:.45rem 0 0;color:var(--muted-foreground);font-size:14px;line-height:1.55}.address-copy small{display:block;margin-top:.4rem;color:var(--muted-foreground);font-size:13px}.address-card-actions{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:auto;padding-top:1rem}.account-shell .address-card-actions .elinea-button{min-height:38px;padding:0 14px;font-size:13px}.account-shell .elinea-button--outline{border-color:var(--elinea-primary);background:var(--elinea-surface);color:var(--elinea-primary);box-shadow:none}.account-shell .elinea-button--danger{background:var(--elinea-danger);color:#fff;box-shadow:none}.addresses-loading{display:grid;min-height:180px;place-items:center;border:1px solid var(--border);border-radius:1rem;background:var(--card);color:var(--muted-foreground);font-size:14px}.address-empty{margin-top:0}.addresses-panel>.feedback{margin:0}.feedback.success{background:color-mix(in oklch,var(--primary) 8%,var(--surface));color:var(--primary)}
@media(max-width:640px){.account-heading h1{font-size:24px}.welcome-card h2,.empty-state h2,.security-row h2{font-size:21px}}
@media(max-width:760px){.addresses-toolbar{align-items:flex-start;flex-direction:column}.address-fields,.address-grid{grid-template-columns:1fr}.address-fields .field-wide{grid-column:auto}.address-form-actions{flex-direction:column-reverse}.address-form-actions .elinea-button,.addresses-toolbar .elinea-button{width:100%}.address-card{min-height:0}}
</style>
