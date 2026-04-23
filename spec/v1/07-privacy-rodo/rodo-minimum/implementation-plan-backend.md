# Plan implementacji RODO minimum — EasyApply Backend

## Proces pracy (obowiązujący dla każdego etapu)

1. **Implementacja** — Claude robi zmiany w kodzie
2. **Weryfikacja automatyczna** — `./mvnw test`, musi być zielony
3. **Weryfikacja manualna** — użytkownik testuje endpoint ręcznie (opcjonalnie)
4. **Aktualizacja planów** — Claude aktualizuje checkboxy w tym pliku
5. **Sugestia commita** — Claude proponuje wiadomość commita (format: `type(backend): opis`)
6. **Commit** — użytkownik sam robi `git add` + `git commit`
7. **Pytanie o kontynuację** — Claude pyta czy idziemy dalej do następnego etapu

---

## Cel

Zrealizować minimum RODO po stronie backendu:
1. **Zgoda na politykę prywatności** — rejestrowana w bazie, wymagana przed
   dostępem do appki dla nowych userów
2. **Prawo do usunięcia danych** — endpoint `DELETE /api/auth/me` kasuje
   usera i wszystkie jego dane (CV, aplikacje, notatki, pliki z dysku)
3. **Brak bonusowych rzeczy** — żadnego eksportu danych, żadnych cookies
   consentów poza minimum

---

## Architektura consent flow

```
  Nowy user loguje się przez Google
            ↓
  CustomOAuth2UserService.loadUser
            ↓
  UserService.findOrCreateUser
    → tworzy User z privacy_policy_accepted_at = NULL
            ↓
  Frontend dostaje JWT
            ↓
  Frontend woła GET /api/auth/me
    → Response zawiera privacyPolicyAcceptedAt (null dla nowego)
            ↓
  Frontend: jeśli null → pokazuje ekran consent (blokada UI)
            ↓
  User akceptuje → POST /api/auth/consent
    → Backend: privacy_policy_accepted_at = now()
            ↓
  Normalny dostęp do appki
```

**Ochrona endpointów:** guard (filter lub HandlerInterceptor) sprawdza pole
`privacyPolicyAcceptedAt` na każdym wywołaniu poza whitelistą
(`/api/auth/me`, `/api/auth/consent`, `/api/auth/logout`, `/api/auth/refresh`,
`DELETE /api/auth/me`). Jeśli pole `null` → `403 Forbidden` z kodem
`CONSENT_REQUIRED` w body.

**Dlaczego user istnieje w bazie przed akceptacją zgody?**
Technicznie musimy zapisać usera żeby wystawić mu JWT (JWT zawiera userId).
Alternatywa — trzymanie "pending" stanu w sesji — wprowadza znacznie
więcej kodu. Trade-off: user w bazie jest, ale bez zgody nie może nic zrobić
(poza zaakceptowaniem lub wylogowaniem). W praktyce kolumna `privacy_policy_accepted_at = NULL`
oznacza "użytkownik w połowie rejestracji". Przy kasowaniu konta usuwamy tak samo.

---

## Status realizacji

### Etap 1 — Migracja schematu: pole `privacy_policy_accepted_at`

**Plik encji:** `entity/User.java`

- [x] Dodać pole `LocalDateTime privacyPolicyAcceptedAt` z `@Column(name = "privacy_policy_accepted_at")` (nullable)
- [x] Dodać getter `getPrivacyPolicyAcceptedAt()`
- [x] Dodać metodę domenową `acceptPrivacyPolicy()` ustawiającą pole na `LocalDateTime.now()` (**idempotentna** — jeśli już ustawione, nie nadpisuje; egzekwuje inwariant w domenie)
- [x] **Flyway migracja V13** `V13__user_privacy_policy_accepted_at.sql` — plan zakładał `ddl-auto=update`, ale projekt używa Flyway (migracje V1–V12 w `db/migration/`), więc zamiast polegać na Hibernate napisałem właściwą migrację
- [x] `./mvnw test` — 88/88 zielone

**Schemat:**

```java
@Column(name = "privacy_policy_accepted_at")
private LocalDateTime privacyPolicyAcceptedAt;

public LocalDateTime getPrivacyPolicyAcceptedAt() { return privacyPolicyAcceptedAt; }

public void acceptPrivacyPolicy() {
    this.privacyPolicyAcceptedAt = LocalDateTime.now();
}
```

---

### Etap 2 — `UserResponse` ujawnia stan zgody

**Plik:** `dto/UserResponse.java`

- [x] Dodać pole `privacyPolicyAcceptedAt` jako `String` (ISO-8601 z `LocalDateTime.toString()`, null-safe) — spójne z `CVResponse.uploadedAt`
- [x] Frontend na podstawie tego pola decyduje czy pokazać ekran consent
- [x] `./mvnw test` — 88/88 zielone (brak testu `/api/auth/me` w projekcie, nic do zaktualizowania)

---

### Etap 3 — Endpoint `POST /api/auth/consent`

**Plik:** `controller/AuthController.java`

- [x] Dodać nowy endpoint `POST /api/auth/consent`
- [x] Wymaga zalogowanego usera (`@AuthenticationPrincipal`)
- [x] Idempotentny: jeśli user już zaakceptował, nie nadpisuje daty — zwraca 204
- [x] Wywołuje nową metodę `userService.acceptPrivacyPolicy(userId)`
- [x] Response: `204 No Content`

**Schemat:**

```java
@PostMapping("/consent")
public ResponseEntity<Void> acceptConsent(
        @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
    userService.acceptPrivacyPolicy(authenticatedUser.id());
    return ResponseEntity.noContent().build();
}
```

**W `UserService`:**

```java
@Transactional
public void acceptPrivacyPolicy(UUID userId) {
    User user = getById(userId);
    if (user.getPrivacyPolicyAcceptedAt() == null) {
        user.acceptPrivacyPolicy();
        userRepository.save(user);
    }
}
```

---

### Etap 4 — Guard wymuszający zgodę

**Nowy plik:** `security/ConsentRequiredFilter.java` (lub `HandlerInterceptor`)

- [x] Filter po `JwtAuthenticationConverter` — user jest już zautentykowany
- [x] Whitelist endpointów (ścieżek bezwzględnych):
  - `GET /api/auth/me`
  - `POST /api/auth/consent`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
  - `DELETE /api/auth/me`
  - `/actuator/**` (jeśli używany)
- [x] Dla pozostałych: pobierz usera z bazy, sprawdź `privacyPolicyAcceptedAt`
- [x] Jeśli `null` → zwróć `403 Forbidden` z body `{"error": "CONSENT_REQUIRED"}`
- [x] Rejestracja w `SecurityConfig.java` — dodać filter do łańcucha po JWT
- [x] `./mvnw test` — testy kontrolerów wymagających zgody muszą teraz w setup tworzyć usera z ustawioną datą

**Decyzja do potwierdzenia:** ścieżka `DELETE /api/auth/me` w whitelist — user bez zgody nadal musi móc usunąć swoje konto (to jest prawo RODO, niezależne od consentu na usługę).

---

### Etap 5 — Endpoint `DELETE /api/auth/me`

**Plik:** `controller/AuthController.java`

- [x] Dodać endpoint `DELETE /api/auth/me`
- [x] Wywołuje `userService.deleteAccount(userId)`
- [x] Czyści cookie `refresh_token` (analogicznie do logout)
- [x] Response: `204 No Content`

**Schemat:**

```java
@DeleteMapping("/me")
public ResponseEntity<Void> deleteAccount(
        @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
        HttpServletResponse response) {
    userService.deleteAccount(authenticatedUser.id());

    Cookie cookie = new Cookie("refresh_token", "");
    cookie.setHttpOnly(true);
    cookie.setSecure(true);
    cookie.setPath("/api/auth");
    cookie.setMaxAge(0);
    response.addCookie(cookie);

    return ResponseEntity.noContent().build();
}
```

**W `UserService`:**

```java
@Transactional
public void deleteAccount(UUID userId) {
    User user = getById(userId);

    // 1. Fizyczne pliki CV z dysku
    List<CV> cvs = cvRepository.findByUserId(userId);
    for (CV cv : cvs) {
        if (cv.getType() == CVType.FILE && cv.getFilePath() != null) {
            try { Files.deleteIfExists(Paths.get(cv.getFilePath())); }
            catch (IOException e) { log.warn("Could not delete CV file {}", cv.getFilePath(), e); }
        }
    }

    // 2. Delete notes (before applications, to avoid FK constraint issues)
    List<Application> applications = applicationRepository.findByUserId(userId);
    for (Application app : applications) {
        noteRepository.deleteByApplicationId(app.getId());
    }

    // 3. Delete applications
    applicationRepository.deleteAll(applications);

    // 4. Delete CVs
    cvRepository.deleteAll(cvs);

    // 5. Delete user
    userRepository.delete(user);
}
```

**Decyzja:** **Ręczne usuwanie** — jawność kolejności (notatki → aplikacje → CVy → user),
łatwiej debugować, gwarancja że pliki z dysku są posprzątane przed usunięciem rekordów.

---

### Etap 6 — Strona `/privacy` (statyczny content przez backend?)

**Decyzja projektowa:** Czy stronę polityki serwujemy z frontendu (React
route) czy z backendu (REST endpoint zwracający markdown/HTML)?

**Rekomendacja:** **Frontend**. Polityka to część UI (styling, i18n,
nawigacja w appce). Backend nie musi wiedzieć o jej istnieniu.

**Zatem w tym planie:** brak zadań backendowych dla `/privacy`. Strona
obsłużona w pełni we frontend planie.

---

### Etap 7 — Testy

**Plik:** `test/controller/AuthControllerTest.java` (i ewentualnie nowe pliki)

- [x] Test `POST /api/auth/consent` dla nowego usera:
  - Response 204
  - Pole `privacy_policy_accepted_at` w bazie jest ustawione
- [x] Test `POST /api/auth/consent` dwa razy:
  - Drugie wywołanie nie zmienia daty (idempotentność)
- [x] Test `GET /api/auth/me` zwraca `privacyPolicyAcceptedAt` w response
- [x] Test guardu: wywołanie `DELETE /api/auth/me` kasuje user + wszystkie dane
- [x] `./mvnw test` — 92 testy zielone (88 existing + 4 new AuthControllerTest)

**Pozostałe testy** (CVControllerTest, ApplicationControllerTest, itd.):
- [x] Setup tworzy usera z ustawionym `privacyPolicyAcceptedAt = LocalDateTime.now()`
- [x] Zmiana w metodzie `@BeforeEach` we wszystkich 4 test klasach

---

## Definicja ukończenia (DoD)

- [x] Nowy user po loginie Google ma `privacy_policy_accepted_at = NULL` w bazie
- [x] `GET /api/auth/me` zwraca pole `privacyPolicyAcceptedAt` (null lub ISO-8601)
- [x] `POST /api/auth/consent` ustawia pole na `now()`, idempotentny
- [x] Guard: wszystkie endpointy poza whitelistą zwracają 403 `CONSENT_REQUIRED` dla usera bez zgody
- [x] `DELETE /api/auth/me` kasuje usera, jego CV (rekordy + pliki), aplikacje, notatki; czyści cookie refresh_token
- [x] `./mvnw test` — 92 passed, 0 failed
- [x] Manualny test: pełen flow od loginu nowego usera do dostępu do appki ✅

---

## Poza zakresem

- **Endpoint `GET /api/auth/me/export`** — prawo do przenoszenia danych RODO;
  opcjonalne, rozważane po fazie 07
- **Versioning polityki prywatności** — pole będzie tylko `privacy_policy_accepted_at` (timestamp),
  nie `privacy_policy_version`. Jeśli kiedyś zmienimy politykę i trzeba będzie wymusić
  ponowną akceptację — dopiero wtedy dodamy wersjonowanie
- **Soft delete** — konto usuwamy twardo (hard delete). Prawo RODO mówi o całkowitym usunięciu
- **Audyt kto i kiedy usunął konto** — nie logujemy, bo to by oznaczało przechowywanie danych usuniętego usera (sprzeczne z celem)
- **Email potwierdzający usunięcie** — nie mamy systemu wysyłki maili, poza zakresem
- **Rate limiting na DELETE /me** — opcjonalne, ale małe ryzyko (user musi być zalogowany); rozważane w `retention-hygiene`

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `entity/User.java` | Pole `privacyPolicyAcceptedAt` + metoda `acceptPrivacyPolicy()` |
| `dto/UserResponse.java` | Ekspozycja pola `privacyPolicyAcceptedAt` |
| `controller/AuthController.java` | `POST /api/auth/consent`, `DELETE /api/auth/me` |
| `service/UserService.java` | `acceptPrivacyPolicy(userId)`, `deleteAccount(userId)` |
| `security/ConsentRequiredFilter.java` | **Nowy plik** — guard |
| `config/SecurityConfig.java` | Rejestracja filteru w łańcuchu |
| `test/controller/AuthControllerTest.java` | Nowe testy + poprawki setupu |
| `test/controller/*ControllerTest.java` (pozostałe) | Setup tworzy usera ze zgodą |

---

*Ostatnia aktualizacja: 2026-04-23 — COMPLETE ✅*
