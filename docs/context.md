# Contexto do Elínea Storefront

Este projeto é uma aplicação Nuxt 4 SSR multi-tenant. Uma única instância atende
todas as lojas e resolve o tenant pelo hostname de cada requisição. O contrato
operacional completo está em `docs/multi-tenant-context.md`.

## Fluxo

```text
Domínio do cliente
        ↓
Nuxt 4 / Nitro SSR
        ↓
@elinea/sdk + domínio da requisição
        ↓
Elínea API resolve store → site → tenant
        ↓
HTML completo + payload de hidratação
```

O browser chama apenas rotas internas do Nitro. O servidor encaminha o domínio à API
como `X-Store-Domain`; segredos e caminhos internos da API não chegam ao bundle.

## Pacotes

- `@elinea/sdk`: TypeScript puro, HTTP, contratos, mappers e erros da Elínea API.
- `@elinea/ui`: Vue, tokens e componentes reutilizáveis organizados em `core`,
  `marketing`, `storefront` e `painel`. Este projeto consome a API pública
  `@elinea/ui/storefront`; nomes com prefixo `Elinea` são compatibilidade temporária.
- storefront: SSR, runtimeConfig, rotas, SEO, branding, assets e composição da loja.

As dependências `file:../elinea-sdk` e `file:../elinea-ui` são transitórias até a
publicação dos pacotes em registry com versões semânticas.

## Estrutura

```text
app/
├── assets/
├── components/
│   ├── shared/
│   ├── BaseTemplate.vue
│   ├── Base*.vue
│   └── base.config.ts
├── pages/
└── utils/
server/
├── api/
└── utils/elinea.ts
shared/types/
```

`BaseTemplate.vue` é importado diretamente pela página catch-all. Checkout e conta
continuam compartilhados, mas não há seleção por `template.folder`, registry,
fallback visual ou scaffold de renderers.

## Ambiente

```env
NUXT_API_BASE=http://elinea-api.test/api/v1
NUXT_ELINEA_STORE_SITE=default
NUXT_TRUST_PROXY_HEADERS=false
NUXT_CUSTOMER_APP_URL=http://localhost:3001
```

Em produção atrás do Traefik, use `NUXT_TRUST_PROXY_HEADERS=true`. O fallback
`NUXT_ELINEA_STORE_SITE` existe para acessos locais sem um hostname de loja.

## Dados e estado

`GET /api/storefront` agrega site, produtos, categorias, analytics e newsletter pelo
SDK. As rotas `/api/cart` mantêm `X-Cart-Session` e usam o mesmo cliente server-side.
Wishlist ainda fica no `localStorage`, isolada por `site.slug`.

O layer `layers/storefront-core` é transitório. Ele contém estado Nuxt e adapters dos
contratos snake_case antigos até a migração completa para `@elinea/ui`.

## Branding

A aparência usa o template base aprovado e recebe cores, tipografia, conteúdo e
imagens de `data.theme`. `shared/utils/default-branding.ts` mantém apenas os defaults
para lojas ainda sem onboarding. Estruturas reutilizáveis devem evoluir em
`@elinea/ui`.

## Validação

```powershell
npm run typecheck
npm run build
```

Também valide HTML SSR, hidratação, catálogo, produto, categorias, carrinho, checkout,
conta, responsividade e ausência de `NUXT_ELINEA_STORE_SECRET` em `.output/public`.
