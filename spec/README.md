# EasyApply — Spec Documentation

This directory contains all specification artifacts for the EasyApply project,
organized chronologically by development phase. All implementation was done using
**Claude Code** (Anthropic's AI CLI) with a spec-first approach: specifications
were written before code, not after.

## V1 — MVP (complete)

| Phase | Directory | Status |
|-------|-----------|--------|
| Vision & brief | `v1/01-vision/` | Complete |
| Implementation plan | `v1/02-implementation/` | Complete |
| Code review | `v1/03-review/` | Complete (2026-03-01) |
| Refactoring & learning | `v1/04-refactoring-learning/` | Frontend: done / Backend: in progress |
| Additional features (i18n, logout) | `v1/05-additional-features/` | Complete |
| Cleanup | `v1/06-cleanup/` | Complete |
| Privacy & RODO (phase 07) | `v1/07-privacy-rodo/` | Complete |
| User Data & Service Notifications (phase 08) | `v1/08-user-data/` | Complete |
| Security refactoring (phase 09) | `v1/09-security-refactoring/` | Complete |
| Logging — production observability (phase 10) | `v1/10-logging/` | Complete |
| Swagger / OpenAPI (phase 11) | `v1/11-swagger/` | Complete |
| GitHub Actions CI (phase 12) | `v1/12-ci/` | Complete |
| Docker Registry — GHCR (phase 13) | `v1/13-docker-registry/` | Complete |
| **As-built** | **`v1/as-built.md`** | **Authoritative — what is actually built** |

> `v1/as-built.md` is the primary reference for the current codebase state:
> full package structure, all REST endpoints, DB schema, frontend components, hooks, API calls.

## V2 — Microservices (not started)

| Phase | Directory | Status |
|-------|-----------|--------|
| Architecture vision | `v2/vision.md` | Complete |
| Brief & implementation plan | `v2/` | Pending |

## Deployment

| Document | Purpose |
|----------|---------|
| `deployment/deployment-intro.md` | Background — what deployment is, terminology, hosting options compared, why Hetzner |
| `deployment/deployment-hetzner.md` | Step-by-step production deployment on a Hetzner VPS (Docker Compose + Caddy) |

## AI-Assisted Development

All implementation used Claude Code, but the approach was spec-first — Claude received
specifications and built to them. The refactoring plans in `v1/04-refactoring-learning/` document an
additional pattern: **Claude as mentor**. After the code review, Claude created structured
learning plans paired with refactoring implementation — teaching concepts while improving code. The notes
files record what was understood at each stage.

## Code Reviews

The project has two separate code reviews, each with a different scope:

**`v1/03-review/`** — general code quality review: best practices, design patterns,
naming, architecture. Not a completion check — completion is tracked in each phase's own Definition of Done.

**`v1/09-security-refactoring/code-review-security.md`** — dedicated security audit:
OWASP-focused review of the full security-critical surface (JWT handling, OAuth2 flow, admin key filter,
token storage, CORS, CSP, input validation). Found and fixed: timing attack on admin key comparison,
refresh token stored in plaintext → SHA-256 hash, PII in logs. Corresponding fixes in `refactor-plan-security.md`.
