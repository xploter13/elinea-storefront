# Branding do storefront

Uma única aplicação atende todas as lojas. Não crie renderers por tenant: a
identidade é configurada por dados e aplicada ao template base em runtime.

## Onde personalizar

- onboarding do admin: nome, imagens, cores, tipografia e textos da loja;
- `data.theme`: contrato público retornado pela API;
- `shared/utils/default-branding.ts`: fallback do template;
- `app/components`: composição compartilhada por todas as lojas.

O design atual é o baseline aprovado e também orienta os defaults de `@elinea/ui`.
Antes de criar um componente local, verifique se props, slots, variantes ou tokens no
UI resolvem a necessidade sem duplicar comportamento de ecommerce.

## Nova loja

1. crie/provisione o site na API;
2. cadastre o hostname exato em `sites.domain`;
3. preencha e aplique o onboarding no admin;
4. configure DNS e Traefik para o deployment compartilhado;
5. valide tema, catálogo, carrinho, checkout e conta pelo novo domínio.

O campo técnico de template não carrega código dinamicamente. Consulte
`docs/multi-tenant-context.md` para o fluxo completo.
