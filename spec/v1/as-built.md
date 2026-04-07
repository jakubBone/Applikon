# EasyApply v1 — As-Built Documentation
> Generated: 2026-04-07. Describes the actual implemented state of EasyApply v1.
> Source of truth: the code. This document reflects what exists, not what was planned.

---

## 1. Summary — Plan vs Reality

| Area | Planned | Built | Status |
|------|---------|-------|--------|
| Application CRUD | `company, position, link, salary, status, source, jobDescription, agency` | As planned + `salarySource`, `currentStage`, `rejectionReason`, `rejectionDetails` | Built with extra fields |
| Kanban (status tracking) | Drag & drop, 5 statuses: Wysłane/Rozmowa/Zadanie/Oferta/Odrzucone | 4 statuses: `SENT/IN_PROGRESS/OFFER/REJECTED`. 3 Kanban columns (FINISHED groups OFFER+REJECTED) | Different |
| CV management | PDF upload, assign to application | PDF + LINK + NOTE types. Upload, assign, download, delete | Beyond spec (LINK/NOTE types) |
| Notes | Plaintext, multiple per application | As planned + `category` field (QUESTIONS/FEEDBACK/OTHER) | Beyond spec (categories) |
| Authentication | OAuth2 (mentioned in v8 "Future") | Google OAuth2 + JWT (access) + refresh token (httpOnly cookie) | Beyond spec for v1 MVP |
| User accounts | Not in MVP | Full multi-user with `users` table, per-user data isolation | Beyond spec |
| i18n | Not in MVP | Full i18n backend (EN/PL via Accept-Language) + frontend (i18next, 4 namespaces) | Beyond spec |
| Statistics/Badges | Not in MVP | `GET /api/statistics/badges` — rejection/ghosting badge engine | Beyond spec |
| Stage history | Planned in impl-plan | Removed (V12 migration drops table; was overengineered) | Removed by cleanup |
| Duplicate detection | Planned | `GET /api/applications/check-duplicate` | As planned |
| Job description archiving | Planned (`jobDescription` field) | `jobDescription TEXT` in `Application` | As planned |
| Re-application edge case | Listed as edge case | Duplicate check endpoint exists | As planned |
| Multi-currency | Listed as edge case | `currency` field (free-text String), no conversion | As planned |
| Session-based auth | Planned for future | Replaced with JWT + OAuth2 (better choice) | Different |

---

## 2. Features — Status

### Brief MVP features (section 4 of brief.md)

| Feature | Status | Notes |
|---------|--------|-------|
| **Application register (CRUD)** — company, position, link, date, salary, currency, status, source | Implemented | All fields present. `appliedAt` is auto-generated via `@CreatedDate`. |
| **Kanban view** — drag & drop between Wysłane/Rozmowa/Zadanie/Oferta/Odrzucone | Implemented differently | Uses 4 statuses (`SENT`, `IN_PROGRESS`, `OFFER`, `REJECTED`), Kanban has 3 columns (FINISHED merges OFFER+REJECTED). Sub-stage tracking via `currentStage` field. |
| **CV management** — PDF upload (max 5MB), assign to application | Implemented and extended | 3 CV types: `FILE` (upload), `LINK` (external URL), `NOTE` (name only). Max 5MB for FILE type. Multiple CVs per user, assigned per application. |
| **Notepad** — plaintext notes per application | Implemented and extended | Notes have `category` (QUESTIONS/FEEDBACK/OTHER), multiple notes per application, timestamps. |

### Brief edge cases (section 5 of brief.md)

| Edge Case | Status | Notes |
|-----------|--------|-------|
| Re-application notification | Implemented | `GET /api/applications/check-duplicate?company=&position=` |
| Hidden recruitment (agency) | Implemented | `agency` field on `Application` entity |
| Expired links | Implemented | `jobDescription TEXT` on `Application` entity |
| Salary change tracking | Implemented (differently) | `NoteService.createSalaryChangeNote()` creates a note automatically on salary change — no separate history table |
| Multi-currency | Implemented | `currency` String field (PLN/EUR/USD/GBP), no auto-conversion |
| Duplicate detection | Implemented | Case-insensitive query on `company + position` per user |

---

## 3. Backend — Actual Architecture

### Package structure (`com.easyapply`)

```
com.easyapply/
  EasyApplyApplication.java
  config/
    I18nConfig.java          — MessageSource, LocalValidatorFactoryBean, AcceptHeaderLocaleResolver
    SecurityConfig.java      — RSA key pair, JWT encoder/decoder, OAuth2, CORS, filter chain
  controller/
    ApplicationController.java
    AuthController.java
    CVController.java
    NoteController.java
    StatisticsController.java
  dto/
    ApplicationRequest.java
    ApplicationResponse.java
    ApplicationStats.java
    BadgeResponse.java
    BadgeStatsResponse.java
    NoteRequest.java
    NoteResponse.java
    StageUpdateRequest.java
    StatusUpdateRequest.java
    UserResponse.java
  entity/
    Application.java
    ApplicationStatus.java   — enum: SENT, IN_PROGRESS, OFFER, REJECTED
    ContractType.java        — enum: B2B, EMPLOYMENT, MANDATE, OTHER
    CV.java
    CVType.java              — enum: FILE, LINK, NOTE
    Note.java
    NoteCategory.java        — enum: QUESTIONS, FEEDBACK, OTHER
    RejectionReason.java     — enum: NO_RESPONSE, EMAIL_REJECTION, REJECTED_AFTER_INTERVIEW, OTHER
    SalarySource.java        — enum: FROM_POSTING, MY_PROPOSAL
    SalaryType.java          — enum: GROSS, NET
    User.java
  exception/
    GlobalExceptionHandler.java
  repository/
    ApplicationRepository.java
    CVRepository.java
    NoteRepository.java
    UserRepository.java
  security/
    AuthenticatedUser.java           — record(UUID id, String email, String name)
    CustomOAuth2UserService.java
    JwtAuthenticationConverter.java
    JwtService.java
    MdcUserFilter.java
    OAuth2AuthenticationSuccessHandler.java
  service/
    ApplicationService.java
    CVService.java
    NoteService.java
    StatisticsService.java
    UserService.java
```

### All REST endpoints

#### ApplicationController — `@RequestMapping("/api/applications")`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/applications` | Create application (201 Created) |
| GET | `/api/applications` | List all for current user |
| GET | `/api/applications/{id}` | Get by ID |
| PUT | `/api/applications/{id}` | Full update |
| DELETE | `/api/applications/{id}` | Delete (204 No Content) |
| PATCH | `/api/applications/{id}/status` | Update status only (`StatusUpdateRequest`) |
| PATCH | `/api/applications/{id}/stage` | Update stage+status+rejection (`StageUpdateRequest`) |
| POST | `/api/applications/{id}/stage` | Add stage (sets `currentStage`, moves to `IN_PROGRESS`) |
| GET | `/api/applications/check-duplicate` | Duplicate check (`?company=&position=`) |
| PATCH | `/api/applications/{id}/cv` | Assign or remove CV (`{cvId: Long|null}`) |

#### AuthController — `@RequestMapping("/api/auth")`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/me` | Current user profile (requires JWT) |
| POST | `/api/auth/refresh` | Issue new access token from httpOnly refresh cookie (public) |
| POST | `/api/auth/logout` | Invalidate refresh token, clear cookie (requires JWT) |

#### CVController — `@RequestMapping("/api/cv")`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/cv/upload` | Upload PDF file (`multipart/form-data`) |
| POST | `/api/cv` | Create CV record with name/type/externalUrl |
| GET | `/api/cv` | List all CVs for current user |
| GET | `/api/cv/{id}` | Get CV by ID |
| GET | `/api/cv/{id}/download` | Download PDF file |
| PUT | `/api/cv/{id}` | Update CV name / externalUrl |
| DELETE | `/api/cv/{id}` | Delete CV (204 No Content) |

#### NoteController — `@RequestMapping("/api")`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/applications/{applicationId}/notes` | List notes for application |
| POST | `/api/applications/{applicationId}/notes` | Create note |
| GET | `/api/notes/{id}` | Get note by ID |
| PUT | `/api/notes/{id}` | Update note content/category |
| DELETE | `/api/notes/{id}` | Delete note (204 No Content) |

#### StatisticsController — `@RequestMapping("/api/statistics")`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/statistics/badges` | Get badge stats (rejection/ghosting badges + counts) |

#### Spring Security managed (not controllers)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/oauth2/authorization/google` | Initiates Google OAuth2 login |
| GET | `/login/oauth2/code/google` | OAuth2 callback (handled by Spring Security) |
| GET | `/actuator/health` | Health check (public) |

### Key dependencies (from pom.xml)

- **Java 21**, Spring Boot 3.4.1
- `spring-boot-starter-data-jpa` — JPA/Hibernate ORM
- `spring-boot-starter-web` — REST API
- `spring-boot-starter-validation` — Jakarta Bean Validation
- `spring-boot-starter-security` — Spring Security
- `spring-boot-starter-oauth2-client` — Google OAuth2 login
- `spring-boot-starter-oauth2-resource-server` — JWT validation (RS256 via Nimbus)
- `spring-boot-starter-actuator` — health endpoint
- `postgresql` — JDBC driver
- `h2` (test scope) — in-memory DB for tests
- `flyway-core` + `flyway-database-postgresql` — schema migrations
- `spring-dotenv` (me.paulschwarz) — `.env` file loading

---

## 4. Database — Actual Schema

Schema is managed by Flyway (12 migrations, V1 through V12). The current effective schema after all migrations:

### Table: `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, `DEFAULT gen_random_uuid()` |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| name | VARCHAR(255) | NOT NULL |
| google_id | VARCHAR(255) | NOT NULL, UNIQUE |
| refresh_token | VARCHAR(255) | nullable |
| refresh_token_expiry | TIMESTAMP | nullable |
| created_at | TIMESTAMP | NOT NULL, `DEFAULT CURRENT_TIMESTAMP` |

### Table: `cvs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| type | VARCHAR(50) | `DEFAULT 'FILE'` |
| file_name | VARCHAR(255) | nullable |
| original_file_name | VARCHAR(255) | NOT NULL |
| file_path | VARCHAR(500) | nullable |
| file_size | BIGINT | nullable |
| external_url | VARCHAR(500) | nullable |
| user_id | UUID | FK → users(id), NOT NULL (added V4, made NOT NULL V11) |
| uploaded_at | TIMESTAMP | NOT NULL, `DEFAULT CURRENT_TIMESTAMP` |

### Table: `applications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| company | VARCHAR(255) | NOT NULL |
| position | VARCHAR(255) | NOT NULL |
| link | VARCHAR(500) | nullable |
| salary_min | INTEGER | nullable |
| salary_max | INTEGER | nullable |
| currency | VARCHAR(10) | nullable |
| salary_type | VARCHAR(50) | nullable |
| contract_type | VARCHAR(50) | nullable |
| salary_source | VARCHAR(50) | nullable |
| source | VARCHAR(255) | nullable |
| status | VARCHAR(50) | NOT NULL, `DEFAULT 'SENT'` (V10 changed from `'WYSLANE'`) |
| job_description | TEXT | nullable |
| agency | VARCHAR(255) | nullable |
| cv_id | BIGINT | FK → cvs(id), nullable |
| user_id | UUID | FK → users(id), NOT NULL (V4 + V11) |
| applied_at | TIMESTAMP | NOT NULL, `DEFAULT CURRENT_TIMESTAMP` |
| current_stage | VARCHAR(255) | nullable |
| rejection_reason | VARCHAR(100) | nullable |
| rejection_details | TEXT | nullable |

### Table: `notes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PK |
| content | TEXT | NOT NULL |
| application_id | BIGINT | FK → applications(id) ON DELETE CASCADE, NOT NULL |
| category | VARCHAR(255) | `DEFAULT 'OTHER'` (V6 migrated from `'INNE'`) |
| created_at | TIMESTAMP | NOT NULL, `DEFAULT CURRENT_TIMESTAMP` |

### Dropped table
- `stage_history` — created in V1, dropped in V12 (`DROP TABLE IF EXISTS stage_history`).

### Key relationships
- `applications.user_id` → `users.id` (many-to-one)
- `applications.cv_id` → `cvs.id` (many-to-one, nullable)
- `notes.application_id` → `applications.id` (many-to-one, cascade delete)
- `cvs.user_id` → `users.id` (many-to-one)

### Indexes (from V1 + V4)
- `idx_applications_status`, `idx_applications_company`, `idx_applications_applied_at`, `idx_applications_company_position`
- `idx_applications_user_id`, `idx_applications_user_status`
- `idx_notes_application_id`, `idx_notes_created_at`
- `idx_cvs_uploaded_at`, `idx_cvs_user_id`
- `idx_users_email`, `idx_users_google_id`

---

## 5. Frontend — Actual Architecture

### Pages

| Page | Path | Description |
|------|------|-------------|
| `LoginPage` | `/login` | Google login button, language switcher, redirects to `/dashboard` if authenticated |
| `AuthCallbackPage` | `/auth/callback` | Reads `?token=` from URL, stores in localStorage, redirects to `/dashboard` |
| `DashboardPage` | `/dashboard` | Thin wrapper around `AppContent` |

### Component structure

```
src/
  App.tsx                        — Router + providers (QueryClient, AuthProvider, ErrorBoundary)
  AppContent.tsx                 — Main layout: header, tabs, view routing, logout button
  AppContent.css                 — (via App.css import)
  auth/
    AuthProvider.tsx             — Context: user, isLoading, isAuthenticated, signOut (calls backend logout)
    ProtectedRoute.tsx           — Redirects to /login if unauthenticated
  pages/
    LoginPage.tsx
    AuthCallbackPage.tsx
    DashboardPage.tsx
  components/
    ErrorBoundary.tsx
    LanguageSwitcher.tsx         — PL/EN toggle buttons
    applications/
      ApplicationForm.tsx        — Create / edit form
      ApplicationTable.tsx       — List view with status filter and delete
      ApplicationDetails.tsx     — Full detail panel with CV picker and notes
      SalaryFormSection.tsx      — Salary fields sub-component (reused in form)
    kanban/
      KanbanBoard.tsx            — DnD board (3 columns: SENT / IN_PROGRESS / FINISHED)
      KanbanColumn.tsx           — Single column
      ApplicationCard.tsx        — Card with stage dropdown, mobile long-press menu
      DragOverlayCard.tsx        — Ghost card during drag
      StageModal.tsx             — Stage selection popup (5 predefined + custom)
      MoveModal.tsx              — Mobile move card popup
      EndModal.tsx               — Outcome modal (OFFER / REJECTED + reason)
      types.ts                   — STATUSES, PREDEFINED_STAGES, REJECTION_REASONS, helpers
    badges/
      BadgeWidget.tsx            — Badge progress widget in header
    cv/
      CVManager.tsx              — CV list (upload/link/note), assign to application
    notes/
      NotesList.tsx              — Notes list with category filter and inline edit
    tour/
      TourGuide.tsx              — First-time user onboarding tour
  hooks/
    useApplications.ts           — React Query hooks: useApplications, useUpdateStatus, useUpdateStage, useDeleteApplication
    useBadgeStats.ts             — React Query hook for badge stats
    useCV.ts                     — React Query hooks for CV operations
    useNotes.ts                  — React Query hooks for notes
  services/
    api.ts                       — All fetch calls to the backend
  types/
    domain.ts                    — TypeScript types mirroring backend DTOs
  constants/
    applicationStatus.ts         — STATUS_CONFIG (label keys, colors per status)
  utils/
    urlValidator.ts              — URL validation helper
  i18n/
    index.ts                     — i18next init (LanguageDetector, 4 namespaces)
    types.ts                     — TypeScript declaration for i18n key typing
    locales/
      pl/ common.json, errors.json, badges.json, tour.json
      en/ common.json, errors.json, badges.json, tour.json
```

### API calls made by the frontend (`src/services/api.ts`)

| Function | Method | Endpoint |
|----------|--------|----------|
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
| `fetchCVs` | GET | `/api/cv` |
| `uploadCV` | POST | `/api/cv/upload` |
| `createCV` | POST | `/api/cv` |
| `updateCV` | PUT | `/api/cv/{id}` |
| `deleteCV` | DELETE | `/api/cv/{id}` |
| `assignCVToApplication` | PATCH | `/api/applications/{applicationId}/cv` |
| `downloadCV` | GET | `/api/cv/{id}/download` |
| `fetchNotes` | GET | `/api/applications/{applicationId}/notes` |
| `createNote` | POST | `/api/applications/{applicationId}/notes` |
| `updateNote` | PUT | `/api/notes/{noteId}` |
| `deleteNote` | DELETE | `/api/notes/{noteId}` |
| `fetchBadgeStats` | GET | `/api/statistics/badges` |

All requests send `Accept-Language: <i18n.language>` and `Authorization: Bearer <token>`.

### Installed libraries (from package.json)

**Dependencies (runtime):**
- `react` 19.2.0, `react-dom` 19.2.0
- `react-router-dom` 7.13.0
- `@tanstack/react-query` 5.90.21
- `@dnd-kit/core` 6.3.1, `@dnd-kit/sortable` 10.0.0, `@dnd-kit/utilities` 3.2.2
- `i18next` 25.10.10, `react-i18next` 16.6.6, `i18next-browser-languagedetector` 8.2.1

**DevDependencies:**
- `vite` 7.2.4, `@vitejs/plugin-react`
- `typescript` 5.9.3
- `tailwindcss` 4.2.0, `@tailwindcss/vite`
- `vitest` 1.3.0, `@testing-library/react` 16.0.0, `@testing-library/user-event`, `jsdom`
- `cypress` 15.9.0

---

## 6. Deviations from Plan

### Authentication model
**Plan (brief.md section 8):** Session-based auth listed as a future option.  
**Reality:** JWT + Google OAuth2 fully implemented in v1. Access token (RS256 JWT, 15 min) stored in localStorage; refresh token (opaque UUID) in httpOnly cookie. RSA key pair generated in-memory at startup — tokens invalidated on server restart.

### Application status enum
**Plan (impl-plan, step 2):** `WYSLANE`, `W_PROCESIE`, `OFERTA`, `ODMOWA` (Polish names).  
**Reality:** Renamed to English: `SENT`, `IN_PROGRESS`, `OFFER`, `REJECTED` via Flyway migrations V9 + V5–V10. i18n labels on the frontend handle display.

### Kanban columns vs statuses
**Plan (brief.md):** 5 Kanban columns: Wysłane / Rozmowa / Zadanie / Oferta / Odrzucone.  
**Reality:** 4 statuses, 3 Kanban columns. `OFFER` and `REJECTED` are grouped into one `FINISHED` column on the board. The "recruitment stage" (HR interview, technical interview, etc.) is tracked via the free-text `currentStage` field + `StageModal`, not as separate statuses.

### StageHistory entity
**Plan (impl-plan, step 3):** `StageHistory` entity with full history of recruitment stages.  
**Reality:** Designed and initially built, then removed via V12 Flyway migration and code cleanup (spec in `06-cleanup/remove-stage-history.md`). The frontend never displayed it. `currentStage` string field on `Application` is sufficient.

### CV types
**Plan:** Only PDF file uploads.  
**Reality:** Three `CVType` values: `FILE` (PDF upload), `LINK` (external URL e.g. Google Drive), `NOTE` (name/label only for locally stored CVs). Multiple CVs belong to the user, not per-application — one CV can be assigned to many applications.

### Note categories
**Plan:** Notes as plaintext only.  
**Reality:** Notes have a `category` field (enum: `QUESTIONS`, `FEEDBACK`, `OTHER`) stored in DB. The category was initially Polish (`PYTANIA`, `INNE`), then renamed via Flyway V6.

### Error response format
**Plan (impl-plan, step 7):** `{"error": "message", "timestamp": "..."}`.  
**Reality:** Uses Spring's RFC 9457 `ProblemDetail` format via `spring.mvc.problemdetails.enabled=true`. Response shape is `{"title": "...", "detail": "...", "status": 400, "errors": {...}}`.

### CORS configuration
**Plan:** Separate `CorsConfig` class.  
**Reality:** CORS is configured inline within `SecurityConfig.corsConfigurationSource()`. No separate class. Allowed origins are configurable via `CORS_ALLOWED_ORIGINS` env variable.

### Salary change tracking
**Plan (brief.md edge cases):** Track history of financial negotiations.  
**Reality:** Salary change creates an automatic note via `NoteService.createSalaryChangeNote()`. No dedicated table or history entity.

---

## 7. Added Beyond Spec

### Google OAuth2 + JWT authentication
Not in brief.md's MVP (listed only as future tech). Fully implemented: Google OAuth2 login → access token (JWT RS256) + refresh token (httpOnly cookie). Token refresh endpoint. Logout clears refresh token from DB and removes cookie.

### Multi-user support with data isolation
No mention in the MVP brief. All entities (`applications`, `cvs`, `notes`) are scoped to `user_id`. All service methods take `UUID userId` and enforce ownership checks.

### Statistics and badges
`GET /api/statistics/badges` returns two badge progressions (rejection resilience and ghosting endurance), each with 5 levels. Computed from `ApplicationRepository.getApplicationStats()` JPQL projection. Frontend renders `BadgeWidget` in the header.

### i18n — backend
`I18nConfig` with `MessageSource` (EN/PL via `Accept-Language`). All validation messages, error messages, and exception messages use i18n keys. Enum values renamed from Polish to English (V5–V10 Flyway migrations).

### i18n — frontend
Full `i18next` setup with 4 namespaces (common, errors, badges, tour). `LanguageDetector` reads from localStorage or browser. `LanguageSwitcher` component. `Accept-Language` header sent with every API request. Predefined stage names stored as i18n keys in DB (e.g. `stage.hrInterview`), with `LEGACY_STAGE_MAP` for backward compatibility.

### Demo application on first login
`UserService.createDemoApplication()` automatically creates a sample Google job listing for every new user on first login.

### Onboarding tour
`TourGuide` component provides a step-by-step guided tour for first-time users.

### Mobile support
`KanbanBoard` disables `TouchSensor` on mobile; uses long-press context menu (`MoveModal`) instead of drag & drop. Floating Action Button (FAB) for adding applications on mobile.

### React Query for data management
`@tanstack/react-query` used for all API state (caching, loading states, invalidation). Not in the original spec.

### `@tanstack/react-query` + React 19
Frontend uses React 19 (spec planned React 18) and React Query v5.

### Actuator health endpoint
`/actuator/health` exposed publicly. `management.endpoints.web.exposure.include=health,info`.

### `spring-dotenv` integration
`me.paulschwarz:spring-dotenv` enables `.env` file loading for local development.

---

## 8. Not Implemented (from spec)

### Kanban drag-and-drop on mobile
The plan mentions drag & drop as the primary interaction. On mobile, `TouchSensor` is intentionally **disabled** and replaced by a `MoveModal` long-press menu. Drag & drop on mobile is not implemented.

### CVStorageService as a separate class
Brief.md shows a `CVStorageService.java` in the file structure. In reality, file storage logic lives inside `CVService.java` — no separate storage class.

### `NoteRepository.java` as the only repository planned
Brief.md lists `ApplicationRepository` and `NoteRepository` only. In reality, `CVRepository` and `UserRepository` also exist (needed by CV management and auth).

### Session-based auth (as an alternative)
Brief.md mentions "Session-based: simpler than JWT for single-backend apps" as an option. This was not implemented — JWT was used instead.

### Automatic job description archiving (no scraping)
Brief.md mentions "Automatic saving of pasted job listing content." This exists as a plain `jobDescription` text field that the user fills in manually — there is no automated scraping or link-to-content extraction.

---

## 9. v1 Completion Status

The core MVP features are fully implemented and functional:

- Application CRUD with all planned fields
- Kanban board with drag & drop (desktop), column grouping, stage modal
- CV management (upload, link, note types)
- Notes with categories
- Status and stage tracking

Additionally, a substantial set of features beyond the original MVP brief are complete:

- Full authentication (Google OAuth2 + JWT + refresh tokens)
- Multi-user data isolation
- Gamification (badges/statistics)
- Full EN/PL i18n on both frontend and backend
- Onboarding tour, mobile support, duplicate detection

**Known gaps / remaining work:**
1. Mobile drag & drop is replaced by a modal — the spec intent (drag & drop) is not met on touch devices.
2. `CVStorageService` separation (minor structural deviation).
3. No automated job description archiving — requires user to paste content manually.
4. Access token RSA key is generated in-memory at startup — server restart invalidates all sessions. Acceptable for MVP, but not production-grade.
5. No v1.1 AI features (out of scope by design).