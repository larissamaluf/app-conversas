# Transformando Conflito em Conversa

Aplicativo web mobile-first para transformar situações difíceis em respostas curtas e usáveis. A página começa com um único campo; situações comuns e revisão de mensagens aparecem de forma secundária. A análise aplica regras de segurança e recusa pedidos de coerção ou incentivo à exploração animal.

## Rodar

```sh
pnpm install
pnpm dev
```

Na Vercel, o backend tenta usar o token OIDC do AI Gateway. O projeto precisa ter acesso ao Gateway e crédito ativo; a conta atual ainda exige cadastro de cartão para liberar o crédito gratuito. Como alternativa, configure `OPENAI_API_KEY` no ambiente da Vercel para usar diretamente a API da OpenAI. Chaves nunca devem ir ao navegador ou ao repositório. Sem acesso ao provedor, o servidor usa respostas locais pré-definidas com a mesma triagem de segurança. Nenhuma conversa é gravada em banco de dados; o contexto de refinamento vai apenas no pedido atual.

## Deploy

Importe o repositório na Vercel como projeto Next.js. Use o diretório raiz, comando de build `pnpm build` e framework Next.js.
