# 💼 EasyApply

![Java](https://img.shields.io/badge/Java-21-007396?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-6DB33F?style=flat&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring_Security-6DB33F?style=flat&logo=springsecurity&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Flyway](https://img.shields.io/badge/Flyway-CC0200?style=flat&logo=flyway&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=flat&logo=reactquery&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=flat&logo=swagger&logoColor=black)
![Cypress](https://img.shields.io/badge/Cypress-69D3A7?style=flat&logo=cypress&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

![Claude Code](https://img.shields.io/badge/Claude_Code-D97706?style=flat&logo=anthropic&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=googlegemini&logoColor=white)
![Spec-Driven](https://img.shields.io/badge/Spec--Driven-1F2937?style=flat)

EasyApply is a job application tracker for IT candidates in Poland. One place for applications, CVs, and interview notes, instead of scattered spreadsheets and expired links. Designed for anyone actively applying to multiple positions at once.

<div align="center">

[![EasyApply screenshot](.github/assets/app-preview.png)](https://aplikujbezspiny.pl)

<br>

[![OPEN LIVE DEMO](https://img.shields.io/badge/▶%20%20OPEN%20LIVE%20DEMO-22C55E?style=for-the-badge)](https://aplikujbezspiny.pl)

<br>
</div>

## 🤖 Built with AI

Spec-driven development end-to-end with **Claude Code** and **Gemini**. The [`spec/`](spec/README.md) directory holds the planning, implementation, and review documentation that drove every phase — written **before** any code, then handed to AI for execution.

![Vision](https://img.shields.io/badge/Vision-1F2937?style=flat) → ![Spec](https://img.shields.io/badge/Spec-1F2937?style=flat) → ![Code](https://img.shields.io/badge/Code-1F2937?style=flat) → ![Review](https://img.shields.io/badge/Review-1F2937?style=flat) → ![Refactor](https://img.shields.io/badge/Refactor-1F2937?style=flat)


## ✨ Features

- **Application registry** - company, position, salary (range, currency, gross/net, contract type), job source, link to posting
- **Kanban board** - visual overview of recruitment status: Sent → In progress → Completed, with drag & drop
- **Recruitment stages** - tracking current stage: HR interview, technical interview, manager interview, recruitment task, final interview, or custom stage
- **CV archive** - storing different CV versions (file upload, link, or note) and assigning them to specific applications
- **Notes** - saving interview questions, feedback, and personal thoughts for each application (categories: Questions / Feedback / Other)
- **Job posting archive** - copy of the job description in case the link expires
- **Duplicate detection** - warning when reapplying to the same company and position
- **Badge system** - achievements for rejections and ghosting (gamification)
- **Authentication** - Google OAuth2 login, JWT access token + refresh token
- **i18n** - Polish and English interface with a language switcher


## 📁 Project Structure

```
easyapply-backend/    - Spring Boot application (com.easyapply)
easyapply-frontend/   - React + Vite application (src/)
spec/                 - Spec-driven documentation (vision, plans, review, as-built)
docker-compose.yml    - Local development setup
```



## 🐳 Running with Docker

**1.** Clone the repo and create `.env`:
```bash
cp .env.example .env
```

**2.** Fill in `.env`:

| Variable | What to put |
|---|---|
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | anything you like, e.g. `easyapply` / `easyapply` / `secret` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com) — add `http://localhost:3000` as an authorised redirect URI |
| `ADMIN_KEY` / `APP_TOKEN_HMAC_SECRET` | any random string, e.g. output of `openssl rand -base64 32` |

Leave the rest as defaults from `.env.example`.

**3.** Build and start:
```bash
docker compose up --build
```

**4.** Open `http://localhost:3000`

Production images are published to GitHub Container Registry after every successful CI run on `master`:
```
ghcr.io/jakubbone/easyapply-backend:latest
ghcr.io/jakubbone/easyapply-frontend:latest
```

## 📚 Documentation

Specification and architecture artifacts live in [`spec/`](spec/README.md):

- **Vision & MVP brief** - `spec/v1/01-vision/brief.md`
- **Implementation plan** - `spec/v1/02-implementation/mvp-implementation-plan.md`
- **As-built (actual architecture)** - `spec/v1/as-built.md`
- **v2 microservices vision** - `spec/v2/vision.md`

The full REST API is documented with **Swagger UI**, available at `/swagger-ui.html` on the running backend. All endpoints are grouped by domain, and authenticated endpoints can be called directly from the UI after pasting a JWT Bearer token.


## 🔒 Privacy & Data

EasyApply collects the minimum data needed to operate:

- **What we store:** email, display name, Google ID, and an optional link to your CV hosted externally (Google Drive, Dropbox, etc.). No CV files are uploaded to our servers.
- **CV files:** deliberately excluded - the upload endpoint is disabled. Users paste a link to their own hosted CV and retain full control over access.
- **Account deletion:** available at any time via Settings → Delete account. All data (applications, notes, CV records) is permanently removed with no trace left in the database.
- **Inactive accounts:** automatically deleted after 12 months of inactivity.
- **Refresh tokens:** stored as SHA-256 hashes - a stolen database cannot be used to hijack sessions.
- **Logs:** user identifiers in logs are UUIDs only — no emails, names, or tokens in plaintext.
- **Privacy policy:** available at `/privacy` in the live app (PL/EN).
- **Contact:** jakub.bone1990@gmail.com

See [`spec/v1/07-privacy-rodo/`](spec/v1/07-privacy-rodo/) for the full design rationale behind these decisions.


## ✅ Status

### v1 - Complete

All planned MVP features implemented, plus:

- **Auth** - Google OAuth2 login, JWT access + refresh tokens
- **i18n** - Polish / English with language switcher
- **Onboarding** - guided tour for new users
- **Gamification** - badge system for rejections and ghosting
- **RODO compliance** - privacy policy, consent flow, account deletion, 12-month data retention
- **API docs** - Swagger UI with JWT auth at `/swagger-ui.html`
- **Tests** - Cypress E2E + Vitest unit tests
- **CI/CD** - GitHub Actions pipeline, Docker images published to GHCR on every `master` build

### v2 - Planned

Microservices architecture + AI features - vision defined, implementation not started. See [`spec/v2/vision.md`](spec/v2/vision.md).
