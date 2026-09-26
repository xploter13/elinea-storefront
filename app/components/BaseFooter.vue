<script setup lang="ts">
import { Mail, Phone } from '@lucide/vue'
import type { StorefrontBranding } from '#shared/types/branding'
defineProps<{ storeName: string, theme: StorefrontBranding }>()

const footerGroups = [
  { title: 'Atendimento', links: ['Minha conta', 'Meus pedidos', 'Trocas e devoluções', 'Entrega', 'Reembolso', 'Privacidade', 'Termos e condições'] },
  { title: 'Venda conosco', links: ['Marketplace', 'Seus serviços', 'Venda para empresas', 'Aplicativos', 'Programa afiliado', 'Publique conosco'] },
  { title: 'Conheça a loja', links: ['Sobre nós', 'Carreiras', 'Relação com clientes', 'Dispositivos', 'Avaliações', 'Responsabilidade social'] },
  { title: 'Nossas lojas', links: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Brasília', 'Salvador', 'Mapa do site'] },
  { title: 'Categorias', links: ['Beleza e saúde', 'Eletrônicos', 'Casa e decoração', 'Esporte e lazer', 'Kids e bebê', 'Todos os produtos'] },
  { title: 'Minha conta', links: ['Entrar', 'Criar conta', 'Lista de desejos', 'Carrinho', 'Comparar produtos', 'Notificações'] },
  { title: 'Central de ajuda', links: ['Contato', 'Perguntas frequentes', 'Encontre uma loja', 'Informações de envio', 'Pagamentos', 'Guia de tamanhos'] },
  { title: 'Internacional', links: ['Portugal', 'Estados Unidos', 'Canadá', 'Espanha', 'Dubai', 'Singapura', 'Mapa global'] }
]
const footerDestination = (label: string) => ({
  'Minha conta': '/conta',
  'Meus pedidos': '/conta/pedidos',
  Entrar: '/login',
  'Criar conta': '/cadastro',
  Carrinho: '/carrinho',
})[label] || '/produtos'
</script>

<template>
  <footer class="retail-footer">
    <div class="footer-watermark" aria-hidden="true">Siga {{ storeName }}</div>
    <div class="footer-main">
      <section class="footer-brand" aria-label="Informações da loja">
        <div class="brand-lockup">
          <span class="footer-symbol"></span>
          <strong>{{ storeName }}</strong>
        </div>
        <p>{{ theme?.footer_description || 'Uma experiência de compra online simples, segura e pronta para vitrines de alto padrão.' }}</p>

        <div class="app-links">
          <h3>Baixe o app no celular:</h3>
          <div>
            <span><b>App Store</b><small>Disponível na</small></span>
            <span><b>Google Play</b><small>Baixar no</small></span>
          </div>
        </div>

        <form class="newsletter" @submit.prevent>
          <label for="footer-email">Receba ofertas e novidades</label>
          <div>
            <Mail :size="18" />
            <input id="footer-email" type="email" placeholder="Digite seu e-mail">
            <button type="submit">Assinar</button>
          </div>
        </form>

        <a class="phone" :href="`tel:${theme?.contact_phone || '(11) 3000-1234'}`">
          <Phone :size="28" />
          <span><small>Precisa de ajuda? Ligue agora!</small><strong>{{ theme?.contact_phone || '(11) 3000-1234' }}</strong></span>
        </a>
      </section>

      <nav v-for="group in footerGroups" :key="group.title" class="footer-group" :aria-label="group.title">
        <h3>{{ group.title }}</h3>
        <NuxtLink v-for="link in group.links" :key="link" :to="footerDestination(link)">{{ link }}</NuxtLink>
      </nav>
    </div>

    <div class="footer-bottom">
      <div class="social">
        <span>Siga-nos:</span>
        <a href="#" aria-label="Instagram">IG</a>
        <a href="#" aria-label="YouTube">YT</a>
        <a href="#" aria-label="Facebook">FB</a>
        <a href="#" aria-label="Telegram">TG</a>
      </div>
      <p>Copyright {{ new Date().getFullYear() }} © <strong>{{ storeName }}</strong>. Todos os direitos reservados.</p>
      <div class="payments" aria-label="Formas de pagamento">
        <span>VISA</span><span>MC</span><span>AMEX</span><span>PIX</span><span>DISC</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.retail-footer{position:relative;margin-top:72px;border-top:1px solid #edf2f7;background:#fff;color:#111827;overflow:hidden}.footer-watermark{position:absolute;left:50%;top:-24px;width:min(100% - 48px,1320px);padding-bottom:10px;border-bottom:1px solid #edf2f7;color:#f3f4f6;font-size:clamp(54px,9vw,124px);font-weight:760;letter-spacing:-.055em;line-height:.86;text-align:center;transform:translateX(-50%);white-space:nowrap;pointer-events:none}.footer-main{position:relative;z-index:1;display:grid;grid-template-columns:340px repeat(4,minmax(130px,1fr));gap:34px 58px;width:min(100% - 48px,1320px);margin:auto;padding:84px 0 62px}.footer-brand{grid-row:span 2;display:grid;align-content:start;gap:24px}.brand-lockup{display:flex;align-items:center;gap:12px}.brand-lockup strong{font-size:27px;font-weight:760;letter-spacing:-.035em;text-transform:uppercase}.footer-symbol{position:relative;display:block;width:42px;height:34px;border-radius:4px 4px 12px 12px;background:linear-gradient(135deg,#2563eb,#1d4ed8)}.footer-symbol:before{position:absolute;left:50%;top:-8px;width:18px;height:18px;border:4px solid #ff7a1a;border-bottom:0;border-radius:18px 18px 0 0;content:"";transform:translateX(-50%)}.footer-brand p{max-width:330px;margin:0;color:#475569;font-size:14px;line-height:1.65}.app-links{display:grid;gap:12px}.app-links h3,.newsletter label{margin:0;color:#111827;font-size:15px;font-weight:650}.app-links>div{display:flex;flex-wrap:wrap;gap:12px}.app-links span{display:grid;min-width:126px;padding:7px 14px;border-radius:5px;background:#030712;color:#fff}.app-links b{order:2;font-size:14px;font-weight:650;line-height:1}.app-links small{font-size:9px;color:#d1d5db}.newsletter{display:grid;gap:12px}.newsletter>div{display:grid;grid-template-columns:auto 1fr auto;align-items:center;min-height:52px;border:1px solid #e5e7eb;border-radius:6px;background:#fff;box-shadow:0 12px 30px rgba(15,23,42,.04)}.newsletter svg{margin-left:18px;color:#64748b}.newsletter input{min-width:0;height:100%;padding:0 14px;border:0;outline:0;color:#111827;font-size:14px}.newsletter button{align-self:stretch;margin:4px 4px 4px 0;padding:0 24px;border:0;border-radius:4px;background:var(--sf-primary);color:#fff;font-weight:650}.phone{display:flex;align-items:center;gap:14px;margin-top:12px;color:#111827;text-decoration:none}.phone svg{color:#020617}.phone span{display:grid;gap:4px}.phone small{color:#64748b;font-size:14px}.phone strong{font-size:26px;font-weight:760;letter-spacing:-.025em}.footer-group{display:grid;align-content:start;justify-items:start;gap:13px}.footer-group h3{margin:0 0 5px;color:#030712;font-size:15px;font-weight:650}.footer-group a{color:#334155;font-size:14px;line-height:1.35;text-decoration:none}.footer-group a:hover{color:var(--sf-primary)}.footer-bottom{position:relative;z-index:1;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;width:min(100% - 48px,1320px);margin:auto;padding:24px 0;border-top:1px solid #edf2f7;color:#64748b;font-size:13px}.footer-bottom p{margin:0;text-align:center}.footer-bottom strong{color:#111827}.social,.payments{display:flex;align-items:center;gap:12px}.social a{display:grid;min-width:24px;height:24px;place-items:center;color:#475569;font-size:11px;font-weight:650;text-decoration:none}.social a:hover{color:var(--sf-primary)}.payments{justify-content:end}.payments span{display:grid;min-width:42px;height:24px;place-items:center;border:1px solid #e5e7eb;border-radius:4px;background:#fff;color:#2563eb;font-size:10px;font-weight:760;box-shadow:0 6px 14px rgba(15,23,42,.04)}@media(max-width:1080px){.footer-main{grid-template-columns:1.2fr repeat(3,1fr)}.footer-brand{grid-column:1/-1;grid-row:auto}.footer-group:nth-of-type(n+7){display:none}.footer-bottom{grid-template-columns:1fr;justify-items:start}.footer-bottom p{text-align:left}.payments{justify-content:start}}@media(max-width:680px){.footer-watermark{top:0;font-size:46px}.footer-main,.footer-bottom{width:min(100% - 24px,1320px)}.footer-main{grid-template-columns:1fr 1fr;gap:30px 22px;padding-top:68px}.footer-brand{grid-column:1/-1}.footer-group:nth-of-type(n+5){display:none}.newsletter>div{grid-template-columns:auto 1fr}.newsletter button{grid-column:1/-1;height:44px;margin:0;border-radius:0 0 5px 5px}.phone strong{font-size:21px}.social,.payments{flex-wrap:wrap}}
</style>
