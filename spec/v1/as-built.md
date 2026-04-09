# EasyApply v1 — As-Built Documentation

> Generated: 2026-04-08. Describes the actual implemented state of EasyApply v1.
> Source of truth: the code. This document reflects what exists, not what was planned.

---

## 1. Summary — Plan vs Reality

| Area | Planned | Built | Status |
|------|---------|-------|--------|
| Application CRUD | Basic REST API | Full CRUD + stage + duplicate check | As planned + more |
| Kanban view | 5 statuses (WYSŁANE/ROZMOWA/ZADANIE/OFERTA/ODRZUCONE) | 4 DB statuses (SENT/IN_PROGRESS/OFFER/REJECTED), 3 Kanban columns (SENT/IN_PROGRESS/FINISHED) | Different |
| CV management | PDF upload + LINK + NOTE types, assign to application (ETAP 4) | Implemented as planned | As planned |
| Notes | Plaintext with PYTANIA/FEEDBACK/INNE categories (ETAP 5) | Implemented, categories renamed to English | As planned |
| Authentication | Not in MVP (planned for future) | Fully implemented: Google OAuth2 + JWT + refresh tokens | Added beyond spec |
| Stage history (StageHistory entity) | Planned in mvp-implementation-plan.md | Implemented, then removed (V12) — overengineered | Removed |
| i18n (EN/PL) | Not in brief | Fully implemented: i18next, LanguageDetector, switcher, all strings translated | Added beyond spec |
| Badges / gamification | In plan (ETAP 7) | StatisticsService + BadgeWidget (rejection/ghosting badges, sweet revenge) | As planned |
| Responsiveness / mobile | Implicit in brief (vs Teal: "brak wersji mobilnej") | FAB, MoveModal as mobile bottom sheet, isMobile(), OnboardingOverlay | As planned |
| Onboarding / Tour | Not in plan | OnboardingOverlay, TourGuide components | Added beyond spec |
| Enum values | Polish (WYSLANE, BRUTTO, UOP, BRAK_ODPOWIEDZI) | English (SENT, GROSS, EMPLOYMENT, NO_RESPONSE) | Different (renamed) |
| Salary change auto-note | Planned in i18n impl. plan | `createSalaryChangeNote()` defined in NoteService — never called from ApplicationService | Dead code |
| Duplicate detection | Planned (check-duplicate) | Implemented | As planned |
| Job description archive | Planned (jobDescription field) | Implemented | As planned |
| Re-application warning | Planned | Implemented via check-duplicate | As planned |
| Hidden recruitment (agency) | Planned | Implemented (agency field) | As planned |
| Security: CORS | Planned (separate CorsConfig) | Merged into SecurityConfig | Different |
| Database migrations | Not planned (ddl-auto=update) | Flyway migrations V1–V12 | Added beyond spec |

---

## 2. Features — Status

Based on `spec/v1/01-vision/brief.md`:

### MVP Features (§4)

| Feature | Status | Notes |
|---------|--------|-------|
| Application registry (CRUD): company, position, link, date, salary, currency, status, source | ✅ Implemented | Plus: salaryMin/salaryMax, contractType, salaryType, salarySource, agency, jobDescription |
| Kanban view: drag & drop between columns | ✅ Implemented | 3 columns (SENT, IN_PROGRESS, FINISHED) — not 5 as in brief |
| CV management: PDF upload (max 5MB) + LINK + NOTE types, assign to application | ✅ Implemented | As planned in ETAP 4; categories renamed to English |
| Notepad: plaintext, multiple per application, with categories (PYTANIA/FEEDBACK/INNE) | ✅ Implemented | As planned in ETAP 5; categories renamed to English (QUESTIONS/FEEDBACK/OTHER) |

### Edge Cases (§5)

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Re-application notification | ✅ Implemented | `GET /api/applications/check-duplicate` |
| Hidden recruitment (agency field) | ✅ Implemented | `agency` field on Application entity |
| Expired links (job description archive) | ✅ Implemented | `jobDescription TEXT` column |
| Salary negotiation history | ❌ Not implemented | `createSalaryChangeNote()` exists in NoteService but is never called from ApplicationService — dead code, no user-visible effect |
| Multi-currency (PLN/EUR/USD/GBP) | ✅ Implemented | `currency` field, no auto-conversion |
| Duplicate detection | ✅ Implemented | Case-insensitive match on company + position |

---

## 3. Backend — Actual Architecture

### Package structure

```
com.easyapply/
  EasyApplyApplication.java        — main class, @SpringBootApplication, @EnableJpaAuditing
  config/
    I18nConfig.java                — MessageSource (i18n/messages), AcceptHeaderLocaleResolver (default: en)
    SecurityConfig.java            — Spring Security, OAuth2, JWT encoder/decoder, CORS
  controller/
    ApplicationController.java     — /api/applications
    AuthController.java            — /api/auth
    CVController.java              — /api/cv
    NoteController.java            — /api (nested under /applications and /notes)
    StatisticsController.java      — /api/statistics
  dto/
    ApplicationRequest.java        — record (company, position, link, salary*, currency, salaryType, contractType, salarySource, source, jobDescription, agency)
    ApplicationResponse.java       — record (all Application fields + cv info flattened: cvId, cvFileName, cvType, cvExternalUrl)
    ApplicationStats.java          — record (rejections, ghosting, offers) — for JPQL projection
    BadgeResponse.java             — record (name, icon, description, threshold, currentCount, nextThreshold, nextBadgeName)
    BadgeStatsResponse.java        — record (rejectionBadge, ghostingBadge, sweetRevengeUnlocked, totals)
    NoteRequest.java               — record (content, category)
    NoteResponse.java              — record (id, content, category, applicationId, createdAt)
    StageUpdateRequest.java        — record (status, currentStage, rejectionReason, rejectionDetails)
    StatusUpdateRequest.java       — record (status)
    UserResponse.java              — record (id, email, name)
  entity/
    Application.java               — @Entity, table: applications
    CV.java                        — @Entity, table: cvs
    Note.java                      — @Entity, table: notes
    User.java                      — @Entity, table: users
    ApplicationStatus.java         — enum: SENT, IN_PROGRESS, OFFER, REJECTED
    ContractType.java              — enum: B2B, EMPLOYMENT, MANDATE, OTHER
    CVType.java                    — enum: FILE, LINK, NOTE
    NoteCategory.java              — enum: QUESTIONS, FEEDBACK, OTHER
    RejectionReason.java           — enum: NO_RESPONSE, EMAIL_REJECTION, REJECTED_AFTER_INTERVIEW, OTHER
    SalarySource.java              — enum: FROM_POSTING, MY_PROPOSAL
    SalaryType.java                — enum: GROSS, NET
  exception/
    GlobalExceptionHandler.java    — @RestControllerAdvice, handles validation / EntityNotFoundException / fallback
  repository/
    ApplicationRepository.java     — JpaRepository; custom queries: findByUserId, findByIdAndUserId, existsByIdAndUserId, findByUserIdAndCompanyIgnoreCaseAndPositionIgnoreCase, getApplicationStats, clearCVReferences
    CVRepository.java              — JpaRepository
    NoteRepository.java            — JpaRepository; findByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc, findByIdAndApplicationUserId, etc.
    UserRepository.java            — JpaRepository; findByGoogleId, findByRefreshToken
  security/
    AuthenticatedUser.java         — record (id: UUID) — principal injected by JwtAuthenticationConverter
    CustomOAuth2UserService.java   — loads/creates user from Google OAuth2 attributes
    JwtAuthenticationConverter.java — extracts AuthenticatedUser from JWT sub claim
    JwtService.java                — generates access token (RS256, 15 min) and refresh token (UUID)
    MdcUserFilter.java             — adds user email to MDC for logging
    OAuth2AuthenticationSuccessHandler.java — on OAuth2 success: issues JWT + refresh token, redirects to frontend
  service/
    ApplicationService.java        — create, findAllByUserId, findById, updateStatus, updateStage, addStage, findDuplicates, delete, update
    CVService.java                 — uploadCV, findAllByUserId, findById, downloadCV, deleteCV, createCV, updateCV, assignCVToApplication, removeCVFromApplication
    NoteService.java               — create, findByApplicationId, findById, update, delete, deleteByApplicationId, createSalaryChangeNote (⚠️ dead code — never called)
    StatisticsService.java         — getBadgeStats: computes rejection/ghosting badges + sweet revenge unlock
    UserService.java               — findOrCreateUser, getById, getByGoogleId, saveRefreshToken, clearRefreshToken, findByValidRefreshToken + createDemoApplication (new user only)
```

### All REST endpoints

**ApplicationController — `/api/applications`**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/applications` | Create application |
| `GET` | `/api/applications` | List all (current user) |
| `GET` | `/api/applications/{id}` | Get by ID |
| `PUT` | `/api/applications/{id}` | Full update |
| `DELETE` | `/api/applications/{id}` | Delete |
| `PATCH` | `/api/applications/{id}/status` | Change status (simple) |
| `PATCH` | `/api/applications/{id}/stage` | Update stage + status + rejection data |
| `POST` | `/api/applications/{id}/stage` | Add stage (sets currentStage, moves to IN_PROGRESS) |
| `PATCH` | `/api/applications/{id}/cv` | Assign or unassign CV (`{cvId: null}` removes) |
| `GET` | `/api/applications/check-duplicate` | Find duplicates by company + position |

**AuthController — `/api/auth`**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/auth/me` | Get current user profile (requires JWT) |
| `POST` | `/api/auth/refresh` | Issue new access token from refresh token cookie |
| `POST` | `/api/auth/logout` | Clear refresh token in DB + remove cookie |

**CVController — `/api/cv`**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/cv/upload` | Upload PDF file (multipart/form-data) |
| `POST` | `/api/cv` | Create CV entry (name + type + optional URL) |
| `GET` | `/api/cv` | List all CVs (current user) |
| `GET` | `/api/cv/{id}` | Get CV by ID |
| `PUT` | `/api/cv/{id}` | Update CV entry |
| `DELETE` | `/api/cv/{id}` | Delete CV |
| `GET` | `/api/cv/{id}/download` | Download PDF (Content-Disposition: attachment) |

**NoteController — `/api`**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/applications/{applicationId}/notes` | List notes for application |
| `POST` | `/api/applications/{applicationId}/notes` | Create note |
| `GET` | `/api/notes/{id}` | Get note by ID |
| `PUT` | `/api/notes/{id}` | Update note |
| `DELETE` | `/api/notes/{id}` | Delete note |

**StatisticsController — `/api/statistics`**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/statistics/badges` | Get badge stats (rejections, ghosting, offers, badges) |

**Spring Security managed**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/oauth2/authorization/google` | Start Google OAuth2 login |
| `GET` | `/actuator/health` | Health check (public) |

### Key dependencies (pom.xml)

| Artifact | Purpose |
|----------|---------|
| `spring-boot-starter-web` | REST API |
| `spring-boot-starter-data-jpa` | ORM |
| `spring-boot-starter-validation` | Bean Validation |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-oauth2-client` | Google OAuth2 login |
| `spring-boot-starter-oauth2-resource-server` | JWT validation |
| `spring-boot-starter-actuator` | Health endpoint |
| `postgresql` | JDBC driver |
| `h2` | In-memory DB for tests |
| `flyway-core` + `flyway-database-postgresql` | DB migrations |
| `spring-dotenv` | `.env` file support |
| No Lombok | All getters/setters written manually |

---

## 4. Database — Actual Schema

### Migration history

| Version | File | Purpose |
|---------|------|---------|
| V1 | `V1__init_schema.sql` | Initial: cvs, applications, notes, stage_history tables |
| V2 | `V2__add_session_id.sql` | session_id columns (pre-auth, anonymous multi-tenant mode) |
| V3 | `V3__migrate_deprecated_statuses.sql` | ROZMOWA/ZADANIE→W_PROCESIE, ODRZUCONE→ODMOWA |
| V4 | `V4__auth_schema.sql` | users table, user_id FK on applications+cvs, drop session_id |
| V5 | `V5__rename_rejection_reasons.sql` | BRAK_ODPOWIEDZI→NO_RESPONSE etc. |
| V6 | `V6__rename_note_categories.sql` | PYTANIA→QUESTIONS, INNE→OTHER etc. |
| V7 | `V7__rename_salary_types.sql` | BRUTTO→GROSS, NETTO→NET |
| V8 | `V8__rename_contract_types.sql` | UOP→EMPLOYMENT, UZ→MANDATE, INNA→OTHER |
| V9 | `V9__rename_application_statuses.sql` | WYSLANE→SENT, W_PROCESIE→IN_PROGRESS, OFERTA→OFFER, ODMOWA→REJECTED |
| V10 | `V10__fix_column_defaults.sql` | column defaults: WYSLANE→SENT, INNE→OTHER |
| V11 | `V11__user_id_not_null.sql` | user_id NOT NULL on applications + cvs |
| V12 | `V12__drop_stage_history.sql` | DROP TABLE stage_history |

### Current tables

**`users`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| name | VARCHAR(255) | NOT NULL |
| google_id | VARCHAR(255) | NOT NULL, UNIQUE |
| refresh_token | VARCHAR(255) | nullable |
| refresh_token_expiry | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL |

**`applications`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| company | VARCHAR(255) | NOT NULL |
| position | VARCHAR(255) | NOT NULL |
| link | VARCHAR(500) | nullable |
| salary_min | INTEGER | nullable |
| salary_max | INTEGER | nullable |
| currency | VARCHAR(10) | nullable |
| salary_type | VARCHAR(50) | nullable (GROSS/NET) |
| contract_type | VARCHAR(50) | nullable (B2B/EMPLOYMENT/MANDATE/OTHER) |
| salary_source | VARCHAR(50) | nullable (FROM_POSTING/MY_PROPOSAL) |
| source | VARCHAR(255) | nullable |
| status | VARCHAR(50) | NOT NULL, default 'SENT' (SENT/IN_PROGRESS/OFFER/REJECTED) |
| job_description | TEXT | nullable |
| agency | VARCHAR(255) | nullable |
| cv_id | BIGINT | FK → cvs(id), nullable |
| applied_at | TIMESTAMP | NOT NULL |
| current_stage | VARCHAR(255) | nullable |
| rejection_reason | VARCHAR(100) | nullable (NO_RESPONSE/EMAIL_REJECTION/REJECTED_AFTER_INTERVIEW/OTHER) |
| rejection_details | TEXT | nullable |
| user_id | UUID | FK → users(id), NOT NULL |

**`cvs`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| type | VARCHAR(50) | default 'FILE' (FILE/LINK/NOTE) |
| file_name | VARCHAR(255) | nullable (storage filename) |
| original_file_name | VARCHAR(255) | NOT NULL (display name) |
| file_path | VARCHAR(500) | nullable |
| file_size | BIGINT | nullable |
| external_url | VARCHAR(500) | nullable |
| uploaded_at | TIMESTAMP | NOT NULL |
| user_id | UUID | FK → users(id), NOT NULL |

**`notes`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| content | TEXT | NOT NULL |
| application_id | BIGINT | FK → applications(id), NOT NULL, ON DELETE CASCADE |
| category | VARCHAR(255) | default 'OTHER' (QUESTIONS/FEEDBACK/OTHER) |
| created_at | TIMESTAMP | NOT NULL |

**`stage_history`** — DROPPED (V12). Was: id, application_id FK, stage_name, completed, created_at, completed_at.

### Relations

- `applications.user_id` → `users.id`
- `applications.cv_id` → `cvs.id` (nullable — application may not have a CV assigned)
- `cvs.user_id` → `users.id`
- `notes.application_id` → `applications.id` (CASCADE DELETE)

---

## 5. Frontend — Actual Architecture

### Routing (App.tsx)

| Path | Component | Protected |
|------|-----------|-----------|
| `/login` | LoginPage | No |
| `/auth/callback` | AuthCallbackPage | No |
| `/dashboard` | DashboardPage → AppContent | Yes (ProtectedRoute) |
| `/` | Redirect to /dashboard | — |
| `*` | Redirect to /dashboard | — |

### Views in AppContent (tab-switched, no separate routes)

| View key | Component | Description |
|----------|-----------|-------------|
| `kanban` | KanbanBoard | Drag & drop kanban |
| `list` | ApplicationTable | Sortable table with bulk delete |
| `cv` | CVManager | Upload/manage CVs, assign to applications |
| `details` | ApplicationDetails | Full application view with notes, CV, stage |

### Component tree

```
App.tsx
  QueryClientProvider (React Query)
  BrowserRouter
    AuthProvider           — Google OAuth2 + JWT state
      ErrorBoundary
        /login   → LoginPage
                   LanguageSwitcher (before login)
        /auth/callback → AuthCallbackPage  — exchanges code for JWT
        /dashboard → ProtectedRoute → DashboardPage → AppContent
          header
            BadgeWidget        — gamification badges
            LanguageSwitcher   — PL / EN toggle
            logout-btn         — calls POST /api/auth/logout
          TourGuide            — onboarding tour
          toolbar
            view-tabs (kanban / list / cv)
            add-btn → ApplicationForm (mode=create)
          fab                  — mobile floating action button
          main-content
            KanbanBoard
              KanbanColumn × 3 (SENT / IN_PROGRESS / FINISHED)
                ApplicationCard (draggable)
                  DragOverlayCard
              OnboardingOverlay
              MoveModal     — status transition confirmation
              EndModal      — OFFER / REJECTED modal (rejection reason)
              StageModal    — select/add currentStage
            ApplicationTable
            CVManager
            ApplicationDetails
              NotesList
```

### Hooks (server state via React Query)

| Hook | File | Manages |
|------|------|---------|
| `useApplications` | hooks/useApplications.ts | fetch, create, update, updateStatus, updateStage, addStage, delete, checkDuplicate |
| `useNotes` | hooks/useNotes.ts | fetch, create, update, delete notes |
| `useCV` | hooks/useCV.ts | fetch, upload, create, update, delete, assignCV |
| `useBadgeStats` | hooks/useBadgeStats.ts | fetch badge statistics |

### API calls (api.ts → backend endpoints)

| Function | Method | Endpoint |
|----------|--------|---------|
| `fetchCurrentUser` | GET | `/api/auth/me` |
| `logout` | POST | `/api/auth/logout` |
| `refreshToken` | POST | `/api/auth/refresh` |
| `fetchApplications` | GET | `/api/applications` |
| `createApplication` | POST | `/api/applications` |
| `updateApplication` | PUT | `/api/applications/{id}` |
| `deleteApplication` | DELETE | `/api/applications/{id}` |
| `updateApplicationStatus` | PATCH | `/api/applications/{id}/status` |
| `updateApplicationStage` | PATCH | `/api/applications/{id}/stage` |
| `addStage` | POST | `/api/applications/{id}/stage` |
| `checkDuplicate` | GET | `/api/applications/check-duplicate` |
| `assignCVToApplication` | PATCH | `/api/applications/{id}/cv` |
| `fetchCVs` | GET | `/api/cv` |
| `uploadCV` | POST | `/api/cv/upload` |
| `createCV` | POST | `/api/cv` |
| `updateCV` | PUT | `/api/cv/{id}` |
| `deleteCV` | DELETE | `/api/cv/{id}` |
| `downloadCV` | GET | `/api/cv/{id}/download` |
| `fetchNotes` | GET | `/api/applications/{id}/notes` |
| `createNote` | POST | `/api/applications/{id}/notes` |
| `updateNote` | PUT | `/api/notes/{id}` |
| `deleteNote` | DELETE | `/api/notes/{id}` |
| `fetchBadgeStats` | GET | `/api/statistics/badges` |

### i18n

| Item | Detail |
|------|--------|
| Library | i18next + react-i18next + i18next-browser-languagedetector |
| Languages | `pl` (Polish), `en` (English), fallback: `en` |
| Detection order | localStorage → navigator |
| Namespaces | `common`, `errors`, `badges`, `tour` |
| Backend header | `Accept-Language: {i18n.language}` on every request |
| Language switcher | `LanguageSwitcher.tsx` — visible on login page and in header |

### Installed libraries (package.json)

| Library | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.0 | UI |
| react-dom | ^19.2.0 | DOM rendering |
| react-router-dom | ^7.13.0 | Routing |
| @tanstack/react-query | ^5.90.21 | Server state management |
| @dnd-kit/core + sortable + utilities | ^6/^10/^3 | Drag & drop (Kanban) |
| i18next | ^25.10.10 | i18n engine |
| react-i18next | ^16.6.6 | React bindings for i18next |
| i18next-browser-languagedetector | ^8.2.1 | Detects browser language |
| tailwindcss | ^4.2.0 | CSS utility framework |
| vite | ^7.2.4 | Build tool |
| vitest | ^1.3.0 | Unit tests |
| cypress | ^15.9.0 | E2E tests |

---

## 6. Deviations from Plan

### 6a. Enum names renamed to English (all)

The original plan and brief used Polish enum values. All were renamed to English via Flyway migrations V5–V9:

| Enum | Plan (Polish) | Reality (English) |
|------|--------------|-------------------|
| ApplicationStatus | WYSLANE, W_PROCESIE, OFERTA, ODMOWA | SENT, IN_PROGRESS, OFFER, REJECTED |
| ContractType | B2B, UOP, UZ, INNA | B2B, EMPLOYMENT, MANDATE, OTHER |
| SalaryType | BRUTTO, NETTO | GROSS, NET |
| RejectionReason | BRAK_ODPOWIEDZI, ODMOWA_MAILOWA, ODRZUCENIE_PO_ROZMOWIE, INNE | NO_RESPONSE, EMAIL_REJECTION, REJECTED_AFTER_INTERVIEW, OTHER |
| NoteCategory | PYTANIA (legacy), INNE (legacy) | QUESTIONS, FEEDBACK, OTHER |

### 6b. Kanban columns: 5 statuses → 4 DB statuses + 3 columns

Brief planned 5 columns: *Wysłane → Rozmowa → Zadanie → Oferta → Odrzucone*.

Reality:
- 4 database statuses: SENT, IN_PROGRESS, OFFER, REJECTED
- 3 Kanban columns: SENT | IN_PROGRESS | FINISHED (FINISHED groups both OFFER and REJECTED)
- V3 migration evidence: ROZMOWA and ZADANIE were merged into W_PROCESIE (later renamed IN_PROGRESS)

### 6c. StageHistory: planned, implemented, removed

The `mvp-implementation-plan.md` included a `StageHistory` entity, `StageHistoryRepository`, `StageHistoryResponse` DTO, `@OneToMany` relation, and dedicated service methods.

All of this was implemented, then removed in a cleanup refactoring:
- `entity/StageHistory.java` — deleted
- `repository/StageHistoryRepository.java` — deleted
- `dto/StageHistoryResponse.java` — deleted
- `ApplicationRepository.findByUserIdWithStageHistory` — replaced with `findByUserId`
- V12 Flyway migration drops the `stage_history` table

Reason: The UI never displayed stage history. Data was collected but never consumed. Removing eliminated dead complexity.

### 6d. CORS: separate class → merged into SecurityConfig

Plan: create a separate `CorsConfig.java` class with `WebMvcConfigurer`.

Reality: CORS is configured as a `CorsConfigurationSource` bean inside `SecurityConfig.java`. This is architecturally correct — Spring Security must handle CORS before auth checks, so it must be inside the security filter chain.

### 6e. JPA ddl-auto: update → validate + Flyway

Plan: `spring.jpa.hibernate.ddl-auto=update` (Hibernate manages schema).

Reality: `spring.jpa.hibernate.ddl-auto=validate` + Flyway migrations. Flyway manages all schema changes via versioned SQL files (V1–V12). Hibernate only validates the schema matches the entities on startup.

### 6f. ApplicationResponse: no stageHistory field

Plan included `List<StageHistoryResponse> stageHistory` in `ApplicationResponse`.

Reality: `ApplicationResponse` record has no `stageHistory` field. `domain.ts` on the frontend has no `stageHistory` field in the `Application` interface. Both cleaned up alongside V12.

### 6g. Salary change auto-note: dead code

The i18n implementation plan describes `service/NoteService.java` — auto-nota salary change i18n.  
`NoteService.createSalaryChangeNote()` was implemented with i18n support.  
However, `ApplicationService.update()` does **not** call it — no salary change comparison logic, no note creation on update.  
The method exists and is reachable from the `NoteController` tests, but is never triggered in the application flow.

### 6h. ApplicationRequest does not send status

`ApplicationRequest` (POST + PUT body) has no `status` field. Status is always set to `SENT` on creation and can only be changed via dedicated PATCH endpoints. This is an intentional architectural decision (not a deviation from spec).

---

## 7. Added Beyond Spec

The following features are implemented but were **not** in `brief.md` or `mvp-implementation-plan.md`.

> Note: Gamification (ETAP 7), CVType FILE/LINK/NOTE (ETAP 4), NoteCategory (ETAP 5), and SalarySource (architecture section) are all in `mvp-implementation-plan.md` and are therefore **not** listed here.

### 7a. Authentication: Google OAuth2 + JWT

`brief.md §8` listed auth as future work (Spring Security + OAuth2 + session-based). The MVP plan had no auth etap. Implemented in full:
- Google OAuth2 login (`/oauth2/authorization/google`)
- JWT access token (RS256, 15-minute expiry, in-memory RSA key pair)
- Refresh token (opaque UUID, 7-day expiry, stored in `users.refresh_token`, sent as httpOnly cookie)
- `AuthController`: `/api/auth/me`, `/api/auth/refresh`, `/api/auth/logout`
- `JwtService`, `JwtAuthenticationConverter`, `CustomOAuth2UserService`, `OAuth2AuthenticationSuccessHandler`, `MdcUserFilter`
- Multi-user isolation: every query filters by `user_id` from JWT

### 7b. Onboarding / Tour

Not in brief or implementation plan:
- `OnboardingOverlay.tsx` — shown in KanbanBoard on first visit
- `TourGuide.tsx` — step-by-step interactive guide
- i18n namespace `tour` with tour step translations

### 7c. i18n (internationalization, EN/PL)

Not in brief or MVP implementation plan (documented as a separate additional feature in `spec/v1/05-additional-features/i18n/`):
- i18next with 4 namespaces: `common`, `errors`, `badges`, `tour`
- Language auto-detection from localStorage or browser (navigator)
- `LanguageSwitcher.tsx` — PL/EN toggle, visible on login page and in header
- `Accept-Language` header sent with every API request
- Backend: `I18nConfig.java` with `MessageSource` (i18n/messages.properties + messages_pl.properties) and `AcceptHeaderLocaleResolver`
- All validation messages and error messages i18n-aware

### 7d. Demo application for new users

`UserService.createDemoApplication()` — called automatically on first login. Creates a sample "Google / Junior Software Engineer" application with job description text.

### 7e. React Query (@tanstack/react-query)

Brief specified `fetch API` for HTTP communication. Reality uses React Query v5 for full server-state management: caching, invalidation, optimistic updates, loading/error states.

### 7f. Cypress E2E tests

Not in spec. The project includes Cypress for end-to-end testing (`cypress/e2e/`). Components use `data-cy` attributes for test selectors.

### 7g. Logout button

Documented as a separate additional feature (`spec/v1/05-additional-features/logout/`). Frontend `signOut()` calls `POST /api/auth/logout` before clearing localStorage.

---

## 8. Not Implemented (from spec)

| Item | Source | Notes |
|------|--------|-------|
| Salary change tracking (auto-note on update) | brief.md §5, i18n plan | `createSalaryChangeNote()` exists in NoteService but is never called from `ApplicationService.update()` — dead code, no user-visible effect |
| 5-column Kanban (Wysłane / Rozmowa / Zadanie / Oferta / Odrzucone) | brief.md §4 | Already reduced to 3 columns in mvp-implementation-plan.md ETAP 3; as-built matches the implementation plan, not the brief |

---

## 9. v1 Completion Status

### What is done and working

- Full CRUD for applications, notes, CVs
- Kanban board with drag & drop and status transitions
- Notes with categories
- CV management (file upload + link/note types)
- Duplicate detection
- Authentication (Google OAuth2 + JWT + refresh + logout)
- i18n (EN/PL with language switcher)
- Gamification badges
- Onboarding/tour
- Flyway migrations (V1–V12, clean schema)
- Multi-user isolation (all queries scoped to user_id from JWT)
- Vitest unit tests (84/84 backend, 67/67 frontend at last run)
- Cypress E2E tests

### What is incomplete or pending

| Item | Type | Priority |
|------|------|----------|
| Salary change auto-note: wire `createSalaryChangeNote()` into `ApplicationService.update()` | Missing feature | `createSalaryChangeNote()` in NoteService is complete and tested; `ApplicationService.update()` needs salary change comparison logic and a call to that method |
| `rejectionDetails` not in frontend `Application` response type | Type gap | Backend returns `rejectionDetails` in `ApplicationResponse`; `domain.ts` `Application` interface doesn't declare it; field is sent correctly via `StageUpdateRequest` but cannot be displayed in UI |

### v1 overall assessment

All planned features (ETAP 1–7) are implemented. Authentication, i18n, onboarding, Cypress E2E, and React Query were added beyond the spec. The two concrete gaps are: (1) salary change auto-note — the NoteService method exists but is not wired into `ApplicationService.update()`; (2) `rejectionDetails` missing from the frontend `Application` type, so the field stored in the DB cannot be displayed in the UI.
