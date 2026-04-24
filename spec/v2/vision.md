# EasyApply v2 – Event-Driven Architecture

> **Status:** Architectural vision document. This is a speculative design artifact,
> not an implementation plan. Detailed specifications (brief.md, implementation-plan.md)
> will be added when v2 work begins.

---

# 1. Problem

The v1 application is a monolith — all functionality (application tracking, CV management, notes) runs in a single process.

**Current problems:**
- When you add a new application, sending an email to the user blocks the main process
- Generating recruitment questions would be time-consuming and freeze the interface
- No ability to scale individual features independently
- Adding new functionality requires modifying the entire monolith

**New possibilities:**
- Email notifications can be sent asynchronously (user doesn't wait)
- Generating recruitment questions and company descriptions can happen in the background
- If AI Service goes down, the application still works (separate process)
- Easy to add new events and services that handle them

**Effect:** Application becomes more responsive, expansion is easier, system is more fault-tolerant.

---

# 2. User

Same as v1: Polish IT candidates applying to 10-20 jobs per month (juniors, mid-level).

New expectations:
- Wants **immediate confirmation** that application was added (without waiting for email)
- Wants to receive **emails about application status changes**
- Wants to receive **recruitment questions** and **brief company description** before the interview
- All of these should happen **automatically, without their intervention**

---

# 3. Why This Architecture?

**Event-driven instead of synchronous (request-response):**
- When a user adds an application, the monolith immediately returns "Added!" 
- At the same time, it sends an `application.added` event to Kafka
- Notification Service listens for this event and sends email in the background
- AI Service listens for this event and generates questions in the background
- User doesn't wait for anything beyond adding the application to the database

**Microservices instead of a single monolith:**
- Notification Service can be restarted/scaled independently
- AI Service can use Python + ML libraries instead of Java
- Each service has one clear responsibility (Single Responsibility Principle)

**Kafka as the message broker:**
- Services don't need to know about each other
- Events can be processed at any pace
- If Notification Service goes down, events wait in Kafka and process when the service restarts

**Practical benefits:**
- Fast responsiveness for the user
- Easy expansion (add a new service, listen for an event)
- Easier testing (test each service independently)
- Scaling: if emails are slow, you scale Notification Service without affecting the rest

---

# 4. Target System

Four components communicating through Kafka:

## 1. Monolith (Core Service)

**Current EasyApply application extended with event publishing.**

Responsibilities:
- User management and authentication (JWT)
- Application CRUD (add, edit, delete, view)
- Kanban board for status management
- Interview notes
- CV file management
- **NEW:** Publishing events to Kafka

Events it publishes (sends to Kafka):
- `application.added` — when user adds a new application
- `application.status.changed` — when user changes status
- `application.deleted` — when user deletes application
- `cv.uploaded` — when user uploads a CV

Events it consumes (listens for):
- *(at this stage, none)*

How it works (flow):
```
1. User in interface: "Add new application to Google"
2. Frontend sends POST /applications
3. Core Service:
   - Saves application to PostgreSQL database
   - Returns JSON response to user (fast!)
   - Publishes event `application.added` to Kafka
4. Kafka stores the event
5. Notification Service and AI Service listen for this event...
```

---

## 2. Notification Microservice (Notification Service)

**Sending emails to the user.**

Responsibilities:
- Listening for events from Kafka
- Sending emails to the user
- Email templates (HTML)

Events it consumes:
- `application.added` → Email: "You added a new application to [company]"
- `application.status.changed` → Email: "Application status changed to [new status]"
- `application.deleted` → Email: "You deleted application to [company]"

Example flow:
```
Kafka topic "application.added" contains event:
{
  "userId": 123,
  "applicationId": 456,
  "companyName": "Google",
  "position": "Software Engineer",
  "timestamp": "2026-04-23T10:30:00Z"
}

Notification Service:
1. Reads event from Kafka
2. Generates email content from template
3. Sends email to user (e.g. via SendGrid)
4. Logs the send
```

Meaning: User always knows what's changing in their applications, without opening the app.

---

## 3. AI Microservice (AI Service)

**Generating recruitment questions and company descriptions.**

Responsibilities:
- Listening for `application.added` events
- Generating recruitment questions based on position and job description
- Generating brief company descriptions
- Storing generated data in AI Service database (or returning to Core Service)

Events it consumes:
- `application.added` — user added application, now generate questions and description

Example flow:
```
Event `application.added`:
{
  "companyName": "Google",
  "position": "Senior Java Developer",
  "jobDescription": "We are looking for...",
  "applicationId": 456
}

AI Service:
1. Reads event from Kafka
2. Extracts keywords from job description (Java, Spring Boot, Kubernetes, etc.)
3. Generates questions:
   - "How would you design a system handling 1 million users?"
   - "Explain containerization and why Google uses it"
   - "What are the advantages and disadvantages of microservices architecture?"
   - etc. (10-15 questions)
4. Generates company description:
   - "Google — technology company based in Mountain View"
   - "Specializes in: search engines, cloud (GCP), AI"
   - "Culture: openness, innovation, high standards"
5. Stores in AI Service database
6. (Optional) publishes event `questions.generated` so Core Service knows they're ready
```

Can this be Python?
- **Yes!** AI Service can be written in Python (Flask/FastAPI) instead of Java
- Can use ML, NLP libraries (spaCy, transformers, etc.)
- Communicates with Kafka (using `confluent-kafka` library for Python)

Meaning: Before an interview, user sees questions they might get, knows about the company.

---

## 4. Analytics & Reports Service

**Weekly application statistics report.**

Responsibilities:
- Listening for events from Kafka (`application.added`, `application.status.changed`)
- Collecting statistics throughout the week
- Generating report every Monday at 9 AM
- Publishing event `report.generated` to Notification Service

Events it consumes:
- `application.added` — count new applications
- `application.status.changed` — track status changes (interviews, rejections)

How it works:
```
Throughout the week (Monday-Sunday):
- Count how many applications added
- Count how many applications change status to "INTERVIEW"
- Count how many applications change status to "REJECTED"
- Count how many applications wait without changes longer than 14 days (overdue)

Every Monday at 9:00 AM:
1. Analytics Service queries the database
2. Generates report:
   {
     "userId": 123,
     "reportPeriod": "2026-04-20 to 2026-04-26",
     "newApplications": 8,
     "interviewsScheduled": 2,
     "rejections": 3,
     "agedApplications": 5,
     "topCompanies": ["Google", "Amazon", "Spotify"],
     "timestamp": "2026-04-28T09:00:00Z"
   }
3. Publishes event `report.generated` to Kafka
4. Notification Service listens for this event and sends email to user
```

Example email report content:
```
📊 Your report from last week (April 20-26)

New applications: 8
Interviews scheduled: 2 🎉
Rejections: 3
Waiting for response longer than 2 weeks: 5

Top companies:
- Google (3 applications)
- Amazon (2)
- Spotify (2)

Overdue pending: Stripe application waiting since day 22 - maybe worth following up?
```

Events it publishes:
- `report.generated` — Notification Service sends email with report

Meaning: User receives a weekly summary of their progress, sees which applications went stale without response.

---

## 5. Kafka

**Event broker between the monolith and microservices.**

Kafka topics (communication channels):
- `application.added`
- `application.status.changed`
- `application.deleted`
- `cv.uploaded`
- `report.generated`

How it works:
1. Core Service publishes (sends) event to Kafka
2. Kafka stores event in logs (history can be replayed)
3. Notification Service reads event from Kafka (even if offline, reads when it restarts)
4. AI Service reads `application.added` events independently
5. Analytics Service reads `application.added` and `application.status.changed` events independently
6. No service waits for any other — everything is asynchronous

---

# 6. Edge Cases & Details

**If Notification Service goes down:**
- Events wait in Kafka
- When service restarts, it reads events and sends emails (may be delayed)
- User doesn't lose any notifications

**If AI Service is slow:**
- Core Service already returned response to user
- AI Service generates questions in background (may take 10-30 seconds)
- When questions are ready, they appear in app (page refresh)
- If AI Service is unavailable for days, questions won't generate — but app still works

**If Analytics Service goes down:**
- Events wait in Kafka (application.added, application.status.changed)
- When Analytics Service restarts, it reads events and adds them to statistics
- Report may be delayed (instead of Monday 9 AM, it'll be Monday 10 AM)
- User receives report, but delayed

**If Kafka goes down:**
- System cannot publish new events
- Can be resent when Kafka restarts (retry logic)

**Duplicates:**
- If the same event is processed 2x, email sends 2x
- Solution: add `idempotency key` to events (e.g. event ID), Notification Service checks if already sent

---

# 7. Implementation Phases

## Phase 1: Infrastructure & Kafka

| Aspect | Description |
|--------|------|
| **Goal** | Run Kafka locally, configure Docker Compose |
| **Why** | Foundation of system — without Kafka there's no communication between services |
| **Requirements** | Docker Compose contains: Kafka, PostgreSQL, Redis (optional) |
| **Success when** | `docker-compose up` runs Kafka without errors |

## Phase 2: Core Service — Event Publishing

| Aspect | Description |
|--------|------|
| **Goal** | Extend the monolith to send events to Kafka |
| **Why** | This is the source of events — everything starts here |
| **Requirements** | When user adds application, event `application.added` is sent to Kafka; interface still works normally |
| **Success when** | You add application, see in logs that event reached Kafka |

## Phase 3: Notification Service

| Aspect | Description |
|--------|------|
| **Goal** | Build service that listens for events and sends emails |
| **Why** | Solves problem: user will always know what's changing |
| **Requirements** | Listens for `application.added`, `application.status.changed`, sends email via SendGrid/Spring Mail |
| **Success when** | You add application in UI, receive confirmation email |

## Phase 4: AI Service

| Aspect | Description |
|--------|------|
| **Goal** | Build service that generates questions and company descriptions |
| **Why** | Provides user value: interview preparation |
| **Requirements** | Listens for `application.added`, generates 10-15 questions + description in 30 seconds |
| **Success when** | You add application, shortly after (page refresh) you see questions and company description |

## Phase 5: Analytics & Reports Service

| Aspect | Description |
|--------|------|
| **Goal** | Build service that generates weekly report |
| **Why** | User sees progress, knows which applications went stale |
| **Requirements** | Listens for events, every Monday at 9 AM generates report, publishes event `report.generated` |
| **Success when** | Monday morning you receive email with report (new applications, interviews, rejections, overdue) |

## Phase 6: Integration & Refinement

| Aspect | Description |
|--------|------|
| **Goal** | Connect all services, test end-to-end |
| **Why** | Confidence that system works as a whole |
| **Requirements** | `docker-compose up` runs all services, adding application -> email -> questions, report every Monday at 9 AM |
| **Success when** | Entire flow works without errors: user adds application, gets email, sees questions; every Monday gets report; no memory leaks, logs are clear |

---

# 8. Technology & Stack

## Monolith (Core Service)

- **Language:** Java 21
- **Framework:** Spring Boot 3.4
- **Database:** PostgreSQL
- **Kafka Client:** `spring-kafka`
- **Email:** Spring Mail (or SendGrid SDK)

## Notification Service

- **Language:** Java 21 (or Python 3.11)
- **Framework:** Spring Boot (or Flask/FastAPI if Python)
- **Database:** PostgreSQL (optional — can read from Core Service)
- **Kafka Client:** `spring-kafka` (or `confluent-kafka` if Python)
- **Email:** SendGrid SDK (or SMTP)

## AI Service

- **Language:** Python 3.11 (recommended) or Java
- **Framework:** Flask or FastAPI (Python), or Spring Boot (Java)
- **Database:** PostgreSQL (to store generated questions)
- **Kafka Client:** `confluent-kafka` (Python) or `spring-kafka` (Java)
- **NLP:** spaCy, transformers (optional for advanced text analysis)
- **LLM:** Claude API (anthropic-sdk), OpenAI API, or local Ollama

## Analytics & Reports Service

- **Language:** Java 21
- **Framework:** Spring Boot 3.4
- **Database:** PostgreSQL (reads data from Core Service)
- **Kafka Client:** `spring-kafka`
- **Scheduler:** Spring Scheduling (to schedule report for Monday 9 AM)
- **Aggregation:** Simple SQL queries for statistics counting

## Kafka & Infrastructure

- **Kafka:** Apache Kafka (Docker image)
- **Docker Compose:** All services + databases + Kafka
- **Redis:** Optional, for caching questions/descriptions

---

# 9. File Structure

```
easy-apply-v2/
├── docker-compose.yml               # Everything in one: Kafka, PostgreSQL, services
│
├── core-service/                    # Monolith (extended)
│   ├── src/main/java/com/easyapply/
│   │   ├── controller/
│   │   │   ├── ApplicationController.java
│   │   │   ├── AuthController.java
│   │   │   └── CVController.java
│   │   ├── service/
│   │   │   ├── ApplicationService.java
│   │   │   ├── CVService.java
│   │   │   └── EventPublisher.java          # NEW: sends events to Kafka
│   │   ├── repository/
│   │   │   ├── ApplicationRepository.java
│   │   │   ├── NoteRepository.java
│   │   │   └── CVRepository.java
│   │   ├── entity/
│   │   │   ├── Application.java
│   │   │   ├── Note.java
│   │   │   ├── CV.java
│   │   │   ├── User.java
│   │   │   └── ApplicationStatus.java       # Enum
│   │   ├── dto/
│   │   │   ├── ApplicationRequest.java
│   │   │   ├── ApplicationResponse.java
│   │   │   └── ApplicationEvent.java        # Event to Kafka
│   │   └── config/
│   │       ├── KafkaProducerConfig.java     # NEW: Kafka configuration
│   │       └── SecurityConfig.java
│   ├── pom.xml
│   └── Dockerfile
│
├── notification-service/             # New service
│   ├── src/main/java/com/easyapply/
│   │   ├── listener/
│   │   │   ├── ApplicationEventListener.java # Listens for events from Kafka
│   │   │   └── ReportGeneratedListener.java  # Listens for report event
│   │   ├── service/
│   │   │   ├── EmailService.java
│   │   │   └── MailTemplateService.java
│   │   ├── dto/
│   │   │   ├── ApplicationEvent.java        # Receives event
│   │   │   └── ReportGeneratedEvent.java    # Receives report event
│   │   ├── template/
│   │   │   ├── application-added.html
│   │   │   ├── status-changed.html
│   │   │   └── weekly-report.html           # Template for report
│   │   └── config/
│   │       ├── KafkaConsumerConfig.java     # Reading from Kafka
│   │       └── EmailConfig.java
│   ├── pom.xml
│   └── Dockerfile
│
├── ai-service/                       # New service (Python)
│   ├── app.py                        # Flask/FastAPI app
│   ├── kafka_listener.py             # Listening for Kafka
│   ├── ai_generator.py               # Generating questions and descriptions
│   ├── models.py                     # Database models
│   ├── requirements.txt              # Dependencies (confluent-kafka, spacy, etc.)
│   ├── templates/
│   │   ├── questions.html            # Templates (optional)
│   │   └── company_info.html
│   └── Dockerfile
│
├── analytics-service/                # New service: weekly reports
│   ├── src/main/java/com/easyapply/
│   │   ├── listener/
│   │   │   └── ApplicationEventListener.java # Listens for events (application.added, status.changed)
│   │   ├── service/
│   │   │   ├── StatisticsService.java       # Count statistics
│   │   │   ├── ReportGenerator.java         # Generate report
│   │   │   └── EventPublisher.java          # Publish report.generated event
│   │   ├── repository/
│   │   │   └── ApplicationRepository.java   # Reads from Core Service DB
│   │   ├── dto/
│   │   │   ├── ApplicationEvent.java        # Receives event
│   │   │   └── ReportGeneratedEvent.java    # Publishes report event
│   │   ├── scheduler/
│   │   │   └── WeeklyReportScheduler.java   # Every Monday 9 AM
│   │   └── config/
│   │       ├── KafkaConsumerConfig.java
│   │       ├── KafkaProducerConfig.java
│   │       └── SchedulerConfig.java
│   ├── pom.xml
│   └── Dockerfile
│
├── shared-libs/                      # Shared classes (optional)
│   ├── src/main/java/com/easyapply/
│   │   ├── event/
│   │   │   ├── ApplicationAddedEvent.java
│   │   │   ├── ApplicationStatusChangedEvent.java
│   │   │   ├── ApplicationDeletedEvent.java
│   │   │   └── ReportGeneratedEvent.java
│   │   └── config/
│   │       └── KafkaTopicsConfig.java
│   └── pom.xml
│
├── frontend/                         # React (no changes)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── Dockerfile
│
└── docs/
    ├── ARCHITECTURE.md               # System diagram
    ├── KAFKA_TOPICS.md               # Topics description
    └── SETUP.md                      # How to run
```

---

# 10. Kafka Topics & Events

## Topic Definitions

```
application.added             # New application was added
application.status.changed    # Application status changed
application.deleted           # Application was deleted
cv.uploaded                    # New CV file was uploaded
report.generated              # Weekly report was generated
```

## Example Events

### Event: `application.added`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "APPLICATION_ADDED",
  "userId": 123,
  "applicationId": 456,
  "companyName": "Google",
  "position": "Senior Java Developer",
  "source": "LinkedIn",
  "jobDescription": "We are looking for a skilled Java developer...",
  "salary": "150000",
  "currency": "USD",
  "timestamp": "2026-04-23T10:30:00Z"
}
```

### Event: `application.status.changed`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440001",
  "eventType": "APPLICATION_STATUS_CHANGED",
  "userId": 123,
  "applicationId": 456,
  "previousStatus": "SENT",
  "newStatus": "INTERVIEW",
  "timestamp": "2026-04-23T14:15:00Z"
}
```

### Event: `application.deleted`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440002",
  "eventType": "APPLICATION_DELETED",
  "userId": 123,
  "applicationId": 456,
  "companyName": "Google",
  "timestamp": "2026-04-23T16:45:00Z"
}
```

### Event: `report.generated`

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440003",
  "eventType": "REPORT_GENERATED",
  "userId": 123,
  "reportPeriod": "2026-04-20 to 2026-04-26",
  "newApplications": 8,
  "interviewsScheduled": 2,
  "rejections": 3,
  "agedApplications": 5,
  "topCompanies": ["Google", "Amazon", "Spotify"],
  "timestamp": "2026-04-28T09:00:00Z"
}
```

---

# 11. Non-Functional Requirements

## Performance

- **Core Service:** Add application < 500ms
- **Notification Service:** Send email < 5 seconds (can be asynchronous)
- **AI Service:** Generate questions < 30 seconds
- **Analytics Service:** Generate report < 10 seconds (every Monday 9 AM)
- **Kafka:** Publish event < 100ms

## Scalability

- Kafka: min. 3 partitions per topic (for consumer scaling)
- Notification Service: can be scaled independently (e.g. 2-3 instances)
- AI Service: can be scaled independently
- Core Service: scaling via load balancer

## Reliability

- **Kafka:** at-least-once delivery (events may be processed multiple times)
- **Retry logic:** Notification Service retries email send on failure
- **Dead Letter Queue:** Events that cannot be processed go to DLQ for debugging
- **Health checks:** Each service has `/health` endpoint

## Security

- **Authentication:** JWT tokens (in Core Service)
- **Kafka:** ACL (access control lists) — Notification Service can only read from its topics
- **Environment variables:** SendGrid API key, DB password, etc.
- **Logging:** Don't log sensitive data (passwords, tokens)

---

# 12. Success Criteria

v2 architecture is successful when:

- ✅ Docker Compose starts without errors (all services online)
- ✅ Core Service publishes events to Kafka when user adds/changes application
- ✅ Notification Service reads events and sends emails
- ✅ AI Service reads events and generates questions in < 30 seconds
- ✅ Analytics Service aggregates events throughout the week
- ✅ Every Monday at 9 AM Analytics Service generates report and publishes event
- ✅ Notification Service sends report via email to user
- ✅ End-to-end: User adds application → gets email → sees questions and company description → gets report every week
- ✅ Code is readable, each service has clear responsibility
- ✅ Unit tests for each service
- ✅ Documentation: how to run, how to add new service
- ✅ No memory leaks, proper resource cleanup

---

# 13. Educational Goals

Developer learns:

- **Event-driven architecture** — how to design event-based systems
- **Apache Kafka** — publishing, consuming, partitioning
- **Microservices** — one service = one task
- **Asynchronous communication** — services don't wait for each other
- **Service integration** — different technologies (Java + Python) working together
- **Docker & Docker Compose** — containerization and orchestration
- **System design** — how to think about scalability, reliability, separation of concerns

---

# 14. Future Extensions (Out of Scope for v2)

- Email Analyzer: monitor emails from companies, auto-update statuses
- Weekly Reports: statistics and weekly reports
- Web Scraping: research companies, tech stacks, news
- Mobile App: Android/iOS application
- Payment System: premium features (advanced analytics, etc.)
