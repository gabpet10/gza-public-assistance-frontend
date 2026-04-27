# M0 Baseline e Stabilizzazione

## Stato
M0 implementata a livello di configurazione ruoli, hardening route e baseline documentale.

## 1) Matrice ruoli consolidata
Riferimento codice: src/core/auth/roles.ts

- admin (SUPER_USER):
- dashboard
- organizzazioni

- operator (ORG_ADMIN):
- dashboard
- utenti
- volontari

- volontario (VOLUNTEER):
- dashboard
- le mie attivita

Nota: aggiunta route page per le mie attivita in src/app/(admin)/my-activities/page.tsx per evitare menu non risolto.

## 2) Hardening URL diretto consolidato
Riferimento codice: src/core/auth/auth-guard.tsx e src/core/auth/use-permissions.ts

- Accesso non autenticato -> redirect login con next.
- mustChangePassword -> redirect change-password forced.
- Accesso non autorizzato per ruolo/path -> redirect dashboard.

## 3) Checklist smoke test M0

### Admin (SUPER_USER)
- [ ] Vede Dashboard e Organizzazioni in sidebar.
- [ ] Accesso diretto a /users -> redirect /dashboard.
- [ ] Accesso diretto a /volunteers -> redirect /dashboard.

### Operatore (ORG_ADMIN)
- [ ] Vede Dashboard, Utenti, Volontari in sidebar.
- [ ] Accesso diretto a /organizations -> redirect /dashboard.
- [ ] Accesso diretto a /my-activities -> redirect /dashboard.

### Volontario (VOLUNTEER)
- [ ] Vede Dashboard e Le mie attivita in sidebar.
- [ ] Accesso diretto a /users -> redirect /dashboard.
- [ ] Accesso diretto a /volunteers -> redirect /dashboard.
- [ ] /my-activities apre la pagina dedicata.

## 4) Baseline visiva (manuale)
Per completare M0 al 100 percento, allegare screenshot in una PR o cartella docs/screenshots/m0:

- [ ] Login page desktop
- [ ] Login page mobile
- [ ] Dashboard SUPER_USER
- [ ] Dashboard ORG_ADMIN
- [ ] Dashboard VOLUNTEER
- [ ] Organizations workspace
- [ ] Users workspace
- [ ] Volunteers workspace
- [ ] My Activities page

## 5) Comandi di verifica tecnica
- npm run typecheck
- npm run lint
