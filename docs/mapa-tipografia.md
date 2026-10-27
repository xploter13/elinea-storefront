# Mapa de tipografia e padronização para 14px

Revisão em 27/10/2026 dos estilos locais de `app`, `layers` e `shared`.
Foram alteradas 212 declarações em 29 arquivos: tamanhos de 12px e 13px
passaram para 14px, incluindo abreviações `font`, regras responsivas,
sobrescritas globais e valores `.75rem` (12px com a base de 16px).

## Famílias de fontes

| Origem | Família e aplicação |
| --- | --- |
| `app/assets/css/main.css` | Aptos, Segoe UI, Arial e sans-serif como sequência padrão |
| `BaseTemplate.vue` | Fonte configurada em `theme.font_family`, com Aptos como padrão; variáveis `--sf-body`, `--sf-display`, `--elinea-font-body` e `--elinea-font-heading` |
| `cadastro.vue`, `login.vue`, `redefinir-senha.vue` | Fonte da loja por `--account-font`, com alternativas Segoe UI, Arial e sans-serif |
| `SharedCustomerArea.vue` | Fonte configurada pela loja e variáveis da área da conta |
| `BaseHeader.vue` | Nunito Sans e Segoe UI para a marca, sujeitas à sobrescrita global de `BaseTemplate` |
| `BaseCart.vue` | Trebuchet MS no título do estado vazio |
| Componentes de compra e camada compartilhada | Aptos, Segoe UI, Arial ou variáveis herdadas da loja |
| Rótulos específicos | ui-monospace e monospace |

As famílias de fontes foram mantidas. A alteração solicitada foi aplicada aos tamanhos.

## Declarações alteradas por arquivo

| Arquivo | Declarações alteradas |
| --- | ---: |
| `app/components/BaseBlogArticle.vue` | 7 |
| `app/components/BaseBlogIndex.vue` | 3 |
| `app/components/BaseCart.vue` | 6 |
| `app/components/BaseCategories.vue` | 5 |
| `app/components/BaseCheckout.vue` | 21 |
| `app/components/BaseCookieConsent.vue` | 2 |
| `app/components/BaseFooter.vue` | 3 |
| `app/components/BaseHeader.vue` | 2 |
| `app/components/BaseHome.vue` | 10 |
| `app/components/BaseInformationPage.vue` | 3 |
| `app/components/BasePayment.vue` | 7 |
| `app/components/BaseProductCard.vue` | 5 |
| `app/components/BaseProductDetail.vue` | 19 |
| `app/components/BaseProducts.vue` | 11 |
| `app/components/BaseServiceRibbon.vue` | 1 |
| `app/components/BaseShippingEstimate.vue` | 6 |
| `app/components/BaseTemplate.vue` | 13 |
| `app/components/CustomerOrderHistory.vue` | 3 |
| `app/components/MercadoPagoCardForm.vue` | 3 |
| `app/components/SharedCommerceHeader.vue` | 2 |
| `app/components/SharedCustomerArea.vue` | 24 |
| `app/components/TransparentPaymentOptions.vue` | 10 |
| `app/pages/cadastro.vue` | 8 |
| `app/pages/login.vue` | 6 |
| `app/pages/redefinir-senha.vue` | 8 |
| `layers/storefront-core/app/components/SharedCheckout.vue` | 10 |
| `layers/storefront-core/app/components/SharedCommerceHeader.vue` | 2 |
| `layers/storefront-core/app/components/SharedCustomerArea.vue` | 7 |
| `layers/storefront-core/app/components/StorefrontCommerceOverlay.vue` | 5 |

## Escala e cobertura

- 12px e 13px: substituídos por 14px.
- `.75rem`: substituído por 14px.
- `font: ... 13px ...`: tamanho atualizado para 14px, preservando peso,
  altura de linha e família.
- Não foram encontradas classes `text-xs`, `text-[12px]` ou `text-[13px]`
  nos arquivos locais; `text-sm` já representa 14px na configuração padrão.
- Os demais tamanhos foram mantidos, incluindo `.8rem` (12,8px),
  `.78rem` (12,48px), textos menores e títulos maiores.
- Espaçamentos, bordas, ícones e outras medidas de 12px e 13px permanecem iguais.
- Componentes externos de `@elinea/ui` e campos em quadros incorporados de
  provedores não são definidos por este repositório.

## Tamanhos locais após a alteração

A tabela inclui valores em `font-size` e tamanhos em abreviações `font`.
As funções responsivas são apresentadas como declaradas.

| Arquivo | Tamanhos declarados |
| --- | --- |
| `app/components/BaseBlogArticle.vue` | `14px`, `16px`, `18px`, `19px`, `28px`, `clamp(17px,1.7vw,21px)`, `clamp(21px,2vw,25px)`, `clamp(22px,2vw,29px)`, `clamp(27px,3vw,39px)`, `clamp(29px,2.9vw,40px)`, `clamp(29px,3vw,42px)`, `clamp(40px,10vw,51px)`, `clamp(42px,9vw,59px)`, `clamp(47px,5.5vw,80px)` |
| `app/components/BaseBlogIndex.vue` | `14px`, `15px`, `16px`, `17px`, `26px`, `clamp(23px,2.2vw,31px)`, `clamp(29px,3vw,42px)`, `clamp(32px,4.3vw,46px)`, `clamp(34px,8vw,46px)`, `clamp(37px,4vw,58px)`, `clamp(47px,11vw,69px)`, `clamp(52px,6.4vw,94px)` |
| `app/components/BaseCart.vue` | `10px`, `11px`, `14px`, `15px`, `19px`, `42px`, `58px`, `clamp(38px,4vw,54px)`, `clamp(45px,5vw,72px)`, `clamp(56px,7vw,92px)` |
| `app/components/BaseCategories.vue` | `11px`, `14px`, `15px`, `17px`, `22px`, `24px`, `26px`, `42px`, `clamp(21px,2vw,27px)`, `clamp(42px,5vw,72px)` |
| `app/components/BaseCheckout.vue` | `10px`, `11px`, `14px`, `16px`, `19px`, `24px`, `26px`, `32px`, `clamp(40px,5vw,68px)` |
| `app/components/BaseCookieConsent.vue` | `14px`, `15px`, `16px` |
| `app/components/BaseFooter.vue` | `11px`, `14px`, `15px`, `17px`, `23px`, `24px`, `clamp(21px,2.2vw,28px)` |
| `app/components/BaseHeader.vue` | `11px`, `14px`, `17px`, `23px`, `8px`, `9px` |
| `app/components/BaseHome.vue` | `10px`, `11px`, `14px`, `19px`, `20px`, `21px`, `25px`, `28px`, `37px`, `8px`, `9px`, `clamp(14px, 1.25vw, 17px)`, `clamp(20px, 2vw, 28px)`, `clamp(27px, 2.5vw, 36px)`, `clamp(27px, 3vw, 38px)`, `clamp(35px, 4vw, 54px)`, `clamp(40px, 10vw, 51px)`, `clamp(42px, 7.2vw, 57px)`, `clamp(44px, 5.2vw, 62px)`, `clamp(47px, 5vw, 72px)` |
| `app/components/BaseInformationPage.vue` | `11px`, `14px`, `16px`, `17px`, `18px`, `19px`, `20px`, `21px`, `clamp(24px,3vw,32px)`, `clamp(38px,5vw,64px)` |
| `app/components/BasePayment.vue` | `11px`, `14px`, `20px`, `28px`, `clamp(30px,4vw,48px)` |
| `app/components/BaseProductCard.vue` | `10px`, `11px`, `14px`, `15px`, `20px` |
| `app/components/BaseProductDetail.vue` | `10px`, `11px`, `14px`, `16px`, `17px`, `19px`, `21px`, `26px`, `29px`, `32px`, `36px`, `40px`, `9px`, `clamp(34px,4vw,56px)` |
| `app/components/BaseProducts.vue` | `10px`, `14px`, `15px`, `17px`, `22px`, `24px` |
| `app/components/BaseServiceRibbon.vue` | `11px`, `14px` |
| `app/components/BaseShippingEstimate.vue` | `14px`, `16px` |
| `app/components/BaseTemplate.vue` | `10px`, `11px`, `14px`, `16px`, `17px`, `20px`, `23px`, `28px`, `max(0.9375rem,15px)` |
| `app/components/CustomerOrderHistory.vue` | `.85rem`, `.875rem`, `.8rem`, `.95rem`, `.9rem`, `1.15rem`, `14px` |
| `app/components/MercadoPagoCardForm.vue` | `14px` |
| `app/components/SharedCommerceHeader.vue` | `0`, `14px`, `18px`, `22px` |
| `app/components/SharedCustomerArea.vue` | `.65rem`, `.68rem`, `.72rem`, `.78rem`, `.7rem`, `.8rem`, `.9rem`, `1.35rem`, `1.3rem`, `1.4rem`, `10px`, `11px`, `14px`, `16px`, `17px`, `20px`, `21px`, `22px`, `24px`, `30px`, `33px`, `48px`, `clamp(24px,2vw,28px)`, `clamp(2rem,4vw,3rem)`, `clamp(38px,5vw,62px)`, `clamp(42px,5.8vw,72px)` |
| `app/components/TransparentPaymentOptions.vue` | `14px`, `18px`, `24px` |
| `app/pages/cadastro.vue` | `11px`, `14px`, `15px`, `16px`, `17px`, `28px`, `34px`, `clamp(28px,2.7vw,35px)`, `clamp(36px,7vw,49px)`, `clamp(38px,4.4vw,58px)` |
| `app/pages/login.vue` | `11px`, `14px`, `15px`, `16px`, `17px`, `27px`, `34px`, `clamp(27px,2.6vw,34px)`, `clamp(34px,7vw,48px)`, `clamp(36px,4.5vw,58px)` |
| `app/pages/redefinir-senha.vue` | `14px`, `15px`, `16px`, `17px`, `27px`, `34px`, `clamp(27px,2.6vw,34px)`, `clamp(36px,7vw,48px)`, `clamp(38px,4.4vw,58px)` |
| `layers/storefront-core/app/components/SharedCheckout.vue` | `10px`, `11px`, `14px`, `19px`, `24px`, `26px`, `32px`, `clamp(40px,5vw,68px)` |
| `layers/storefront-core/app/components/SharedCommerceHeader.vue` | `0`, `14px`, `18px`, `22px` |
| `layers/storefront-core/app/components/SharedCustomerArea.vue` | `10px`, `11px`, `14px`, `30px`, `33px`, `48px`, `clamp(42px,5.8vw,72px)` |
| `layers/storefront-core/app/components/StorefrontCommerceOverlay.vue` | `10px`, `11px`, `14px`, `16px`, `18px`, `22px` |
