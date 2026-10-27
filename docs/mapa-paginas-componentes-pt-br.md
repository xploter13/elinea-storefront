# Mapa de páginas, componentes e textos em pt-BR

Revisão realizada em 27/10/2026: 22 páginas, 22 componentes em `app/components`
e 4 componentes em `layers/storefront-core/app/components`.

## Páginas

Os arquivos abaixo ficam em `app/pages`. As páginas usam `useStorefrontPage`
para carregar os dados da loja e definir títulos e metadados em português.

| Rota | Arquivo | Composição e finalidade |
| --- | --- | --- |
| `/` | `index.vue` | `BaseTemplate` → `BaseHome`; destaques, categorias, vitrines e matérias |
| `/produtos` | `produtos.vue` | `BaseTemplate` → `BaseProducts`; catálogo, filtros, busca e ordenação |
| `/categorias` | `categorias.vue` | `BaseTemplate` → `BaseCategories`; navegação e busca de categorias |
| `/categoria/:slug` | `categoria/[slug].vue` | `BaseTemplate` → `BaseProducts`; produtos da categoria |
| `/produto/:slug` | `produto/[slug].vue` | `BaseTemplate` → `BaseProductDetail`; detalhes e compra do produto |
| `/carrinho` | `carrinho.vue` | `BaseCart`; itens, quantidades e resumo |
| `/checkout` | `checkout.vue` | `BaseCheckout`; contato, entrega e confirmação |
| `/pagamento/:id` | `pagamento/[id].vue` | `BasePayment`; seleção de pagamento e consulta do pedido |
| `/pagamento/checkout/:id/:tipo` | `pagamento/checkout/[id]/[tipo].vue` | `BasePayment` → `TransparentPaymentOptions`; cartão, Pix ou boleto |
| `/login` | `login.vue` | `BaseTemplate` com formulário de entrada e autenticação em duas etapas |
| `/cadastro` | `cadastro.vue` | `BaseTemplate` com formulário de criação de conta |
| `/redefinir-senha` | `redefinir-senha.vue` | `BaseTemplate` com solicitação de recuperação e definição da nova senha |
| `/conta` | `conta/index.vue` | `SharedCustomerArea`; visão geral |
| `/conta/pedidos` | `conta/pedidos.vue` | `SharedCustomerArea` → `CustomerOrderHistory`; histórico e pagamento |
| `/conta/enderecos` | `conta/enderecos.vue` | `SharedCustomerArea`; cadastro e manutenção de endereços |
| `/conta/dados` | `conta/dados.vue` | `SharedCustomerArea`; dados pessoais |
| `/conta/seguranca` | `conta/seguranca.vue` | `SharedCustomerArea`; autenticação em duas etapas e recuperação |
| `/ajuda` | `ajuda.vue` | `BaseTemplate` → `BaseInformationPage`; central de ajuda |
| `/entrega` | `entrega.vue` | `BaseTemplate` → `BaseInformationPage`; orientações de entrega |
| `/contato` | `contato.vue` | `BaseTemplate` → `BaseInformationPage`; canais de atendimento |
| `/blog` | `blog/index.vue` | `BaseTemplate` → `BaseBlogIndex`; matérias e paginação |
| `/blog/:slug` | `blog/[slug].vue` | `BaseTemplate` → `BaseBlogArticle`; leitura, índice e recomendações |

As cinco páginas de conta e as duas páginas de pagamento usam o middleware
`customer-auth`. O arquivo `app/app.vue` monta `NuxtPage` e `NuxtRouteAnnouncer`.

## Componentes da aplicação

Todos os arquivos desta tabela ficam em `app/components`.

| Componente | Responsabilidade | Resultado da revisão |
| --- | --- | --- |
| `BaseTemplate.vue` | Estrutura da loja e seleção da composição de página | Textos já em português |
| `BaseHeader.vue` | Marca, busca, menu, conta, favoritos e carrinho | Textos já em português |
| `BaseFooter.vue` | Atendimento e links de navegação | Textos já em português |
| `BaseCookieConsent.vue` | Aviso e escolha de cookies | Título, explicação, política e botões traduzidos |
| `BaseHome.vue` | Apresentação inicial, vitrines, categorias e blog | Título da vitrine, abas e link geral traduzidos |
| `BaseCategories.vue` | Lista e busca de categorias | Textos já em português |
| `BaseProducts.vue` | Catálogo, filtros e ordenação | Início da navegação traduzido |
| `BaseProductCard.vue` | Cartão reutilizado nas vitrines e no catálogo | Selo de mais vendido e botão de compra traduzidos |
| `BaseProductDetail.vue` | Galeria, variações, compra e descrição | Textos já em português |
| `BaseShippingEstimate.vue` | Consulta de frete do produto | Textos já em português |
| `BaseCart.vue` | Carrinho e resumo da compra | Textos já em português |
| `BaseCheckout.vue` | Etapas da finalização da compra | Textos já em português |
| `BasePayment.vue` | Pedido, provedores e confirmação de pagamento | Mensagem de abertura da página de pagamento traduzida |
| `TransparentPaymentOptions.vue` | Pagamento sem redirecionamento, códigos e confirmação | Expressões com código QR traduzidas |
| `MercadoPagoCardForm.vue` | Campos seguros de cartão do Mercado Pago | Textos já em português; SDK configurado com `pt-BR` |
| `SharedCommerceHeader.vue` | Cabeçalho do carrinho, finalização e pagamento | Textos já em português |
| `SharedCustomerArea.vue` | Estrutura e seções da conta | Referências a entrada e autenticação em duas etapas traduzidas |
| `CustomerOrderHistory.vue` | Lista, detalhes e paginação de pedidos | Textos já em português |
| `BaseInformationPage.vue` | Ajuda, entrega e contato | Orientação de finalização da compra traduzida |
| `BaseBlogIndex.vue` | Lista de matérias | Textos já em português |
| `BaseBlogArticle.vue` | Leitura de matéria e artigos relacionados | Textos já em português |
| `BaseServiceRibbon.vue` | Faixa de benefícios, sem uso encontrado na composição atual | Acentuação de serviços, flexível e cartão corrigida |

`base.config.ts` reexporta a identidade visual padrão de
`shared/utils/default-branding.ts`, cujos textos já estão em português.

## Componentes da camada compartilhada

Arquivos em `layers/storefront-core/app/components`:

| Componente | Responsabilidade | Resultado da revisão |
| --- | --- | --- |
| `StorefrontCommerceOverlay.vue` | Painéis de carrinho e lista de desejos usados por `BaseTemplate` | Explicação de frete e descontos traduzida |
| `SharedCheckout.vue` | Composição anterior da finalização da compra | Rótulo de acessibilidade e explicação traduzidos |
| `SharedCommerceHeader.vue` | Cabeçalho das composições anteriores | Textos já em português |
| `SharedCustomerArea.vue` | Composição anterior da conta | Textos já em português |

As composições atuais de compra e conta usam os componentes de `app/components`.
O projeto importa explicitamente o painel de comércio e os composables dessa
camada; `nuxt.config.ts` não declara a camada em `extends`.

## Outros pontos revisados

- `app/composables/useStorefrontPage.ts`: mensagem padrão de indisponibilidade
  traduzida para “Loja indisponível”.
- `app/pages/redefinir-senha.vue`: links de retorno à entrada da conta traduzidos.
- `app/utils/storefront-page.ts`: títulos das páginas já em português.
- `app/utils/order-display.ts`: traduções dos estados conhecidos de pedidos já
  em português; estados desconhecidos seguem o valor recebido da API.
- `app/utils/payment-script.ts`, `shared/utils/checkout-payment.ts` e
  `shared/utils/checkout-shipping.ts`: mensagens locais já em português.
- `app/composables/useShippingDestination.ts` e os composables de catálogo e
  comércio da camada compartilhada: estado, formatação e avisos revisados.
- `server/api` e `server/utils`: mensagens locais de validação revisadas;
  mensagens recebidas dos serviços externos continuam sendo repassadas.
- `nuxt.config.ts`: documento já configurado com `lang="pt-BR"`; datas locais
  e campos seguros do Mercado Pago também usam a localidade brasileira.

## Limites da tradução

A revisão cobre textos definidos no código: conteúdo visível, títulos, mensagens,
alternativas de imagens, instruções e rótulos de acessibilidade. Rotas existentes,
nomes de arquivos, componentes, propriedades, classes, contratos de API e valores
persistidos foram preservados para manter a compatibilidade.

Nomes comerciais e termos usuais em português, como blog, cookies, e-mail, Pix,
SKU e nomes de provedores, foram mantidos. Produtos, categorias, matérias,
identidade visual e mensagens externas vêm da API e dependem do conteúdo
cadastrado na origem. A revisão não reescreve esse conteúdo automaticamente.

O aviso de cookies já aponta para `/privacidade`, mas não existe uma página local
para essa rota. O link foi traduzido; a criação de conteúdo jurídico fica fora
do escopo desta revisão.
