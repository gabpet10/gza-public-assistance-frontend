# GZA Public Assistance Frontend

Frontend separato Next.js per il backend Public Assistance.

## Stack

- Next.js App Router
- TypeScript
- MUI come libreria primaria
- Tailwind come utility layer

## Setup

1. Copiare .env.example in .env.local.
2. Installare le dipendenze con npm install.
3. Avviare il backend su http://localhost:5187.
4. Avviare il frontend con npm run dev.

### Variabili ambiente consigliate

- API_BASE_URL oppure NEXT_PUBLIC_API_BASE_URL: URL base del backend.
- AUTH_SESSION_SECRET: segreto usato dal frontend server-side per firmare il cookie di sessione. In sviluppo, se non impostato, viene usato un fallback locale; in ambienti condivisi va configurato esplicitamente.

## Struttura

- src/app: route e layout.
- src/core: auth, config, api client.
- src/shared: theme e componenti foundation.
- src/features: moduli verticali.
- docs: note architetturali del frontend.

## Operativita Post-M5

- Checklist regressione: [docs/post-m5-regression-checklist.md](docs/post-m5-regression-checklist.md)
- Template checklist PR: [docs/pr-checklist-template.md](docs/pr-checklist-template.md)
- Chiusura backlog PR-00..PR-13: [docs/post-m5-backlog-closure.md](docs/post-m5-backlog-closure.md)