import tailwindcss from '@tailwindcss/vite'

const customerAppUrl = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NUXT_CUSTOMER_APP_URL || 'http://127.0.0.1:3101'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    apiBase: 'http://elinea-api.test/api/v1',
    elineaStoreSite: 'default',
    trustProxyHeaders: false,
    customerAppUrl,
    public: {
      customerAppUrl,
    },
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'pt-BR' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },
  vite: { plugins: [tailwindcss()] },
  routeRules: {
    '/carrinho': { proxy: `${customerAppUrl}/carrinho` },
    '/checkout': { proxy: `${customerAppUrl}/checkout` },
    '/conta/**': { proxy: `${customerAppUrl}/conta/**` },
    '/login': { proxy: `${customerAppUrl}/login` },
    '/redefinir-senha': { proxy: `${customerAppUrl}/redefinir-senha` },
  },
  typescript: { strict: true, typeCheck: true },
})
