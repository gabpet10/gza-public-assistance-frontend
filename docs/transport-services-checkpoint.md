## TransportServices Checkpoint - 21-04-2026

### Obiettivo attuale
Approccio Grid-First confermato: completare prima tutte le funzioni operative della griglia, poi implementare lo scheduler.

### Stato corrente
1. Endpoint allineati e funzionanti su base route TransportServices.
2. Workspace Trasporti attiva con tab Griglia e Calendario.
3. Caricamento lista servizi e eventi calendario funzionante.
4. Action panel lifecycle disponibile: accept, assign, start, complete, cancel, reschedule.
5. Selezione servizio da griglia e da lista eventi calendario (con fallback get by id).
6. CRUD base griglia avviato:
- Nuovo: implementato
- Modifica: implementato
- Elimina: implementato con conferma
7. Empty state griglia implementata con CTA Crea primo servizio.
8. Form create/edit implementato con validazioni base (titolo obbligatorio, range date valido).

### Aggiornamento contratto backend recepito
TransportPriority allineato al backend pseudo-enum:
- routine
- urgent

Allineamenti applicati:
1. Tipi frontend aggiornati.
2. Form priorita aggiornato (Ordinario/Urgente).
3. Normalizzazione API aggiornata con compatibilita retroattiva sui vecchi valori.

### Completato (Grid-First)
1. Fase A sostanzialmente completata:
- form reale create/edit
- wiring create/edit/delete in workspace
- confirm delete
- empty state con CTA
2. Typecheck verde dopo le modifiche.

### In corso
1. Consolidamento Fase B (lifecycle griglia):
- messaggi UX piu espliciti su azioni non disponibili per stato
- rifinitura feedback/loading/error per ogni azione

### Prossimi step (ordine vincolato)
1. Fase B - Lifecycle Griglia Completo
- completare guardie stato e messaggi contestuali
- verificare assign con regole minime e refresh coerente
2. Fase C - Filtri e operativita griglia
- filtri status/priority/range data
- rifinitura ricerca/sort/paginazione
- miglioramento leggibilita colonne
3. Fase D - Verifica Grid-First
- test manuale completo su griglia (create/edit/delete + lifecycle)
- verifica UTC/local su create/edit/reschedule
- gate qualita: npm run typecheck, npm run lint
4. Fase E - Scheduler
- solo dopo sign-off della Fase D

### File principali da cui ripartire
- src/features/transport-services/components/transport-services-workspace.tsx
- src/features/transport-services/components/transport-service-form-dialog.tsx
- src/features/transport-services/components/transport-service-action-panel.tsx
- src/features/transport-services/components/transport-services-grid.tsx
- src/features/transport-services/api/transport-services-api.ts
- src/features/transport-services/api/types.ts

### Note operative
1. assignedByUserId resta server-authoritative.
2. Se ambiente backend e vuoto, creare dati seed minimi per accelerare i test griglia.
