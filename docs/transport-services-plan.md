## Plan: Cruscotto TransportServices

Implementare una nuova workspace operativa TransportServices con doppia vista calendario + griglia, usando il contratto API fornito come fonte ufficiale. Priorita alla UX ispirata a Google Calendar, con operazioni create/edit/move/resize e azioni di ciclo di vita servizio (accept, assign, start, complete, cancel, reschedule).

**Vincolo UX prioritario**
1. L’interfaccia deve ispirarsi chiaramente al calendario Google: header operativo con Oggi/Prev/Next, switch vista sempre visibile, densita informativa alta ma leggibile, interazioni rapide (click slot, drag&drop, resize) e comportamento coerente tra calendario e griglia.

**Steps**
1. Fase 1 - Fondazioni dominio e integrazione API
1. Creare un nuovo slice feature dedicato con struttura api/types/components per TransportServices.
1. Modellare tipi frontend allineati agli enum backend: TransportPriority, TransportServiceStatus, TransportAssignmentRole.
1. Implementare API client del dominio con metodi:
1. searchTransportServices su GET /api/TransportServices con query paginata.
1. createTransportService su POST /api/TransportServices.
1. getTransportServiceById, updateTransportService, deleteTransportService su /api/TransportServices/{id}.
1. acceptTransportService, assignTransportService, startTransportService, completeTransportService, cancelTransportService, rescheduleTransportService su action endpoints.
1. getTransportCalendarEvents su GET /api/TransportServices/calendar-events.
1. Gestire errori ProblemDetails come shape standard per feedback utente e mapping messaggi.
1. Fase 2 - Routing, permessi e navigazione
1. Aggiungere route admin dedicata per la workspace TransportServices.
1. Aggiungere voce menu e regole accesso per ruoli Admin/Operator allineate al contesto organizzazione.
1. Definire URL state condivisibile per filtri e viste: view, startUtc, endUtc, status, priority, searchText, pageIndex, pageSize, sortBy, sortDescending.
1. Fase 3 - Vista calendario Google-like
1. Implementare calendario con granularita Giorno, Settimana, Mese, Anno.
1. Popolare il calendario tramite endpoint calendar-events variando startUtc/endUtc in base alla finestra visibile.
1. Implementare toolbar calendario con Oggi, Prev, Next, selettore vista e indicatori periodo.
1. Mappare campi evento:
1. title, startUtc, endUtc, status, priority, note, teamMemberCount.
1. Flag canMove, canAssign, canCancel per abilitazione azioni UI contestuali.
1. Azioni calendario MVP:
1. click su slot per creazione servizio (POST create).
1. apertura dettaglio/modifica servizio (GET by id + PUT).
1. drag and drop o resize per ripianificazione (POST reschedule con scheduledAtUtc).
1. Fase 4 - Azioni ciclo di vita e assegnazione
1. Implementare action panel contestuale nel dettaglio evento/riga con bottoni:
1. Accept (POST accept).
1. Assign (POST assign con vehicleId, assignedByUserId, teamMembers min 1).
1. Start (POST start).
1. Complete (POST complete).
1. Cancel (POST cancel).
1. Applicare guardie UI per transizioni stato usando status corrente + flag canAssign/canCancel/canMove.
1. Stato target principale da rispettare in UX: pending -> accepted -> assigned -> in_progress -> completed, con ramo cancel.
1. Fase 5 - Vista griglia gestionale
1. Implementare DataGrid server-side su GET /api/TransportServices con paginazione, ordinamento e ricerca.
1. Aggiungere filtri status/priority/rangeStartUtc/rangeEndUtc coerenti con contratto query.
1. Garantire coerenza dati con il calendario usando un singolo modello di normalizzazione lato frontend.
1. Fornire azioni riga identiche alle azioni evento (accept, assign, start, complete, cancel, reschedule).
1. Fase 6 - Hardening UX e quality gate
1. Uniformare feedback di loading/errore/vuoto per calendario e griglia.
1. Gestire correttamente timezone: invio/ricezione UTC, conversione locale solo in presentazione.
1. Gestire validazione query calendario: endUtc > startUtc.
1. Gestire validazioni assignment: almeno un membro team, ruoli driver/attendant validi.
1. Verificare responsive desktop/mobile e fluidita interazioni drag/resize.

**Parallelismo e dipendenze**
1. Fase 1 e bloccante per tutte le altre fasi.
1. Fase 2 puo procedere in parallelo con la parte finale di Fase 1 (dopo definizione tipi/nomi route).
1. Fase 4 e Fase 5 dipendono da Fase 3 per il modello eventi condiviso, ma lo sviluppo UI puo avanzare in parallelo su componenti separati.
1. Fase 6 chiude il ciclo dopo completamento funzionale di calendario, azioni stato e griglia.

**Relevant files**
- [src/core/api/api-client.ts](src/core/api/api-client.ts#L23) - client HTTP e gestione errori.
- [src/core/api/query-string.ts](src/core/api/query-string.ts#L3) - serializzazione query params.
- [src/app/api/bff/[...path]/route.ts](src/app/api/bff/[...path]/route.ts#L17) - pass-through API backend.
- [src/core/auth/roles.ts](src/core/auth/roles.ts#L108) - voce menu e accesso per nuova route.
- [src/core/auth/auth-guard.tsx](src/core/auth/auth-guard.tsx#L9) - enforcement accesso path-based.
- [src/app/(admin)/layout.tsx](src/app/(admin)/layout.tsx#L8) - contenitore area protetta.
- [src/shared/hooks/use-server-grid-state.ts](src/shared/hooks/use-server-grid-state.ts#L15) - stato griglia server-side.
- [src/shared/ui/search-toolbar.tsx](src/shared/ui/search-toolbar.tsx#L31) - filtri e ricerca.
- [src/shared/ui/data-grid/workspace-data-grid-styles.ts](src/shared/ui/data-grid/workspace-data-grid-styles.ts#L16) - stile tabella.
- [src/shared/ui/confirm-action-dialog.tsx](src/shared/ui/confirm-action-dialog.tsx#L25) - conferme azioni operative.
- [src/features/organizations/api/organizations-api.ts](src/features/organizations/api/organizations-api.ts#L88) - riferimento pattern API feature.
- [src/features/volunteers/api/volunteers-api.ts](src/features/volunteers/api/volunteers-api.ts#L73) - riferimento pattern DTO mapping.

**Nuovi file pianificati**
1. src/app/(admin)/transport-services/page.tsx
1. src/features/transport-services/api/types.ts
1. src/features/transport-services/api/transport-services-api.ts
1. src/features/transport-services/components/transport-services-workspace.tsx
1. src/features/transport-services/components/transport-services-calendar.tsx
1. src/features/transport-services/components/transport-services-grid.tsx
1. src/features/transport-services/components/transport-service-form-dialog.tsx
1. src/features/transport-services/components/transport-service-action-panel.tsx

**Verification**
1. API contract compliance
1. Verificare mapping request/response per tutti gli endpoint inclusi action endpoints.
1. Verificare gestione ProblemDetails su 400/401/403/404.
1. Calendario
1. Verificare caricamento eventi con query startUtc/endUtc/organizationId.
1. Verificare create, edit, reschedule da interazioni calendario.
1. Verificare abilitazione/disabilitazione azioni da canMove/canAssign/canCancel.
1. Lifecycle
1. Verificare transizioni stato corrette: accept, assign, start, complete, cancel.
1. Verificare payload assign con almeno un team member.
1. Griglia
1. Verificare paginazione/sorting/filtri su endpoint SearchTransportServices.
1. Verificare coerenza dati calendario-griglia dopo ogni mutazione.
1. UX e policy
1. Verificare conversione UTC -> locale in visualizzazione.
1. Verificare responsive su desktop/mobile.

**Decisions**
- In scope MVP: calendario Giorno/Settimana/Mese/Anno + griglia gestionale.
- In scope MVP: create, edit, reschedule, accept, assign, start, complete, cancel.
- Out of scope MVP: ricorrenze, realtime multiutente, pianificazione automatica.
- Contratto operativo ufficiale: file JSON condiviso in chat con versione 1.0.0.
- Libreria scheduler scelta: MUI X Scheduler (approccio early-adopter) per mantenere stack coerente MUI end-to-end e ottenere UX calendario Google-like integrata con il design system esistente.
- Strategia adozione: implementazione con adapter interno CalendarEngine (wrapper component + mapping eventi) per isolare la libreria e ridurre lock-in tecnico.
- Mitigazione rischio release: prevedere fallback tecnico su motore alternativo solo se bloccanti critici su drag&drop, resize o viste prima del go-live.

**Further Considerations**
1. Verificare se il backend accetta anche range inclusivo/esclusivo su endUtc per evitare off-by-one nelle viste mese/settimana.
1. Definire se assignedByUserId va valorizzato lato frontend o derivato da sessione backend per ridurre rischio incongruenze.
1. Definire una palette colore stabile per status/priority condivisa tra calendario e griglia.
