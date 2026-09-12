# Arquitetura de pacotes Elínea

Este documento registra a auditoria e o estado incremental da separação entre API,
SDK, UI e storefront. Ele complementa `docs/context.md` e deve acompanhar cada fase
de extração.

## Classificação do código auditado

### Backend

- resolução e isolamento de tenant por `site_id`;
- estoque, descontos, frete, totalização, pagamento e criação de pedidos;
- emissão e rotação das credenciais de storefront;
- autenticação e autorização de clientes e administradores.

Frete e totalização do pedido ainda exigem endurecimento: o checkout atual aceita
`shipping_total` informado pelo consumidor. A API deve passar a emitir uma cotação
assinada ou recalcular o valor ao criar o pedido. Essa regra não deve ser movida para
o SDK, UI ou storefront.

### `@elinea/sdk`

- cliente HTTP, headers, autenticação e sessão de carrinho;
- envelopes, paginação, DTOs públicos, mappers e erros normalizados;
- store, catálogo, produtos por slug, categorias, marcas, carrinho, frete, cupom,
  checkout, customer, wishlist, pedidos, pagamentos, analytics e newsletter.

O SDK é TypeScript puro e não contém imports de Vue ou Nuxt.

### `@elinea/ui`

- `@elinea/ui/core`: primitivas `Ui*` sem conhecimento de produto;
- `@elinea/ui/marketing`: componentes `Marketing*` do site institucional;
- `@elinea/ui/storefront`: componentes `Storefront*`, provider/adapters de comércio,
  produto, preço, quantidade, carrinho, categorias, header e footer;
- `@elinea/ui/painel`: domínio reservado aos componentes `Painel*` que serão
  migrados futuramente do painel administrativo.

Os componentes aceitam slots e variantes. O estilo `base` é o default; identidade de
outros clientes entra por CSS variables e composição.

Imports novos devem usar o subpath do domínio. Os aliases antigos com prefixo
`Elinea` existem apenas na entrada raiz durante a transição. A decisão completa está
documentada em `elinea-ui/docs/context.md`.

### Storefront

- leitura do `runtimeConfig` privado no Nitro;
- rotas internas que protegem credenciais e sessões do browser;
- roteamento Nuxt, SEO e conteúdo do cliente;
- branding, assets e composição visual exclusiva da loja.

## Estado transitório

Os pacotes estão em repositórios independentes em `../elinea-sdk` e `../elinea-ui`,
mas são consumidos por dependências `file:` enquanto não há publicação em registry.
Cada pacote já possui versão e build próprios.

O layer `layers/storefront-core` ainda mantém estado Nuxt de carrinho/wishlist e
adapta os contratos visuais antigos. A única composição ativa está em
`app/components` e preserva o HTML/CSS aprovado. Ela deve migrar componente
a componente para `@elinea/ui`, sempre com screenshots comparativos desktop/mobile.

Checkout e área do cliente atuais são protótipos visuais, não fluxos operacionais
completos. A extração para o UI deve ocorrer junto da implementação real dos
contratos SDK, evitando cristalizar telas demonstrativas como API pública.

## Próximas fases

1. Publicar `@elinea/sdk` e `@elinea/ui` e substituir dependências `file:` por ranges.
2. Configurar credenciais nos sites existentes e retirar o fallback local por slug.
3. Migrar `BaseProductCard`, grids e produto com comparação visual automatizada.
4. Migrar header, footer, categorias e overlays mantendo slots específicos da loja.
5. Implementar checkout/customer reais e então extrair suas estruturas para o UI.
6. Remover contratos snake_case e o layer `storefront-core` após o último consumidor.

Não criar `@elinea/nuxt` até pelo menos dois storefronts demonstrarem repetição real
nos adapters Nuxt.
