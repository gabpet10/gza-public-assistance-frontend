# Frontend Architecture

## Obiettivo

Il frontend vive in un repository separato dal backend .NET per mantenere isolati toolchain, dipendenze Node e ciclo di rilascio.

## Strati

- core: config runtime, autenticazione JWT, API client e provider globali.
- shared: theme, shell e componenti foundation riusabili.
- features: moduli verticali di dominio, ciascuno proprietario dei propri tipi, chiamate API e componenti.
- app: composizione delle route App Router usando route groups per aree pubbliche, auth e admin.

## Contratti backend adottati

- QueryParameters usa pageIndex, pageSize, searchText, sortBy e sortDescending.
- PagedResult espone items, pageIndex, pageSize, totalCount, totalPages, hasPreviousPage e hasNextPage.
- SkillType, SkillLevel e RoleType sono trattati come stringhe JSON, coerentemente con i converter del backend.

## Primo slice

Volunteers e il vertical slice pilota. Consuma:

- POST /api/auth/login
- GET /api/volunteers
- GET /api/volunteers/{id}

## Gap backend ancora aperti

- Lista/search paginata per organization memberships.
- Lista inviti per volunteer.
- Enforcement organization-aware server-side su tutti gli endpoint list.