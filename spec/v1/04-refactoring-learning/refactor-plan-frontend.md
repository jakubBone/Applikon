# Frontend Learning Plan — EasyApply

## Document Context

This document is a learning guide for Jakub — author of EasyApply.
Jakub is a backend developer (Java/Spring) who wrote this application with Claude Code help.
He wants to understand how frontend works at basic level.

**Source Documents:**
- `spec/v1/04-refactoring-learning/refactor-plan-frontend.md` — this file (plan, rules, progress)
- `spec/v1/03-review/code-review-2026-03-01.md` — code review from mentor — source of all fixes

**How to Use This Plan:**
Paste it into new Claude Code session and write: _"We're continuing frontend learning. We're at Phase X."_

**Claude reads at start of each session:**
1. `spec/v1/04-refactoring-learning/refactor-plan-frontend.md` — this file (plan, rules, progress)
2. `spec/v1/03-review/code-review-2026-03-01.md` — code review
3. `spec/v1/04-refactoring-learning/learning-notes-frontend.md` — what Jakub already worked through and understood

`learning-notes-frontend.md` is key context — shows which language and analogies work best for Jakub, what he already knows, what he can reference.

---

## Project: EasyApply

**What It Does:** Job application tracker for job seekers.
User logs in via Google, adds job applications, tracks recruitment stages
on Kanban board, manages CVs and notes. Badge system gamifies job search.

**Tech Stack:**
- **Backend:** Java 21, Spring Boot, Spring Security, OAuth2 + JWT (RS256), PostgreSQL, Flyway, Docker
- **Frontend:** React 18, TypeScript (strict), Vite, React Query (TanStack), React Router, Cypress

**Frontend Directory Structure (`easyapply-frontend/src/`):**
```
App.tsx                          — app root, routing, providers
AppContent.tsx                   — main dashboard layout (per CR: consider renaming to DashboardLayout)
main.tsx                         — app entry point

auth/
  AuthProvider.tsx               — authentication context, checks token on startup
  ProtectedRoute.tsx             — blocks access for logged-out users

pages/
  LoginPage.tsx                  — login page (CR issue: hardcoded URL)
  AuthCallbackPage.tsx           — handles Google OAuth2 return
  DashboardPage.tsx              — main application page

components/
  applications/
    ApplicationTable.tsx         — table view of applications with filtering/sorting
    ApplicationForm.tsx          — form for adding/editing applications
    ApplicationDetails.tsx       — selected application details panel
    SalaryFormSection.tsx        — salary section in form
  kanban/
    KanbanBoard.tsx              — Kanban board (~987 lines, needs decomposition per CR)
  cv/
    CVManager.tsx                — CV management (~650 lines, uses useState instead of React Query per CR)
  notes/
    NotesList.tsx                — list of notes for application
  badges/
    BadgeWidget.tsx              — badges/statistics widget
  tour/
    TourGuide.tsx                — app tour guide (~572 lines)

hooks/
  useApplications.ts             — React Query hook: fetch and mutate applications
  useCV.ts                       — React Query hook: fetch and mutate CVs
  useNotes.ts                    — React Query hook: fetch and mutate notes
  useBadgeStats.ts               — React Query hook: fetch badge statistics

services/
  api.ts                         — API communication layer (fetch, JWT, endpoints)

types/
  domain.ts                      — TypeScript types mirroring backend entities
```

---

## Mentor Mode Rules (APPLY THROUGHOUT LEARNING)

1. **Explanation Level:** Jakub knows Java and Spring at basic/intermediate level.
   Doesn't know frontend. Explain with Java/Spring analogies where possible.
   Literally. No thought shortcuts.

2. **Interaction:** After explaining each topic OBLIGATORILY ask if clear.
   Don't move forward without explicit confirmation ("ok", "understood", "next").

3. **Quiz After Each Subtopic:** After explaining each small topic in a phase
   (e.g., "what is Vite", "what is useState") ask Jakub 5 comprehension questions.
   Questions must be concrete, reference the project, not abstractions.
   Wait for answers, fix mistakes before moving.

4. **Notes After Each Large Phase:** After completing entire phase (1–10) save summary
   to `spec/v1/04-refactoring-learning/learning-notes-frontend.md`. Format: phase heading, key concepts with explanations,
   Java analogies, most important project files that apply to phase.
   File serves as Jakub's cheat sheet.

5. **Always Show Code:** Discuss specific project files, not abstract examples.
   Point to line numbers (format: `file.tsx:42`).

6. **CR Integrated With Learning:** When code review points to problem in current phase — first explain mechanism, then fix together with Jakub.
   Don't fix without explanation — reason matters.

7. **Don't Ask "Ready to move on?"** — make decisions based on quiz results and whether Jakub confirmed understanding.

8. **Don't Commit:** Jakub makes commits himself. Never run `git commit`.

---

## Work Flow For Each CR Fix

Each code change must go through this process. Don't skip steps.

```
1. EXPLAIN   — explain mechanism (why it's error / how it works)
2. READ      — read current file before change (Read tool)
3. FIX       — make change (Edit tool)
4. TESTS     — check if change touches existing tests:
                  a) run: npm test (Vitest) in easyapply-frontend
                  b) if test breaks — update test, run again
                  c) if new logic — propose new test
5. BUILD     — check TypeScript compiles: npm run build
6. BROWSER   — remind Jakub to manually test in browser
                  (give specifics: what to click / what to check)
7. QUESTION  — ask: "Should we mark CR-X as fixed in progress table?"
8. UPDATE    — if Jakub confirms: update status in tables (⬜ → ✅)
                  and add entry to "Session Notes"
```

**Important Rules:**
- Step 4 (tests) is **mandatory** — even for small changes
- Step 6 (browser) is always Jakub's task, not Claude's
- Step 7 (question) — Claude asks, Jakub decides
- If tests don't pass — **don't move forward** until green

---

## Learning Progress

| Phase | Topic | Learning | CR Fixed This Phase |
|-------|-------|----------|-------------------|
| 1 | Ecosystem and Tools | ✅ | — |
| 2 | Component — Basic Unit | ✅ | — |
| 3 | State (state) and Re-rendering | ✅ | — |
| 4 | React Hooks | ✅ | — |
| 5 | React Query — Frontend Heart | ✅ | CR-7 |
| 6 | Routing and Page Protection | ✅ | — |
| 7 | Frontend ↔ Backend Communication | ✅ | CR-3, CR-4, CR-9 |
| 8 | OAuth2 and JWT — Complete Login Flow | ✅ | CR-5, CR-6 |
| 9 | TypeScript in React | ✅ | CR-2, CR-8 |
| 10 | Frontend Testing | ✅ | — |

After each phase Claude asks:
> _"Should we mark Phase X as complete? I'll update table and notes with session info."_

---

## List of Fixes from CR (Progress Tracking)

Source: `spec/v1/03-review/code-review-2026-03-01.md` (review 2026-03-01, reviewer: DR & AI)

### 🔴 Critical (security / correctness)

| ID | Problem | File(s) | Phase | Status | Tested |
|----|---------|---------|-------|--------|--------|
| CR-2 | Missing URL validation (XSS through href) | `ApplicationDetails.tsx`, `CVManager.tsx` | Phase 9 | ✅ | ✅ |
| CR-3 | Refresh token contract (`token` vs `accessToken`) | `api.ts` + backend controller | Phase 7 | ✅ | ✅ |
| CR-4 | Hardcoded `http://localhost:8080` in LoginPage | `LoginPage.tsx` | Phase 7 | ✅ | ✅ |
| CR-5 | Missing SameSite on refresh_token cookie | `OAuth2AuthenticationSuccessHandler.java` | Phase 8 | ✅ | ✅ |
| CR-6 | Missing Error Boundary + crash `new URL()` in CVManager | `App.tsx`, `CVManager.tsx` | Phase 8 | ✅ | ✅ |

### 🟡 Important (quality / consistency)

| ID | Problem | File(s) | Phase | Status | Tested |
|----|---------|---------|-------|--------|--------|
| CR-7 | CVManager uses useState instead of useCV() | `CVManager.tsx` | Phase 5 | ✅ | ✅ |
| CR-8 | Duplicate status color constants | `ApplicationDetails.tsx`, `ApplicationTable.tsx` | Phase 9 | ✅ | ✅ |
| CR-9 | `apiFetch()` redirect without stopping processing | `api.ts` | Phase 7 | ✅ | ✅ |
| CR-11 | Missing memoization for sort/filter | `ApplicationTable.tsx` | Phase 3 | ✅ | ✅ |
| CR-12 | KanbanBoard.tsx ~987 lines — needs decomposition | `KanbanBoard.tsx` | optional | ✅ | ✅ |

**Legend:**
- **Status** ⬜/✅ — code change done
- **Tested** ⬜/✅ — tests passed AND Jakub tested in browser

---

## Detailed Phase Descriptions

---

### Phase 1 — Ecosystem and Tools

**Goal:** Understand what React, TypeScript, Vite are at "what is it and why" level.

**Java Analogies:**
- React ≈ UI framework (like Spring, but for browser)
- TypeScript ≈ Java (static typing) vs JavaScript ≈ dynamic Groovy
- Vite ≈ Maven/Gradle (builds project, manages dependencies)
- `package.json` ≈ `pom.xml`
- `node_modules/` ≈ Maven repository `~/.m2`
- `npm run dev` ≈ `mvn spring-boot:run`

**What We Discuss:**
- How browser runs JavaScript (DOM, event loop — basics)
- What SPA (Single Page Application) is vs traditional page
- How Vite compiles TypeScript → JavaScript and serves to browser
- What `index.html` + `main.tsx` are as entry point (analogy to `main()` in Java)
- Overview of `src/` directory structure

**Files to Open:**
- `easyapply-frontend/package.json` — dependencies (like pom.xml)
- `easyapply-frontend/vite.config.ts` — build config
- `easyapply-frontend/src/main.tsx` — entry point
- `easyapply-frontend/src/App.tsx` — app root

**CR Related:** none on this phase.

---

### Phase 2 — Component — Basic Unit

**Goal:** Understand React component, JSX, props.

**Java Analogies:**
- Component ≈ class with `render()` method (but written as function)
- JSX ≈ templates (like Thymeleaf/JSP, but in TypeScript code)
- Props ≈ constructor parameters / method arguments (data passed to component)
- Rendering ≈ generating HTML (dynamic, in browser)

**What We Discuss:**
- What JSX is (`<div>`, `<LoginPage />`) — why HTML in TypeScript?
- How React converts JSX to DOM tree (Virtual DOM — idea, not details)
- Props — passing data to component
- Component export/import (analogy to Java classes)
- Component nesting (App → AuthProvider → Routes → LoginPage)

**Files to Open:**
- `src/App.tsx` — component composition, routing at top level
- `src/pages/LoginPage.tsx` — simple page component
- `src/components/badges/BadgeWidget.tsx` — small component with props

**CR Related:** none on this phase.

---

### Phase 3 — State and Re-rendering

**Goal:** Understand `useState`, how React updates UI, why it's different from Java.

**Java Analogy:**
- `useState` ≈ field + setter, except setter automatically refreshes view
- In Java change field → nothing in UI happens. In React change state → React auto re-renders component

**What We Discuss:**
- `const [value, setValue] = useState(initial)` — destructuring, how to read
- Why NOT modify state directly (not like `this.field = x` in Java)
- Re-rendering — what "component re-renders" means
- Rule: one state → one source of truth
- When to use `useState` vs regular variable

**Files to Open:**
- `src/auth/AuthProvider.tsx` — `useState` for `user` and `isLoading` (lines 34-35)
- `src/components/applications/ApplicationTable.tsx` — filters and sorting as state

**CR Related:**
- CR-11 (memoization): `ApplicationTable.tsx` — sort/filter without memoization on every render.
  Explain `useMemo` and when needed.

---

### Phase 4 — React Hooks

**Goal:** Understand hooks, `useEffect`, and custom hooks in project.

**Java Analogies:**
- Hooks ≈ lifecycle methods (like `@PostConstruct`, `@PreDestroy` in Spring)
- `useEffect` ≈ code that must execute "on the side" — e.g., after component loads
- Custom hook (`useApplications`) ≈ service in Spring (encapsulates logic, reusable)

**What We Discuss:**
- `useEffect(fn, [deps])` — when it fires, what dependency array means
- Common uses: fetch data on startup, subscriptions, cleanup
- Difference between `useEffect` and `useState`
- Custom hooks and why they start with `use`
- Overview of project hooks: `useApplications`, `useCV`, `useNotes`, `useBadgeStats`

**Files to Open:**
- `src/auth/AuthProvider.tsx` — `useEffect` checking token on startup (lines 37-53)
- `src/hooks/useApplications.ts` — custom hook based on React Query
- `src/hooks/useNotes.ts` — custom hook

**CR Related:**
- CR-7 (preview): `CVManager.tsx` uses `useState + useEffect` instead of ready `useCV()`.
  Show inconsistency. Fix in Phase 5.

---

### Phase 5 — React Query — Frontend Heart

**Goal:** Understand why React Query is key and how it works in project.

**Java Analogies:**
- React Query ≈ caching layer (like Spring Cache + @Cacheable)
- `useQuery` ≈ repository call with automatic state management loading/error/data
- `useMutation` ≈ service method mutating data (POST/PUT/DELETE) with auto cache invalidation
- `queryKeys` ≈ cache names (like value in `@Cacheable("applications")`)

**What We Discuss:**
- Problem without React Query: manual `useState` + `useEffect` + loading/error handling (like CVManager)
- `useQuery({ queryKey, queryFn })` — fetch with auto cache
- `useMutation({ mutationFn, onSuccess })` — mutations with cache invalidation
- Stale time and refetching — when React Query refreshes data
- `queryClient.invalidateQueries` — invalidate cache after mutation

**Files to Open:**
- `src/hooks/useApplications.ts` — complete example useQuery + useMutation
- `src/hooks/useCV.ts` — hook to CV (which CVManager should use)
- `src/components/cv/CVManager.tsx` — anti-example: useState+useEffect

**CR Related:**
- **CR-7:** Fix `CVManager.tsx` — replace `useState + useEffect + fetchCVs()`
  with `useCV()` hook. Full work flow (tests + browser).

---

### Phase 6 — Routing and Page Protection

**Goal:** Understand SPA navigation and page protection for logged-in users.

**Java Analogies:**
- React Router ≈ Spring MVC `@RequestMapping` (URL → component)
- `ProtectedRoute` ≈ Spring Security filter (blocks access)
- `AuthProvider` + Context ≈ `SecurityContextHolder` (global auth state)
- `useContext` ≈ `@Autowired` (getting dependency)

**What We Discuss:**
- How SPA handles URL without page reload (History API)
- `<Routes>` and `<Route>` — mapping URL → component
- `<Navigate>` — redirect (like `redirect:` in Spring MVC)
- Context API — global state (why not props drilling)
- `AuthProvider` — how `createContext`, `Provider`, `useContext` create global auth state
- `ProtectedRoute` — checks if logged in, redirects or allows

**Files to Open:**
- `src/App.tsx` — full routing config
- `src/auth/AuthProvider.tsx` — Context API, global auth state
- `src/auth/ProtectedRoute.tsx` — component guard

**CR Related:** none fixes, but preview Error Boundary (CR-6 from Phase 8).

---

### Phase 7 — Frontend ↔ Backend Communication

**Goal:** Understand how frontend sends HTTP requests to Spring Boot and handles responses.

**Java Analogies:**
- `fetch()` ≈ `RestTemplate` / `WebClient` (HTTP client)
- `api.ts` ≈ service class (encapsulates all REST calls)
- JSON request/response ≈ `@RequestBody` / `@ResponseBody` in Spring
- `Authorization: Bearer TOKEN` ≈ header verified by Spring Security filter

**What We Discuss:**
- How `fetch(url, options)` works — method, headers, body
- Function `apiFetch()` — what it does with 401 response (and CR problem)
- Function `getHeaders()` — where token comes from and why Bearer
- CORS — why backend must "allow" frontend requests
- `credentials: 'include'` — sends refresh token cookie
- All endpoints in `api.ts` and their Spring controller equivalents

**Files to Open:**
- `src/services/api.ts` — entire API layer
- (backend) `easyapply-backend/.../controller/` — compare with Spring endpoints

**CR Related (to fix in this phase):**
- **CR-3:** Token contract — backend returns `"token"`, frontend expects `"accessToken"`
  (`api.ts:71`). Explain + fix both ends. Full work flow + tests + browser.
- **CR-4:** `LoginPage.tsx` — hardcoded `http://localhost:8080`.
  Explain Vite environment variables (`import.meta.env`). Fix. Check `.env.example`.
- **CR-9:** `apiFetch()` on redirect doesn't stop processing — explain and fix.

---

### Phase 8 — OAuth2 and JWT — Complete Login Flow

**Goal:** Trace step by step what happens from clicking "Login with Google"
to seeing dashboard. Understand role of each file.

**Java Analogies:**
- `AuthCallbackPage.tsx` ≈ controller handling OAuth2 callback
- JWT in localStorage ≈ client-side session (instead of `HttpSession` on server)
- httpOnly cookie with refresh token ≈ server session (inaccessible to JS)

**What We Discuss:**
Complete flow step by step:
1. Click "Login with Google" → redirect to Google (`LoginPage.tsx`)
2. Google logs user in
3. Google redirects to `/auth/callback?token=...` (`AuthCallbackPage.tsx`)
4. Frontend saves token in localStorage and navigates to `/dashboard`
5. `AuthProvider` on startup checks localStorage and fetches user data (`/api/auth/me`)
6. `ProtectedRoute` checks `isAuthenticated` and allows or throws out
7. On every API request, token goes in `Authorization: Bearer` header
8. After 15 min, token expires → 401 → redirect to `/login`
9. Refresh token in cookie → endpoint `/api/auth/refresh` → new access token

**Why Two Tokens:** access token (short, in localStorage) vs refresh token (long, httpOnly cookie)

**Files to Open:**
- `src/pages/LoginPage.tsx` — redirect to Google
- `src/pages/AuthCallbackPage.tsx` — receive token from URL
- `src/auth/AuthProvider.tsx` — check session on startup
- `src/services/api.ts` — `refreshToken()`, `getHeaders()`
- (backend) `OAuth2AuthenticationSuccessHandler.java` — token generation

**CR Related (to fix in this phase):**
- **CR-5:** Missing `SameSite` on refresh_token cookie — explain CSRF,
  fix on backend side (`OAuth2AuthenticationSuccessHandler.java`). Tests + restart.
- **CR-6:** Error Boundary — explain purpose and fix (add to `App.tsx`).
  Also fix `new URL()` crash in `CVManager.tsx`. Tests + browser.

---

### Phase 9 — TypeScript in React

**Goal:** Understand how TypeScript adds type safety to frontend
and how `domain.ts` mirrors backend.

**Java Analogies:**
- `interface` in TypeScript ≈ `interface` / POJO / record in Java
- `type` ≈ `enum` or complex type
- `T | null` ≈ `Optional<T>` or nullable in Java
- TypeScript strict mode ≈ `-Xlint:all` + Checkstyle in Java

**What We Discuss:**
- What TypeScript is vs JavaScript (compilation, type checking)
- `interface Application` vs `class Application` in Java — why interfaces here
- Union types (`'SENT' | 'IN_PROGRESS'`) vs Java enum
- `| null` and `?` — how TypeScript enforces handling missing values
- Generics in TypeScript (e.g., `Promise<Application[]>`)
- Strict mode — what do flags `noUnusedLocals`, `noUnusedParameters` give

**Files to Open:**
- `src/types/domain.ts` — all project types
- `src/services/api.ts` — how types used in fetch
- `easyapply-frontend/tsconfig.json` — strict mode config

**CR Related (to fix in this phase):**
- **CR-2:** URL validation — `javascript:` XSS through href.
  Explain attack, write `isSafeUrl()` function, fix `ApplicationDetails.tsx` and `CVManager.tsx`.
  Full work flow + tests + browser.
- **CR-8:** Duplicate status colors — extract to `src/constants/`.
  Explain DRY. Fix. Tests + browser.

---

### Phase 10 — Frontend Testing

**Goal:** Understand test pyramid and how frontend tests differ from JUnit.

**Java Analogies:**
- Vitest ≈ JUnit 5 (unit tests)
- Testing Library (`@testing-library/react`) ≈ Mockito + assertions on behavior
- Cypress ≈ Selenium (E2E tests, browser)
- Mock Service Worker (MSW) ≈ `@MockBean` in Spring Test

**What We Discuss:**
- Test pyramid: unit → integration → E2E
- How to test component (render, simulate clicks, assert on DOM)
- What `test-utils.tsx` does in project — wrapper with providers
- Overview of existing tests: `AuthProvider.test.tsx`, `useApplications.test.tsx`
- What's worth testing per CR: React Query hooks, conditional components

**Files to Open:**
- `src/test/test-utils.tsx` — test setup
- `src/test/auth/AuthProvider.test.tsx` — component test with context
- `src/test/hooks/useApplications.test.tsx` — hook test

**CR Related:**
- Discuss what more to cover per CR notes.

---

## Session Notes

After each session Claude updates this section. Format: date, what discussed, what understood,
what needs repeat, which CR fixed, next step.

---

### Session 1 — 2026-03-03
**Discussed:**
- Established learning scope: frontend + security + frontend↔backend flow
- Established starting level: Jakub doesn't know frontend from scratch
- Reviewed learning plan and approved
- Established work flow for CR fixes (tests → build → browser → question about marking done)
- Added reference to `spec/v1/03-review/code-review-2026-03-01.md` as source
- Completed Phase 1 — tools ecosystem, Vite flow, files package.json / index.html / main.tsx / App.tsx
- To remember: ports (5432/5173/8080), JSX ≠ HTML, browser understands only JS not JSX

**CR Fixed:** none

**Next Step:** Phase 3 — State and Re-rendering

---

(Rest of session notes will be added as learning progresses)
