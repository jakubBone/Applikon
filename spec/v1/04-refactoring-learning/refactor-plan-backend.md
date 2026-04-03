# Plan nauki backendu — EasyApply

## Kontekst dokumentu

Ten dokument jest przewodnikiem nauki backendu dla Jakuba — autora projektu EasyApply.
Jakub jest junior Java developerem. Zna Spring Boot na poziomie podstawowym/średnim.
Backend został napisany z pomocą AI — Jakub rozumie ogólną architekturę, ale nie chce zgłębić 
głębiej wszystkie szczegóły implementacji. Główne luki: security, walidacja, wzorce projektowe.

**Cel:** Zrozumieć lepiej przepływ backendu, naprawić problemy z Code Review, uzupełnić luki
w security. Nie uczymy od zera — tłumaczymy to, co wymaga wyjaśnienia.

**Dokumenty źródłowe:**
- `spec/v1/04-refactoring-learning/refactor-plan-backend.md` — ten plik (plan nauki + postęp)
- `spec/v1/03-review/code-review-2026-03-01.md` — Code Review od mentora (DR & AI, 2026-03-01) — źródło napraw
- `spec/v1/04-refactoring-learning/learning-notes-backend.md` — notatki z nauki backendu

**Jak używać tego planu:**
Wklej go do nowej sesji Claude Code i napisz: _"Kontynuujemy naukę backendu. Jesteśmy na Etapie X."_

**Claude na początku każdej sesji czyta:**
1. `spec/v1/04-refactoring-learning/refactor-plan-backend.md` — ten plik (plan, zasady, postęp)
2. `spec/v1/03-review/code-review-2026-03-01.md` — code review od mentora
3. `spec/v1/04-refactoring-learning/learning-notes-backend.md` — co Jakub już przerobił i zrozumiał

---

## Projekt: EasyApply — backend

**Stack:** Java 21, Spring Boot 3.4.1, Spring Security, OAuth2 + JWT (RS256),
PostgreSQL, Flyway, Docker, Maven

**Struktura pakietów (`com.easyapply`):**
```
EasyApplyApplication.java              — punkt wejścia (@SpringBootApplication)

config/
  SecurityConfig.java                  — konfiguracja Spring Security, CORS, OAuth2, JWT

controller/
  ApplicationController.java           — CRUD aplikacji o pracę
  AuthController.java                  — /api/auth/me, /api/auth/refresh, /api/auth/logout
  CVController.java                    — upload/CRUD plików CV
  NoteController.java                  — CRUD notatek
  StatisticsController.java            — statystyki i odznaki

dto/
  ApplicationRequest.java              — dane wejściowe tworzenia/edycji aplikacji
  ApplicationResponse.java             — dane wyjściowe aplikacji
  BadgeResponse.java                   — pojedyncza odznaka
  BadgeStatsResponse.java              — statystyki z odznakami
  NoteRequest.java                     — dane wejściowe notatki
  NoteResponse.java                    — dane wyjściowe notatki
  StageHistoryResponse.java            — historia etapów
  StageUpdateRequest.java              — zmiana etapu rekrutacji
  StatusUpdateRequest.java             — zmiana statusu
  UserResponse.java                    — dane użytkownika

entity/
  Application.java                     — encja aplikacji o pracę
  ApplicationStatus.java               — enum statusów (WYSLANE, W_PROCESIE, OFERTA, ODMOWA, GHOSTING)
  CV.java                              — encja CV (plik lub link)
  CVType.java                          — enum: UPLOADED, EXTERNAL_LINK
  ContractType.java                    — enum: UOP, B2B, UZ, UD
  Note.java                            — encja notatki
  NoteCategory.java                    — enum kategorii notatek
  RejectionReason.java                 — enum powodów odmowy
  SalarySource.java                    — enum źródła informacji o wynagrodzeniu
  SalaryType.java                      — enum: BRUTTO, NETTO
  StageHistory.java                    — encja historii etapów
  User.java                            — encja użytkownika (Google OAuth2)

exception/
  GlobalExceptionHandler.java          — @ControllerAdvice, obsługa błędów

repository/
  ApplicationRepository.java           — JPA repo + custom query (statystyki)
  CVRepository.java                    — JPA repo CV
  NoteRepository.java                  — JPA repo notatek
  StageHistoryRepository.java          — JPA repo historii etapów
  UserRepository.java                  — JPA repo użytkowników

security/
  AuthenticatedUser.java               — wrapper na dane zalogowanego użytkownika
  CustomOAuth2UserService.java         — tworzenie/aktualizacja User po zalogowaniu przez Google
  JwtAuthenticationConverter.java      — konwersja JWT → Authentication (Spring Security)
  JwtService.java                      — generowanie i walidacja tokenów JWT (RS256)
  MdcUserFilter.java                   — dodaje userId do MDC (kontekst logowania)
  OAuth2AuthenticationSuccessHandler.java — generuje JWT po zalogowaniu OAuth2, ustawia cookie

service/
  ApplicationService.java              — logika biznesowa aplikacji, etapy, statusy
  CVService.java                       — upload plików, walidacja, zarządzanie CV
  NoteService.java                     — CRUD notatek
  StatisticsService.java               — statystyki, odznaki, progi
  UserService.java                     — zarządzanie użytkownikami
```

**Migracje Flyway:**
```
V1__init_schema.sql                    — schemat początkowy (applications, cvs, notes, stage_history)
V2__add_session_id.sql                 — dodanie session_id
V3__migrate_deprecated_statuses.sql    — migracja starych statusów
V4__auth_schema.sql                    — tabela users, kolumny user_id w applications/cvs
```

**Testy:**
```
config/TestSecurityConfig.java                  — konfiguracja security dla testów
security/WithMockAuthenticatedUser.java         — adnotacja do mockowania zalogowanego usera
security/WithMockAuthenticatedUserSecurityContextFactory.java — factory dla powyższej

controller/
  ApplicationControllerTest.java                — testy REST kontrolera aplikacji
  CVControllerTest.java                         — testy REST kontrolera CV
  NoteControllerTest.java                       — testy REST kontrolera notatek
  StatisticsControllerTest.java                 — testy REST kontrolera statystyk

service/
  ApplicationServiceTest.java                   — testy logiki biznesowej aplikacji
  CVServiceTest.java                            — testy logiki CV
  NoteServiceTest.java                          — testy logiki notatek
  StatisticsServiceTest.java                    — testy logiki statystyk
```

---

## Zasady trybu Mentor (OBOWIĄZUJĄ przez całą naukę)

1. **Poziom tłumaczenia:** Jakub jest junior Java devem. Zna Spring Boot podstawy.
   NIE tłumacz co to `@Service`, `@Repository`, `@RestController` — to wie.
   TŁUMACZ dokładnie: security (OAuth2, JWT, CSRF, path traversal, XSS),
   wzorce (State Machine, AOP proxy), i rzeczy gdzie widać luki z CR.

2. **Interakcja:** Po każdym omówionym zagadnieniu zapytaj czy rozumie.
   Nie przechodź dalej bez potwierdzenia Jakuba.

3. **Pytania kontrolne:** Po każdym etapie 2-3 pytania sprawdzające.
   Konkretne, odnoszące się do projektu.

4. **Notatki po każdym etapie:** Zapisz podsumowanie do `spec/v1/04-refactoring-learning/learning-notes-backend.md`.
   Format: nagłówek etapu, kluczowe pojęcia, ważne pliki, co naprawiono.

5. **Zawsze pokazuj kod:** Omawiaj konkretne pliki z projektu. Wskazuj linię.

6. **CR zintegrowany z nauką:** Przy każdym etapie — jeśli CR wskazuje problem —
   najpierw wytłumacz mechanizm, potem napraw razem z Jakubem.

7. **Nice to have:** Na końcu każdego etapu, przed przejściem do następnego,
   pokaż listę opcjonalnych napraw ("nice to have") z tego etapu i zapytaj:
   _"Mamy jeszcze X nice-to-have. Robimy, czy idziemy dalej?"_

8. **Nie pomijaj pytań.** Jeśli Jakub zapyta o cokolwiek — odpowiedz.

9. **Nie commituj.** Jakub robi commity sam.

---

## Flow pracy przy każdej naprawie z CR

Identyczny jak przy froncie. Każda zmiana musi przejść przez ten proces:

```
1. WYJAŚNIJ   — wytłumacz mechanizm (dlaczego to błąd / jak to działa)
2. PRZECZYTAJ — odczytaj aktualny plik przed zmianą (Read tool)
3. NAPRAW     — wprowadź zmianę (Edit tool)
4. TESTY      — sprawdź czy zmiana dotyka istniejących testów:
                  a) uruchom: mvn test w katalogu easyapply-backend
                  b) jeśli test się sypie — zaktualizuj test, uruchom ponownie
                  c) jeśli zmiana dodaje nową logikę — zaproponuj i napisz nowy test
5. BUILD      — sprawdź kompilację: mvn compile
6. RESTART    — przypomnij Jakubowi żeby zrestartował backend i przetestował ręcznie
                  (podaj konkretnie co sprawdzić — jaki endpoint, jaki request)
7. PYTANIE    — zapytaj: "Czy zaznaczyć CR-X jako naprawione w tabeli postępu?"
8. AKTUALIZUJ — jeśli Jakub potwierdzi: zaktualizuj status w tabelach poniżej (⬜ → ✅)
                  oraz dodaj wpis w "Notatki z sesji"
```

**Ważne zasady:**
- Krok 4 (testy) jest **obowiązkowy** — nawet dla małych zmian
- Krok 4c — nowe testy piszemy **tylko gdy pojawia się nowa logika** (np. walidacja magic bytes)
  lub gdy istniejące testy nie pokrywają scenariusza (np. path traversal)
- Krok 6 (restart) to zawsze zadanie dla Jakuba, nie dla Claude
- Jeśli testy nie przechodzą — **nie przechodź dalej** dopóki nie są zielone

---

## Postęp nauki

| Etap | Temat | Nauka | CR naprawione w tym etapie |
|------|-------|-------|---------------------------|
| 1 | Przegląd architektury — przepływ i elementy | ✅ | — |
| 2 | Security — OAuth2, JWT, ciasteczka | ✅ | CR-5, CR-3 (backend) |
| 3 | Security — walidacja danych i plików | ✅ | CR-1, CR-B1, CR-B2, CR-B3 |
| 4 | Jakość kodu i wzorce | ⬜ | CR-10, CR-B4, CR-B5, CR-B7, CR-B8, CR-B9, CR-B10 |
| 5 | Testy — przegląd, uzupełnienie, pokrycie | ⬜ | — |

Po zakończeniu każdego etapu Claude pyta:
> _"Czy uznajemy Etap X za zaliczony? Zaktualizuję tabelę i notatki."_

---

## Lista napraw z CR (śledzenie postępu)

Źródło: `spec/v1/03-review/code-review-2026-03-01.md` (review z 2026-03-01, reviewer: DR & AI)

### 🔴 Krytyczne (bezpieczeństwo / poprawność)

| ID | Problem | Plik(i) | Etap | Status | Przetestowane |
|----|---------|---------|------|--------|---------------|
| CR-1 | Path traversal przy uploadzie CV | `CVService.java` | 3 | ✅ | ✅ |
| CR-5 | Brak SameSite na ciasteczku refresh_token | `OAuth2AuthenticationSuccessHandler.java` | 2 | ✅ | ✅ |
| CR-3 | Kontrakt refresh tokena — backend zwraca `"token"` zamiast `"accessToken"` | `AuthController.java` | 2 | ✅ | ✅ |
| CR-B1 | Brak walidacji URL-i w backendzie (externalUrl w CV) | `CVService.java` | 3 | ✅ | ✅ |
| CR-B3 | Walidacja plików oparta tylko na Content-Type, brak magic bytes | `CVService.java` | 3 | ✅ | ✅ |

### 🟡 Ważne (jakość / poprawność)

| ID | Problem | Plik(i) | Etap | Status | Przetestowane |
|----|---------|---------|------|--------|---------------|
| CR-B2 | Brak @NotNull na status w StageUpdateRequest | `StageUpdateRequest.java` | 3 | ✅ | ✅ |
| CR-10 | @Transactional na prywatnej metodzie (AOP ignoruje) | `ApplicationService.java` | 4 | ✅ | ✅ |
| CR-B7 | user_id nullable — brak NOT NULL constraint | nowa migracja Flyway | 4 | ✅ | ✅ |
| CR-B9 | Błędy walidacji jako string zamiast mapy pól | `GlobalExceptionHandler.java` | 4 | ⬜ | ⬜ |

### 🟢 Nice to have (jakość kodu)

| ID | Problem | Plik(i) | Etap | Status | Przetestowane |
|----|---------|---------|------|--------|---------------|
| CR-B4 | Object[] w zapytaniu statystycznym → projection/DTO | `ApplicationRepository.java`, `StatisticsService.java` | 4 | ⬜ | ⬜ |
| CR-B5 | 5 równoległych tablic w StatisticsService → record Badge | `StatisticsService.java` | 4 | ⬜ | ⬜ |
| CR-B8 | Deprecated enums w NoteCategory (PYTANIE, KONTAKT) | `NoteCategory.java` + migracja | 4 | ⬜ | ⬜ |
| CR-B10 | Brak komentarzy przy regułach biznesowych w updateStage() | `ApplicationService.java` | 4 | ⬜ | ⬜ |

**Legenda:**
- **Status** ⬜/✅ — czy zmiana w kodzie została wprowadzona
- **Przetestowane** ⬜/✅ — czy testy przeszły AND Jakub sprawdził ręcznie

---

## Szczegółowy opis etapów

---

### Etap 1 — Przegląd architektury — przepływ i elementy

**Cel:** Zrozumieć jak request przechodzi przez backend od HTTP do bazy danych i z powrotem.
Wiedzieć co robi każda warstwa i jak się łączą. Nie od zera — na poziomie "wiem co gdzie szukać".

**Co omawiamy:**

1. **Przepływ request → response (na przykładzie tworzenia aplikacji):**
   ```
   POST /api/applications
     → Spring Security filter chain (JWT → Authentication)
     → MdcUserFilter (userId do logów)
     → ApplicationController.create()
     → @Valid → walidacja DTO
     → ApplicationService.create()
     → ApplicationRepository.save()
     → response DTO → JSON → 201 Created
   ```

2. **Security filter chain — co się dzieje ZANIM request trafi do kontrolera:**
   - `SecurityConfig.java` — konfiguracja: które endpointy publiczne, które chronione
   - `JwtAuthenticationConverter` — jak JWT z nagłówka `Authorization: Bearer` zamienia się
     na obiekt `Authentication` w Spring Security
   - `MdcUserFilter` — dodaje userId do MDC (kontekst logów)
   - `@AuthenticationPrincipal AuthenticatedUser` — jak kontroler dostaje dane zalogowanego usera

3. **Warstwy i ich odpowiedzialności:**
   - Controller — walidacja wejścia (@Valid), mapowanie HTTP, kody odpowiedzi
   - Service — logika biznesowa, transakcje, reguły
   - Repository — dostęp do bazy (Spring Data JPA)
   - Entity — model danych (tabele)
   - DTO — kontrakt z frontendem (request/response)

4. **Przegląd konfiguracji:**
   - `application.properties` — zmienne środowiskowe, profile (local/dev/prod)
   - `SecurityConfig.java` — CORS, OAuth2, JWT, publiczne endpointy
   - Flyway migracje — ewolucja schematu bazy

**Pliki do otwarcia:**
- `SecurityConfig.java` — serce konfiguracji security
- `ApplicationController.java` — przykładowy kontroler
- `ApplicationService.java` — przykładowy serwis
- `application.properties` — konfiguracja

**CR powiązane:** brak napraw, tylko przegląd.

---

### Etap 2 — Security — OAuth2, JWT, ciasteczka

**Cel:** Zrozumieć pełny przepływ logowania od strony backendu.
Naprawić problemy z ciasteczkami i kontraktem tokenów.

**Co omawiamy:**

1. **Przepływ OAuth2 (backend side) krok po kroku:**
   ```
   1. Frontend redirect → Google
   2. Google callback → Spring Security OAuth2 filter
   3. CustomOAuth2UserService — tworzy/aktualizuje User w bazie
   4. OAuth2AuthenticationSuccessHandler:
      a) generuje access token (JWT, RS256, 15 min)
      b) generuje refresh token (JWT, RS256, 7 dni)
      c) ustawia refresh token jako httpOnly cookie
      d) redirect na frontend z access tokenem w URL
   ```

2. **JwtService — generowanie i walidacja tokenów:**
   - RS256 (asymetryczny) — klucz prywatny podpisuje, publiczny weryfikuje
   - Dlaczego RS256 a nie HS256
   - Claims: subject (userId), iat, exp

3. **Refresh token flow:**
   - AuthController.refresh() — walidacja cookie, generowanie nowego access tokena
   - Dlaczego refresh token w httpOnly cookie (niedostępny dla JS = ochrona przed XSS)

4. **CSRF i SameSite — co to jest i dlaczego ważne:**
   - Atak CSRF — ktoś wysyła request z Twojego ciasteczka bez Twojej wiedzy
   - SameSite=Lax — przeglądarka nie wysyła cookie z obcych stron
   - Dlaczego brak SameSite to problem (CR-5)

5. **Kontrakt refresh tokena (CR-3):**
   - Backend zwraca `"token"`, frontend oczekuje `"accessToken"`
   - Jak to naprawić i dlaczego to powoduje że refresh nie działa

**Pliki do otwarcia:**
- `OAuth2AuthenticationSuccessHandler.java` — generowanie tokenów, cookie
- `JwtService.java` — tworzenie i walidacja JWT
- `CustomOAuth2UserService.java` — tworzenie usera po OAuth2
- `AuthController.java` — /me, /refresh, /logout
- `SecurityConfig.java` — konfiguracja filtrów

**CR do naprawy:**
- **CR-5:** Dodaj `SameSite=Lax` do ciasteczka refresh_token. Wyjaśniamy CSRF, naprawiamy.
- **CR-3 (backend part):** Napraw klucz w odpowiedzi refresh — `"token"` → `"accessToken"`.

**Nice to have na koniec etapu:** brak

---

### Etap 3 — Security — walidacja danych i plików

**Cel:** Naprawić krytyczne luki bezpieczeństwa — path traversal, walidacja URL-i,
walidacja plików, walidacja DTO. To najważniejszy etap pod kątem bezpieczeństwa.

**Co omawiamy:**

1. **Path traversal (CR-1) — KRYTYCZNY:**
   - Jak działa atak: nazwa pliku `../../etc/cron.d/malicious` → zapis poza katalogiem uploads
   - Jak się bronić: `resolve()` + `normalize()` + `startsWith(uploadDir)`
   - Lepsze podejście: UUID jako nazwa na dysku, oryginalna nazwa tylko w bazie
   - Pokaz na kodzie `CVService.java` — gdzie dokładnie jest luka

2. **Walidacja URL-i w backendzie (CR-B1):**
   - Frontend waliduje, ale backend też musi (defense in depth)
   - `externalUrl` w CV — ktoś może wysłać `javascript:alert(1)` bezpośrednio do API
   - Walidacja schematu: dopuść tylko `http://` i `https://`

3. **Walidacja plików — magic bytes (CR-B3):**
   - Content-Type jest deklaratywny — przeglądarka go ustawia, atakujący może sfałszować
   - Magic bytes — pierwsze bajty pliku identyfikują jego typ:
     - PDF: `%PDF-` (hex: `25 50 44 46 2D`)
     - DOCX: `50 4B 03 04` (bo DOCX to ZIP)
   - Sprawdzamy: magic bytes + Content-Type + rozszerzenie (trojna walidacja)

4. **Walidacja DTO — @NotNull (CR-B2):**
   - `StageUpdateRequest.status` — brak @NotNull → null przechodzi do serwisu → NPE → 500
   - Powinno być: @NotNull → czytelne 400 Bad Request
   - Kiedy dodawać walidację: na granicy systemu (API), nie wewnątrz serwisu

**Pliki do otwarcia:**
- `CVService.java` — upload, path traversal, walidacja pliku, URL
- `StageUpdateRequest.java` — brak @NotNull
- `GlobalExceptionHandler.java` — jak błędy walidacji są zwracane

**CR do naprawy:**
- **CR-1:** Path traversal — naprawiamy upload w `CVService.java`
- **CR-B1:** Walidacja URL-i — dodajemy sprawdzenie schematu w `CVService.java`
- **CR-B3:** Magic bytes — dodajemy walidację zawartości pliku w `CVService.java`
- **CR-B2:** @NotNull na status w `StageUpdateRequest.java`

**Nice to have na koniec etapu:** brak (wszystko w tym etapie jest ważne)

---

### Etap 4 — Jakość kodu i wzorce

**Cel:** Naprawić problemy z jakością kodu, wzorcami, integralnością danych.
Etap mieszany — część napraw jest ważna (stage history, user_id NOT NULL),
część to "nice to have" (Object[] → projection).

**Co omawiamy:**

1. **@Transactional na prywatnej metodzie (CR-10):**
   - Jak działa Spring AOP — proxy opakowuje bean
   - Proxy przechwytuje tylko publiczne metody wywołane z zewnątrz
   - Prywatna metoda = proxy nie widzi = @Transactional ignorowany
   - W tym przypadku: brak praktycznego wpływu (wywołana z transakcyjnej metody),
     ale adnotacja jest myląca — usuwamy

2. **user_id nullable (CR-B7):**
   - Migracja V4 dodaje kolumnę jako nullable ("na razie, bo istniejące wiersze mają null")
   - Ale nigdy nie dodaje NOT NULL
   - Tworzymy nową migrację: backfill + ALTER TABLE SET NOT NULL

4. **Błędy walidacji jako string (CR-B9):**
   - Aktualnie: błędy łączone w jeden tekst → frontend nie wie które pole
   - Poprawnie: mapa `{pole: komunikat}` przez `ProblemDetail.setProperty()`
   - Standard RFC 9457

5. **[Nice to have] Object[] → projection (CR-B4):**
   - Zapytanie statystyczne zwraca Object[] — brak typów, kruche
   - JPQL constructor expression: `SELECT new StatsDto(...) FROM ...`
   - Alternatywa: interface-based projection

6. **[Nice to have] Równoległe tablice → record (CR-B5):**
   - 5 tablic (nazwy, ikony, opisy, progi, kolory) zsynchronizowanych po indeksie
   - Jeden element przesunięty = wszystkie odznaki popsute
   - Rozwiązanie: `record Badge(String name, String icon, String description, int threshold, String color)`

7. **[Nice to have] Deprecated enums (CR-B8):**
   - `NoteCategory`: PYTANIE i KONTAKT współistnieją z PYTANIA, FEEDBACK, INNE
   - Migracja Flyway zamieni stare → nowe, potem usunięcie z enuma

8. **[Nice to have] Komentarze przy regułach biznesowych (CR-B10):**
   - `updateStage()` — złożona logika warunkowa bez komentarzy
   - Dodajemy komentarze wyjaśniające "dlaczego", nie "co"

**Pliki do otwarcia:**
- `ApplicationService.java` — @Transactional, updateStage(), stage history
- `StageHistoryRepository.java` — zapis historii
- `GlobalExceptionHandler.java` — format błędów
- `StatisticsService.java` — parallel arrays, Object[]
- `ApplicationRepository.java` — custom query
- `NoteCategory.java` — deprecated enums

**CR do naprawy (ważne):**
- **CR-10:** Usunięcie @Transactional z prywatnej metody
- **CR-B7:** Nowa migracja — NOT NULL na user_id
- **CR-B9:** Błędy walidacji jako mapa pól

**Nice to have na koniec etapu:**
- CR-B4: Object[] → projection/DTO
- CR-B5: Równoległe tablice → record Badge
- CR-B8: Deprecated enums + migracja
- CR-B10: Komentarze przy regułach biznesowych

---

### Etap 5 — Testy — przegląd, uzupełnienie, pokrycie

**Cel:** Zrozumieć istniejące testy, uruchomić je, uzupełnić o scenariusze
wynikające z napraw (path traversal, null status, magic bytes, walidacja URL).

**Co omawiamy:**

1. **Przegląd istniejących testów:**
   - Jak działa `@WebMvcTest` — testy kontrolerów bez pełnego kontekstu
   - `@MockBean` — mockowanie serwisów
   - `@WithMockAuthenticatedUser` — custom adnotacja do mockowania auth
   - `TestSecurityConfig` — konfiguracja security dla testów
   - Testy serwisów — mockowanie repozytoriów przez Mockito

2. **Uruchomienie testów i przegląd wyników:**
   - `mvn test` — co przechodzi, co nie
   - Jak czytać stack trace z testów
   - Jak uruchomić pojedynczy test

3. **Uzupełnienie testów o scenariusze z napraw:**
   - Test path traversal — nazwa pliku z `../` powinna być odrzucona
   - Test magic bytes — plik z fałszywym Content-Type powinien być odrzucony
   - Test null status — StageUpdateRequest bez statusu → 400
   - Test walidacji URL — `javascript:` URL powinien być odrzucony
   - Test stage history — updateStage() powinno tworzyć wpis w historii

4. **Czym NIE zajmujemy się:**
   - Nie piszemy testów E2E (za duży scope)
   - Nie piszemy testów integracyjnych z bazą (mamy H2 w testach, ale to na przyszłość)
   - Nie konfigurujemy JaCoCo (temat na przyszłość)

**Pliki do otwarcia:**
- `src/test/java/com/easyapply/service/CVServiceTest.java` — testy CV
- `src/test/java/com/easyapply/service/ApplicationServiceTest.java` — testy aplikacji
- `src/test/java/com/easyapply/controller/ApplicationControllerTest.java` — testy kontrolera
- `src/test/resources/application-test.properties` — konfiguracja testów

**CR powiązane:** brak nowych napraw, uzupełniamy testy dla napraw z etapów 2-4.

---

## Notatki z sesji

Po każdej sesji Claude uzupełnia tę sekcję. Format: data, co omówiono,
co naprawiono, co wymaga powtórki, następny krok.

---

(Notatki będą uzupełniane po każdej sesji)
