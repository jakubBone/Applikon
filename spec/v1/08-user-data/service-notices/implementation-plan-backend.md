# Service Notices — Plan implementacji backend

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

Zbudować system powiadomień serwisowych: admin tworzy komunikat (przez API),
wszyscy zalogowani userzy widzą go w UI jako banner lub modal.

---

## Architektura

```
Admin wywołuje:
POST /api/admin/notices  (wymaga nagłówka X-Admin-Key)
        ↓
ServiceNoticeService.create(request)
        ↓
Zapisuje do tabeli service_notices

---

Frontend przy każdym wejściu:
GET /api/system/notices/active  (wymaga JWT)
        ↓
ServiceNoticeService.findActive()
  → WHERE active = true AND (expires_at IS NULL OR expires_at > now())
        ↓
Lista aktywnych notices → ServiceBanner / ServiceModal
```

---

## Decyzja: zabezpieczenie endpointu admin

Projekt nie ma ról użytkowników (brak `ROLE_ADMIN` w `User`). Dodanie roli
wymagałoby migracji schematu i zmiany logiki auth. Zamiast tego:

**Shared secret w nagłówku** — admin wysyła `X-Admin-Key: <wartość>` w żądaniu.
Wartość konfigurowana przez zmienną środowiskową `ADMIN_KEY` (trzymana w `.env`,
nigdy w kodzie). Backend sprawdza nagłówek w dedykowanym filtrze.

Minimalne i wystarczające dla skali projektu.

---

## Status realizacji

### Etap 1 — Flyway migracja V14

**Nowy plik:** `resources/db/migration/V14__service_notices.sql`

- [ ] Stworzyć migrację:

```sql
CREATE TABLE service_notices (
    id         BIGSERIAL PRIMARY KEY,
    type       VARCHAR(20)  NOT NULL,
    message_pl TEXT         NOT NULL,
    message_en TEXT         NOT NULL,
    active     BOOLEAN      NOT NULL DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);
```

- [ ] `./mvnw test` — zielone (Flyway uruchomi migrację na H2 w testach)

---

### Etap 2 — Encja i enum

**Nowy plik:** `entity/ServiceNoticeType.java`

```java
public enum ServiceNoticeType {
    BANNER, MODAL
}
```

**Nowy plik:** `entity/ServiceNotice.java`

```java
@Entity
@Table(name = "service_notices")
public class ServiceNotice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceNoticeType type;

    @Column(name = "message_pl", nullable = false)
    private String messagePl;

    @Column(name = "message_en", nullable = false)
    private String messageEn;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    // getters
}
```

- [ ] `./mvnw test` — zielone

---

### Etap 3 — Repository i DTO

**Nowy plik:** `repository/ServiceNoticeRepository.java`

```java
public interface ServiceNoticeRepository extends JpaRepository<ServiceNotice, Long> {

    @Query("SELECT n FROM ServiceNotice n WHERE n.active = true " +
           "AND (n.expiresAt IS NULL OR n.expiresAt > :now)")
    List<ServiceNotice> findActive(@Param("now") LocalDateTime now);
}
```

---

**Nowy plik:** `dto/ServiceNoticeResponse.java`

```java
public record ServiceNoticeResponse(
    Long id,
    String type,
    String messagePl,
    String messageEn,
    String expiresAt
) {}
```

---

**Nowy plik:** `dto/ServiceNoticeRequest.java`

```java
public record ServiceNoticeRequest(
    @NotBlank String type,
    @NotBlank String messagePl,
    @NotBlank String messageEn,
    String expiresAt   // ISO-8601, nullable
) {}
```

- [ ] `./mvnw test` — zielone

---

### Etap 4 — Service

**Nowy plik:** `service/ServiceNoticeService.java`

```java
@Service
public class ServiceNoticeService {

    private final ServiceNoticeRepository repository;

    public ServiceNoticeService(ServiceNoticeRepository repository) {
        this.repository = repository;
    }

    public List<ServiceNoticeResponse> findActive() {
        return repository.findActive(LocalDateTime.now())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public ServiceNoticeResponse create(ServiceNoticeRequest request) {
        ServiceNotice notice = new ServiceNotice();
        notice.setType(ServiceNoticeType.valueOf(request.type()));
        notice.setMessagePl(request.messagePl());
        notice.setMessageEn(request.messageEn());
        if (request.expiresAt() != null) {
            notice.setExpiresAt(LocalDateTime.parse(request.expiresAt()));
        }
        return toResponse(repository.save(notice));
    }

    private ServiceNoticeResponse toResponse(ServiceNotice n) {
        return new ServiceNoticeResponse(
            n.getId(),
            n.getType().name(),
            n.getMessagePl(),
            n.getMessageEn(),
            n.getExpiresAt() != null ? n.getExpiresAt().toString() : null
        );
    }
}
```

- [ ] `./mvnw test` — zielone

---

### Etap 5 — Kontrolery

**Nowy plik:** `controller/SystemController.java`

```java
@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final ServiceNoticeService service;

    public SystemController(ServiceNoticeService service) {
        this.service = service;
    }

    @GetMapping("/notices/active")
    public List<ServiceNoticeResponse> getActiveNotices() {
        return service.findActive();
    }
}
```

Endpoint wymaga JWT (objęty przez istniejący `SecurityConfig`).

---

**Nowy plik:** `controller/AdminController.java`

```java
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final ServiceNoticeService service;

    public AdminController(ServiceNoticeService service) {
        this.service = service;
    }

    @PostMapping("/notices")
    public ResponseEntity<ServiceNoticeResponse> createNotice(
            @Valid @RequestBody ServiceNoticeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.create(request));
    }
}
```

- [ ] `./mvnw test` — zielone

---

### Etap 6 — Zabezpieczenie endpointu admin

**Nowy plik:** `security/AdminKeyFilter.java`

```java
@Component
public class AdminKeyFilter extends OncePerRequestFilter {

    @Value("${app.admin-key}")
    private String adminKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        if (request.getRequestURI().startsWith("/api/admin")) {
            String key = request.getHeader("X-Admin-Key");
            if (key == null || !key.equals(adminKey)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
```

**Plik:** `.env` (lokalny, nie w repo)

```
ADMIN_KEY=<losowy-string-min-32-znaki>
```

**Plik:** `application.properties`

```properties
app.admin-key=${ADMIN_KEY}
```

**Plik:** `config/SecurityConfig.java`

- [ ] Dodać `/api/admin/**` do listy chronionych ścieżek — powinno być objęte
  przez istniejącą regułę "wszystko wymaga JWT"; AdminKeyFilter doda drugi
  poziom ochrony niezależnie od JWT
- [ ] Zarejestrować `AdminKeyFilter` w łańcuchu filtrów przed
  `JwtAuthenticationConverter`

**Plik:** `test/application.properties` (lub odpowiednik dla testów)

- [ ] Dodać `app.admin-key=test-admin-key` — żeby testy się kompilowały
  bez `.env`

- [ ] `./mvnw test` — zielone

---

### Etap 7 — Testy

**Nowy plik:** `test/controller/SystemControllerTest.java`

- [ ] Test `GET /api/system/notices/active` — brak notices w DB:
  - Response `200`, body `[]`
- [ ] Test `GET /api/system/notices/active` — 1 aktywny notice:
  - Response `200`, body zawiera 1 element z poprawnym `type` i `messagePl`
- [ ] Test `GET /api/system/notices/active` — notice wygasły (expiresAt w przeszłości):
  - Response `200`, body `[]` (wygasły nie wraca)
- [ ] Test `GET /api/system/notices/active` bez JWT:
  - Response `401`

**Nowy plik:** `test/controller/AdminControllerTest.java`

- [ ] Test `POST /api/admin/notices` z poprawnym `X-Admin-Key`:
  - Response `201`
  - Notice zapisany w DB
- [ ] Test `POST /api/admin/notices` bez `X-Admin-Key`:
  - Response `403`
- [ ] Test `POST /api/admin/notices` z błędnym `X-Admin-Key`:
  - Response `403`
- [ ] Test `POST /api/admin/notices` z brakującymi polami (`messagePl` puste):
  - Response `400`
- [ ] `./mvnw test` — wszystkie testy zielone

---

## Definicja ukończenia (DoD)

- [ ] Flyway V14 tworzy tabelę `service_notices`
- [ ] `POST /api/admin/notices` z `X-Admin-Key` tworzy notice → `201`
- [ ] `POST /api/admin/notices` bez klucza → `403`
- [ ] `GET /api/system/notices/active` zwraca aktywne, nieuwzględnia wygasłych
- [ ] `GET /api/system/notices/active` bez JWT → `401`
- [ ] `./mvnw test` — 0 failed

---

## Poza zakresem

- **Dezaktywacja notice przez API** — admin może ręcznie ustawić `active=false`
  przez bazę danych; endpoint PATCH/DELETE to nadmiarowy zakres
- **Limit aktywnych notices** — nie ograniczamy liczby; w praktyce będzie 0-1
- **Notyfikacje push / email** — tylko in-app
- **Role ADMIN w User** — zbyt duża zmiana dla tej skali; shared secret wystarczy

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `db/migration/V14__service_notices.sql` | **Nowy** — tabela `service_notices` |
| `entity/ServiceNoticeType.java` | **Nowy** — enum BANNER/MODAL |
| `entity/ServiceNotice.java` | **Nowy** — encja |
| `repository/ServiceNoticeRepository.java` | **Nowy** — `findActive` query |
| `dto/ServiceNoticeResponse.java` | **Nowy** — response DTO |
| `dto/ServiceNoticeRequest.java` | **Nowy** — request DTO |
| `service/ServiceNoticeService.java` | **Nowy** — logika |
| `controller/SystemController.java` | **Nowy** — `GET /api/system/notices/active` |
| `controller/AdminController.java` | **Nowy** — `POST /api/admin/notices` |
| `security/AdminKeyFilter.java` | **Nowy** — weryfikacja X-Admin-Key |
| `config/SecurityConfig.java` | Rejestracja AdminKeyFilter |
| `application.properties` | `app.admin-key=${ADMIN_KEY}` |
| `test/application.properties` | `app.admin-key=test-admin-key` |
| `test/controller/SystemControllerTest.java` | **Nowy** — 4 testy |
| `test/controller/AdminControllerTest.java` | **Nowy** — 4 testy |
