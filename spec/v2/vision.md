# Applikon v2 — AI-Assisted Recruitment Companion

> **Status:** Architectural vision document, agreed 2026-06-12.
> Supersedes the previous v2 vision (4 microservices: core + notification + AI + analytics).
> This is the basis for detailed specs (brief.md, implementation plans) when v2 work begins.

---

# 1. Problem

v1 is a working, deployed monolith: application tracking, Kanban, notes, CVs, auth,
RODO compliance, CI. It records what the user does — but it does not help them
*get through* the recruitment process.

**v2 has two goals, in this order:**

1. **Real user value:** support the candidate at every moment of the actual
   recruitment journey — not with features that look good in a demo, but with
   features that answer "when does the user actually need this?"
2. **Architecture as a portfolio story:** demonstrate modern backend skills
   (modular architecture, event-driven design, Kafka, a second JVM framework,
   LLM integration) **without overengineering**. The story is the *evolution*:
   monolith → modular monolith → one deliberately extracted worker. Every
   architectural element must be justified by a concrete feature.

**Guiding principles (decided up front):**

- A feature appears at the moment the user needs it — nothing generated "in advance".
- AI costs must be **zero** (free API tiers only).
- Not every feature needs AI. The most useful view in v2 (the screening cheat
  sheet) uses none.
- Reality of the Polish job-board market is binding: candidates apply through
  job boards (no contact e-mail → no follow-ups), and most companies never
  respond (response-based statistics carry no signal).

---

# 2. User

Same as v1: Polish IT candidates (junior/mid) applying to 10–20 jobs per month,
almost exclusively **through job boards** (pracuj.pl, justjoin.it, nofluffjobs).

What their process actually looks like:

1. They apply through a job board. They state their salary expectation in the
   board's form (their own proposal — not data from the ad).
2. **An HR recruiter may call unexpectedly** for a short screening — "what do
   you know about our company?", "what are your expectations?", "notice period?".
3. Or HR writes to schedule a short call — same content, minus the surprise.
4. If screening passes, a **technical interview** follows.
5. After the interview they note down the questions they were asked.
6. Most applications end in silence. Boards fill up with dead cards.

v2 maps one feature to each of these moments.

---

# 3. Features

## 3.1 Company brief (automatic, AI)

**Moment:** right after adding an application — because the HR call can come
at any time.

- Triggered by the `ApplicationAdded` event; generated asynchronously in the
  background.
- Content: what the company does, product, scale, known tech, ending with a
  ready 3–4 sentence answer to *"what do you know about our company?"* and a
  short *"why this company may interest you"* hook.
- Generated in the user's language (PL/EN — i18n exists in v1).
- **Grounded via web search** (Google Search grounding built into the Gemini
  API). Without grounding the model hallucinates facts about small local
  companies; with it the brief is based on real search results.
- Frontend shows status `pending → processing → completed / failed`, with a
  "regenerate" action on failure.

## 3.2 Technical interview prep pack (on demand, AI)

**Moment:** the user reached the technical stage. Never generated automatically —
most applications never get this far, and pre-generating would burn LLM quota
on content nobody reads.

- Triggered by a button in application details; the UI also suggests it when a
  card moves to `IN_PROGRESS`.
- Input: the job ad text already archived in v1 (`jobDescription`) + position.
- Output, three sections:
  - **Technical questions** derived from the ad's requirements,
  - **Questions worth asking the recruiter**,
  - **"What to brush up"** — topics to refresh before the interview.
- Explicitly **no generic HR/soft questions** — those belong to the screening
  cheat sheet (3.3), where the answers are the user's own.

## 3.3 Screening cheat sheet (no AI)

**Moment:** the unexpected HR call (or the scheduled HR screening — same content,
different element of surprise).

Two parts:

**a) "My answers" — global, per user, written by the user.**
A page with a template of standard screening questions, each with a text field:
tell me about yourself · why are you changing jobs · salary expectations ·
notice period / availability · remote/hybrid preference · English level.
The app's value here is the **template itself** — juniors often don't know what
screening questions to expect. AI generates nothing: experience and motivation
are the user's own.

**b) "Cheat sheet" view — per application, pure composition.**
One screen in application details that assembles three things that already exist:

1. the **company brief** (3.1),
2. the **salary the user proposed in THIS application** (stored since v1 —
   three weeks after applying nobody remembers what they typed into the form),
3. the **global "My answers"** (with an edit link).

Scenario: recruiter calls out of nowhere → open the application → everything is
on one screen. The phone call stops being an ambush.

## 3.4 Board cleanup

**Moment:** silence. An application sitting in `SENT` for more than ~30 days is
almost certainly dead.

- The UI suggests archiving such applications as `REJECTED` /
  `NO_RESPONSE` (enum exists since v1) with one click.
- Keeps the Kanban honest and the board clean.

## 3.5 Question bank (user data + AI on demand)

**Moment:** after interviews. v1 already collects notes with the `QUESTIONS`
category — questions that were *actually asked*.

- Aggregated view of all `QUESTIONS` notes across all applications.
- Per question, an on-demand "prepare me" action: AI generates a short
  explanation / study material.

## 3.6 Weekly report (no AI)

**Moment:** Monday morning, planning the week.

- Scheduled e-mail: applications sent last week + applications stuck too long
  (feeding the cleanup suggestion, 3.4).
- Deliberately thin: **no** response-rate statistics (companies rarely respond —
  no signal), **no** upcoming-interview section, **no** AI content.
- This is the only recurring e-mail in the system.

## 3.7 MCP server (optional, stage 4)

An MCP server exposing the user's Applikon data (applications, statuses, notes)
so it can be queried from an AI assistant: *"which companies did I apply to in
May and which went silent?"*. No value for the casual user — high value as a
portfolio demonstration of agent/tool integration.

## Considered and rejected

Kept on record deliberately — each rejection is an architecture/product
decision worth defending in an interview.

| Idea | Why rejected |
|------|--------------|
| 4 separate microservices (previous v2 vision) | Overengineering for this scale; analytics = a cron + SQL query, not a deployment |
| AI service in Python | The portfolio sells Java skills; AI integration stays in the JVM |
| Parse the job ad → autofill the form | Parsing is inaccurate; form fields are dropdowns; salary is the user's proposal, not ad data |
| Skill profile + per-ad matching | Rejected as a feature; not the user's need |
| Tech radar (aggregated stack stats) | Without ad parsing it has no data source; felt like artificial filler |
| Follow-up reminders + AI-drafted follow-ups | Job-board reality: there is nobody to write to; you wait |
| Response-based statistics / insights | Companies rarely respond — too little signal to compute anything honest |
| Interview-date field + day-before reminder e-mail | The user knows about their interview and prepares anyway; calendars exist |
| Soft/HR questions in the prep pack | Screening answers must be the user's own (3.3a), not generated |
| E-mail on every status change | The user changed the status themselves; mail carries no new information |
| Generated content in reminder/report e-mails | Mail is a nudge; content lives in the app |

---

# 4. Architecture — Evolution in Stages

```
Stage 1                Stage 2                  Stage 3
Spring Modulith   →    + Spring AI (in-proc) →  + Kafka + Quarkus AI worker

Frontend ──► Spring Modulith backend
             (applications, users, notifications, reports, ai*)
                │  in-process events, publication registry in Postgres (outbox)
                │  @Externalized ──► Kafka ◄──┐
                ▼                             │
             PostgreSQL              AI Worker (Quarkus + langchain4j)
                                     * `ai` module extracted in stage 3
```

Two kinds of events, two scopes: **Spring Modulith events inside the process**,
**Kafka only across the process boundary**. Final state: **two deployables**,
not four.

## Stage 1 — Spring Modulith (boundaries without cutting)

Restructure the v1 backend into modules: `applications`, `users`,
`notifications`, `reports`, `ai` (empty shell at first).

- Inter-module communication via **Spring Modulith application events** with
  the event publication registry persisted to PostgreSQL — the transactional
  outbox pattern, for free.
- `ApplicationModules.verify()` test guards module boundaries.
- Weekly report = `reports` module + `@Scheduled` + a SQL query. **Not** a
  separate service.
- Board cleanup (3.4) and screening cheat sheet (3.3) land here — they need no
  AI and no new infrastructure.

**Done when:** modules verified, events flow through the registry, report mail
arrives on Monday, cheat sheet and cleanup work end-to-end.

## Stage 2 — AI inside the modulith (Spring AI)

The `ai` module implements the company brief (3.1), prep pack (3.2) and
question-bank study material (3.5) **in-process**, triggered by modulith events
(brief) or service calls (on-demand features).

- **Spring AI** as the provider abstraction (`ChatModel`): swapping the LLM
  provider is configuration, not code.
- Structured output: model responses mapped directly onto Java records.
- Async processing + `pending/processing/completed/failed` status visible in
  the frontend.
- Failure isolation: if the LLM provider is down, everything except AI content
  keeps working.

**Done when:** adding an application produces a grounded brief in the
background; prep pack and study material generate on demand; provider can be
switched between Gemini and Ollama via config.

## Stage 3 — Kafka + extracting ONE worker (Quarkus)

Extract the `ai` module into a standalone **AI Worker: Quarkus +
quarkus-langchain4j**, communicating over Kafka.

- Modulith events become Kafka messages via `@Externalized` — the stage-1
  outbox naturally becomes the Kafka producer.
- **Why the AI module and only it:** different profile — slow (seconds, not
  milliseconds), dependent on an external API, can crash or lag without
  affecting the core app, scales independently.
- **Why notifications stays inside:** extracting it adds a deployment without
  changing any quality attribute. Knowing how to extract a second service and
  deliberately not doing it *is* the anti-overengineering argument.

**Done when:** brief and prep pack flow through Kafka to the worker and back;
killing the worker does not affect the core app; events replay after the worker
restarts.

## Stage 4 (optional) — MCP server

Expose Applikon data through an MCP server (Spring AI has MCP server support),
demonstrating agent/tool integration on top of the existing modules.

---

# 5. Events

## In-process (Spring Modulith, stages 1–2)

| Event | Published by | Consumed by |
|-------|-------------|-------------|
| `ApplicationAdded` | `applications` | `ai` (brief), `reports` |
| `ApplicationStatusChanged` | `applications` | `reports` |
| `WeeklyReportGenerated` | `reports` | `notifications` (sends mail) |

## Externalized to Kafka (stage 3)

A single request/result pair with a task-type discriminator — one pattern
covers all AI features:

| Topic | Message | Notes |
|-------|---------|-------|
| `ai.tasks.requested` | `AiTaskRequested { taskId, type: BRIEF \| PREP_PACK \| STUDY_MATERIAL, payload }` | `BRIEF` externalized from `ApplicationAdded`; others published on user demand |
| `ai.tasks.completed` | `AiTaskCompleted { taskId, result }` / `AiTaskFailed { taskId, error }` | Core service updates task status; frontend polls/refreshes |

- At-least-once delivery; consumers idempotent by `taskId`.
- Failed tasks land in a dead-letter topic for inspection.

---

# 6. AI Rules

| Rule | Decision |
|------|----------|
| Cost | **Zero.** Free API tiers only. The user volume (single-digit users, dozens of calls/day) fits comfortably. |
| Production model | **Gemini 2.5 Flash** via the Gemini API (free-tier API key from Google AI Studio). The free tier is the same model with daily rate limits, not a weaker one. |
| Grounding | Google Search grounding built into the Gemini API for the company brief (verify current free-tier daily limits before implementation). |
| Dev model | **Ollama** locally — for testing the plumbing (events, statuses, retries), not content quality. |
| Fallback provider | Groq (free tier, open models). Provider swap = config change thanks to the Spring AI / langchain4j abstraction. |
| Privacy | Only job-ad content (public data) is ever sent to the LLM. **Never user personal data.** Consistent with the v1 RODO posture. |
| Trigger policy | Brief: automatic. Everything else: on demand. Nothing generated "in advance". |

---

# 7. Non-Functional Requirements

- **Graceful degradation:** AI worker or LLM provider down → core app fully
  functional; AI sections show `failed` with a retry action.
- **Idempotency:** AI task processing keyed by `taskId`; duplicate Kafka
  delivery must not produce duplicate content or duplicate mails.
- **Responsiveness:** adding an application returns immediately; all AI work is
  background work.
- **Observability:** task statuses queryable; worker logs correlated by
  `taskId`; Kafka UI in docker-compose for inspection.
- **Cost guard:** daily LLM call counter; refuse new AI tasks gracefully when
  the free-tier limit is near (the UI explains, the tracker keeps working).

---

# 8. Deployment Shape

```
docker-compose:
  backend          # Spring Modulith (stages 1–2: the only app container)
  ai-worker        # Quarkus (from stage 3)
  postgres
  kafka            # from stage 3
  kafka-ui         # from stage 3, inspection only
  frontend
```

Two application deployables in the final state. The previous vision's
`notification-service` and `analytics-service` are modules, not containers.

---

# 9. Working Method

- **ADRs** (`spec/v2/adr/`): one short record per decision — "modulith before
  microservices", "why notifications was not extracted", "why Gemini free
  tier", "why no follow-ups". Continues the "discussed and intentionally
  skipped" culture from `as-built.md`. Each ADR doubles as an interview answer.
- **Each stage is shippable** and ends with: working deploy, updated as-built
  notes, and a LinkedIn post about the evolution step.
- Conventional commits, scopes as in v1 (`backend`, `frontend`, `spec`, `db`,
  `infra`).

---

# 10. Success Criteria

v2 is successful when:

- ✅ The backend is a verified Spring Modulith (`ApplicationModules.verify()`
  passes; module boundaries enforced by tests).
- ✅ Adding an application immediately returns and a grounded company brief
  appears in the background with visible task status.
- ✅ Prep pack and question-bank study material generate on demand only.
- ✅ The screening cheat sheet composes brief + proposed salary + "My answers"
  on one screen, with zero AI calls.
- ✅ Stale applications (>30 days in SENT) get a one-click archive suggestion.
- ✅ The weekly report mail arrives on schedule and contains only sent + stale
  counts.
- ✅ From stage 3: AI tasks flow through Kafka to the Quarkus worker; killing
  the worker degrades only AI features; events replay on restart.
- ✅ Total LLM cost: 0 PLN; only public job-ad content leaves the system.
- ✅ Every non-obvious decision has an ADR.

---

# 11. Educational Goals (the CV story)

- **Spring Modulith** — module boundaries, in-process domain events,
  publication registry as a transactional outbox.
- **Event-driven design at two scopes** — modulith events in-process, Kafka
  across the process boundary, and the judgment of where each belongs.
- **Apache Kafka** — producing via `@Externalized`, consuming, idempotency,
  dead-letter handling.
- **Quarkus + langchain4j** — a second JVM framework in a justified role:
  a small async worker.
- **LLM integration in Java** — Spring AI, structured output, grounding via
  tool/search, provider abstraction, cost control, graceful degradation.
- **Restraint as a skill** — the rejected-ideas table and the deliberately
  non-extracted notifications module.

One-sentence pitch: *"Applikon doesn't just track applications — it prepares
you for the calls and interviews, at zero AI cost; architecturally it evolved
from a monolith into a modulith with one deliberately extracted, event-driven
AI worker."*

---

# 12. Future Extensions (Out of Scope for v2)

- Rejection-pattern analysis (needs more data than a single user accumulates).
- E-mail inbox integration (auto-detecting company responses).
- Mobile app.
- v3: revisit extraction of further modules **only** when a concrete quality
  attribute demands it.
