# Elínea Storefront

Aplicação Nuxt 4 SSR multi-tenant. Uma única instância atende todas as lojas e aplica
o tema correto a partir do hostname da requisição.

## Configuração

```powershell
Copy-Item .env.example .env
yarn install
npm run dev
```

Configure:

```env
NUXT_API_BASE=http://elinea-api.test/api/v1
NUXT_ELINEA_STORE_SITE=default
NUXT_TRUST_PROXY_HEADERS=false
```

- O hostname identifica a loja no servidor Nitro e é enviado à API como
  `X-Store-Domain`.
- `NUXT_TRUST_PROXY_HEADERS=true` habilita `X-Forwarded-Host` somente quando o Nitro
  está atrás de um proxy confiável.
- `NUXT_ELINEA_STORE_SITE` é o fallback para desenvolvimento em localhost.

O storefront renderiza `app/components/BaseTemplate.vue` diretamente.
Não existem registry, seleção dinâmica ou cópia de templates dentro da aplicação.
Branding específico vem de `data.theme`, configurado pelo onboarding;
engenharia compartilhada pertence a `@elinea/sdk` e `@elinea/ui`.

## SSR

As páginas em `app/pages/` usam `useStorefrontPage`, que executa `useFetch('/api/storefront')`
durante SSR. A rota Nitro cria o SDK com o runtime config privado, consulta a API e
entrega HTML completo antes da hidratação.

```powershell
npm run typecheck
npm run build
```

## Área do cliente

As rotas `/carrinho`, `/checkout`, `/conta/**`, `/login` e `/redefinir-senha` são
servidas pelo próprio storefront. As rotas Nitro em `/api/*` atendem autenticação,
recuperação de senha e carrinho no mesmo host, compartilhando os cookies da sessão.

A sessão de visitante do carrinho usa o cookie `elinea_cart_session`, permitindo
que o carrinho seja preservado entre páginas. O `localStorage` antigo permanece
apenas como fallback de migração.

Consulte `docs/context.md` e `docs/package-architecture.md` para os limites de cada
camada.
# elinea-storefront

O storefront concentra a vitrine pública, a área do cliente, o carrinho, o checkout e a recuperação de senha.
