# EasyApply v1 — As-Built Documentation

> Generated: 2026-04-23. Describes the actual implemented state of EasyApply v1.
> Source of truth: the code. This document reflects what exists, not what was planned.
> 
> **Latest update:** Phase 11 Swagger/OpenAPI complete: `springdoc-openapi-starter-webmvc-ui` added, Swagger UI at `/swagger-ui.html`, JWT Bearer auth scheme, all controllers tagged.

---

## 1. Summary — Plan vs Reality

| Area | Planned | Built | Status |
|------|---------|-------|--------|
| Application CRUD | Basic REST API | Full CRUD + stage + duplicate check | As planned + more |
| Kanban view | 5 statuses (SENT/IN_PROGRESS/OFFER/REJECTED and one more) | 4 DB statuses (SENT/IN_PROGRESS/OFFER/REJECTED), 3 Kanban columns (SENT/IN_PROGRESS/FINISHED) | Different |
| CV management | PDF upload + LINK + NOTE types, assign to application (PHASE 4) | LINK + NOTE implemented; FILE upload disabled (phase 07) | Modified |
| Notes | Plaintext with QUESTIONS/FEEDBACK/OTHER categories (PHASE 5) | Implemented, categories renamed to English | As planned |
| Authentication | Not in MVP (planned for future) | Fully implemented: Google OAuth2 + JWT + refresh tokens | Added beyond spec |
| Stage history (StageHistory entity) | Planned in mvp-implementation-plan.md | Implemented, then removed (V12) — overengineered | Removed |
| i18n (EN/PL) | Not in brief | Fully implemented: i18next, LanguageDetector, switcher, all strings translated | Added beyond spec |
| Badges / gamification | In plan (PHASE 7) | StatisticsService + BadgeWidget (rejection/ghosting badges, sweet revenge) | As planned |
| Responsiveness / mobile | Implicit in brief (vs Teal: "brak wersji mobilnej") | FAB, MoveModal as mobile bottom sheet, isMobile(), OnboardingOverlay | As planned |
| Onboarding / Tour | Not in plan | OnboardingOverlay, TourGuide components | Added beyond spec |
| Enum values | Polish (WYSLANE, BRUTTO, UOP, BRAK_ODPOWIEDZI) | English (SENT, GROSS, EMPLOYMENT, NO_RESPONSE) | Different (renamed) |
| Salary change auto-note | Planned in i18n impl. plan | `createSalaryChangeNote()` defined in NoteService — never called from ApplicationService | Dead code |
| Duplicate detection | Planned (check-duplicate) | Implemented | As planned |
| Job description archive | Planned (jobDescription field) | Implemented | As planned |
| Re-application warning | Planned | Implemented via check-duplicate | As planned |
| Hidden recruitment (agency) | Planned | Implemented (agency field) | As planned |
| Security: CORS | Planned (separate CorsConfig) | Merged into SecurityConfig | Different |
| Database migrations | Not planned (ddl-auto=update) | Flyway migrations V1–V13 | Added beyond spec |
| Privacy policy (phase 07) | Not in MVP | `/privacy` page public route, PL/EN, react-markdown | Added (phase 07) |
| Consent flow (phase 07) | Not in MVP | ConsentGate wrapper, POST /api/auth/consent, blocks UI until accepted | Added (phase 07) |
| Account deletion (phase 07) | Not in MVP | DELETE /api/auth/me + cascade; /settings page with deletion UI | Added (phase 07) |
| Retention & hygiene (phase 07) | Not in MVP | last_login_at tracking; daily cron removes inactive accounts >12 months; refresh_token stored as SHA-256 hash; PII removed from logs | Added (phase 07) |
| Data export (phase 08) | Not in MVP | GET /api/auth/me/export returns JSON blob with all user data (RODO Art. 20) | Added (phase 08) |
| Service notices (phase 08) | Not in MVP | BANNER/MODAL notices via DB; admin POST endpoint secured by X-Admin-Key header; countdown timer | Added (phase 08) |
| API documentation (phase 11) | Not in MVP | Swagger UI at /swagger-ui.html; OpenAPI 3 spec auto-generated; JWT Bearer auth scheme; all controllers tagged | Added (phase 11) |

---

## 2. Features — Status

Based on `spec/v1/01-vision/brief.md`:

### MVP Features (§4)

| Feature | Status | Notes |
|---------|--------|-------|
| Application registry (CRUD): company, position, link, date, salary, currency, status, source | ✅ Implemented | Plus: salaryMin/salaryMax, contractType, salaryType, salarySource, agency, jobDescription |
| Kanban view: drag & drop between columns | ✅ Implemented | 3 columns (SENT, IN_PROGRESS, FINISHED) — not 5 as in brief |
| CV management: PDF upload (max 5MB) + LINK + NOTE types, assign to application | ✅ Implemented | As planned in PHASE 4; categories renamed to English |
| Notepad: plaintext, multiple per application, with categories (QUESTIONS/FEEDBACK/OTHER) | ✅ Implemented | As planned in PHASE 5; categories renamed to English |

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
  EasyApplyApplication.java        — main class, @SpringBootApplication, @EnableJpaAuditing, @EnableScheduling
  config/
    I18nConfig.java                — MessageSource (i18n/messages), AcceptHeaderLocaleResolver (default: en)
    OpenApiConfig.java             — @OpenAPIDefinition (title/description/version/contact) + @SecurityScheme (JWT Bearer) (phase 11)
    SecurityConfig.java            — Spring Security, OAuth2, JWT encoder/decoder, CORS
  controller/
    ApplicationController.java     — /api/applications
    AuthController.java            — /api/auth
    AdminController.java           — /api/admin (phase 08)
    CVController.java              — /api/cv
    NoteController.java            — /api (nested under /applications and /notes)
    StatisticsController.java      — /api/statistics
    SystemController.java          — /api/system (phase 08)
  dto/
    ApplicationRequest.java        — record (company, position, link, salary*, currency, salaryType, contractType, salarySource, source, jobDescription, agency)
    ApplicationResponse.java       — record (all Application fields + cv info flattened: cvId, cvFileName, cvType, cvExternalUrl)
    ApplicationStats.java          — record (rejections, ghosting, offers) — for JPQL projection
    BadgeResponse.java             — record (name, icon, description, threshold, currentCount, nextThreshold, nextBadgeName)
    BadgeStatsResponse.java        — record (rejectionBadge, ghostingBadge, sweetRevengeUnlocked, totals)
    NoteRequest.java               — record (content, category)
    NoteResponse.java              — record (id, content, category, applicationId, createdAt)
    ServiceNoticeRequest.java      — record (type, messagePl, messageEn, expiresAt) with @NotBlank @Pattern on type (phase 08)
    ServiceNoticeResponse.java     — record (id, type, messagePl, messageEn, expiresAt) (phase 08)
    StageUpdateRequest.java        — record (status, currentStage, rejectionReason, rejectionDetails)
    StatusUpdateRequest.java       — record (status)
    UserResponse.java              — record (id, email, name, privacyPolicyAcceptedAt) (phase 07)
  entity/
    Application.java               — @Entity, table: applications
    CV.java                        — @Entity, table: cvs
    Note.java                      — @Entity, table: notes
    ServiceNotice.java             — @Entity, table: service_notices (phase 08)
    ServiceNoticeType.java         — enum: BANNER, MODAL (phase 08)
    User.java                      — @Entity, table: users
    ApplicationStatus.java         — enum: SENT, IN_PROGRESS, OFFER, REJECTED
    ContractType.java              — enum: B2B, EMPLOYMENT, MANDATE, OTHER
    CVType.java                    — enum: FILE, LINK, NOTE
    NoteCategory.java              — enum: QUESTIONS, FEEDBACK, OTHER
    RejectionReason.java           — enum: NO_RESPONSE, EMAIL_REJECTION, REJECTED_AFTER_INTERVIEW, OTHER
    SalarySource.java              — enum: FROM_POSTING, MY_PROPOSAL
    SalaryType.java                — enum: GROSS, NET
  exception/
    GlobalExceptionHandler.java    — @RestControllerAdvice, handles validation / EntityNotFoundException (WARN log, phase 10) / DateTimeParseException (phase 08) / fallback (ERROR log)
  repository/
    ApplicationRepository.java     — JpaRepository; custom queries: findByUserId, findByIdAndUserId, existsByIdAndUserId, findByUserIdAndCompanyIgnoreCaseAndPositionIgnoreCase, getApplicationStats, clearCVReferences
    CVRepository.java              — JpaRepository
    NoteRepository.java            — JpaRepository; findByApplicationIdAndApplicationUserIdOrderByCreatedAtDesc, findByIdAndApplicationUserId, etc.
    ServiceNoticeRepository.java   — JpaRepository; JPQL findActive(@Param("now") LocalDateTime now) — WHERE active=true AND (expiresAt IS NULL OR expiresAt > :now) (phase 08)
    UserRepository.java            — JpaRepository; findByGoogleId, findByRefreshToken, findInactiveUsers(threshold) (phase 07)
  security/
    AdminKeyFilter.java            — OncePerRequestFilter; checks X-Admin-Key header against app.admin-key; returns 403 if missing/wrong (phase 08); logs WARN with URI + IP on every denial (phase 10)
    AuthenticatedUser.java         — record (id: UUID) — principal injected by JwtAuthenticationConverter
    CustomOAuth2UserService.java   — loads/creates user from Google OAuth2 attributes
    JwtAuthenticationConverter.java — extracts AuthenticatedUser from JWT sub claim
    JwtService.java                — generates access token (RS256, 15 min) and refresh token (UUID)
    MdcUserFilter.java             — adds user email to MDC for logging
    OAuth2AuthenticationSuccessHandler.java — on OAuth2 success: issues JWT + refresh token, redirects to frontend
    TokenHasher.java               — SHA-256 util; used to hash refresh tokens before storing in DB (phase 07)
  service/
    AccountRetentionService.java   — @Scheduled(cron daily 3:00): deletes accounts inactive > 12 months via UserService.deleteAccount; threshold from app.retention.inactive-months (phase 07)
    ApplicationService.java        — create, findAllByUserId, findById, updateStatus, updateStage, addStage, findDuplicates, delete, update
    CVService.java                 — uploadCV, findAllByUserId, findById, downloadCV, deleteCV, createCV, updateCV, assignCVToApplication, removeCVFromApplication
    NoteService.java               — create, findByApplicationId, findById, update, delete, deleteByApplicationId, createSalaryChangeNote (⚠️ dead code — never called)
    ServiceNoticeService.java      — findActive(), create(ServiceNoticeRequest) (phase 08)
    StatisticsService.java         — getBadgeStats: computes rejection/ghosting badges + sweet revenge unlock
    UserService.java               — findOrCreateUser (calls recordLogin), getById, getByGoogleId, saveRefreshToken (hashes token via TokenHasher), clearRefreshToken, findByValidRefreshToken (hashes + bumps lastLoginAt), acceptPrivacyPolicy, deleteAccount + createDemoApplication (new user only)
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
| `GET` | `/api/auth/me/export` | Export all user data as JSON blob (RODO Art. 20, phase 08) |
| `POST` | `/api/auth/refresh` | Issue new access token from refresh token cookie |
| `POST` | `/api/auth/logout` | Clear refresh token in DB + remove cookie |
| `POST` | `/api/auth/consent` | Accept privacy policy (phase 07) |
| `DELETE` | `/api/auth/me` | Delete user account + cascade all user data (phase 07) |

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

**SystemController — `/api/system`** (phase 08)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/system/notices/active` | List active notices (public, no auth required) |

**AdminController — `/api/admin`** (phase 08, secured by `X-Admin-Key` header via `AdminKeyFilter`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/admin/notices` | Create a new service notice (returns 201 Created) |

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
| `springdoc-openapi-starter-webmvc-ui 2.8.8` | Swagger UI + OpenAPI 3 spec generation (phase 11) |
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
| V13 | `V13__user_privacy_policy_accepted_at.sql` | Add privacy_policy_accepted_at column (phase 07) |
| V14 | `V14__service_notices.sql` | Create service_notices table (phase 08) |
| V15 | `V15__user_last_login_at.sql` | Add last_login_at column to users (phase 07) |

### Current tables

**`users`**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| name | VARCHAR(255) | NOT NULL |
| google_id | VARCHAR(255) | NOT NULL, UNIQUE |
| refresh_token | VARCHAR(255) | nullable — stores SHA-256 hash of the token, not plaintext (phase 07) |
| refresh_token_expiry | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL |
| privacy_policy_accepted_at | TIMESTAMP | nullable (phase 07) |
| last_login_at | TIMESTAMP | nullable; updated on every login and token refresh (phase 07) |

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

**`service_notices`** (phase 08)

| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| type | VARCHAR(20) | NOT NULL (BANNER/MODAL) |
| message_pl | TEXT | NOT NULL |
| message_en | TEXT | NOT NULL |
| active | BOOLEAN | NOT NULL, default true |
| expires_at | TIMESTAMP | nullable (null = no expiry) |
| created_at | TIMESTAMP | NOT NULL |

**`stage_history`** — DROPPED (V12). Was: id, application_id FK, stage_name, completed, created_at, completed_at.

### Relations

- `applications.user_id` → `users.id`
- `applications.cv_id` → `cvs.id` (nullable — application may not have a CV assigned)
- `cvs.user_id` → `users.id`
- `notes.application_id` → `applications.id` (CASCADE DELETE)
- `service_notices` — no FK relations; standalone admin-managed table

---

## 5. Frontend — Actual Architecture

### Routing (App.tsx)

| Path | Component | Protected |
|------|-----------|-----------|
| `/login` | LoginPage | No |
| `/auth/callback` | AuthCallbackPage | No |
| `/privacy` | PrivacyPolicy | No (public) — phase 07 |
| `/dashboard` | DashboardPage → AppContent → ConsentGate | Yes (ProtectedRoute) — phase 07 |
| `/settings` | Settings | Yes (ProtectedRoute) — phase 07 |
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
        /privacy → PrivacyPolicy (public route, phase 07)
        /settings → ProtectedRoute → Settings (delete account UI, phase 07)
        /dashboard → ProtectedRoute → ConsentGate (phase 07)
                                      ↓
                                    DashboardPage → AppContent
          ServiceBanner × N    — red danger banners for BANNER-type notices (phase 08)
          ServiceModal × N     — modal popups for MODAL-type notices; dismissed per session via sessionStorage (phase 08)
          header
            BadgeWidget        — gamification badges
            LanguageSwitcher   — PL / EN toggle
            settings-btn       — link to /settings (phase 07)
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
            CVManager        — disabled file upload (phase 07)
            ApplicationDetails
              NotesList
          Footer             — privacy policy link + contact email (phase 07)
```

### New components (phase 07)

| Component | File | Purpose |
|-----------|------|---------|
| `ConsentGate` | `components/auth/ConsentGate.tsx` | Fullscreen overlay blocking UI for users without accepted privacy policy |
| `PrivacyPolicy` | `pages/PrivacyPolicy.tsx` | Public page rendering privacy policy in PL/EN with markdown |
| `Settings` | `pages/Settings.tsx` | Protected user settings page with account deletion and data export (phase 08) |
| `Footer` | `components/layout/Footer.tsx` | Footer with privacy policy link and contact email |

### New components (phase 08)

| Component | File | Purpose |
|-----------|------|---------|
| `ServiceBanner` | `components/notices/ServiceBanner.tsx` | Red danger banner for BANNER-type notices; dismissable per page load (useState) |
| `ServiceModal` | `components/notices/ServiceModal.tsx` | Modal overlay for MODAL-type notices; dismissal persisted in sessionStorage per session |
| `CountdownLabel` | `components/notices/CountdownLabel.tsx` | Inline `⏳ time left: X days X hours MM:SS` label (PL/EN); shown only when expiresAt is set |
| `useCountdown` | `components/notices/useCountdown.ts` | setInterval-based hook; returns `TimeLeft {days, hours, minutes, seconds, expired} \| null` |

### Hooks (server state via React Query)

| Hook | File | Manages |
|------|------|---------|
| `useApplications` | hooks/useApplications.ts | fetch, create, update, updateStatus, updateStage, addStage, delete, checkDuplicate |
| `useNotes` | hooks/useNotes.ts | fetch, create, update, delete notes |
| `useCV` | hooks/useCV.ts | fetch, upload, create, update, delete, assignCV |
| `useBadgeStats` | hooks/useBadgeStats.ts | fetch badge statistics |
| `useServiceNotices` | hooks/useServiceNotices.ts | fetch active notices; staleTime 5 min; returns `[]` on error (phase 08) |

### API calls (api.ts → backend endpoints)

| Function | Method | Endpoint |
|----------|--------|---------|
| `fetchCurrentUser` | GET | `/api/auth/me` |
| `logout` | POST | `/api/auth/logout` |
| `refreshToken` | POST | `/api/auth/refresh` |
| `acceptConsent` | POST | `/api/auth/consent` |
| `deleteAccount` | DELETE | `/api/auth/me` |
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
| `fetchActiveNotices` | GET | `/api/system/notices/active` — returns `[]` on error, never breaks app (phase 08) |
| `exportMyData` | GET | `/api/auth/me/export` — triggers blob download as `easyapply-export.json` (phase 08) |

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
| react-markdown | ^9.* | Markdown rendering (phase 07) |
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

The i18n implementation plan describes `service/NoteService.java` — auto-note salary change i18n.  
`NoteService.createSalaryChangeNote()` was implemented with i18n support.  
However, `ApplicationService.update()` does **not** call it — no salary change comparison logic, no note creation on update.  
The method exists and is reachable from the `NoteController` tests, but is never triggered in the application flow.

### 6h. ApplicationRequest does not send status

`ApplicationRequest` (POST + PUT body) has no `status` field. Status is always set to `SENT` on creation and can only be changed via dedicated PATCH endpoints. This is an intentional architectural decision (not a deviation from spec).

---

## 7. Added Beyond Spec

The following features are implemented but were **not** in `brief.md` or `mvp-implementation-plan.md`.

> Note: Gamification (PHASE 7), CVType FILE/LINK/NOTE (PHASE 4), NoteCategory (PHASE 5), and SalarySource (architecture section) are all in `mvp-implementation-plan.md` and are therefore **not** listed here.

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

## 8. Phase 07 — Privacy & RODO (2026-04-23)

**Status:** rodo-minimum + cv-link-only **complete**. retention-hygiene deferred post-publication.

### 8a. rodo-minimum — Consent & Account Deletion

**Backend:**
- `User.privacyPolicyAcceptedAt` field (nullable TIMESTAMP)
- `POST /api/auth/consent` — accept privacy policy (idempotent, returns 204)
- `DELETE /api/auth/me` — delete user account + cascade (applications, notes, CVs, files)
- `ConsentRequiredFilter` — guard protecting all endpoints except whitelist (consent, logout, refresh, delete)
- Flyway V13: add `privacy_policy_accepted_at` column
- Tests: 4 new + updated existing for consent/delete flow

**Frontend:**
- `PrivacyPolicy.tsx` — public route `/privacy`, renders markdown policy PL/EN with react-markdown
- `ConsentGate.tsx` — fullscreen overlay blocking UI for users without accepted policy
- `Settings.tsx` — protected route `/settings`, email + accept date display, delete account modal with confirmation
- `Footer.tsx` — visible on all pages, links to `/privacy` + mailto contact
- i18n: 8+ keys for consent (title, description, button, etc.) + 12+ for settings (delete flow)
- Tests: 21 new tests (PrivacyPolicy, ConsentGate, Settings)

### 8b. cv-link-only — Disable File Upload

**Backend:**
- `POST /api/cv/upload` returns **503 Service Unavailable** with message "File upload is temporarily unavailable. Use CV link instead."

**Frontend:**
- CVManager: upload card disabled (opacity 0.5, cursor not-allowed, aria-disabled=true)
- Icon changed from 📁 to 🔒
- Tooltip: "Chwilowo nieczynne" (PL) / "Temporarily unavailable" (EN)
- Link option fully functional

**Rationale:** CV files contain PII (address, phone, birthdate, photo, employment history). Hosting them on our infrastructure creates RODO liability. User provides link (Google Drive, Dropbox, own site) — user manages access, we keep only the link.

### 8c. retention-hygiene (deferred)

**Planned (not yet implemented):**
- `lastLoginAt` field tracking user activity
- Scheduled job (daily 3:00 AM) deleting accounts inactive > 12 months
- Refresh token hashing (SHA-256) — store hash, not plaintext
- Audit: verify logs don't leak email/name/tokens
- Spec exists in `v1/07-privacy-rodo/retention-hygiene/implementation-plan-backend.md`

**Why deferred:** Compliance with minimum RODO is now met. retention-hygiene improves infrastructure security & data minimization but is not blocking publication. Will implement post-MVP launch.

---

## 9. Phase 08 — User Data & Service Notices (2026-04-27)

**Status:** data-export + service-notices **complete**.

### 9a. Data Export (RODO Art. 20)

**Backend:**
- `GET /api/auth/me/export` in `AuthController` — returns JSON with all user data: profile, all applications (with notes and CV info)
- Response sent as `Content-Disposition: attachment; filename="easyapply-export.json"` with `Content-Type: application/json`

**Frontend:**
- Settings page: export section above danger zone — title, description, "Export data" button
- `exportMyData()` in `api.ts` — fetches the blob and triggers browser download
- i18n keys: `settings.exportTitle/Description/Button/exporting/exportError` (PL + EN)

### 9b. Service Notices System

**Backend:**
- `ServiceNotice` entity: id, type (BANNER/MODAL), messagePl, messageEn, active, expiresAt (nullable), createdAt
- `ServiceNoticeRepository.findActive()` — JPQL query filtering `active=true AND (expiresAt IS NULL OR expiresAt > :now)`
- `GET /api/system/notices/active` — public endpoint, no auth required; returns list of active notices
- `POST /api/admin/notices` — creates new notice; secured by `AdminKeyFilter` (X-Admin-Key header); returns 201 Created
- `AdminKeyFilter` — `OncePerRequestFilter`; reads `${app.admin-key}` from properties; returns 403 if header missing or value wrong
- `SecurityConfig`: `/api/admin/**` added to `permitAll()` (Spring Security skips JWT check; filter handles auth); `X-Admin-Key` added to CORS `allowedHeaders`
- `GlobalExceptionHandler`: added `DateTimeParseException` handler → 400 with ISO-8601 format error message
- Flyway V14: `service_notices` table
- Tests: `SystemControllerTest` (3 tests: empty list, active notice, expired excluded) + `AdminControllerTest` (4 tests: valid key→201, no key→403, wrong key→403, invalid body→400)

**Frontend:**
- `useServiceNotices` hook (React Query, staleTime 5 min) — fetches `/api/system/notices/active`; returns `[]` on any error so the app never breaks
- `ServiceBanner` — dismissable red danger banner (background `#dc3545`); state in `useState`, resets on page reload
- `ServiceModal` — modal overlay; dismissal stored in `sessionStorage` key `dismissed_notices` (array of IDs); reappears after logout because `AuthProvider.signOut()` calls `sessionStorage.removeItem('dismissed_notices')`
- `CountdownLabel` — shown when `expiresAt` is set and not expired; displays `⏳ time left: X days X hours MM:SS` (PL) or `⏳ time left: ...` (EN)
- `useCountdown` — setInterval-based hook (1s tick); exports `TimeLeft` interface
- `AppContent` — renders banners above header and modals above TourGuide
- `notices.css` — red danger theme: bold white text on `#dc3545` background with `border-bottom: 3px solid #a71d2a`
- i18n key: `notices.ok: "OK, I understand"` / `"OK, I understand"` (PL + EN)
- Tests: `ServiceBanner.test.tsx` (4 tests) + `ServiceModal.test.tsx` (4 tests, uses `sessionStorage.clear()`)

---

## 10. Phase 10 — Logging (2026-05-06)

**Status:** complete.

Added targeted `WARN`-level logging to three previously invisible failure paths; removed two unused `Logger` field declarations.

### What changed

**`AdminKeyFilter`** — logs every blocked admin request before returning 403:
```
WARN  [anonymous] c.e.s.AdminKeyFilter - Admin access denied: uri=/api/admin/users, ip=1.2.3.4
```

**`AuthController.refresh()`** — logs failed token refresh inside the existing catch block:
```
WARN  [anonymous] c.e.c.AuthController - Token refresh failed: Refresh token not found or expired
```

**`GlobalExceptionHandler.handleEntityNotFoundException()`** — logs every 404 before returning ProblemDetail:
```
WARN  [userId=abc123] c.e.e.GlobalExceptionHandler - Entity not found: Application with id=999 not found
```

**`NoteService`**, **`JwtService`** — removed unused `Logger` field + `slf4j` imports (dead code).

### Design notes

- All new logs are `WARN` — security denials and token failures are unexpected in normal operation; 404 is visible in production without being an error.
- IP address logged in `AdminKeyFilter` (remote IP is security-relevant); elsewhere MDC already carries `userId` via `MdcUserFilter`.
- Logger style kept consistent: explicit `LoggerFactory.getLogger` (no `@Slf4j`), matching `UserService`, `ApplicationService` etc.

---

## 11. Phase 11 — Swagger / OpenAPI (2026-05-06)

**Status:** complete.

Added `springdoc-openapi-starter-webmvc-ui 2.8.8`. OpenAPI 3 spec is auto-generated from existing annotations; no manual spec files.

### What changed

**`pom.xml`** — added `springdoc-openapi-starter-webmvc-ui 2.8.8` dependency.

**`application.properties`** — added springdoc config:
```properties
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.operations-sorter=alpha
springdoc.swagger-ui.tags-sorter=alpha
```

**`SecurityConfig.java`:**
- `/swagger-ui/**`, `/swagger-ui.html`, `/v3/api-docs/**` added to `permitAll()` block
- CSP relaxed from `default-src 'self'` to `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:` — required for Swagger UI inline scripts/styles

**`config/OpenApiConfig.java`** (new file):
- `@OpenAPIDefinition` — title "EasyApply API", description, version 1.0.0, contact (Jakub Bone)
- `@SecurityRequirement(name = "bearerAuth")` — global: all endpoints show padlock in Swagger UI
- `@SecurityScheme` — HTTP Bearer JWT; adds "Authorize" button to the UI

**Controllers — `@Tag` added to all:**

| Controller | Tag name | Description |
|-----------|----------|-------------|
| `ApplicationController` | Applications | CRUD and duplicate detection for job applications |
| `AuthController` | Auth | Google OAuth2 login, JWT refresh, consent, account management |
| `AdminController` | Admin | Service notices management — requires X-Admin-Key header |
| `CVController` | CV | CV versions — link and note types |
| `NoteController` | Notes | Notes per application — Questions, Feedback, Other |
| `StatisticsController` | Statistics | Badge stats and application metrics |
| `SystemController` | System | Active service notices shown to logged-in users |

**`@Operation` added to non-obvious endpoints:**

| Endpoint | Summary |
|----------|---------|
| `POST /api/auth/refresh` | Refresh access token using a valid refresh token |
| `POST /api/auth/consent` | Record user consent (required once after first login) |
| `DELETE /api/auth/me` | Permanently delete the authenticated user's account and all their data |
| `GET /api/auth/me/export` | Export all user data as JSON (RODO Art. 20) |
| `POST /api/admin/notices` | Create a service notice (BANNER or MODAL) |

### Accessible at

| URL | Content |
|-----|---------|
| `/swagger-ui.html` | Swagger UI (browser) |
| `/v3/api-docs` | Raw OpenAPI 3 JSON spec |

---

## 12. Phase 12 — GitHub Actions CI (2026-05-06)

Two parallel jobs triggered on every push to `master`.

| Job | Steps |
|-----|-------|
| Backend | `actions/setup-java@v4` (Java 21 Temurin) → `./mvnw test` |
| Frontend | `actions/setup-node@v4` (Node 22) → `npm ci` → `npm run test:run` → `npm run build` |

CI badge added to `README.md`. No caching, no artifact publishing — tests are the only signal.

Note: `easyapply-backend/mvnw` required `chmod +x` in the git index (`100644` → `100755`) to run on Linux runners.

---

## 13. Not Implemented (from spec)

| Item | Source | Notes |
|------|--------|-------|
| Salary change tracking (auto-note on update) | brief.md §5, i18n plan | `createSalaryChangeNote()` exists in NoteService but is never called from `ApplicationService.update()` — dead code, no user-visible effect |
| 5-column Kanban (SENT / IN_PROGRESS / OFFER / REJECTED and one more) | brief.md §4 | Already reduced to 3 columns in mvp-implementation-plan.md PHASE 3; as-built matches the implementation plan, not the brief |

---

## 14. v1 Completion Status

### What is done and working

- Full CRUD for applications, notes, CVs
- Kanban board with drag & drop and status transitions
- Notes with categories
- CV management (link/note types; file upload disabled per phase 07)
- Duplicate detection
- Authentication (Google OAuth2 + JWT + refresh + logout)
- i18n (EN/PL with language switcher)
- Gamification badges
- Onboarding/tour
- Flyway migrations (V1–V14, clean schema)
- Multi-user isolation (all queries scoped to user_id from JWT)
- Privacy policy page (/privacy, public, PL/EN)
- Consent flow (users must accept privacy policy before accessing app)
- Account deletion (DELETE /api/auth/me with cascade to all user data)
- Settings page with account management and data export
- Data export (GET /api/auth/me/export, RODO Art. 20 compliance)
- Service notices system (BANNER/MODAL with countdown; admin POST endpoint; public GET endpoint)
- Swagger UI at `/swagger-ui.html` with JWT Bearer auth scheme and all controllers tagged (phase 11)
- Vitest unit tests (backend + frontend, including Phase 08 SystemController and AdminController tests)
- Cypress E2E tests
- GitHub Actions CI (two parallel jobs: Maven tests + Vitest/build; badge in README)

### What is incomplete or pending

| Item | Type | Priority |
|------|------|----------|
| Salary change auto-note: wire `createSalaryChangeNote()` into `ApplicationService.update()` | Missing feature | `createSalaryChangeNote()` in NoteService is complete and tested; `ApplicationService.update()` needs salary change comparison logic and a call to that method |
| `rejectionDetails` not in frontend `Application` response type | Type gap | Backend returns `rejectionDetails` in `ApplicationResponse`; `domain.ts` `Application` interface doesn't declare it; field is sent correctly via `StageUpdateRequest` but cannot be displayed in UI |
| retention-hygiene (phase 07 part 3) | Deferred | Spec complete; implementation deferred post-MVP publication for infrastructure optimization |

### v1 overall assessment

All planned MVP features (PHASE 1–7) are implemented. Phase 07 (Privacy & RODO) completed rodo-minimum (consent flow, account deletion) and cv-link-only (file upload disabled). Phase 08 completed data export (RODO Art. 20) and service notices (BANNER/MODAL with countdown). Phase 10 added WARN logging for admin denials, failed token refreshes, and 404s. Phase 11 added Swagger UI at `/swagger-ui.html` with JWT Bearer auth and all controllers tagged. retention-hygiene (auto-delete inactive accounts, token hashing, log audit) is planned but deferred to post-publication.

Authentication, i18n, onboarding, Cypress E2E, React Query, and GitHub Actions CI were added beyond the spec. The two concrete gaps are: (1) salary change auto-note — the NoteService method exists but is not wired into `ApplicationService.update()`; (2) `rejectionDetails` missing from the frontend `Application` type.
