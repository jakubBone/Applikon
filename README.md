<p align="center">
  <img src="" alt="EasyApply" width="80" height="80">
</p>

<h1 align="center">EasyApply</h1>

<p align="center">
  Job application tracker for IT candidates in Poland.
</p>


## About

EasyApply helps organize your job search process. Instead of scattered notes, spreadsheets, and expired links — one place for all applications, CVs, and interview notes.

Built for the Polish IT market, primarily for juniors who apply to many positions simultaneously and need control over the entire process.


## Features

- **Application registry** — company, position, salary (range, currency, gross/net, contract type), job source, link to posting
- **Kanban board** — visual overview of recruitment status: Sent → In progress → Completed, with drag & drop
- **Recruitment stages** — tracking current stage: HR interview, technical interview, manager interview, recruitment task, final interview, or custom stage
- **CV archive** — storing different CV versions (file upload, link, or note) and assigning them to specific applications
- **Notes** — saving interview questions, feedback, and personal thoughts for each application (categories: Questions / Feedback / Other)
- **Job posting archive** — copy of the job description in case the link expires
- **Duplicate detection** — warning when reapplying to the same company and position
- **Badge system** — achievements for rejections and ghosting (gamification)
- **Authentication** — Google OAuth2 login, JWT access token + refresh token
- **i18n** — Polish and English interface with a language switcher


## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Java 21, Spring Boot 3.4, Spring Security, Google OAuth2 + JWT (RS256) |
| Database | PostgreSQL 16, Flyway migrations (V1–V12) |
| Frontend | React 19, TypeScript, Tailwind CSS 4, React Query v5, @dnd-kit, i18next |
| Infrastructure | Docker Compose, Vercel (frontend) |


## Project Structure

```
easyapply-backend/    — Spring Boot application (com.easyapply)
easyapply-frontend/   — React + Vite application (src/)
spec/                 — Spec-driven documentation (vision, plans, review, as-built)
docker-compose.yml    — Local development setup
```


## Running Locally

See [`spec/deployment/deployment-guide.md`](spec/deployment/deployment-guide.md) for full setup instructions.

Quick start:
```bash
# Copy and fill in environment variables
cp .env.example .env
cp easyapply-frontend/.env.example easyapply-frontend/.env

# Start everything
docker-compose up
```

Backend runs on `localhost:8080`, frontend on `localhost:5173`.


## Documentation

All specification and architecture artifacts live in [`spec/`](spec/README.md):

- **Vision & MVP brief** — `spec/v1/01-vision/brief.md`
- **Implementation plan** — `spec/v1/02-implementation/mvp-implementation-plan.md`
- **As-built (actual architecture)** — `spec/v1/as-built.md`
- **v2 microservices vision** — `spec/v2/vision.md`


## Status

v1 complete. All planned MVP features implemented, plus: Google OAuth2 authentication, i18n (EN/PL), onboarding tour, gamification badges, Cypress E2E tests.

v2 (microservices + AI features) — vision defined, implementation not started.
