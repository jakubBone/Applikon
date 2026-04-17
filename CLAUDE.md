# EasyApply — CLAUDE.md

## Project
Job application tracker for Polish IT candidates (juniors/mids actively applying for roles).
Built together with the user in a **spec-driven** workflow: specs in `spec/` came before code.

**Backend:** Java 21 · Spring Boot 3.4 · Spring Security · Google OAuth2 + JWT (RS256) · PostgreSQL · Flyway  
**Frontend:** React 19 · TypeScript · Tailwind CSS 4 · React Query v5 · i18next (PL/EN) · @dnd-kit  
**Infra:** Docker Compose · Vercel (frontend)

## Structure
```
easyapply-backend/    — Spring Boot app (com.easyapply)
easyapply-frontend/   — React + Vite (src/)
spec/
  README.md                        — index of all spec phases
  v1/01-vision/brief.md            — original product brief (problem, MVP scope, tech choices)
  v1/02-implementation/mvp-implementation-plan.md — step-by-step build plan (ETAP 1–7)
  v1/03-review/code-review-2026-03-01.md          — code quality review (security, patterns)
  v1/04-refactoring-learning/      — backend/frontend refactor plans + learning notes
  v1/05-additional-features/       — i18n, logout (separate feature specs)
  v1/as-built.md                   — SOURCE OF TRUTH: full package structure, all REST endpoints,
                                     DB schema (V1–V12 Flyway), frontend components, hooks, API calls
  v2/vision.md                     — microservices architecture vision (not started)
  deployment/deployment-guide.md   — how to deploy
```

## Current State (v1 — complete)
- Full CRUD: applications, notes, CVs (FILE/LINK/NOTE types)
- Kanban board: 3 columns (SENT / IN_PROGRESS / FINISHED), drag & drop
- Google OAuth2 login → JWT access token (15 min) + refresh token (httpOnly cookie, 7 days)
- Multi-user isolation: all queries scoped to `user_id` from JWT
- i18n EN/PL, gamification badges, onboarding tour
- Vitest (84 backend, 67 frontend tests) + Cypress E2E
- Branch `refactor-backend` — backend refactoring/learning in progress

**Known gaps:** `createSalaryChangeNote()` in NoteService exists but is never called from ApplicationService (dead code); `rejectionDetails` missing from frontend `Application` type.

## Working Agreement

**Commits — never commit autonomously. Always propose using Conventional Commits:**
```
type(scope): description
```
Types: `feat` · `fix` · `refactor` · `test` · `docs` · `chore`  
Scopes: `backend` · `frontend` · `spec` · `db` · `infra`  
Example: `refactor(backend): extract validation into ApplicationValidator`

**Other rules:**
- No features/abstractions beyond what was asked
- When changing behavior, check if it conflicts with `spec/v1/as-built.md`
- User communicates in Polish; code, commits, and docs stay in English
- Read actual code before suggesting modifications

## Quick Reference — when to read deeper docs
| Need | Read |
|------|------|
| Full architecture / DB schema / API list | `spec/v1/as-built.md` |
| Backend refactor — what's done, what's next | `spec/v1/04-refactoring-learning/refactor-plan-backend.md` |
| Original vision / problem statement | `spec/v1/01-vision/brief.md` |
| v2 microservices context | `spec/v2/vision.md` |
| Deploy instructions | `spec/deployment/deployment-guide.md` |
