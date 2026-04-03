# Notatki z nauki backendu — EasyApply

Plik do wracania. Każdy etap = kluczowe pojęcia, ważne pliki, naprawione CR.

---

## Etap 1 — Przegląd architektury, Security, OAuth2, JWT

### Przepływ request → response

Przykład: `POST /api/applications`

```
HTTP POST /api/applications  (+ nagłówek Authorization: Bearer <JWT>)
  ↓
[CORS filter]                → czy origin frontendu jest na liście allowedOrigins?
[OAuth2 Resource Server]     → wyciąga JWT z nagłówka
                               → JwtDecoder weryfikuje podpis i exp
                               → JwtAuthenticationConverter: JWT → AuthenticatedUser
                               → SecurityContext.setAuthentication(...)
[Authorization filter]       → .anyRequest().authenticated() — ma token? OK.
[MdcUserFilter]              → wyciąga userId z SecurityContext, wkłada do logów
  ↓
ApplicationController.create()
  → @AuthenticationPrincipal AuthenticatedUser user  (z SecurityContext)
  → @Valid @RequestBody ApplicationRequest           (walidacja DTO przed metodą)
  ↓
ApplicationService.create()  (@Transactional)
  → userRepository.findById()
  → new Application(...)
  → applicationRepository.save()     ↑
  → stageHistoryRepository.save()    ↑  jeden rollback jeśli coś się posypie
  ↓
ApplicationResponse (DTO) → JSON → 201 Created
```

Jeśli JWT nieprawidłowy lub brakuje → Spring Security zwraca **401**, metoda kontrolera się nie wywołuje.

---

### Warstwy — co robi każda

| Warstwa | Odpowiedzialność | Co NIE robi |
|---------|-----------------|-------------|
| Controller | HTTP: parsuje, wywołuje service, buduje response | logika biznesowa |
| Service | logika biznesowa, transakcje, reguły | dostęp do DB bezpośrednio |
| Repository | SQL/JPA, dostęp do bazy | żadnej logiki |
| Entity | model danych (tabela) | logika biznesowa |
| DTO | kontrakt z frontem | nie trafia do bazy |

---

### CORS — co to i dlaczego

Przeglądarka blokuje requesty między różnymi originami (protokół + domena + port).
`localhost:5173` → `localhost:8080` = dwa originy → przeglądarka pyta backend (preflight OPTIONS).

Backend odpowiada: "ten origin jest OK" → przeglądarka przepuszcza request.

```java
// SecurityConfig.java
config.setAllowedOrigins(List.of(allowedOrigins.split(",")));
config.setAllowCredentials(true);  // bez tego cookie nie jest wysyłane razem z requestem
```

`allowedOrigins` pochodzi z `application.properties` (zmienna środowiskowa).
CORS dotyczy **tylko przeglądarek** — curl/Postman go nie sprawdzają.

---

### Sesja HTTP vs JWT (stateless)

**Sesja (stare podejście):**
- Serwer tworzy sesję i zapamiętuje użytkownika w pamięci
- Przeglądarka dostaje cookie `JSESSIONID`
- Przy każdym request serwer szuka sesji w pamięci
- Problem: serwer musi pamiętać każdego zalogowanego — przy wielu serwerach trzeba synchronizować

**JWT (stateless — Twoje podejście):**
- Serwer nic nie pamięta
- Cała "sesja" jest w tokenie (JWT) po stronie klienta
- Przy każdym request serwer weryfikuje podpis tokena — informacja jest wewnątrz
- Działa na wielu serwerach bez synchronizacji

`SessionCreationPolicy.STATELESS` = Spring nie tworzy HttpSession.

---

### Kryptografia — klucz i podpis (uproszczone)

**RSA = para kluczy:**
- **Prywatny** — tylko serwer go ma, podpisuje tokeny
- **Publiczny** — możesz dać każdemu, weryfikuje czy podpis jest prawdziwy

**Podpis** = matematyczna operacja:
```
podpis = encrypt(hash(dane), klucz_prywatny)
weryfikacja: hash(dane) == decrypt(podpis, klucz_publiczny)  → OK
```

Nikt nie może sfałszować podpisu bez klucza prywatnego — nawet znając klucz publiczny.

**W projekcie:**
Klucz generowany przy starcie w pamięci (`RSAKeyGenerator(2048)`).
Po restarcie stare tokeny nieważne — OK, bo access token żyje tylko 15 min.

---

### JWT — struktura

```
HEADER.PAYLOAD.SIGNATURE
```

Każda część to Base64 — odkodować może każdy. JWT nie jest szyfrowany, tylko podpisany.

**HEADER:**
```json
{ "alg": "RS256", "kid": "easyapply-key" }
```

**PAYLOAD (claims):**
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  ← userId
  "email": "jakub@gmail.com",
  "name": "Jakub",
  "iat": 1711900000,   ← issued at (kiedy wystawiony)
  "exp": 1711900900    ← expiration (kiedy wygasa)
}
```

**SIGNATURE:** `RSA_sign(HEADER + "." + PAYLOAD, klucz_prywatny)`

**Claims** = pola w PAYLOAD. Standardowe: `sub`, `iat`, `exp`. Własne: `email`, `name`.
Nie wrzucaj do JWT haseł ani tajemnic — payload jest publiczny.

---

### JWK — co to

JWK = JSON Web Key. Klucz kryptograficzny w formacie JSON.
JWKSet = zbiór kluczy (przydatne przy rotacji).
JWKSource = interfejs "skarbiec kluczy" — Nimbus pyta go o klucz do podpisania/weryfikacji.

---

### Klasa `Jwt` z Spring Security

Gotowa klasa z API (`org.springframework.security.oauth2.jwt`). Trzyma zdekodowany token:

```java
jwt.getSubject()              // claims["sub"]
jwt.getClaimAsString("email") // claims["email"]
jwt.getExpiresAt()            // claims["exp"]
```

Spring Security sam dekoduje token string → obiekt `Jwt` → przekazuje do Twojego konwertera.

---

### UUID — co to i dlaczego

UUID = 128-bitowy losowy identyfikator: `550e8400-e29b-41d4-a716-446655440000`

Dlaczego nie `Long id`?
- `Long` jest sekwencyjny (1, 2, 3...) → atakujący może zgadywać ID innych użytkowników
- UUID jest losowy → nie do zgadnięcia

W projekcie: `User.id` to UUID, generowany przez bazę przy INSERT. W JWT trafia jako `sub`.

---

### Principal — co to

Principal = "kto jest zalogowany". Ogólny koncept z Javy i Spring Security.

W Spring Security `Authentication` trzyma:
- `principal` → kto (u Ciebie: `AuthenticatedUser`)
- `credentials` → dowód (JWT string, zwykle null po weryfikacji)
- `authorities` → uprawnienia / role (u Ciebie: puste)

`@AuthenticationPrincipal` = adnotacja która wyciąga `authentication.getPrincipal()` i wstrzykuje do parametru metody.

---

### Łańcuch: JWT string → AuthenticatedUser w kontrolerze

```
JWT string w nagłówku (Authorization: Bearer ...)
    ↓
JwtDecoder.decode()              [Spring Security, automatycznie]
    → weryfikuje podpis i exp
    → zwraca obiekt Jwt (z claims)
    ↓
JwtAuthenticationConverter.convert(Jwt jwt)    [Twój kod]
    → wyciąga sub, email, name z claims
    → tworzy new AuthenticatedUser(userId, email, name)
    → zwraca AuthenticatedUserToken (principal = AuthenticatedUser)
    ↓
SecurityContextHolder.setAuthentication(...)   [Spring Security]
    ↓
MdcUserFilter.doFilterInternal()               [Twój kod]
    → SecurityContextHolder.getAuthentication().getPrincipal()
    → MDC.put("userId", user.id())     ← każdy log dostaje userId
    → filterChain.doFilter(...)
    → finally: MDC.remove("userId")    ← KRYTYCZNE: wątek wraca do puli
    ↓
@AuthenticationPrincipal AuthenticatedUser user  [w kontrolerze]
```

**Gdzie co jest napisane przez Ciebie:**
- `JwtAuthenticationConverter.java` — konwersja JWT → AuthenticatedUser
- `AuthenticatedUser.java` — record (id, email, name)
- `MdcUserFilter.java` — wkładanie userId do logów
- `SecurityConfig.java` — konfiguracja (co jest publiczne, jakie CORS, jaki decoder)

**Co daje Spring Security / Nimbus (gotowe z API):**
- `JwtDecoder`, `JwtEncoder` — implementacje (NimbusJwtDecoder/Encoder)
- Cały filter chain — CORS, session, authorization
- `@AuthenticationPrincipal` — wstrzykiwanie principal do metody
- `Jwt` — klasa z claims

---

### OAuth2 — przepływ logowania

```
1. Frontend → redirect na Google
   (Spring Security generuje URL automatycznie)

2. Google → ekran logowania (Ty tego nie robisz)
   Użytkownik wpisuje hasło w Google, nie u Ciebie

3. Google → redirect z powrotem na:
   /login/oauth2/code/google?code=JEDNORAZOWY_KOD

4. Spring Security odbiera code → wymienia na token u Google (serwer-serwer)
   Google zwraca: { id_token: "...", access_token: "..." }

5. Spring Security wyciąga dane usera z id_token
   → wywołuje CustomOAuth2UserService  [Twój kod]
      szuka usera w bazie po googleId
      jeśli nie ma → tworzy nowego User
      jeśli jest → aktualizuje email/imię

6. OAuth2AuthenticationSuccessHandler  [Twój kod]
   → generuje access token (JWT, RS256, 15 min)
   → generuje refresh token (JWT, RS256, 7 dni)
   → ustawia refresh token jako httpOnly cookie
   → redirect na frontend z access tokenem
```

**Co Ty piszesz, co daje framework:**

| Co | Kto robi |
|----|---------|
| Redirect do Google | Spring Security automatycznie |
| Ekran logowania | Google |
| Wymiana code → token | Spring Security automatycznie |
| Tworzenie/aktualizacja User w bazie | Ty → `CustomOAuth2UserService` |
| Generowanie Twojego JWT | Ty → `OAuth2AuthenticationSuccessHandler` |
| Weryfikacja JWT na każdy request | Spring Security automatycznie |

**Słowniczek OAuth2:**

| Termin | Co to |
|--------|-------|
| Client | Twoja aplikacja (EasyApply) |
| Resource Owner | Użytkownik (właściciel konta Google) |
| Authorization Server | Google — wydaje tokeny |
| Resource Server | Twój backend — chroni API |
| Authorization Code | Jednorazowy code z redirectu |
| scope | Jakie dane chcesz od Google (`email`, `profile`) |
| redirect_uri | Gdzie Google odsyła po logowaniu |

**Dlaczego code, nie token bezpośrednio?**
Wymiana code → token dzieje się serwer-serwer (z `client_secret`). Żaden pośrednik w sieci nie widzi tokena Google.

---

### SecurityConfig — co Ty tworzysz, co jest gotowe

| Bean | Co robi | Kto implementuje |
|------|---------|-----------------|
| `rsaKey()` | generuje parę kluczy RSA 2048 bit | Nimbus (biblioteka) |
| `jwkSource()` | pakuje klucz w "skarbiec" | Nimbus |
| `jwtEncoder()` | tworzy/podpisuje JWT | Nimbus (NimbusJwtEncoder) |
| `jwtDecoder()` | weryfikuje JWT, zwraca Jwt | Nimbus (NimbusJwtDecoder) |
| `securityFilterChain()` | konfiguruje reguły security | Ty konfigurujesz, Spring buduje |
| `corsConfigurationSource()` | reguły CORS | Ty konfigurujesz, Spring stosuje |

---

---

## Etap 2 — Security: OAuth2, JWT, ciasteczka

### Access token vs Refresh token — przepływ

```
Logowanie przez Google
  → access token  → URL (/auth/callback?token=...) → frontend trzyma w pamięci JS
  → refresh token → httpOnly cookie (przeglądarka trzyma sama)
  → refresh token → baza danych (serwer trzyma kopię do weryfikacji)

Request po 5 minutach:
  → frontend wysyła: Authorization: Bearer <access_token>
  → refresh token NIE jest wysyłany (cookie idzie tylko do /api/auth)
  → działa ✅

Request po 20 minutach (access token wygasł):
  → frontend wysyła access token → backend zwraca 401
  → frontend woła POST /api/auth/refresh
  → przeglądarka automatycznie dołącza httpOnly cookie z refresh tokenem
  → backend: userService.findByValidRefreshToken(token) — szuka w bazie
  → znajdzie i nie wygasł → generuje nowy access token
  → frontend dostaje nowy access token → trzyma w pamięci JS
  → ponawia oryginalny request ✅
```

### Dlaczego refresh token to UUID, a nie JWT

JWT jest **bezstanowy** — serwer nic nie pamięta, tylko weryfikuje podpis.
Żeby unieważnić JWT trzeba prowadzić blacklistę — skomplikowane.

Refresh token jako UUID jest **zapisany w bazie**. Unieważnienie = usunięcie z bazy.
Logout: `userService.clearRefreshToken(user)` + cookie `MaxAge=0`.

### localStorage vs httpOnly cookie

| | localStorage | httpOnly cookie |
|--|-------------|-----------------|
| JS może odczytać | tak | nie (`document.cookie` zwraca "") |
| Wysyłanie do serwera | ręcznie w nagłówku | przeglądarka automatycznie |
| Podatność na XSS | tak | nie |

Access token w pamięci JS jest do ukradzenia przez XSS — ale żyje tylko 15 min.
React domyślnie chroni przed XSS (escapuje HTML w JSX).

### CSRF i SameSite

**CSRF** = atakujący nakłania przeglądarkę do wysłania requestu do Twojej domeny w Twoim imieniu (przeglądarka dołącza cookies automatycznie).

**SameSite=Strict** — przeglądarka nie wysyła cookie gdy request pochodzi z obcej strony. Atak niemożliwy.

Minus Strict: kliknięcie zewnętrznego linku do aplikacji → brak cookie przy pierwszym request → widoczny jako niezalogowany (jednorazowy zgrzyt, po odświeżeniu OK).
Dlatego wiele aplikacji używa `Lax` — linki działają, automatyczne POST-y z obcych stron blokowane.

### JwtService — jak powstaje access token

```java
JwtClaimsSet claims = JwtClaimsSet.builder()
        .subject(user.getId().toString())            // UUID usera
        .claim("email", user.getEmail())
        .claim("name", user.getName())
        .expiresAt(now.plus(15, ChronoUnit.MINUTES))
        .build();
jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
// jwtEncoder podpisuje kluczem prywatnym RSA → string "aaa.bbb.ccc"
```

### CR-3 i CR-5 — już naprawione przed sesją

**CR-3** — backend zwracał `"token"` zamiast `"accessToken"`.
Frontend robił `const { accessToken } = response` → `undefined` — cichy błąd, user wylogowywany po 15 min.
Naprawione: `Map.of("accessToken", newAccessToken)` w `AuthController.java:72`.

**CR-5** — brak `SameSite` na cookie → podatność na CSRF.
Naprawione: `refreshCookie.setAttribute("SameSite", "Strict")` w `OAuth2AuthenticationSuccessHandler.java:80`.

### Pliki kluczowe dla tego etapu

| Plik | Co robi |
|------|---------|
| `JwtService.java` | Generuje access token (JWT) i refresh token (UUID) |
| `OAuth2AuthenticationSuccessHandler.java` | Po logowaniu: generuje tokeny, ustawia cookie, redirect |
| `AuthController.java` | `/refresh` — weryfikuje refresh token, wydaje nowy access token; `/logout` — czyści |

---

### Pliki kluczowe dla tego etapu (Etap 1)

| Plik | Co robi |
|------|---------|
| `SecurityConfig.java` | Serce konfiguracji — RSA, JWT, CORS, reguły dostępu |
| `JwtAuthenticationConverter.java` | JWT (claims) → AuthenticatedUser |
| `AuthenticatedUser.java` | Record: id (UUID), email, name |
| `MdcUserFilter.java` | Dodaje userId do każdego logu |
| `CustomOAuth2UserService.java` | Tworzy/aktualizuje User po logowaniu Google |
| `OAuth2AuthenticationSuccessHandler.java` | Generuje JWT, ustawia cookie po OAuth2 |
| `ApplicationController.java` | Przykład użycia @AuthenticationPrincipal |
| `ApplicationService.java` | Przykład @Transactional |

---

## Etap 3 — Security: walidacja danych i plików

### CR-1 — Path traversal

`file.getOriginalFilename()` zwraca nazwę podaną przez klienta — atakujący może wpisać `/etc/passwd` lub `../../etc/cron.d/backdoor`.

`Path.resolve()` z absolutną ścieżką ignoruje `uploadDir` i zapisuje plik gdzie atakujący chce.

**Fix:** Na dysk idzie tylko `UUID.randomUUID() + ".pdf"`. Oryginalna nazwa jest już w bazie (`originalFileName`), nie musi być w ścieżce pliku.

```java
// PRZED (luka)
String fileName = UUID.randomUUID() + "_" + originalFileName;

// PO (bezpieczne)
String fileName = UUID.randomUUID() + ".pdf";
```

### CR-B3 — Magic bytes

`Content-Type` nagłówek ustawia klient — atakujący może wysłać `.exe` z `Content-Type: application/pdf`.

Magic bytes = pierwsze bajty pliku identyfikują jego rzeczywisty typ. PDF zawsze zaczyna się od `%PDF-` (`25 50 44 46 2D`).

**Fix:** Czytamy pierwsze 5 bajtów z `file.getInputStream()` i porównujemy z `%PDF-`. Oba muszą zgadzać: Content-Type + magic bytes.

```java
byte[] header = new byte[5];
if (file.getInputStream().read(header) < 5
        || header[0] != 0x25 || header[1] != 0x50
        || header[2] != 0x44 || header[3] != 0x46
        || header[4] != 0x2D) {
    throw new IllegalArgumentException(...);
}
```

`MultipartFile.getInputStream()` można wywołać wielokrotnie (plik tymczasowy na dysku) — `Files.copy` poniżej działa poprawnie.

### CR-B1 — Walidacja URL-i (defense in depth)

Frontend waliduje URL — ale API jest publiczne, ktoś może wysłać request z pominięciem frontendu.

`javascript:alert(document.cookie)` zapisany jako `externalUrl` → frontend renderuje `<a href="javascript:...">` → XSS przy kliknięciu.

**Fix:** URL musi zaczynać się od `http://` lub `https://`. Dotyczy zarówno `createCV` jak i `updateCV`.

```java
if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    throw new IllegalArgumentException(...);
}
```

### CR-B2 — @NotNull na StageUpdateRequest

Brak `@NotNull` na `status` → `null` przechodzi do serwisu → NPE → 500 Internal Server Error.

**Fix:** `@NotNull ApplicationStatus status` w `StageUpdateRequest.java`. Bean Validation łapie null przed wywołaniem metody serwisu → 400 Bad Request z czytelnym komunikatem.

Zasada: walidację stawiamy na granicy systemu (DTO/API), nie wewnątrz serwisu.

### Pliki kluczowe

| Plik | Co zmieniono |
|------|-------------|
| `CVService.java` | CR-1 (UUID filename), CR-B3 (magic bytes), CR-B1 (URL validation) |
| `StageUpdateRequest.java` | CR-B2 (@NotNull na status) |
| `messages.properties` / `messages_pl.properties` | Nowy komunikat `error.cv.urlInvalid` |

---

## Etap 4 — Jakość kodu i wzorce

### Spring AOP i proxy

AOP (Aspect-Oriented Programming) = dodanie zachowania do wielu metod bez modyfikowania każdej z nich.

Spring przy starcie aplikacji tworzy **proxy** — dynamiczną podklasę Twojego beana (CGLIB). Kiedy wstrzykujesz `@Autowired ApplicationService`, dostajesz proxy, nie oryginał.

```
Controller → applicationService (PROXY) → otwiera transakcję → super.addStage() (Twój kod) → commit/rollback
```

Proxy nadpisuje metody (`@Override`) żeby dodać logikę przed/po. Dlatego:
- **prywatna metoda** — Java nie pozwala jej nadpisać w podklasie → proxy jej nie widzi → `@Transactional` ignorowany
- **`this.metoda()`** — wywołanie bezpośrednio na obiekcie, omija proxy → `@Transactional` ignorowany

### `@Transactional(readOnly = true)`

Mówi Hibernate: "ta transakcja tylko czyta". Hibernate wyłącza **dirty checking** (sprawdzanie czy encje się zmieniły przed commitem). Lżejsze i szybsze dla metod `findAll...`.

### CR-10 — naprawione

Usunięto `@Transactional` z prywatnej metody `markCurrentStageCompleted()` w `ApplicationService.java:148`.
Adnotacja była ignorowana (prywatna metoda) i myląca — metoda zawsze działa w transakcji `addStage()`.

### CR-B7 — user_id NOT NULL

Migracja V4 dodała `user_id` jako nullable ("na razie, bo istniejące wiersze mają null") i nigdy nie wymusiła NOT NULL. Skutek: baza nie chroniła przed wstawieniem rekordu bez właściciela.

**Fix:** Migracja V11 — usuwa osierocone wiersze (bez `user_id`), potem `ALTER TABLE ... SET NOT NULL` na `applications` i `cvs`.

Zasada: **historycznych migracji Flyway nie edytujemy** — Flyway weryfikuje checksumę każdego zastosowanego pliku. Zmiana komentarzy w V2/V4 wywołałaby `checksum mismatch` na produkcji.

### GlobalExceptionHandler — jak działa

`@RestControllerAdvice` = Spring wie, że ta klasa obsługuje wyjątki ze wszystkich kontrolerów.
`extends ResponseEntityExceptionHandler` = dziedziczysz po klasie bazowej Spring MVC, która już obsługuje wewnętrzne wyjątki (np. `MethodArgumentNotValidException`). Możesz nadpisywać jej metody przez `@Override`.
`@Order(HIGHEST_PRECEDENCE)` = jeśli byłoby kilka handlerów — ten ma pierwszeństwo.

**Kto rzuca, kto łapie:**

| Kto rzuca | Gdzie w kodzie | Kto łapie |
|-----------|----------------|-----------|
| Spring (`@Valid` fail) | automatycznie przy wejściu do kontrolera | `handleMethodArgumentNotValid` |
| `new EntityNotFoundException(...)` | w serwisach, gdy brak w bazie | `handleEntityNotFoundException` |
| `new IllegalArgumentException(...)` | CVService (path traversal, magic bytes, URL) | `handleIllegalArgumentException` |
| Cokolwiek innego | gdziekolwiek | `handleGenericException` |

**ProblemDetail** = klasa Spring (RFC 9457). Zamiast własnego JSON-a używasz gotowej struktury:
```json
{ "status": 400, "title": "...", "detail": "..." }
```
`problem.setProperty("errors", mapa)` — dodaje własne pole do response.

**MessageSource** = mechanizm tłumaczeń. Klucze trzymasz w `messages.properties` / `messages_pl.properties`,
`messageSource.getMessage("klucz", null, locale)` zwraca tekst w języku usera.

### Pliki kluczowe

| Plik | Co zmieniono |
|------|-------------|
| `ApplicationService.java` | CR-10: usunięto `@Transactional` z `markCurrentStageCompleted()` |
| `V11__user_id_not_null.sql` | CR-B7: NOT NULL na `user_id` w `applications` i `cvs` |