# Roadmap M1-M5 Modernizzazione Admin

## Obiettivo
Eseguire una roadmap completa in 5 milestone per:
- centralizzare lo stile,
- uniformare l'esperienza CRUD,
- introdurre la modalita admin-in-contesto organizzazione (persistente in sessione),
- mostrare branding org attiva in topbar,
- aggiungere le nuove feature Clienti/Destinazioni/Veicoli con stesso pattern e permessi operatore.

## Decisioni confermate
- Ruoli business: admin, operator, volontario.
- Mapping tecnico: admin -> SUPER_USER, operator -> ORG_ADMIN, volontario -> VOLUNTEER.
- Context switch M3 persistente in sessione (server-authoritative).
- Nuove API M5 con pattern CRUD paginato uguale alle feature esistenti.

## M0 - Baseline e stabilizzazione
Stato: completata

1. Congelare stato UI corrente con checklist visiva su dashboard/auth/workspace.
2. Consolidare la matrice ruoli concordata.
3. Verificare hardening URL diretto su route admin/operator.

## M1 - Centralizzazione stile (no behavior change)
Stato: completata

1. Unificare token tra:
- src/shared/theme/theme.ts
- src/app/globals.css
- tailwind.config.ts
2. Definire token semantici unici (surface, border, accentPrimary, accentSecondary, textMuted, interactiveHover).
3. Estrarre componenti shared da pattern duplicati:
- workspace header card,
- frame dialog entita,
- detail drawer shell,
- bottoni primari/secondari/distruttivi.
4. Sostituire hardcoded colore/ombra nei workspace.
5. Aggiornare documentazione convenzioni stile.

## M2 - Applicare stile Organizations alle altre pagine
Stato: completata

1. Formalizzare preset DataGrid enterprise condiviso.
2. Applicarlo a Users/Volunteers (e Skills quando riattivata).
3. Uniformare toolbar, spacing, pulsanti azione e stati loading/error/empty.
4. Uniformare dialog create/edit/delete al frame condiviso.
5. Rifinitura responsive xs/md/lg.

## M3 - Admin entra in una organizzazione (context switch)
Stato: completata

1. Introdurre activeOrganizationId nella sessione firmata.
2. Estendere AuthContext con:
- enterOrganizationContext,
- exitOrganizationContext,
- refresh sessione.
3. Rendere permessi context-aware.
4. Aggiornare AuthGuard con enforcement ruolo+contesto.
5. Aggiungere UX di ingresso contesto da Organizations.
6. Aggiungere azione "Esci dal contesto" in topbar/menu utente.

## M4 - Branding organizzazione attiva in header
1. Mostrare logo e nome org attiva in AppShell.
2. Aggiungere badge "contesto attivo".
3. Gestire fallback robusti (logo mancante, nome lungo, contesto non valido).
4. Aggiornare dati visualizzati live dopo enter/exit context.

## M5 - Nuove feature Clienti/Destinazioni/Veicoli
Stato: completata (frontend)

1. Implementare vertical slice per ciascuna feature:
- api/types,
- workspace,
- form-dialog,
- route page,
- menu role-gated.
2. Accesso disponibile a:
- ORG_ADMIN,
- SUPER_USER solo quando e in contesto org.
3. Reuse pattern esistenti:
- SearchToolbar,
- ConfirmActionDialog,
- feedback states,
- DataGrid enterprise preset.
4. Validare CRUD completo e autorizzazioni per ruolo.

## File principali impattati
- src/core/auth/roles.ts
- src/core/auth/use-permissions.ts
- src/core/auth/auth-guard.tsx
- src/core/auth/auth-context.tsx
- src/core/auth/types.ts
- src/core/auth/server/auth-session.ts
- src/app/api/auth/session/route.ts
- src/shared/ui/app-shell.tsx
- src/shared/ui/data-grid/workspace-data-grid-styles.ts
- src/features/organizations/components/organizations-workspace.tsx
- src/features/users/components/users-workspace.tsx
- src/features/volunteers/components/volunteers-workspace.tsx
- src/features/dashboard/components/dashboard-overview.tsx

## Nuove aree M5
- src/features/clients/
- src/features/destinations/
- src/features/vehicles/
- src/app/(admin)/clients/page.tsx
- src/app/(admin)/destinations/page.tsx
- src/app/(admin)/vehicles/page.tsx

## Verifica per milestone
1. npm run typecheck
2. npm run lint
3. Test manuali ruoli/menu + URL diretto.
4. Test visuali responsive xs/md/lg.
5. Test CRUD completi per M5.
