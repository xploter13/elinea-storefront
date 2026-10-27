<script setup lang="ts">
import { CreditCard, Headphones, RotateCcw, ShieldCheck, Truck } from '@lucide/vue'
</script>

<template>
  <section class="service-ribbon" aria-label="Serviços da loja">
    <div>
      <Truck :size="22" />
      <span><strong>Entrega rastreada</strong><small>Prazo calculado por CEP</small></span>
    </div>
    <div>
      <CreditCard :size="22" />
      <span><strong>Pagamento flexível</strong><small>Pix, cartão e ofertas</small></span>
    </div>
    <div>
      <RotateCcw :size="22" />
      <span><strong>Troca assistida</strong><small>Atendimento direto da loja</small></span>
    </div>
    <div>
      <ShieldCheck :size="22" />
      <span><strong>Compra protegida</strong><small>Ambiente seguro</small></span>
    </div>
    <div>
      <Headphones :size="22" />
      <span><strong>Suporte humano</strong><small>Ajuda antes e depois da compra</small></span>
    </div>
  </section>
</template>

<style scoped>
.service-ribbon {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  width: min(100% - 40px, 1400px);
  margin: 34px auto 0;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: rgba(255, 255, 255, .74);
  box-shadow: 0 24px 70px rgba(15, 23, 42, .05);
  backdrop-filter: blur(18px);
}

.service-ribbon > div {
  display: flex;
  min-height: 86px;
  align-items: center;
  gap: 13px;
  padding: 18px 20px;
  color: var(--sf-primary);
}

.service-ribbon > div + div {
  border-left: 1px solid #e5e7eb;
}

.service-ribbon span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.service-ribbon strong {
  color: var(--sf-ink);
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -.01em;
}

.service-ribbon small {
  color: #6e807b;
  font-size: 11px;
  line-height: 1.35;
}

@media (max-width: 1050px) {
  .service-ribbon {
    grid-template-columns: repeat(3, 1fr);
  }

  .service-ribbon > div:nth-child(4) {
    border-left: 0;
  }

  .service-ribbon > div:nth-child(n+4) {
    border-top: 1px solid #e5e7eb;
  }
}

@media (max-width: 680px) {
  .service-ribbon {
    grid-template-columns: 1fr;
    width: min(100% - 24px, 1400px);
  }

  .service-ribbon > div + div {
    border-left: 0;
    border-top: 1px solid #e5e7eb;
  }
}
</style>
