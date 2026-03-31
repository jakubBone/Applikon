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

### Pliki kluczowe dla tego etapu

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