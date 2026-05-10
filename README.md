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
[![CI](https://github.com/jakubBone/EasyApply/actions/workflows/ci.yml/badge.svg)](https://github.com/jakubBone/EasyApply/actions/workflows/ci.yml)


![Claude Code](https://img.shields.io/badge/Claude_Code-D97706?style=flat&logo=anthropic&logoColor=white)
![Spec-Driven](https://img.shields.io/badge/Spec--Driven-1F2937?style=flat)

EasyApply is a job application tracker for IT candidates in Poland. One place for applications, CVs, and interview notes, instead of scattered spreadsheets and expired links. Designed for anyone actively applying to multiple positions at once.

<div align="center">

[![EasyApply screenshot](.github/assets/app-preview.png)](https://aplikujbezspiny.pl)
<br>

[![WATCH VIDEO DEMO](https://img.shields.io/badge/%20WATCH%20VIDEO%20DEMO%20(PL)-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/watch?v=sqIwGYWYn_E)
[![Full App](https://img.shields.io/badge/▶%20%20OPEN%20FULL%20APPLICATION-22C55E?style=for-the-badge)](https://aplikujbezspiny.pl)
<br>
</div>

## 🧠 Spec-Driven Development with AI

Built with **Claude Code** using a strict spec-first approach: every phase starts with a written specification, gets reviewed, then moves to implementation. No code was written without a plan first.

![](https://img.shields.io/badge/Vision-3B82F6?style=flat-square) → ![](https://img.shields.io/badge/Spec-8B5CF6?style=flat-square) → ![](https://img.shields.io/badge/Code-F97316?style=flat-square) → ![](https://img.shields.io/badge/Review-EAB308?style=flat-square) → ![](https://img.shields.io/badge/Refactor-22C55E?style=flat-square)

```
spec/
├── v1/                         
│   ├── 01-vision/              ← MVP scope
│   ├── 02-implementation/      ← implementation plan
│   ├── 03-review/              ← code review
│   ├── 04-mvp-refactoring/     ← refactoring & learning (Claude as mentor)
│   ├── 05-additional-features/ ← i18n, onboarding, gamification
│   ├── 06-cleanup/             ← technical cleanup
│   ├── 07-privacy-rodo/        ← RODO & privacy policy
│   ├── 08-user-data/           ← account management
│   ├── 09-security-refactoring/ ← OWASP audit, timing attack fix, HMAC-SHA256 tokens
│   ├── 10-logging/             ← production observability
│   ├── 11-swagger/             ← API documentation
│   ├── 12-ci/                  ← GitHub Actions CI
│   ├── 13-docker-registry/     ← Docker & GHCR
│   ├── architecture.md         ← package structure, REST endpoints, DB schema, FE components
│   └── as-built.md             ← plan vs reality, deviations, phase history
└── v2/                         
    └── vision.md               ← microservices + AI features (CV analysis, job matching)
```


## ✨ Features

- **Application registry** - company, position, salary (range, currency, gross/net, contract type), job source, link to posting
- **Kanban board** - visual overview of recruitment status: Sent → In progress → Completed, with drag & drop
- **Recruitment stages** - tracking current stage: HR interview, technical interview, manager interview, recruitment task, final interview, or custom stage
- **CV archive** - storing different CV versions (link or note — file upload temporarily disabled) and assigning them to specific applications
- **Notes** - saving interview questions, feedback, and personal thoughts for each application (categories: Questions / Feedback / Other)
- **Job posting archive** - copy of the job description in case the link expires
- **Duplicate detection** - warning when reapplying to the same company and position
- **Badge system** - achievements for rejections and ghosting (gamification)
- **Authentication** - Google OAuth2 login, JWT access token + refresh token
- **i18n** - Polish and English interface with a language switcher
- **Settings** - account management: change display name, delete account
- **Data export** - download all personal data as JSON (RODO Art. 20)
- **Service notices** - system announcements displayed on login (maintenance, updates)
- **API documentation** - Swagger UI with all endpoints, request/response schemas, and authorization


## 🐳 Running with Docker

```bash
cp .env.example .env        # fill in Postgres credentials + Google OAuth client ID/secret
docker compose up --build
```

Open `http://localhost:3000`. All required variables are documented in `.env.example`.

Production images (published to GHCR on every `master` build):
```
ghcr.io/jakubbone/easyapply-backend:latest
ghcr.io/jakubbone/easyapply-frontend:latest
```


## 🔒 Privacy & Data

- **Refresh tokens** stored as HMAC-SHA256 hashes - a stolen database cannot be used to hijack sessions
- **Logs** contain UUIDs only - no emails, names, or tokens in plaintext
- **Account deletion** permanently removes all data; inactive accounts purged after 12 months

Full design rationale: [`spec/v1/07-privacy-rodo/`](spec/v1/07-privacy-rodo/)

