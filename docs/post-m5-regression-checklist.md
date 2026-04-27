# Post-M5 Regression Checklist

Questa checklist e il gate minimo prima di fare merge su refactor/hardening post milestone 1-5.

## 1. Definition Of Done (obbligatoria)

- `npm run lint` passa senza errori.
- `npm run typecheck` passa senza errori.
- Le route admin principali sono navigabili senza errori runtime.
- Le funzionalita toccate dalla PR sono testate manualmente con esito positivo.
- Nessun warning/errore console bloccante durante i flussi principali.

## 2. Smoke Test Auth e Routing

- Login utente valido.
- Logout e redirect corretti.
- Accesso negato su route non autorizzate.
- Accesso consentito su route autorizzate.
- Cambio contesto organizzazione (se previsto dal ruolo) senza regressioni.

## 3. Smoke Test Workspace Admin Attivi

Eseguire i seguenti controlli minimi su:

- `Volunteers`
- `Users`
- `Organizations`
- `Clients`
- `Destinations`
- `Vehicles`

Per ciascun workspace:

- Caricamento lista senza errori.
- Ricerca testuale funzionante.
- Ordinamento colonna funzionante.
- Paginazione server-side funzionante.
- Selezione riga e stato UI coerente.

## 4. CRUD Smoke per Feature Toccate

Per ogni entita modificata nella PR:

- Create: ok.
- Edit: ok.
- Delete: ok.
- Persistenza in lista dopo refresh: ok.

## 5. Drawer/Dialog/Confirm States

- Apertura/chiusura dialog senza stati sporchi.
- Messaggi errore coerenti in caso di failure API.
- Confirm action non lascia UI in stato bloccato.
- Bottoni disabled/loading coerenti durante submit.

## 6. DataGrid UX Consistency

- Nessuna colonna rotta o overflow anomalo su desktop/mobile.
- Azioni riga visibili/comportamento hover coerente con la feature.
- Nessuna regressione su stile shared (`organizationsEnterpriseDataGridSx`).

## 7. Style/Design System Guardrails

Se la PR tocca stile/theme/shared UI:

- Evitare nuovi hardcoded colore/spacing se esistono token condivisi.
- Evitare regole feature-specific in `globals.css` quando possibile.
- Verificare coerenza con componenti shared (`ContentCard`, `SearchToolbar`, `ConfirmActionDialog`).

## 8. Esito Finale (da compilare in PR)

- Lint: PASS/FAIL
- Typecheck: PASS/FAIL
- Smoke route/auth: PASS/FAIL
- Smoke workspace: PASS/FAIL
- CRUD feature toccate: PASS/FAIL
- Note regressioni residue: nessuna / elenco
