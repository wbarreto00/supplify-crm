# CODEX_RUNBOOK

## Objetivo

Garantir ciclo de validação contínuo (self-healing) antes de publicar.

## Pré-requisitos

- Node.js 20+
- npm
- Dependências instaladas (`npm install`)
- Para E2E: browsers do Playwright instalados (`npx playwright install chromium`)

## Ciclo de execução

1. `npm run lint`
2. `npm run test`
3. `npm run test:e2e`

## Política de correção

- Se `lint` falhar: corrigir erros de tipagem/estilo e repetir o ciclo.
- Se `test` falhar: corrigir lógica/validação/integração de rotas e repetir o ciclo.
- Se `test:e2e` falhar: ajustar fluxo de UI (selectors, navegação, respostas) e repetir o ciclo.
- Não concluir entrega enquanto qualquer etapa falhar.

## Observações de ambiente

- Em testes, o projeto usa fallback em memória quando `USE_IN_MEMORY_DB=1`.
- Em produção, configure envs de Google Sheets para persistência real.

## Comandos úteis

```bash
npm run dev
npm run lint
npm run test
npm run test:e2e
```
