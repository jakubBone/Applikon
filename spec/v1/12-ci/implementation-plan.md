# CI Implementation Plan — EasyApply

## Work Process

1. **Implementation** — Claude creates `.github/workflows/ci.yml` and updates `README.md`
2. **Verification** — user pushes to `main`, opens GitHub → Actions tab, confirms green
3. **Commit suggestion** — Claude proposes commit message
4. **Commit** — user runs `git add` + `git commit`

---

## Goal

Two parallel CI jobs (backend + frontend) triggered on every push and PR to `main`.
A green badge in `README.md` visible to anyone browsing the repository.

---

## Design Decisions

- **Parallel jobs** — backend and frontend have no dependency on each other;
  running them in parallel keeps total CI time minimal.
- **`./mvnw test` only** — no `package` or Docker build; tests are the signal,
  not the artifact.
- **`npm ci`** — reproducible install from `package-lock.json`, faster than `npm install`.
- **`npm run test:run`** — single-pass Vitest (not watch mode).
- **`npm run build`** — catches TypeScript errors that tests might miss.
- **No caching of Maven/Node dependencies** — adds complexity; acceptable for
  a portfolio project where CI speed is not critical.

---

## Implementation

### File: `.github/workflows/ci.yml` *(new)*

```yaml
name: CI

on:
  push:
    branches: [master]

jobs:
  backend:
    name: Backend — Maven tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Java 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: temurin

      - name: Run tests
        working-directory: easyapply-backend
        run: ./mvnw test

  frontend:
    name: Frontend — Vitest + build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        working-directory: easyapply-frontend
        run: npm ci

      - name: Run unit tests
        working-directory: easyapply-frontend
        run: npm run test:run

      - name: Build
        working-directory: easyapply-frontend
        run: npm run build
```

---

### File: `README.md` — badge

Add below the project title (first line after `# EasyApply` or equivalent):

```markdown
[![CI](https://github.com/jakubBone/EasyApply/actions/workflows/ci.yml/badge.svg)](https://github.com/jakubBone/EasyApply/actions/workflows/ci.yml)
```

> Replace `jakubBone/EasyApply` with the actual GitHub org/repo slug if different.

---

## Verification

- [ ] Push commit to `main`
- [ ] GitHub → Actions tab → workflow run appears
- [ ] Both jobs green (backend + frontend)
- [ ] Badge in README shows green on github.com

---

## Definition of Done (DoD)

- [ ] `.github/workflows/ci.yml` exists and triggers on push to `main`
- [ ] Backend job: `./mvnw test` passes on GitHub runner
- [ ] Frontend job: `npm run test:run && npm run build` pass on GitHub runner
- [ ] CI badge visible and green in `README.md`
- [ ] `spec/README.md` updated with phase 12 row

---

## Files to Change

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | New — CI pipeline |
| `README.md` | Add CI badge below title |

---

*Created: 2026-05-06*
