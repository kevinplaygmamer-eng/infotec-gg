# Infotec - Loja Demo

Projeto com frontend em HTML/CSS/JavaScript, backend Node.js/Express, SQLite e integracao Mercado Pago para PIX, cartao e boleto.

## Pre-requisitos
- Node.js 18+
- Docker (opcional)
- Git/GitHub (para deploy via Render conectando o repositorio)

## Configurar Mercado Pago
1. Copie `.env.example` para `.env`.
2. No Mercado Pago Developers, abra sua aplicacao e copie:
   - `Access Token` para `MERCADO_PAGO_ACCESS_TOKEN`
   - `Public Key` para `MERCADO_PAGO_PUBLIC_KEY`
3. Em producao, configure `PUBLIC_BASE_URL` com a URL publica raiz do site, por exemplo `https://sua-loja.onrender.com`.
4. Configure o webhook no painel do Mercado Pago apontando para:

```text
https://sua-loja.onrender.com/api/webhooks/mercado-pago
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

## Deploy no Render
O repositorio inclui `render.yaml`, entao o Render ja consegue criar o Web Service com:

- Build Command: `npm ci --omit=dev`
- Start Command: `node server.js`
- Health Check Path: `/api/health`

Passos:

1. Commit & push do repositorio no GitHub.
2. No Render: New -> Blueprint ou Web Service -> selecione o repositorio.
3. Se usar Blueprint, confirme o arquivo `render.yaml`.
4. Cadastre as variaveis de ambiente no Render:
   - `PUBLIC_BASE_URL`: URL publica raiz do Render, por exemplo `https://sua-loja.onrender.com`
   - `MERCADO_PAGO_ACCESS_TOKEN`: Access Token privado
   - `MERCADO_PAGO_PUBLIC_KEY`: Public Key
   - `MERCADO_PAGO_WEBHOOK_SECRET`: segredo do webhook, se ativado
5. Depois do deploy, teste:

```text
https://sua-loja.onrender.com/api/health
```

## Banco de dados
- O SQLite (`meubanco.db`) e criado automaticamente na primeira execucao.
- O backend cria as tabelas `users`, `products`, `orders`, `order_items` e `payment_events`.
- Em producao, arquivos locais podem nao persistir entre deploys. Para demo, o SQLite funciona; para pedidos reais, use um banco persistente.
- Se usar Render Disk, configure `DATABASE_PATH` para o caminho montado, por exemplo `/var/data/meubanco.db`.

## Pagamentos
- PIX: gera QR Code e copia e cola automaticamente.
- Cartao: usa o Brick oficial do Mercado Pago no frontend e envia apenas o token seguro ao backend.
- Boleto: gera link/codigo do boleto.
- Webhook: atualiza o pedido quando o Mercado Pago confirma o pagamento.
