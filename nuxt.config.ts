import tailwindcss from '@tailwindcss/vite'
import { createResolver } from '@nuxt/kit'

const runtimeEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
const { resolve } = createResolver(import.meta.url)
const localPackages = {
  '@elinea/ui/styles.css': resolve('../elinea-ui/src/styles.css'),
  '@elinea/ui/storefront': resolve('../elinea-ui/src/storefront.ts'),
  '@elinea/ui': resolve('../elinea-ui/src/index.ts'),
  '@elinea/sdk': resolve('../elinea-sdk/src/index.ts'),
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  alias: localPackages,
  runtimeConfig: {
    apiBase: 'http://elinea-api.test/api/v1',
    elineaStoreSite: 'default',
    trustProxyHeaders: false,
  },
  nitro: runtimeEnv?.ELINEA_SSR_TEST_BUILD === '1' ? { output: { dir: '.output-ssr-test' } } : {},
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
  vite: {
    plugins: [tailwindcss()],
    server: { fs: { allow: [resolve('..')] } },
  },
  typescript: {
    strict: true,
    typeCheck: true,
    tsConfig: {
      compilerOptions: {
        paths: Object.fromEntries(Object.entries(localPackages).map(([name, path]) => [name, [path]])),
      },
    },
  },
})
