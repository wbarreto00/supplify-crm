# Supplify CRM

CRM simples em Next.js (App Router) com persistência em Google Sheets e API idempotente para agentes anônimos.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- Google Sheets API v4 (Service Account)
- Runtime Node.js para rotas que acessam Google APIs

## Funcionalidades

- Login por senha (`ADMIN_PASSWORD`) com sessão em cookie assinado
- Dashboard com métricas e atividades próximas
- Companies: lista, busca, filtro, criação, edição, exclusão e export CSV
- Deals: lista, busca, filtro, criação e export CSV
- Company detail com abas:
  - `overview` (editar/excluir company)
  - `contacts` (CRUD)
  - `deals` (CRUD)
  - `activities` (CRUD)
- API para agentes em `/api/agent/*` com `X-API-Key`
- Rate limit best-effort em memória

## Variáveis de ambiente

Use `.env.local` baseado em `.env.example`:

```bash
ADMIN_PASSWORD=
SESSION_SECRET=
AGENT_API_KEY=
GOOGLE_SHEET_ID=
GOOGLE_SHEETS_CLIENT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
```

## Configuração Google Sheets + Service Account

1. Crie uma planilha no Google Sheets.
2. Crie abas com estes nomes exatos:
- `companies`
- `contacts`
- `deals`
- `activities`

3. Cabeçalhos fixos (linha 1):

- `companies`: `id,name,segment,size,owner,status,source,notes,createdAt,updatedAt`
- `contacts`: `id,companyId,name,role,email,phone,linkedin,notes,createdAt,updatedAt`
- `deals`: `id,companyId,title,stage,value,probability,closeDate,owner,notes,createdAt,updatedAt`
- `activities`: `id,companyId,contactId,type,dueDate,done,notes,createdAt,updatedAt`

4. No Google Cloud Console:
- Ative a API do Google Sheets
- Crie uma Service Account
- Gere chave JSON

5. Compartilhe a planilha com o `client_email` da Service Account (Editor).

6. Preencha no `.env.local`:
- `GOOGLE_SHEET_ID` = ID da planilha
- `GOOGLE_SHEETS_CLIENT_EMAIL` = `client_email` do JSON
- `GOOGLE_SHEETS_PRIVATE_KEY` = `private_key` do JSON (com `\\n` para quebras)

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Testes

```bash
npm run lint
npm run test
npm run test:e2e
```

## API de agentes

Base: `/api/agent/*`

- `POST /api/agent/company` (upsert por `name`)
- `POST /api/agent/contact` (upsert por `email`)
- `POST /api/agent/deal` (upsert por `companyId + title` ou `companyName + title`)
- `POST /api/agent/activity` (create)
- `GET /api/agent/search?q=...`

Auth: header `X-API-Key: <AGENT_API_KEY>`

Resposta padrão:

```json
{
  "ok": true,
  "data": {}
}
```

Erro:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": {}
  }
}
```

Exemplos completos em `requests.http`.

## Deploy no Vercel

Fluxo sugerido:

1. `vercel login`
2. `vercel link`
3. `vercel env add` (todas as variáveis)
4. `vercel deploy --prod`
