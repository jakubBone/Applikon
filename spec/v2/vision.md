> **Status:** Architecture vision document. This is a speculative design artifact,
> not an implementation plan. Development spec (brief.md, implementation-plan.md)
> will be added when v2 work begins.

---

📘 SPECYFIKACJA PROJEKTU: EasyApply Microservices Architecture

🎯 CEL PROJEKTU
Wizja biznesowa:
Rozbudowa istniejącej aplikacji EasyApply (job application tracker dla juniorów IT) o zaawansowane funkcje oparte na architekturze mikroerwisów i event-driven communication z wykorzystaniem Apache Kafka. Celem jest stworzenie inteligentnego asystenta, który nie tylko śledzi aplikacje o pracę, ale aktywnie wspiera użytkownika w całym procesie rekrutacyjnym.
Obecny stan aplikacji:

Monolityczna aplikacja Spring Boot
Podstawowe funkcjonalności: tracking aplikacji o pracę, Kanban board do zarządzania statusami, notatki z rozmów rekrutacyjnych
Tech stack: Java, Spring Boot, PostgreSQL
Frontend: (do określenia - React/Angular/Vue)

Docelowy stan:
System składający się z 6 mikroserwisów komunikujących się asynchronicznie przez Apache Kafka, oferujący AI-powered features oraz automatyzację procesów rekrutacyjnych.

🏗️ ARCHITEKTURA DOCELOWA
Komponenty systemu:
Warstwa komunikacji:

API Gateway jako single entry point
Apache Kafka jako message broker dla event-driven communication
Redis dla cachowania danych

Mikroserwisy:

Core Service - główna logika biznesowa (rozbudowany monolit)
Resume Analyzer Service - analiza CV i scoring ATS
Company Intel Service - research firm i generowanie pytań rekrutacyjnych
Email Analyzer Service - klasyfikacja emaili i auto-update statusów
Analytics & Reports Service - statystyki, wzorce, raporty
Notification Service - powiadomienia email/SMS/push

Bazy danych:

PostgreSQL jako główna baza dla każdego serwisu
Redis dla cache'owania (Company Intel)


📦 SZCZEGÓŁOWA SPECYFIKACJA FUNKCJONALNOŚCI

1. CORE SERVICE - Główna logika biznesowa
Odpowiedzialności:

Zarządzanie użytkownikami, autentykacja i autoryzacja (JWT)
CRUD operacje dla aplikacji o pracę (tworzenie, edycja, usuwanie, wyświetlanie)
Kanban board - zarządzanie statusami aplikacji (Applied, Interview, Offer, Rejected, etc.)
System notatek - zapisywanie notatek z rozmów rekrutacyjnych
Przechowywanie job postings (ofert pracy)
Zarządzanie CV użytkowników (upload, storage)

Nowa funkcjonalność do dodania:

Możliwość przechowywania URL firmy przy aplikacji
Zapisywanie pełnego opisu stanowiska (job description)
Widełki salary (min-max)
Powiązanie aplikacji z uploadowanym CV
Publishing eventów do Kafki gdy coś się zmienia

Eventy Kafka:

Publikuje: application.created, application.status.changed, resume.uploaded
Konsumuje: resume.analyzed, company.research.completed

Podstawowy flow:

User tworzy nową aplikację o pracę → event do Kafki
User zmienia status aplikacji → event do Kafki
User uploaduje CV → event do Kafki
Otrzymuje wyniki analiz z innych serwisów → aktualizuje DB


2. RESUME ANALYZER SERVICE - Analiza CV
Odpowiedzialności:

Parsowanie plików CV (PDF i DOCX)
Ekstrakcja tekstu z dokumentów
Analiza ATS (Applicant Tracking System) compatibility
Porównanie CV z opisem stanowiska (job description)
Identyfikacja dopasowanych keywords
Identyfikacja brakujących keywords
Generowanie konkretnych, actionable suggestions dla użytkownika
Scoring - obliczanie procentowego dopasowania CV do oferty

Algorytm działania:

Odbiera event o uploadowanym CV
Parsuje plik PDF/DOCX i ekstraktuje tekst
Ekstraktuje keywords z job description
Ekstraktuje keywords z CV
Porównuje oba zestawy keywords:

Matched keywords (wspólne)
Missing keywords (brakujące w CV)


Oblicza ATS score: (matched / total required) × 100
Generuje konkretne sugestie:

"Add 'Kubernetes' to skills - appears 5x in job posting"
"Include 'Docker' experience - required skill"
"Reformat 'Experience' section for better ATS parsing"


Zwraca before/after comparison: "8/20 requirements matched → 15/20 after improvements"

Eventy Kafka:

Konsumuje: resume.uploaded
Publikuje: resume.analyzed (z wynikami analizy)

Wartość dla użytkownika:

Konkretny, mierzalny feedback (score 78%)
Specific actionable suggestions zamiast ogólników
Zwiększenie szans na przejście przez ATS (75% CV jest odrzucanych automatycznie)


3. COMPANY INTEL SERVICE - Research firm
Odpowiedzialności:

Web scraping oficjalnych stron firm
Agregacja informacji o firmie z publicznych źródeł
Ekstrakcja tech stacku firmy
Zbieranie recent news/blog posts
Generowanie pytań rekrutacyjnych specyficznych dla firmy i roli
Caching wyników (żeby nie scrape'ować za każdym razem)

Źródła danych:

Company website:

/about - opis firmy, misja, wartości
/blog lub /news - ostatnie newsy
/careers - kultura firmy, benefity
/tech-blog lub /engineering - tech stack


LinkedIn (ostrożnie, rate limits!):

Company size
Industry
Growth trends


External APIs (opcjonalnie):

Clearbit API - company data
Crunchbase - startup info



Generowanie Interview Questions:
Approach 1 - Static Database:

Baza pytań pogrupowanych po rolach (Java Developer, Frontend Engineer, etc.)
Baza pytań pogrupowanych po technologiach (Spring Boot, React, AWS, etc.)
Dla każdej roli: common questions (OOP principles, design patterns, etc.)
Dla każdej technologii: specific questions

Approach 2 - AI Generation (opcjonalnie):

Wykorzystanie Claude/GPT API do generowania pytań
Based on: job description + company tech stack + role level
Prompt: "Generate 10 likely interview questions for Junior Java Developer at Google, using Spring Boot and Kubernetes"

Caching strategy:

Cache company intel na 7 dni w Redis
Jeśli data w cache → zwróć z cache
Jeśli brak lub expired → scrape i zapisz do cache

Eventy Kafka:

Konsumuje: application.created, interview.scheduled
Publikuje: company.research.completed

Wartość dla użytkownika:

Oszczędność czasu (nie musi browsować 10 stron)
Structured, organized information
Specific interview questions zamiast generic prep
Informacje o tech stacku → może się przygotować


4. EMAIL ANALYZER SERVICE - Klasyfikacja emaili
Odpowiedzialności:

Integracja z Gmail/Outlook API
Monitoring skrzynki email użytkownika
Automatyczna klasyfikacja emaili od firm
Ekstrakcja structured data (dates, times, locations)
Detekcja urgency i action items
Auto-update statusów aplikacji

Email Classification (typy):

REJECTION - email odrzucający kandydaturę
INTERVIEW_INVITE - zaproszenie na rozmowę
WAITING - "we're reviewing", "will get back to you"
REQUEST_FOR_INFO - prośba o dodatkowe informacje
OTHER - wszystko inne

Algorytm klasyfikacji:
Approach 1 - Rule-based (prosty, ale skuteczny ~80%):

Rejection keywords: "unfortunately", "not moving forward", "we have decided", "other candidates"
Interview keywords: "interview", "schedule a call", "next steps", "would like to speak"
Waiting keywords: "reviewing", "will get back", "under consideration"
Urgency detection: "by tomorrow", "ASAP", "as soon as possible"

Approach 2 - ML-based (advanced, opcjonalnie):

Train classifier na labeled dataset
Use sentiment analysis
Better accuracy, ale więcej work

Entity Extraction:

Dates: "February 15", "next Tuesday", "2/15/2026"
Times: "2:00 PM", "14:00", "afternoon"
Locations: "Google NYC Office", "Zoom meeting"
Interviewer names: "Jane Smith", "John from HR"

Action Items Detection:

"Please reply with your availability"
"Send us your portfolio"
"Confirm the interview time"

Auto-update Flow:

Email arrives → webhook z Gmail
Classify email type
If INTERVIEW_INVITE → auto-update status to "Interview"
If REJECTION → auto-update status to "Rejected"
Extract structured data (date, time, location)
Publish event do Kafki

Eventy Kafka:

Konsumuje: email.received (webhook z Gmail)
Publikuje: email.classified, application.status.updated

Wartość dla użytkownika:

Auto-update statusów (nie musi ręcznie)
Structured info (interview date/time wyekstraktowane)
Nie przegapi ważnego emaila (urgency detection)
Oszczędność czasu


5. ANALYTICS & REPORTS SERVICE - Statystyki i wzorce
Odpowiedzialności:

Agregacja statystyk aplikacji
Pattern recognition ("dlaczego dostaję rejection?")
Weekly/monthly reports
Success rate calculation
Trend analysis
Anomaly detection (5 rejections in a row → trigger notification)
PDF report generation

Real-time Analytics (Kafka Streams):

Stream processing wszystkich eventów
Agregacja w czasie rzeczywistym:

Count aplikacji by status
Success rate calculation
Average time to response
Company response patterns



Pattern Analysis:

"You applied to 50 senior roles but have 2 YoE → aim lower"
"80% of your applications are FAANG → diversify"
"Companies in Finance reject you 90% → maybe not your fit"
"You apply Monday mornings - try Tuesday afternoons (higher response rate)"

Weekly Report Content:

Total applications: 47
New this week: 8
Interviews scheduled: 3
Offers received: 1 🎉
Rejections: 12
Ghosted (no response >2 weeks): 15
Success rate: 21% (industry avg: 18%)
Top companies applied to: Google (5), Meta (3), Amazon (2)
Average time to response: 6 days
Insights: "You're getting more interviews from startups than big tech"
Recommendations: konkretne action items

Scheduled Jobs:

Every Monday 9 AM: Generate weekly report
Daily: Check for anomalies (multiple rejections, ghosting)
Weekly: Update industry benchmarks

Eventy Kafka:

Konsumuje: ALL events (application.created, status.changed, email.classified, resume.analyzed, company.research.completed)
Publikuje: analytics.insight, report.generated

Wartość dla użytkownika:

Data-driven insights zamiast guessing
Actionable feedback co poprawić
Motywacja (success rate, progress tracking)
Pattern recognition (self-awareness)


6. NOTIFICATION SERVICE - Powiadomienia
Odpowiedzialności:

Email notifications
Push notifications (future)
SMS notifications (future)
Scheduled reminders
Multi-channel delivery

Notification Types:

Resume analyzed: "Your CV scored 78% - here's how to improve"
Company intel ready: "Research completed for Google - 10 interview questions prepared"
Email detected: "Interview invitation detected from Amazon!"
Status auto-updated: "Application status changed to 'Interview'"
Pattern detected: "We noticed 5 rejections in a row - here are some tips"
Weekly report ready: "Your weekly report is ready - 8 new applications this week"
Interview reminder: "Interview tomorrow at 2 PM with Google"

Delivery Strategy:

Email jako primary channel
Push notifications dla urgent (interview reminders)
Respect user preferences (notification settings)
Batching (nie spam'ować co 5 minut)

Eventy Kafka:

Konsumuje: resume.analyzed, company.research.completed, email.classified, analytics.insight, report.generated, interview.scheduled
Publikuje: notification.sent

Wartość dla użytkownika:

Nie przegapi ważnych informacji
Centralized notifications (wszystko w jednym miejscu)
Timely reminders


🔄 EVENT-DRIVEN FLOWS
Flow 1: User uploaduje CV

User uploaduje CV przez frontend
Core Service zapisuje plik i publikuje resume.uploaded event
Resume Analyzer Service konsumuje event:

Parsuje CV
Analizuje ATS compatibility
Publikuje resume.analyzed event z wynikami


Core Service konsumuje resume.analyzed i aktualizuje DB
Notification Service konsumuje resume.analyzed i wysyła email: "Your CV scored 78%"
Analytics Service konsumuje resume.analyzed i trackuje average scores

Flow 2: User tworzy aplikację

User dodaje nową aplikację o pracę (company name, role, job description)
Core Service zapisuje w DB i publikuje application.created event
Równolegle, kilka serwisów konsumuje event:

Company Intel Service: scrape company info, generuje interview questions, publikuje company.research.completed
Resume Analyzer Service: porównuje CV z job description
Email Analyzer Service: starts monitoring inbox dla emaili z tej firmy
Analytics Service: trackuje nową aplikację w statystykach


Notification Service wysyła powiadomienia gdy research/analysis są gotowe

Flow 3: Email arrives z firmy

Gmail webhook triggeruje Email Analyzer Service
Email Analyzer klasyfikuje email (INTERVIEW_INVITE)
Ekstraktuje date, time, location
Publikuje email.classified event
Core Service konsumuje event i auto-updates status to "Interview"
Notification Service wysyła powiadomienie: "Interview invitation detected!"
Analytics Service trackuje response time

Flow 4: User zmienia status na "Rejected"

User ręcznie zmienia status aplikacji
Core Service publikuje application.status.changed event
Analytics Service konsumuje event:

Sprawdza pattern: "5 rejections in a row?"
Publikuje analytics.insight event


Notification Service konsumuje insight i wysyła email: "We noticed a pattern - here's advice"

Flow 5: Weekly report (scheduled)

Analytics Service (scheduled job, każdy poniedziałek 9 AM)
Queries Core DB dla wszystkich aplikacji usera
Oblicza stats, success rate, trends
Generuje PDF report
Publikuje report.generated event
Notification Service wysyła email z PDF attachmentem


📊 KAFKA TOPICS
Lista topików:

application.created - nowa aplikacja dodana
application.status.changed - zmiana statusu aplikacji
resume.uploaded - CV uploadowane
resume.analyzed - wyniki analizy CV
company.research.requested - request dla company research
company.research.completed - research zakończony
email.received - nowy email
email.classified - email sklasyfikowany
interview.scheduled - rozmowa zaplanowana
analytics.event - general analytics events
analytics.insight - insights z pattern analysis
notification.requested - request wysłania powiadomienia
report.generated - raport wygenerowany

Event Payloads - przykładowe struktury:
application.created:
{
  "userId": 123,
  "applicationId": 456,
  "companyName": "Google",
  "companyWebsite": "https://google.com",
  "role": "Software Engineer",
  "level": "Junior",
  "jobDescription": "Full text...",
  "salaryMin": 120000,
  "salaryMax": 150000,
  "timestamp": "2026-02-04T10:30:00Z"
}
resume.analyzed:
{
  "userId": 123,
  "resumeId": 456,
  "applicationId": 789,
  "atsScore": 78,
  "matchedKeywords": ["Java", "Spring Boot", "PostgreSQL"],
  "missingKeywords": ["Kubernetes", "Docker", "AWS"],
  "suggestions": [
    "Add 'Kubernetes' to skills - appears 5x in job posting",
    "Include 'Docker' experience - required skill"
  ],
  "beforeAfter": {
    "before": "8/20 requirements matched",
    "after": "15/20 requirements matched (if you apply suggestions)"
  },
  "timestamp": "2026-02-04T10:31:15Z"
}
email.classified:
{
  "userId": 123,
  "applicationId": 456,
  "emailId": "gmail-message-id",
  "classification": "INTERVIEW_INVITE",
  "sentiment": "POSITIVE",
  "urgency": "HIGH",
  "extractedData": {
    "interviewDate": "2026-02-15",
    "interviewTime": "14:00",
    "location": "Google NYC Office / Zoom",
    "interviewerName": "Jane Smith"
  },
  "actionItems": [
    "Reply with your availability by Feb 10"
  ],
  "timestamp": "2026-02-04T11:00:00Z"
}

🎯 WYMAGANIA FUNKCJONALNE
Resume Analyzer:

✅ Musi parsować PDF i DOCX
✅ Keyword extraction z min. 80% accuracy
✅ ATS score calculation (0-100%)
✅ Konkretne, actionable suggestions (nie generic advice)
✅ Before/after comparison

Company Intel:

✅ Scraping min. 3 sources (website /about, /blog, /careers)
✅ Tech stack detection
✅ Min. 10 interview questions per role
✅ Caching na 7 dni (żeby nie overload scraping)
✅ Graceful failure (jeśli scraping fails, zwróć partial data)

Email Analyzer:

✅ Integration z Gmail API
✅ Classification accuracy min. 80% (rule-based OK)
✅ Date/time extraction
✅ Auto-update statusów
✅ Real-time processing (webhook-based)

Analytics:

✅ Real-time aggregation (Kafka Streams)
✅ Weekly reports (automated, scheduled)
✅ Pattern detection (min. 3 patterns: role mismatch, company type, timing)
✅ PDF generation dla raportów

Notifications:

✅ Email delivery (Spring Mail lub SendGrid)
✅ Support dla różnych typów notyfikacji
✅ Batching (max 1 email per hour dla non-urgent)
✅ User preferences (opt-in/opt-out)


🔧 WYMAGANIA NIEFUNKCJONALNE
Performance:

Resume analysis: max 30 sekund per CV
Company research: max 60 sekund per company (first time), instant (cached)
Email classification: real-time (<5 sekund)
API Gateway response time: <200ms (excluding heavy operations)

Scalability:

System powinien obsłużyć 1000+ użytkowników
Kafka partitions: min. 3 per topic (dla horizontal scaling)
Redis caching dla często używanych danych

Reliability:

Each service może failować niezależnie
Kafka zapewnia at-least-once delivery
Retry mechanism dla failed events
Dead letter queue dla permanently failed events

Security:

JWT authentication
Secure storage CV files (S3 lub podobne)
Email API credentials securely stored
HTTPS only

Monitoring:

Logging (centralized - ELK stack opcjonalnie)
Metrics (Prometheus opcjonalnie)
Health checks dla każdego serwisu


💼 WARTOŚĆ BIZNESOWA
Dla użytkownika:

Oszczędność czasu: 3-4 godziny tygodniowo (automation + research)
Lepsze CV: 78% vs 45% ATS score średnio
Więcej interviews: Lepsze dopasowanie CV → więcej callbacks
Better preparation: Company intel + interview questions
Data-driven decisions: Insights co poprawić
Less stress: Auto-tracking, reminders, notifications

Unique Value Proposition:

Nie tylko tracking - aktywne wsparcie w każdym etapie
Mierzalne rezultaty - ATS score, success rate, konkretne metrics
AI-powered ale controllable - user w kontroli, AI asystuje
Event-driven - real-time updates, automation
Scalable - microservices architecture


🚀 TECHNOLOGY CONSTRAINTS
Must-have:

Java jako główny język (user zna Javę)
Spring Boot framework
PostgreSQL jako główna baza
Apache Kafka dla event streaming
Docker dla containerization

Preferowane (ale do wyboru przez AI):

PDF parsing library (PDFBox, iText, lub inne)
NLP library (OpenNLP, Stanford NLP, lub inne)
Web scraping library (Jsoup lub inne)
Gmail API dla email integration
Caching solution (Redis preferowane)

Opcjonalne (nice-to-have):

Spring Cloud Gateway dla API Gateway
Kafka Streams dla real-time analytics
AI API (Claude/GPT) dla question generation
External APIs (Clearbit, Crunchbase)


📝 ZAKRES PROJEKTU
In Scope:

✅ 6 mikroserwisów jak opisano powyżej
✅ Kafka integration
✅ Basic frontend (może być simple, focus na backend)
✅ Docker Compose dla local development
✅ Basic documentation

Out of Scope (future):

❌ Mobile app
❌ Kubernetes deployment
❌ Advanced ML models
❌ Real-time chat support
❌ OAuth integration (Google/LinkedIn login)
❌ Payment system (premium features)


🎓 LEARNING GOALS
Główne cele nauki dla developera:

Microservices architecture - jak projektować i implementować
Event-driven systems - Kafka, asynchronous communication
Domain-driven design - bounded contexts, service boundaries
Real-world integrations - Gmail API, web scraping, external APIs
Scalability patterns - caching, partitioning, load balancing
AI integration - practical use cases, not just hype


✅ SUCCESS CRITERIA
Projekt będzie uznany za sukces gdy:

✅ Wszystkie 6 serwisów działają i komunikują się przez Kafkę
✅ Resume analyzer daje accuracy >80% na keyword matching
✅ Company intel scraping działa dla min. 5 różnych firm
✅ Email classification accuracy >75%
✅ Weekly reports są generowane automatycznie
✅ System działa end-to-end (user może przejść cały flow)
✅ Kod jest well-structured, maintainable
✅ Basic tests coverage (unit + integration)
✅ Docker Compose setup działa (easy local development)
✅ Project można pokazać na rozmowie jako portfolio piece


🤝 COLLABORATION WITH AI
Co AI powinno zrobić:

Przeanalizować istniejący kod (monolith)
Zaproponować konkretny tech stack dla każdego serwisu
Zaproponować database schema (tables, relationships)
Stworzyć implementation plan (week by week)
Pomóc w implementacji każdego serwisu
Code review i suggestions for improvements

Co developer zrobi:

Implementacja według planu AI
Testing
Integration
Deployment setup
Final polish

