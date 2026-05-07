# Docker Registry Implementation Plan — EasyApply

## Work Process

1. **Secret** — user adds `VITE_API_URL` in GitHub repo Settings → Secrets → Actions
2. **Implementation** — Claude extends `.github/workflows/ci.yml` and updates `docker-compose.yml`
3. **Verification** — user pushes to `master`, checks GitHub → Actions and GitHub → Packages
4. **Server deploy** — user SSHes to Hetzner, runs `docker-compose pull && docker-compose up -d`
5. **Commit suggestion** — Claude proposes commit message
6. **Commit** — user runs `git add` + `git commit`

---

## Goal

After every successful CI run on `master`, two Docker images are pushed to GHCR:
- `ghcr.io/jakubbone/easyapply-backend`
- `ghcr.io/jakubbone/easyapply-frontend`

Each push produces two tags: `:latest` (moving) and `:<short-sha>` (immutable).
The server pulls `:latest` and runs the application without building anything locally.

---

## Design Decisions

- **`docker` job depends on `backend` and `frontend`** — images are only pushed when all tests pass; a broken build never reaches the registry.
- **Only runs on `push` to `master`, not PRs** — PRs trigger tests only; no images are pushed for unmerged branches.
- **`GITHUB_TOKEN` for GHCR auth** — Actions has built-in write access to GHCR via `secrets.GITHUB_TOKEN`; no manual PAT needed in CI.
- **Both `image:` and `build:` in docker-compose.yml** — `image:` tells Docker which registry name to use; `build:` stays for local development (`docker-compose up --build`). On the server `docker-compose pull` uses `image:`, `build:` is ignored.
- **`VITE_API_URL` as GitHub Secret** — the production API URL is baked into the frontend JS bundle at CI build time; it must not be hardcoded in the repository.
- **Short SHA tag** — `github.sha` is 40 chars; `${GITHUB_SHA::7}` gives a readable 7-char short hash matching `git log --oneline` output.
- **Packages visibility** — GHCR packages inherit repository visibility. If the repo is public, packages are public; no server-side `docker login` is required to pull.

---

## Implementation

### Step 1 — GitHub Secret

In GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://api.yourdomain.com/api` (production URL) |

---

### Step 2 — File: `.github/workflows/ci.yml` *(extend)*

Add the `docker` job below the existing `frontend` job:

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

  docker:
    name: Docker — build and push to GHCR
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    if: github.event_name == 'push'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./easyapply-backend
          push: true
          tags: |
            ghcr.io/${{ github.repository_owner }}/easyapply-backend:latest
            ghcr.io/${{ github.repository_owner }}/easyapply-backend:${{ github.sha }}

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./easyapply-frontend
          push: true
          build-args: |
            VITE_API_URL=${{ secrets.VITE_API_URL }}
            VITE_USE_BACKEND=true
          tags: |
            ghcr.io/${{ github.repository_owner }}/easyapply-frontend:latest
            ghcr.io/${{ github.repository_owner }}/easyapply-frontend:${{ github.sha }}
```

---

### Step 3 — File: `docker-compose.yml` *(update backend and frontend services)*

Add `image:` field to `backend` and `frontend` — keep all existing `build:` sections intact:

```yaml
  backend:
    image: ghcr.io/jakubbone/easyapply-backend:latest
    build:
      context: ./easyapply-backend
      dockerfile: Dockerfile
    # ... rest unchanged

  frontend:
    image: ghcr.io/jakubbone/easyapply-frontend:latest
    build:
      context: ./easyapply-frontend
      dockerfile: Dockerfile
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_USE_BACKEND: ${VITE_USE_BACKEND:-true}
    # ... rest unchanged
```

---

### Step 4 — Server deploy commands

```bash
# SSH onto Hetzner, then:
docker-compose pull          # pulls :latest from GHCR
docker-compose up -d         # restarts containers with new images
docker image prune -f        # removes old dangling images (optional cleanup)
```

---

## Verification

- [ ] Push to `master` — all three jobs appear in GitHub → Actions (`backend`, `frontend`, `docker`)
- [ ] `docker` job is green
- [ ] GitHub → Packages shows `easyapply-backend` and `easyapply-frontend`
- [ ] Each package has tags `:latest` and `:<sha>`
- [ ] `docker-compose pull` on server completes without auth error
- [ ] `docker-compose up -d` starts all three containers (db, backend, frontend)
- [ ] Application responds on the server

---

## Definition of Done

- [ ] `docker` CI job builds and pushes after every successful `backend` + `frontend` run
- [ ] Both images present in GHCR with `:latest` and `:<sha>` tags
- [ ] `docker-compose.yml` has `image:` fields pointing to GHCR
- [ ] Server runs application from pulled GHCR images (not a local build)
- [ ] `spec/README.md` updated with phase 13 row

---

## Files to Change

| File | Change |
|------|--------|
| `.github/workflows/ci.yml` | Add `docker` job (build + push to GHCR) |
| `docker-compose.yml` | Add `image:` to `backend` and `frontend` services |
| GitHub repo Settings | Add `VITE_API_URL` secret |

---

*Created: 2026-05-07*
