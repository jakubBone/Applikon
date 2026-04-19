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

You need: Java 21, Node.js 20+, PostgreSQL 16 (or run via Docker), Google OAuth2 credentials.

**1. Database** — start Postgres (e.g. via Docker):
```bash
docker run --name easyapply-db -e POSTGRES_DB=easyapply -e POSTGRES_USER=easyapply \
  -e POSTGRES_PASSWORD=easyapply -p 5432:5432 -d postgres:16-alpine
```

**2. Backend** (`easyapply-backend/`):
```bash
cp .env.example .env       # fill in DATABASE_*, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
./mvnw spring-boot:run     # starts on :8080
```

**3. Frontend** (`easyapply-frontend/`):
```bash
cp .env.example .env       # fill in VITE_API_URL, VITE_GOOGLE_CLIENT_ID
npm install
npm run dev                # starts on :5173
```


## Documentation

Specification and architecture artifacts live in [`spec/`](spec/README.md):

- **Vision & MVP brief** — `spec/v1/01-vision/brief.md`
- **Implementation plan** — `spec/v1/02-implementation/mvp-implementation-plan.md`
- **As-built (actual architecture)** — `spec/v1/as-built.md`
- **v2 microservices vision** — `spec/v2/vision.md`


## Status

v1 complete. All planned MVP features implemented, plus: Google OAuth2 authentication, i18n (EN/PL), onboarding tour, gamification badges, Cypress E2E tests.

v2 (microservices + AI features) — vision defined, implementation not started.
