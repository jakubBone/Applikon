# Plan implementacji retention & hygiene — EasyApply Backend

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

Domknąć fazę 07 w trzech obszarach higieny danych:

1. **Auto-retencja** — cron usuwa konta nieaktywne > 12 miesięcy
2. **Audyt logów** — weryfikacja że logi nie zawierają emaili, nazw, tokenów
3. **Hashowanie refresh tokena** — token w bazie jako hash, nie plaintext

Na końcu: aktualizacja dokumentacji (`README.md`, `spec/README.md`, `as-built.md`)
zamykająca fazę 07.

---

## Stan wyjściowy

- `User.refreshToken` trzymany w bazie jako **plaintext UUID** (patrz `entity/User.java:29`)
- `MdcUserFilter` loguje tylko UUID usera (`security/MdcUserFilter.java:39`) — już OK
- `CVService` loguje `fileName` (UUID.pdf) i `userId` — bez PII
- Brak pola tracking "ostatnia aktywność" — jedyne sygnały: `createdAt` i `refreshTokenExpiry`
- Brak `@EnableScheduling` / cronów

---

## Status realizacji

### Etap 1 — Pole `last_login_at` w User

**Plik:** `entity/User.java`

- [ ] Dodać pole `LocalDateTime lastLoginAt` z `@Column(name = "last_login_at")`
- [ ] Metoda `recordLogin()` ustawiająca pole na `LocalDateTime.now()`
- [ ] Getter `getLastLoginAt()`

**Gdzie wywoływać `recordLogin()`?**

- `UserService.findOrCreateUser(...)` — dla istniejącego usera aktualizujemy, dla nowego ustawiamy wraz z `createdAt`
- `UserService.findByValidRefreshToken(...)` — bump przy odświeżeniu tokenu (user aktywnie korzysta)

**Interpretacja "nieaktywny":** użytkownik który od ponad 12 miesięcy nie
zalogował się i nie odświeżył sesji. Wystarczające dla portfolio projektu —
alternatywa (update na każdym request'cie) dodaje write na każdym API call,
co jest dużym narzutem.

---

### Etap 2 — Scheduled job usuwający nieaktywne konta

**Nowy plik:** `service/AccountRetentionService.java`

- [ ] Klasa `@Service` z metodą `@Scheduled(cron = "0 0 3 * * *")` (codziennie o 3:00)
- [ ] Metoda znajduje userów z `lastLoginAt < now() - 12 months` (lub `createdAt < now() - 12 months AND lastLoginAt IS NULL` dla userów którzy się zarejestrowali ale nigdy nie zaakceptowali polityki)
- [ ] Dla każdego takiego usera wywołuje `userService.deleteAccount(userId)` (ta sama metoda co z `DELETE /me` — gwarancja identycznego flow kasowania)
- [ ] Logowanie: tylko liczba usuniętych kont (`log.info("Retention job removed {} inactive accounts", count)`) — **bez** emaili/ID usuniętych userów

**Plik:** `EasyApplyApplication.java`

- [ ] Dodać annotację `@EnableScheduling` do głównej klasy (jeśli jeszcze nie ma)

**Repository:**

**Plik:** `repository/UserRepository.java`

- [ ] Dodać metodę `List<User> findByLastLoginAtBefore(LocalDateTime threshold)` (lub z `@Query`)
- [ ] Wariant: `findInactiveUsers(LocalDateTime threshold)` łapiący oba przypadki (null lastLogin + stary createdAt)

**Konfigurowalność progu:**

- [ ] Próg 12 miesięcy wyciągnąć do `application.properties`: `app.retention.inactive-months=12`
- [ ] Wstrzyknąć przez `@Value` — łatwiej testować i dostosować

---

### Etap 3 — Testy retencji

**Nowy plik:** `test/service/AccountRetentionServiceTest.java`

- [ ] Test: user z `lastLoginAt > threshold` nie jest usuwany
- [ ] Test: user z `lastLoginAt < threshold` jest usuwany (wraz z CV, aplikacjami, notatkami i plikami z dysku)
- [ ] Test: user z `lastLoginAt = null` i `createdAt < threshold` jest usuwany
- [ ] Test: gdy nie ma nieaktywnych userów, job kończy się bez błędu i loguje `count=0`
- [ ] `./mvnw test` zielony

---

### Etap 4 — Hashowanie refresh tokena

**Obecny stan:**

`User.refreshToken` zawiera plaintext UUID. `User.isRefreshTokenValid(token)`
wykonuje `refreshToken.equals(token)`. Kradzież bazy = kradzież aktywnych sesji
wszystkich userów.

**Zmiana:**

Przy zapisie → hashujemy (np. SHA-256) token i zapisujemy hash.
Przy walidacji → hashujemy przychodzący token i porównujemy hashe.
Sam token jest wysyłany do klienta raz (w cookie), nigdy go nie odzyskujemy z bazy.

**Plik:** `security/JwtService.java` (lub nowy `security/TokenHasher.java`)

- [ ] Dodać util `TokenHasher.hash(String token)` — SHA-256 → hex
- [ ] SHA-256 wystarczy (token to UUID o 122 bitach entropii — nie podatny na rainbow tables, bcrypt/argon2 jest overkill i spowalnia)

**Plik:** `service/UserService.java`

- [ ] Metoda generująca refresh token: zapisuj do bazy `TokenHasher.hash(token)`, zwracaj plaintext do klienta (JwtService / Controller)
- [ ] Metoda `findByValidRefreshToken(String token)`:
  - Hashuj przychodzący token
  - Wyszukaj w bazie po hashu (zamiast `refreshToken.equals(...)`)
  - Sprawdź expiry

**Plik:** `entity/User.java`

- [ ] Metoda `isRefreshTokenValid(String tokenHash)` przyjmuje hash (nie plaintext) i porównuje z `this.refreshToken`
- [ ] Nazwa kolumny pozostaje `refresh_token` (semantyka się nie zmieniła — dalej "nasz token"), ale zawartość to hash

**Migracja istniejących tokenów:**

Istniejące refresh tokeny w bazie są plaintext. Po wdrożeniu hashowania nie
zmatchują się z hashowanymi wersjami — wszyscy zalogowani userzy zostaną
wylogowani. **Akceptowalne** (jednorazowa niedogodność dla < 10 userów w tym momencie).

- [ ] Skrypt jednorazowy (opcjonalny): `UPDATE users SET refresh_token = NULL WHERE refresh_token IS NOT NULL;` — żeby wymusić re-login zamiast pozwolić userom na "broken session" do expiry

---

### Etap 5 — Testy hashowania

**Pliki:** `test/security/JwtServiceTest.java` / `test/service/UserServiceTest.java`

- [ ] Test: po wygenerowaniu refresh tokena w bazie jest hash (nie plaintext)
- [ ] Test: `findByValidRefreshToken(plaintext)` znajduje usera (hashuje i matchuje)
- [ ] Test: `findByValidRefreshToken(wrongToken)` rzuca wyjątek / zwraca pustą
- [ ] Test: `TokenHasher.hash("abc")` zwraca deterministyczny hex string
- [ ] `./mvnw test` zielony

---

### Etap 6 — Audyt logów

**Cel:** przegląd kodu pod kątem logowania PII (email, nazwa, tokeny).

**Znane miejsca — do weryfikacji:**

- [ ] `MdcUserFilter` — loguje tylko `userId` (UUID) ✅ OK (weryfikacja)
- [ ] `CVService.uploadCV` — `log.info("Uploaded CV file={} for user={}", fileName, userId)` — fileName to generowany UUID, nie original filename; userId to UUID ✅ OK
- [ ] `OAuth2AuthenticationSuccessHandler` — sprawdzić czy nie loguje emaila ani nazwy po Google loginie
- [ ] `CustomOAuth2UserService` — sprawdzić czy nie loguje `oAuth2User.getAttribute("email")` ani `name`
- [ ] `AuthController.refresh` i `logout` — czy nie logują tokena z cookie
- [ ] `GlobalExceptionHandler` — czy nie loguje pełnego body request lub stacktrace z PII
- [ ] `JwtService` — czy nie loguje tokena w logach DEBUG
- [ ] `application.properties` — `spring.jpa.show-sql=true` (SQL w logach ujawnia zapytania, w tym email przy `WHERE email = ?`)

**Zadania:**

- [ ] Przejść przez wszystkie `log.info/warn/error/debug` w `main/java/com/easyapply/**`
- [ ] Każde logowanie usera identyfikować tylko przez `userId` (UUID)
- [ ] Żadne logowanie nie zawiera raw tokena (ani access, ani refresh)
- [ ] Rozważyć `spring.jpa.show-sql=false` dla profilu `prod` (lub filtrowanie SQL przez Logback pattern)
- [ ] Logowania błędów (`log.error(..., e)`) — zweryfikować że exception message nie zawiera PII z request body

**Test manualny:**

- [ ] Wygenerować kilka requestów (login, logout, consent, delete account, upload próba) i przejrzeć logi — nie ma emaili, nazw, tokenów

---

### Etap 7 — Rate limiting na wrażliwe endpointy (opcjonalne)

**Cel:** minimalizacja ryzyka abuse dla `DELETE /me` (żeby zalogowany atakujący nie spamował żądań).

**Decyzja:** dla portfolio projektu z ~10-50 userów to **nadmiarowe**. Spring
Security + ograniczenie do zalogowanych userów jest wystarczające. Odkładamy.

- [ ] Ten etap oznaczony jako "nie realizowany w fazie 07"

---

### Etap 8 — Domknięcie fazy 07: dokumentacja

**Plik:** `README.md`

- [ ] Dodać sekcję **"Privacy & Data"**:
  - Jakie dane zbieramy (minimum)
  - Decyzja: CV tylko przez link (wariant B z brief fazy 07)
  - Link do `/privacy` w live appce
  - Link do polityki retencji
  - Uwaga: "Portfolio project — see `spec/v1/07-privacy-rodo/` for design rationale"

**Plik:** `spec/README.md`

- [ ] Dodać w tabeli V1 wiersz:
  ```
  | Privacy & RODO | `v1/07-privacy-rodo/` | Complete |
  ```

**Plik:** `spec/v1/as-built.md`

- [ ] Zaktualizować sekcje:
  - REST endpoints: `POST /api/auth/consent`, `DELETE /api/auth/me` (nowe), `POST /api/cv/upload` zwraca 503
  - DB schema: nowe kolumny `users.privacy_policy_accepted_at`, `users.last_login_at`; `refresh_token` teraz hash
  - Frontend: `/privacy`, `/settings`, `ConsentGate`, `Footer`
  - Scheduled jobs: `AccountRetentionService` (cron daily 3:00)
  - Flow auth: nowy krok "consent check" między loginem a dostępem do appki

---

## Definicja ukończenia (DoD)

- [ ] Pole `last_login_at` jest ustawiane przy loginie i refresh tokena
- [ ] Cron `AccountRetentionService` uruchamia się codziennie, usuwa konta z `lastLoginAt < now() - 12 months`
- [ ] Retencja jest testowana jednostkowo
- [ ] Refresh token w bazie przechowywany jako hash SHA-256 (nie plaintext)
- [ ] Walidacja refresh tokena działa (hashuje przychodzący token i porównuje)
- [ ] Logi nie zawierają emaili, nazw userów, tokenów w plaintext (weryfikacja manualna + przegląd kodu)
- [ ] `./mvnw test` — 0 failed
- [ ] `README.md` ma sekcję "Privacy & Data"
- [ ] `spec/README.md` odnotowuje fazę 07 jako "Complete"
- [ ] `spec/v1/as-built.md` zaktualizowany

---

## Poza zakresem

- **Rate limiting** — rozważane w Etapie 7, odrzucone dla tej fazy
- **Audit log tabel (kto kiedy się logował)** — sprzeczne z minimalizacją danych
- **Szyfrowanie całej tabeli `users` at-rest w aplikacji** — poziom infrastruktury (baza/dysk), nie aplikacji
- **Powiadomienia email przed usunięciem nieaktywnego konta** — brak systemu mailowego, poza zakresem
- **Configurable per-user retention** — jedna polityka dla wszystkich
- **Historia logowań usera** — jedno pole `lastLoginAt`, bez tabeli historii
- **Rotacja klucza hashującego** — SHA-256 nie używa klucza; gdybyśmy szli na HMAC, rotacja byłaby problemem — stąd wybór prostego SHA-256

---

## Pliki do zmiany / dodania

| Plik | Status | Zmiana |
|------|--------|--------|
| `entity/User.java` | modyfikacja | Pole `lastLoginAt` + `recordLogin()`; `isRefreshTokenValid` na hash |
| `service/UserService.java` | modyfikacja | `findOrCreateUser` aktualizuje `lastLoginAt`; refresh token hashowany |
| `service/AccountRetentionService.java` | **nowy** | `@Scheduled` cron usuwający nieaktywne konta |
| `security/TokenHasher.java` | **nowy** | SHA-256 util (lub metoda w `JwtService`) |
| `repository/UserRepository.java` | modyfikacja | `findInactiveUsers(threshold)` |
| `EasyApplyApplication.java` | modyfikacja | `@EnableScheduling` |
| `application.properties` | modyfikacja | `app.retention.inactive-months=12`, `spring.jpa.show-sql=false` dla prod |
| `test/service/AccountRetentionServiceTest.java` | **nowy** | Testy retencji |
| `test/service/UserServiceTest.java` | modyfikacja | Testy hashowania refresh tokena |
| Przegląd `log.*` w `main/java/com/easyapply/**` | modyfikacja | Usunięcie PII z logów |
| `README.md` | modyfikacja | Sekcja "Privacy & Data" |
| `spec/README.md` | modyfikacja | Wiersz fazy 07 |
| `spec/v1/as-built.md` | modyfikacja | Nowe endpointy, pola DB, frontend, scheduled jobs |

---

## Diagram retencji

```
  Codziennie 3:00 (cron)
         ↓
  AccountRetentionService.cleanupInactive()
         ↓
  UserRepository.findInactiveUsers(now - 12 months)
         ↓
  Dla każdego znalezionego usera:
         ↓
  UserService.deleteAccount(userId)
    ├── Files.delete(cv.filePath) dla każdego CV typu FILE
    ├── delete notes
    ├── delete applications
    ├── delete cv records
    └── delete user
         ↓
  log.info("Retention job removed {} accounts", count)
```

---

*Ostatnia aktualizacja: 2026-04-22*
