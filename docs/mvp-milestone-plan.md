# MVP Milestone Plan

Questo documento definisce il passaggio da PoC ad applicazione reale tramite milestone incrementali. Ogni milestone chiude un sottosistema completo e include sempre:

- modifiche API
- adeguamenti UI
- consolidamento di componenti e helper riusabili
- validazione end-to-end prima di passare alla milestone successiva

## Obiettivi

- costruire una codebase riusabile per layer e pattern
- validare ogni feature passo per passo
- evitare di sviluppare backend e frontend in blocchi separati non verificati
- garantire multi-tenant forte per organization e controlli di ruolo coerenti

## Ruoli Inclusi

- Super Admin
- Org Admin
- Coordinator
- Volunteer

Nota: il ruolo Volunteer resta nel dominio, ma la sua area self-service è fuori scope per la prima console admin.

## Principi Di Delivery

- ogni milestone chiude un risultato funzionante, non solo una schermata
- non si apre la milestone successiva finché la precedente non ha superato test tecnici, verifica manuale e controllo dei permessi
- quando emerge logica condivisa, va estratta subito in layer riusabili
- il backend resta la fonte di verità per autenticazione, autorizzazione e scoping organization
- la UI usa i permessi per esperienza utente, non come controllo di sicurezza finale

## Milestone 1 - Login, Sessione E Accesso Base

### Scope

1. Pagina login.
2. Logout.
3. Bootstrap sessione.
4. Guard di autenticazione.
5. Gestione coerente dei 401 nel BFF.
6. Basi della navigazione per utenti autenticati.

### API Da Chiudere

1. `POST /api/auth/login`
   Modifiche richieste: response coerente con utente, ruoli, memberships ed expiration; 401 per credenziali invalide; 403 per utente disabilitato.
2. `POST /api/auth/logout`
   Modifiche richieste: invalidazione reale della sessione o del token lato server se supportata; risposta idempotente.
3. `GET /api/auth/session` oppure `GET /api/auth/me`
   Modifiche richieste: fonte trusted della sessione corrente con ruoli e memberships effettive.
4. `POST /api/auth/refresh` se adottato
   Modifiche richieste: rinnovo sessione controllato senza introdurre comportamenti impliciti.

### UI Da Chiudere

1. Pagina login completa.
2. Redirect post-login.
3. Stato di caricamento sessione.
4. Stato sessione scaduta o non valida.

### Asset Riusabili Da Produrre

1. Auth context stabile.
2. Auth guard riusabile.
3. Gestione uniforme 401 e 403 in BFF e client.

### Gate Di Uscita

1. Login funzionante end-to-end.
2. Logout pulito.
3. Refresh pagina con sessione valida senza perdita di stato auth.
4. Redirect corretto quando la sessione è assente.


## Milestone 2 - Dashboard professionale e menu dinamico

### Scope

1. Dopo il login, l’utente vede una dashboard con layout e stile definitivi.
2. Il menu mostra solo le voci consentite dal suo ruolo (Super User, Org Admin, Volunteer).
3. La logica di landing page differenziata per ruolo/loggato sarà oggetto di una milestone successiva.

### API Da Chiudere

1. Nessuna API nuova necessaria per la milestone: si usano i dati di sessione/ruolo già disponibili.

### UI Da Chiudere

1. Dashboard stilizzata e coerente con il design definitivo.
2. Menu laterale/header generato dinamicamente in base al ruolo.
3. Responsive design, palette colori, tipografia, icone e feedback states definitivi.

### Asset Riusabili Da Produrre

1. Struttura dati centralizzata per i menu, con ruoli abilitati.
2. Hook/helper per filtrare menu e feature in base al ruolo.
3. Layout e shell riutilizzabili per tutte le aree.

### Gate Di Uscita

1. Login con ciascun ruolo: la dashboard appare con stile definitivo e menu corretto.
2. Nessuna logica di landing page differenziata: tutti atterrano sulla dashboard.
3. UI pronta per estensioni future (landing page per ruolo, nuove feature/menu).

## Milestone 3 - Volunteers List E Dettaglio

### Scope

1. Primo vertical slice operativo in consultazione.
2. Lista volontari.
3. Ricerca, paginazione e ordinamento.
4. Dettaglio volontario.

### API Da Chiudere

1. `GET /api/volunteers`
   Modifiche richieste: scoping organization server-side obbligatorio; mantenere ricerca, paginazione e ordinamento coerenti.
2. `GET /api/volunteers/{volunteerId}`
   Modifiche richieste: accesso solo se il volunteer appartiene a una organization visibile al chiamante.

### UI Da Chiudere

1. Lista volontari completa.
2. Search toolbar e paginazione.
3. Dettaglio volontario.
4. Empty state e forbidden state corretti.

### Asset Riusabili Da Produrre

1. Pattern standard list/detail workspace.
2. Gestione loading/error per feature data-driven.
3. Utility comuni per query e paginazione.

### Gate Di Uscita

1. Nessun leak cross-organization in list e detail.
2. Org Admin e Coordinator vedono il perimetro corretto.
3. Test di scoping superati.

## Milestone 4 - Volunteers CRUD

### Scope

1. Creazione volontario.
2. Modifica volontario.
3. Archiviazione volontario.
4. Permessi write reali per ruolo.

### API Da Chiudere

1. `POST /api/volunteers`
   Modifiche richieste: server-side validation dello scope organization e dei campi obbligatori.
2. `PUT /api/volunteers/{volunteerId}` oppure `PATCH /api/volunteers/{volunteerId}`
   Modifiche richieste: impedire cambi tenant non autorizzati; audit delle modifiche sensibili.
3. `DELETE /api/volunteers/{volunteerId}` oppure `POST /api/volunteers/{volunteerId}/archive`
   Modifiche richieste: preferire archiviazione soft delete con policy esplicita per Org Admin e Coordinator.

### UI Da Chiudere

1. Create form.
2. Edit form.
3. Conferma archiviazione.
4. Messaggi validation e business errors.

### Asset Riusabili Da Produrre

1. Pattern form riutilizzabile per create/edit.
2. Dialog di conferma coerenti.
3. Gestione standard dei Problem Details lato UI.

### Gate Di Uscita

1. CRUD volontari validato end-to-end.
2. Org Admin e Coordinator hanno solo le azioni consentite.
3. I tentativi forzati non autorizzati sono bloccati dal backend.

## Milestone 5 - Volunteer Skills

### Scope

1. Assegnazione skill al volontario.
2. Modifica skill assegnata.
3. Rimozione skill assegnata.
4. Completamento del flusso operativo volontari.

### API Da Chiudere

1. `GET /api/volunteers/{volunteerId}/skills`
   Modifiche richieste: restituire solo skill coerenti con la organization del volunteer.
2. `POST /api/volunteers/{volunteerId}/skills`
   Modifiche richieste: consentire assegnazione solo con accesso al volunteer e skill appartenente a catalogo consentito.
3. `PATCH /api/volunteers/{volunteerId}/skills/{skillId}`
   Modifiche richieste: aggiornare livello o metadati nel rispetto delle policy di catalogo.
4. `DELETE /api/volunteers/{volunteerId}/skills/{skillId}`
   Modifiche richieste: rimozione idempotente e auditabile.

### UI Da Chiudere

1. Lista skill del volontario.
2. Dialog add/edit/remove skill.
3. Gestione dei vincoli di catalogo e livello skill.

### Asset Riusabili Da Produrre

1. Pattern standard per nested resources.
2. Dialog di editing secondario.
3. Policy helper per azioni annidate.

### Gate Di Uscita

1. Il flusso volontario è completo e usabile.
2. Le skill assegnabili rispettano il catalogo consentito.
3. Gli errori business sono chiari e coerenti.

## Milestone 6 - Skills Catalog

### Scope

1. Gestione del catalogo skill come feature autonoma.
2. Riuso dei pattern costruiti sui volontari.

### API Da Chiudere

1. `GET /api/skills`
2. `GET /api/skills/{skillId}`
3. `POST /api/skills`
4. `PUT /api/skills/{skillId}` oppure `PATCH /api/skills/{skillId}`
5. `DELETE /api/skills/{skillId}` oppure `POST /api/skills/{skillId}/archive`

Modifiche richieste: definire se il catalogo è organization-scoped o globale; la raccomandazione MVP è organization-scoped con vista globale opzionale solo per Super Admin.

### UI Da Chiudere

1. Lista skill.
2. Create, edit e archive skill.
3. Eventuale sola lettura per Coordinator.

### Asset Riusabili Da Produrre

1. Riuso del workspace CRUD standard.
2. Riuso dei form dialog e confirm dialog.

### Gate Di Uscita

1. Catalogo allineato al modello tenant scelto.
2. Nessuna duplicazione inutile di logica rispetto alla feature volontari.

## Milestone 7 - Users E Memberships

### Scope

1. Gestione utenti della organization.
2. Gestione ruoli e memberships.
3. Onboarding amministrativo reale.

### API Da Chiudere

1. `GET /api/organizations/{organizationId}/memberships` oppure equivalente scelto.
2. `POST /api/organizations/{organizationId}/memberships`
3. `PATCH /api/organizations/{organizationId}/memberships/{membershipId}`
4. `DELETE /api/organizations/{organizationId}/memberships/{membershipId}` oppure `POST /api/organizations/{organizationId}/memberships/{membershipId}/revoke`
5. `GET /api/users`
6. `GET /api/users/{userId}`
7. `POST /api/users`
8. `PUT /api/users/{userId}` oppure `PATCH /api/users/{userId}`

Modifiche richieste: prevenire self-escalation; proteggere il caso dell'ultimo admin; separare chiaramente vista globale e vista organization-scoped.

### UI Da Chiudere

1. Lista utenti.
2. Creazione utente con membership iniziale.
3. Edit ruolo e stato membership.
4. Revoca accesso.

### Asset Riusabili Da Produrre

1. Pattern standard per gestione ruoli e azioni sensibili.
2. Controlli anti self-escalation riflessi in UI.

### Gate Di Uscita

1. Org Admin gestisce il proprio perimetro senza leak cross-org.
2. Super Admin mantiene la visione globale prevista.
3. Le regole su ultimo admin e self-escalation sono validate.

## Milestone 8 - Organizations

### Scope

1. Gestione organizzazioni come feature globale.
2. Completamento del perimetro piattaforma per Super Admin.

### API Da Chiudere

1. `GET /api/organizations`
2. `GET /api/organizations/{organizationId}`
3. `POST /api/organizations`
4. `PUT /api/organizations/{organizationId}` oppure `PATCH /api/organizations/{organizationId}`
5. `DELETE /api/organizations/{organizationId}` oppure `POST /api/organizations/{organizationId}/deactivate`

Modifiche richieste: accesso solo per Super Admin; preferire deactivate a hard delete; proteggere i vincoli business su entità collegate.

### UI Da Chiudere

1. Lista organizzazioni.
2. Create, edit e deactivate organization.
3. Eventuale dettaglio organization.

### Asset Riusabili Da Produrre

1. Riuso dei workspace CRUD amministrativi.
2. Standard di warning per operazioni globali.

### Gate Di Uscita

1. Solo Super Admin vede e usa questa area.
2. I vincoli business su deactivate sono rispettati.

## Milestone 9 - Dashboard Reale

### Scope

1. KPI minimi reali per ruolo.
2. Sostituzione dello scaffold statico.

### API Da Chiudere

1. `GET /api/dashboard/summary`
2. `GET /api/dashboard/alerts` oppure `GET /api/dashboard/highlights` se inclusi

Modifiche richieste: KPI globali per Super Admin, organization-scoped per Org Admin, operativi per Coordinator.

### UI Da Chiudere

1. Dashboard Super Admin.
2. Dashboard Org Admin.
3. Dashboard Coordinator.

### Asset Riusabili Da Produrre

1. KPI cards riutilizzabili.
2. Pattern summary panel per feature future.

### Gate Di Uscita

1. I KPI sono coerenti con i dati delle feature già rilasciate.
2. Il contenuto cambia correttamente per ruolo e organization.

## Milestone 10 - Hardening Finale E UAT

### Scope

1. Test automatici minimi.
2. Audit e logging.
3. Rifinitura stati errore, loading e forbidden.
4. Collaudo completo per ruolo.

### API Da Chiudere

1. Standardizzazione finale degli errori.
2. Audit hooks trasversali.
3. Eventuali aggiustamenti emersi dai collaudi precedenti.

### UI Da Chiudere

1. Rifinitura feedback states.
2. Coerenza finale di dialog, form e messaggi.

### Asset Riusabili Da Produrre

1. Libreria interna di pattern consolidati per future feature.
2. Checklist di introduzione nuova feature basata sul percorso già validato.

### Gate Di Uscita

1. Test critici verdi.
2. UAT completata per Super Admin, Org Admin e Coordinator.
3. Verifiche negative cross-organization superate.

## Regole Trasversali API

1. Standardizzare Problem Details per errori di validazione, conflitto, 401 e 403.
2. Applicare paginazione e sorting coerenti con i tipi già usati dal frontend.
3. Introdurre audit per create, update, revoke, archive e change-role.
4. Definire quando usare 403 rispetto a 404 per non esporre risorse cross-tenant.
5. Non fidarsi mai di `organizationId`, `roleType` o scope inviati dal client se incompatibili con la sessione reale.
6. Valutare correlation id e header di tracing nel BFF.

## Scope Incluso

- console amministrativa role-aware
- multi-tenant forte per organization
- gestione volontari e volunteer skills
- gestione utenti e memberships
- gestione organizzazioni
- dashboard reale minima
- hardening auth e BFF essenziale

## Scope Escluso Dall'MVP Iniziale

- area self-service Volunteer
- notifiche complete ed email di invito
- reportistica avanzata ed export estesi
- workflow complessi oltre il vertical slice volontari
- automazioni o analytics avanzati