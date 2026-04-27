# PR Checklist Template (Post-M5)

Copiare questa sezione nella descrizione PR.

## Scope

- [ ] Obiettivo PR descritto in 1-2 righe.
- [ ] Feature/file principali elencati.

## Quality Gates

- [ ] `npm run lint` passato.
- [ ] `npm run typecheck` passato.

## Regression Smoke

- [ ] Auth/login/logout ok.
- [ ] Routing autorizzazioni ok.
- [ ] Workspace coinvolti testati.
- [ ] CRUD feature toccate testato (create/edit/delete).

## UI/UX Consistency

- [ ] DataGrid senza regressioni.
- [ ] Dialog/confirm senza stati inconsistenti.
- [ ] Nessuna nuova regola globale non necessaria.

## Risk e Rollback

- [ ] Rischi principali indicati.
- [ ] Strategia rollback indicata (file/feature).

## Notes

- [ ] Eventuali follow-up task aperti.
