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
NUXT_CUSTOMER_APP_URL=http://localhost:3001
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

## Área do cliente separada

As rotas `/carrinho`, `/checkout`, `/conta/**`, `/login` e `/redefinir-senha` são
encaminhadas pelo Nitro para o projeto `C:\htdocs\elinea-customer`. Em produção,
configure `NUXT_CUSTOMER_APP_URL` com a URL interna desse serviço. As rotas `/api/*`
continuam no host principal, permitindo que autenticação e carrinho compartilhem o
mesmo cookie e a mesma sessão.

A sessão de visitante do carrinho usa o cookie `elinea_cart_session`, permitindo
que o carrinho seja preservado ao encaminhar o usuário para o app customer em
outra porta ou serviço. O `localStorage` antigo permanece apenas como fallback de
migração.

Consulte `docs/context.md` e `docs/package-architecture.md` para os limites de cada
camada.
# elinea-storefront

O storefront concentra a vitrine pública. As rotas `/conta/**`, `/login` e `/redefinir-senha`, além de `/carrinho` e `/checkout`, são encaminhadas pelo Nitro para o `elinea-customer` através de `NUXT_CUSTOMER_APP_URL`.
