# Infotec - Loja Demo

Projeto com frontend em HTML/CSS/JavaScript, backend Node.js/Express, SQLite e integracao Mercado Pago para PIX, cartao e boleto.

## Pre-requisitos
- Node.js 18+
- Docker (opcional)
- Git (para deploy via Railway conectando o repositorio)

## Configurar Mercado Pago
1. Copie `.env.example` para `.env`.
2. No Mercado Pago Developers, abra sua aplicacao e copie:
   - `Access Token` para `MERCADO_PAGO_ACCESS_TOKEN`
   - `Public Key` para `MERCADO_PAGO_PUBLIC_KEY`
3. Em producao, configure `PUBLIC_BASE_URL` com a URL publica do site, por exemplo `https://sua-loja.com`.
4. Configure o webhook no painel do Mercado Pago apontando para:

```text
https://sua-loja.com/api/webhooks/mercado-pago
```

Nunca coloque a Access Token no HTML ou no JavaScript do navegador. Ela fica somente no `.env` do servidor.

## Rodar localmente
```bash
npm install
npm start
```

Acesse: http://localhost:5000

## Endpoints principais
- `GET /api/products`
- `POST /api/register`
- `POST /api/login`
- `POST /api/orders`
- `POST /api/orders/:orderId/payments`
- `GET /api/orders/:orderId/status`
- `POST /api/webhooks/mercado-pago`

## Rodar em producao
```bash
npm install --omit=dev
npm start
```

## Usando Docker
Build e run localmente:

```bash
docker build -t infotec-loja .
docker run -p 5000:5000 --env-file .env infotec-loja
```

## Deploy no Railway
1. Commit & push do repositorio no GitHub.
2. No Railway: New Project -> Deploy from GitHub -> selecione o repositorio.
3. Cadastre as variaveis do `.env` em Variables no Railway.
4. Railway usa o `Procfile` com `npm start`.
5. Verifique a URL publica e teste `/api/health`.

## Banco de dados
- O SQLite (`meubanco.db`) e criado automaticamente na primeira execucao.
- O backend cria as tabelas `users`, `products`, `orders`, `order_items` e `payment_events`.
- Em producao, arquivos locais podem nao persistir entre deploys. Para loja real, migre para um banco gerenciado.

## Pagamentos
- PIX: gera QR Code e copia e cola automaticamente.
- Cartao: usa o Brick oficial do Mercado Pago no frontend e envia apenas o token seguro ao backend.
- Boleto: gera link/codigo do boleto.
- Webhook: atualiza o pedido quando o Mercado Pago confirma o pagamento.
