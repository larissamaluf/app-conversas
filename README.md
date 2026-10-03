# Transformando Conflito em Conversa

Aplicativo web mobile-first para preparar conversas difíceis. Três fluxos: relato de situação, revisão de mensagem e respostas a frases frequentes. A análise aplica regras de segurança e recusa pedidos de coerção ou incentivo à exploração animal.

## Rodar

```sh
pnpm install
pnpm dev
```

Configure `OPENAI_API_KEY` no ambiente da Vercel para respostas geradas por IA. A chave nunca deve ir ao navegador ou ao repositório. Sem a chave, o servidor usa respostas locais pré-definidas, com a mesma triagem de segurança. Nenhuma conversa é gravada em banco de dados; o contexto de refinamento vai apenas no pedido atual.

## Deploy

Importe o repositório na Vercel como projeto Next.js. Use o diretório raiz, comando de build `pnpm build` e framework Next.js.
