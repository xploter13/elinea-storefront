<script setup lang="ts">
import { LockKeyhole } from '@lucide/vue'
defineProps<{ storeName: string, step?: string }>()
</script>

<template>
  <header class="shared-header">
    <NuxtLink to="/" class="shared-brand">{{ storeName }}</NuxtLink>
    <span v-if="step" class="shared-step">{{ step }}</span>
    <span class="shared-secure"><LockKeyhole :size="15" /> Ambiente seguro</span>
  </header>
</template>

<style scoped>
.shared-header{height:78px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 clamp(18px,4vw,56px);border-bottom:1px solid #e5e7eb;background:#fff;box-shadow:0 12px 34px rgba(15,23,42,.05);color:#111827;font-family:"Aptos","Segoe UI",Arial,sans-serif}.shared-brand{color:inherit;font-family:"Aptos","Segoe UI",Arial,sans-serif;font-size:22px;font-weight:800;letter-spacing:-.035em;text-decoration:none}.shared-brand:before{display:inline-block;width:12px;height:12px;margin-right:9px;border-radius:4px;background:#2563eb;content:""}.shared-step{padding:9px 14px;border:1px solid #e5e7eb;border-radius:999px;background:#f8fafc;color:#6b7280;font-size:12px;font-weight:650}.shared-secure{justify-self:end;display:flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:700}@media(max-width:640px){.shared-header{grid-template-columns:1fr auto;height:70px}.shared-brand{font-size:18px}.shared-step{display:none}.shared-secure{font-size:0}.shared-secure svg{width:18px;height:18px}}
</style>
