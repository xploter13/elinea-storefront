# Contexto: storefront multi-tenant por domínio

## Objetivo

Uma única aplicação Nuxt SSR atende todas as lojas. O hostname público identifica o
tenant e a API devolve a configuração visual que será aplicada ao template base.
Não há código, build ou container por loja.

```text
Browser: loja1.elinea.com.br
        ↓
Traefik preserva Host e envia X-Forwarded-Host
        ↓
elinea-storefront (Nuxt/Nitro SSR)
        ↓ X-Store-Domain: loja1.elinea.com.br
@elinea/sdk
        ↓
elinea-api (Laravel ResolveSite)
        ↓
Site + catálogo + tema do onboarding
```

O mesmo domínio deve chegar ao `elinea-customer` nas rotas de carrinho, checkout e
conta. Por isso storefront e customer usam a mesma resolução de hostname.

## Contrato de resolução

- Nitro obtém o hostname da requisição.
- Atrás de proxy, `X-Forwarded-Host` só é aceito quando
  `NUXT_TRUST_PROXY_HEADERS=true`.
- Nitro envia o hostname à API no header `X-Store-Domain`.
- A API procura uma correspondência exata em `sites.domain`, ignorando sites
  inativos. Domínio desconhecido retorna `404`.
- Em acesso por `localhost`, `127.0.0.1` ou `::1`,
  `NUXT_ELINEA_STORE_SITE` continua disponível como fallback de desenvolvimento.
- `X-Store-Key` e `X-Store-Secret` continuam suportados para integrações privadas e
  deployments legados, mas não são necessários no deployment multi-tenant público.

Nunca aceite um `X-Forwarded-Host` fornecido diretamente pela internet. Em produção,
publique o Nitro apenas atrás do Traefik e faça o proxy substituir os headers
encaminhados.

## Tema publicado pela API

`GET /api/v1/site`, resolvido pelo domínio, retorna `data.theme` com:

- `logo_url`, `favicon_url`, `hero_image_url`;
- `primary_color`, `secondary_color`, `accent_color`;
- `font_family`;
- textos da hero, cabeçalho, ofertas, newsletter e rodapé;
- telefone, horário de atendimento e visibilidade da newsletter;
- `version`, derivada da última atualização do briefing.

Quando a loja ainda não possui briefing, a API retorna os valores padrão do template.
Os arquivos enviados são armazenados no disco público em `storefront/{site_id}`. O
deploy da API precisa de `php artisan storage:link` e de um `APP_URL` público correto
para gerar URLs absolutas válidas.

## Onboarding

A tela `elinea-admin/app/pages/onboarding.vue` é a fonte de configuração do template.
Ela permite salvar como rascunho ou aplicar/enviar os dados. Os campos atuais são:

- nome da loja;
- logo, favicon e imagem principal;
- três cores e tipografia;
- título e texto principal;
- mensagem de cabeçalho, contato e horário;
- descrição do rodapé e exibição da newsletter.

O formulário envia `multipart/form-data` para `PUT /api/v1/onboarding/brief` usando
method spoofing (`POST` com `_method=PUT`). Ao salvar `brand_name`, o nome público do
`Site` também é atualizado. A antiga seção `/configuration/tema` permanece removida:
o tema pertence ao onboarding e é apenas consumido pelo endpoint público da loja.

## Configuração de ambiente

Storefront:

```env
NUXT_API_BASE=http://elinea-api.test/api/v1
NUXT_ELINEA_STORE_SITE=default
NUXT_TRUST_PROXY_HEADERS=true
NUXT_CUSTOMER_APP_URL=http://elinea-customer:3000
```

Customer:

```env
NUXT_API_BASE=http://elinea-api.test/api/v1
NUXT_ELINEA_STORE_SITE=default
NUXT_TRUST_PROXY_HEADERS=true
```

API:

```env
TENANCY_BASE_DOMAIN=elinea.com.br
TENANCY_HEADER=X-Site
TENANCY_DOMAIN_HEADER=X-Store-Domain
```

Mantenha `NUXT_TRUST_PROXY_HEADERS=false` quando o processo Nitro puder receber
tráfego direto sem um proxy confiável.

## Infraestrutura

Produção requer:

1. DNS wildcard `*.elinea.com.br` apontando para o load balancer/Traefik;
2. certificado wildcard `*.elinea.com.br` (normalmente ACME DNS-01);
3. uma regra Traefik que aceite os subdomínios e direcione todos ao mesmo serviço
   `elinea-storefront`;
4. preservação do `Host` e substituição controlada de `X-Forwarded-Host`;
5. cadastro exato do domínio em `sites.domain` antes de publicar a loja;
6. storage público persistente/compartilhado para os assets do onboarding.

Exemplo conceitual de labels do serviço storefront:

```yaml
labels:
  - traefik.enable=true
  - traefik.http.routers.storefront.rule=HostRegexp(`[a-z0-9-]+\\.elinea\\.com\\.br`)
  - traefik.http.routers.storefront.entrypoints=websecure
  - traefik.http.routers.storefront.tls=true
  - traefik.http.services.storefront.loadbalancer.server.port=3000
```

Adapte nomes de entrypoint, resolver ACME, rede e escaping ao formato do arquivo de
deploy utilizado. Domínios personalizados exigirão uma regra/certificado adicional,
mas o runtime já funciona porque resolve por correspondência exata de `sites.domain`.

## Cache e isolamento

- Qualquer cache SSR, CDN ou reverse proxy precisa variar por `Host`.
- O `useFetch` do storefront usa uma chave que inclui o hostname para não compartilhar
  payload entre lojas.
- Catálogo, carrinho, autenticação e analytics continuam usando o `TenantContext` da
  API; nenhum `site_id` fornecido pelo browser deve substituir esse contexto.
- Uma resposta de uma loja nunca deve ser reutilizada para outro hostname.

## Desenvolvimento local

Cadastre, por exemplo, `loja1.elinea.local` e `loja2.elinea.local` em `sites.domain`.
Faça ambos resolverem para o proxy local (arquivo hosts ou DNS local) e encaminhe-os
ao mesmo processo Nuxt. Se o proxy enviar `X-Forwarded-Host`, ative
`NUXT_TRUST_PROXY_HEADERS=true`; no acesso direto ao Nuxt, o header `Host` basta.

Checklist de aceitação:

1. abrir os dois domínios em sessões separadas;
2. confirmar nome, logo, favicon, cores, hero e textos diferentes;
3. confirmar produtos, carrinho, login, checkout e pedidos isolados;
4. confirmar `404` para domínio não cadastrado;
5. alterar o onboarding e confirmar a mudança após nova requisição;
6. verificar que nenhum segredo de loja aparece no bundle do browser.

## Validação técnica

```powershell
# elinea-api
php artisan migrate
php artisan test --compact tests/Feature/StorefrontMultiTenancyTest.php

# elinea-sdk
npm test
npm run typecheck
npm run build

# elinea-storefront, elinea-customer e elinea-admin
npm run typecheck
npm run build
```

Antes do deploy, teste também SSR/hidratação e a política de cache na camada Traefik
ou CDN com dois hosts alternados.
