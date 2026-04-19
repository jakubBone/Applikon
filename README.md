<img src="easyapply-frontend/public/logo_white.png" alt="EasyApply" width="100%">

![Claude Code](https://img.shields.io/badge/Claude_Code-D97706?style=flat&logo=anthropic&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-4285F4?style=flat&logo=googlegemini&logoColor=white)
![Spec-Driven](https://img.shields.io/badge/Spec--Driven-1F2937?style=flat)

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
![Cypress](https://img.shields.io/badge/Cypress-69D3A7?style=flat&logo=cypress&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)


## 🎯 About

**EasyApply is a job application tracker for IT candidates in Poland** — one place for applications, CVs, and interview notes, instead of scattered spreadsheets and expired links. Built primarily for juniors actively applying to many positions and needing control over the entire process.


## 🤖 Built with AI

Spec-driven development end-to-end with **Claude Code** and **Gemini**. The [`spec/`](spec/README.md) directory holds the planning, implementation, and review documentation that drove every phase — written **before** any code, then handed to AI for execution.

![Vision](https://img.shields.io/badge/Vision-1F2937?style=flat) → ![Spec](https://img.shields.io/badge/Spec-1F2937?style=flat) → ![Code](https://img.shields.io/badge/Code-1F2937?style=flat) → ![Review](https://img.shields.io/badge/Review-1F2937?style=flat) → ![Refactor](https://img.shields.io/badge/Refactor-1F2937?style=flat)


## ✨ Features

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


## 📁 Project Structure

```
easyapply-backend/    — Spring Boot application (com.easyapply)
easyapply-frontend/   — React + Vite application (src/)
spec/                 — Spec-driven documentation (vision, plans, review, as-built)
docker-compose.yml    — Local development setup
```


## 🚀 Running Locally

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


## 📚 Documentation

Specification and architecture artifacts live in [`spec/`](spec/README.md):

- **Vision & MVP brief** — `spec/v1/01-vision/brief.md`
- **Implementation plan** — `spec/v1/02-implementation/mvp-implementation-plan.md`
- **As-built (actual architecture)** — `spec/v1/as-built.md`
- **v2 microservices vision** — `spec/v2/vision.md`


## ✅ Status

v1 complete. All planned MVP features implemented, plus: Google OAuth2 authentication, i18n (EN/PL), onboarding tour, gamification badges, Cypress E2E tests.

v2 (microservices + AI features) — vision defined, implementation not started.
