# EasyApply – aplikacja do trackowania rekrutacji

# 1. Problem
Kandydaci IT aplikują na dużą liczbę ofert pracy na różnych job boardach oraz przez LinkedIn. 
Proces ten szybko staje się chaotyczny i trudny do kontrolowania.

**Najczęstsze problemy (uporządkowane według priorytetu)**:
- **Gubienie się w aplikacjach:** Trudność w ustaleniu, na jakim etapie jest konkretna rekrutacja.
- **Chaos w dokumentach:** Tworzenie wielu wersji CV pod daną ofertęa /firmę; brak wiedzy, która wersja trafiła do danej firmy.
- **Utrata danych finansowych:** Zapominanie, jaką stawkę podało się w formularzu aplikacyjnym, w tym walutę i warunki (np. B2B vs UoP).
- **Rozproszone notatki:** Brak miejsca na dane kontaktowe do rekruterów, pytania z rozmów, feedback oraz treść wiadomości wysłanej w polu „informacja do rekrutera”.
- **Ephemeral Content:** Linki do ogłoszeń wygasają, co uniemożliwia powrót do wymagań przed rozmową.

- **Bariera wejścia AI:** Research firmy przed rozmową zajmuje zbyt dużo czasu
- **Brak dopasowania CV:** Trudność w dostosowaniu CV pod konkretną ofertę, by przejść przez systemy ATS (automatyczne odrzucenia) 

**Efekt:** Brak kontroli nad procesem, zwiększony stres przed rozmową, brak wyciągania wniosków z porażek oraz marnowanie czasu na powtarzające się błędy.

---

# 2. Użytkownik
Kandydaci aktywnie szukający pracy, aplikujący na 10-20 ofert miesięcznie, korzystający głównie z LinkedIn i NoFluffJobs/JustJoinIT:
- Zmieniający branżę z non-IT do IT (bez doświadczenia)
- Junior/Mid Developerzy (0-4 lata doświadczenia)

---

# 3. Dlaczego ta aplikacja?
- **Luka rynkowa:** Narzędzie projektowane w 100% pod potrzeby kandydata, a nie rekrutera – w odróżnieniu od narzędzi jak LinkedIn czy ATS-y firm.
- **End-to-end:** Obsługa od momentu wysłania CV, przez research pracodawców, aż po archiwum zakończonych procesów.
- **Wygoda:** Jedno "źródło prawdy" zamiast rozproszonych plików Excel, Notion czy e-maili.

**Analiza konkurencji:**

| Konkurent | Wady | Nasze wyróżniki |
|-----------|------|-----------------|
| Huntr.co | Ograniczony UI, brak polskiej lokalizacji | Polski rynek, prostota |
| Teal | Płatny ($29/mies), brak wersji mobilnej | Darmowe MVP, focus na IT |
| Notion templates | Wymaga ręcznej konfiguracji | Gotowe rozwiązanie out-of-the-box |

---

# 4. MVP (Minimum Viable Product)
1. **Rejestr aplikacji (CRUD):** Firma, stanowisko, link, data (auto-generowana), stawka (z walutą), status, źródło oferty.
2. **Widok Kanban:** Przeciąganie aplikacji między kolumnami: *Wysłane → Rozmowa → Zadanie → Oferta → Odrzucone*.
3. **Zarządzanie CV:** Upload plików PDF (lokalny storage, max 5MB) i przypisywanie do aplikacji.
4. **Notatnik:** Sekcja na pytania techniczne, feedback, dane kontaktowe (plaintext).

---

# 5. Edge Cases
- **Re-aplikacja:** Powiadomienie o wcześniejszych aplikacjach do tej samej firmy.
- **Rekrutacja ukryta:** Obsługa relacji Agencja – Klient końcowy.
- **Wygasłe linki:** Automatyczny zapis wklejonej treści ogłoszenia w bazie danych.
- **Zmiana stawki:** Śledzenie historii negocjacji finansowych.
- **Wielowalutowość:** Obsługa różnych walut (PLN, EUR, USD) bez automatycznego przelicznika.
- **Duplikaty ofert:** Wykrywanie tej samej oferty na różnych portalach (po nazwie firmy + stanowisku).

---

# 6. MVP — kroki biznesowe

## Krok 1: Backend API

| Aspekt | Opis |
|--------|------|
| **Cel** | REST API do zapisywania i pobierania aplikacji z bazy danych PostgreSQL |
| **Dlaczego** | Fundament aplikacji — bez backendu frontend nie ma z czym się komunikować |
| **Warunki brzegowe** | PostgreSQL działający (easyapply_db), API zwraca JSON, walidacja działa, CORS skonfigurowany dla localhost:5173 |
| **Sukces gdy** | Mogę dodać aplikację przez curl/Postman, API zwraca JSON, dane zapisują się w bazie i przetrwają restart serwera |

## Krok 2: Frontend Lista

| Aspekt | Opis |
|--------|------|
| **Cel** | React UI do przeglądania listy aplikacji i dodawania nowych przez formularz |
| **Dlaczego** | Rozwiązuje główny problem — "gubienie się w aplikacjach". Jedno miejsce zamiast chaosu |
| **Warunki brzegowe** | Frontend komunikuje się z backendem (localhost:8080), dane przetrwają odświeżenie strony, dodanie aplikacji max 1 minuta |
| **Sukces gdy** | Mogę dodać 10 aplikacji przez formularz w przeglądarce, wszystkie widzę na liście z kluczowymi danymi (firma, stanowisko, stawka, waluta, data) |

## Krok 3: Śledzenie statusu aplikacji

| Aspekt | Opis |
|--------|------|
| **Cel** | Użytkownik może zmieniać status aplikacji (Wysłane → Rozmowa → Zadanie → Oferta → Odrzucone) i widzieć to na widoku Kanban |
| **Dlaczego** | Rozwiązuje "na jakim etapie jest rekrutacja?" — wizualna kontrola procesu |
| **Warunki brzegowe** | 5 statusów (hardcoded). Zmiana statusu przez drag & drop lub select. Widać ile aplikacji w każdym statusie |
| **Sukces gdy** | Widzę tablicę Kanban, przeciągam kartę między kolumnami, status się zapisuje |

## Krok 4: Zarządzanie CV

| Aspekt | Opis |
|--------|------|
| **Cel** | Użytkownik może uploadować pliki CV (PDF) i przypisywać je do aplikacji |
| **Dlaczego** | Rozwiązuje "która wersja CV trafiła do tej firmy?" |
| **Warunki brzegowe** | Tylko PDF, max 5MB. Jedno CV może być przypisane do wielu aplikacji. Można podejrzeć/pobrać CV |
| **Sukces gdy** | Uploaduję 3 wersje CV, przypisuję różne do różnych aplikacji, widzę która wersja gdzie poszła |

## Krok 5: Notatki i archiwum ogłoszeń

| Aspekt | Opis |
|--------|------|
| **Cel** | Użytkownik może dodawać notatki do aplikacji (pytania z rozmów, feedback, dane kontaktowe) oraz zapisać treść ogłoszenia |
| **Dlaczego** | Rozwiązuje "rozproszone notatki" i "wygasłe linki do ogłoszeń" |
| **Warunki brzegowe** | Notatki plaintext (bez formatowania). Wiele notatek per aplikacja. Treść ogłoszenia jako jedno pole tekstowe |
| **Sukces gdy** | Po rozmowie zapisuję pytania i feedback. Przed następną rozmową mogę to przeczytać. Ogłoszenie jest dostępne nawet gdy link wygasł |

---


# 7. TECHNOLOGIA

## Biblioteki

### STDLIB (wbudowane, preferowane):

**Backend (Java 21):**
- `java.util.*`: Kolekcje (List, Map, Set) do zarządzania danymi w pamięci
- `java.time.*`: Obsługa dat aplikacji (LocalDate, LocalDateTime)
- `java.nio.file.*`: Operacje na plikach CV (zapis, odczyt, usuwanie)
- `java.util.UUID`: Generowanie unikalnych identyfikatorów dla CV

**Frontend (JavaScript/TypeScript):**
- `fetch API`: Komunikacja HTTP z backendem
- `localStorage`: Opcjonalne cachowanie danych użytkownika

### ZEWNĘTRZNE (tylko jeśli stdlib nie wystarczy):

**Backend:**
- **Spring Boot 3.4**: Framework webowy (stdlib nie ma REST API / dependency injection)
- **Spring Data JPA**: ORM do komunikacji z PostgreSQL (stdlib nie ma mapowania obiektowo-relacyjnego)
- **PostgreSQL JDBC Driver**: Sterownik bazy danych (wymagany do połączenia)
- **Hibernate Validator**: Walidacja danych wejściowych (stdlib ma podstawową walidację, ale brak integracji ze Spring)
- **Lombok** (opcjonalnie): Redukcja boilerplate (gettery, settery, constructory)

**Frontend:**
- **React 18**: Biblioteka UI (stdlib nie ma komponentów reaktywnych)
- **TypeScript**: Typowanie statyczne (JavaScript nie ma typów)
- **Tailwind CSS**: Utility-first CSS (stdlib nie ma gotowych stylów)
- **@dnd-kit/core**: Drag & drop dla Kanban (stdlib nie ma natywnego DnD w React)
- **React Router**: Routing między widokami (stdlib nie ma routingu SPA)

**Baza danych:**
- **PostgreSQL 16**: Relacyjna baza danych (stdlib nie ma bazy danych)

---

# Struktura plików (minimalna, dla MVP)

## Backend (`src/main/java/com/easyapply/`)

```
├── controller/
│   └── ApplicationController.java       # REST API endpoints (CRUD aplikacji)
├── service/
│   ├── ApplicationService.java          # Logika biznesowa aplikacji
│   └── CVStorageService.java            # Zarządzanie plikami CV (upload, download, delete)
├── repository/
│   ├── ApplicationRepository.java       # Spring Data JPA repository dla aplikacji
│   └── NoteRepository.java              # Repository dla notatek
├── entity/
│   ├── Application.java                 # Encja aplikacji (firma, stanowisko, status, stawka)
│   ├── Note.java                        # Encja notatki (tekst, data, relacja do aplikacji)
│   └── ApplicationStatus.java           # Enum (WYSŁANE, ROZMOWA, ZADANIE, OFERTA, ODRZUCONE)
└── dto/
    ├── ApplicationRequest.java          # DTO do tworzenia/edycji aplikacji
    └── ApplicationResponse.java         # DTO do zwracania danych aplikacji
```

## Frontend (`src/`)

```
├── components/
│   ├── KanbanBoard.tsx                  # Tablica Kanban z kolumnami statusów
│   ├── ApplicationCard.tsx              # Karta aplikacji (przeciągalna)
│   ├── ApplicationForm.tsx              # Formularz dodawania/edycji aplikacji
│   ├── CVUpload.tsx                     # Komponent uploadu CV
│   └── NotesList.tsx                    # Lista notatek do aplikacji
├── services/
│   └── api.ts                           # Funkcje fetch do komunikacji z backendem
├── types/
│   └── application.ts                   # TypeScript interfaces (Application, Note, Status)
├── pages/
│   ├── Dashboard.tsx                    # Główny widok (Kanban + lista)
│   └── ApplicationDetails.tsx           # Szczegóły aplikacji (CV, notatki, historia)
└── App.tsx                              # Root component z routingiem
```

## Baza danych (PostgreSQL)

```
└── schema.sql
    ├── applications table               # id, company, position, link, date, salary, currency, status, source
    ├── notes table                      # id, application_id, content, created_at
    └── cv_files table                   # id, filename, file_path, upload_date, application_id (nullable)
```

---

# 8. Przyszłość

| Faza | Zakres |
|------|--------|
| **v1.1** | Funkcje AI — przygotowanie do rozmowy, analiza CV vs ogłoszenie |
| **v2.0** | Architektura (opcjonalnie, edukacyjnie) — event-driven, mikroserwisy |


| Wybór | Uzasadnienie |
|-------|--------------|
| Spring Security + OAuth2 | Logowanie/autoryzacja |
| Session-based | Prostsze niż JWT dla aplikacji z jednym backendem |
| pg_vector | v1.1 | Embeddingi dla AI |
| Spring AI + Ollama/Groq | v1.1 | Funkcje AI |
| Kafka, mikroserwisy | v2.0 | Nauka architektury (opcjonalnie) |




