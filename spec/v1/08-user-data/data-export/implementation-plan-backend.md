# Data Export — Plan implementacji backend

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

Dodać endpoint `GET /api/auth/me/export` zwracający wszystkie dane zalogowanego
usera jako plik JSON do pobrania. Realizuje wymóg RODO Art. 20 (prawo do
przenoszalności danych).

---

## Architektura

```
GET /api/auth/me/export
        ↓
AuthController.exportMyData(@AuthenticationPrincipal)
        ↓
UserExportService.buildExport(userId)
  → UserRepository.findById
  → ApplicationRepository.findByUserId
  → dla każdej aplikacji: NoteRepository.findByApplicationId
        ↓
ResponseEntity z nagłówkiem Content-Disposition: attachment
filename: easyapply-export.json
```

---

## Status realizacji

### Etap 1 — DTO `UserExportResponse`

**Nowy plik:** `dto/UserExportResponse.java`

- [ ] Stworzyć record `UserExportResponse` z zagnieżdżonymi recordami:

```java
public record UserExportResponse(
    ProfileExport profile,
    List<ApplicationExport> applications
) {
    public record ProfileExport(
        String email,
        String name,
        String createdAt,
        String privacyPolicyAcceptedAt
    ) {}

    public record ApplicationExport(
        Long id,
        String company,
        String position,
        String link,
        Integer salaryMin,
        Integer salaryMax,
        String currency,
        String salaryType,
        String contractType,
        String salarySource,
        String source,
        String status,
        String jobDescription,
        String agency,
        String currentStage,
        String rejectionReason,
        String rejectionDetails,
        String appliedAt,
        CvExport cv,
        List<NoteExport> notes
    ) {}

    public record CvExport(
        String name,
        String type,
        String externalUrl
    ) {}

    public record NoteExport(
        String content,
        String category,
        String createdAt
    ) {}
}
```

Daty jako `String` (ISO-8601) — spójne z resztą DTO w projekcie.

**Czego nie eksportujemy:** `id` usera, `google_id`, `refresh_token`,
wewnętrzne ID CV i notatek, `user_id` w aplikacjach — to dane systemowe.

- [ ] `./mvnw test` — zielone (DTO samo w sobie nic nie psuje)

---

### Etap 2 — `UserExportService`

**Nowy plik:** `service/UserExportService.java`

- [ ] Stworzyć serwis z metodą `buildExport(UUID userId)`:

```java
@Service
public class UserExportService {

    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final NoteRepository noteRepository;

    public UserExportService(UserRepository userRepository,
                             ApplicationRepository applicationRepository,
                             NoteRepository noteRepository) {
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.noteRepository = noteRepository;
    }

    public UserExportResponse buildExport(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(EntityNotFoundException::new);

        List<Application> applications = applicationRepository.findByUserId(userId);

        List<ApplicationExport> appExports = applications.stream()
            .map(app -> {
                List<Note> notes = noteRepository.findByApplicationId(app.getId());
                return mapApplication(app, notes);
            })
            .toList();

        return new UserExportResponse(mapProfile(user), appExports);
    }

    private ProfileExport mapProfile(User user) {
        return new ProfileExport(
            user.getEmail(),
            user.getName(),
            user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
            user.getPrivacyPolicyAcceptedAt() != null
                ? user.getPrivacyPolicyAcceptedAt().toString() : null
        );
    }

    private ApplicationExport mapApplication(Application app, List<Note> notes) {
        CvExport cvExport = null;
        if (app.getCv() != null) {
            CV cv = app.getCv();
            cvExport = new CvExport(
                cv.getOriginalFileName(),
                cv.getType() != null ? cv.getType().name() : null,
                cv.getExternalUrl()
            );
        }

        List<NoteExport> noteExports = notes.stream()
            .map(n -> new NoteExport(
                n.getContent(),
                n.getCategory() != null ? n.getCategory().name() : null,
                n.getCreatedAt() != null ? n.getCreatedAt().toString() : null
            ))
            .toList();

        return new ApplicationExport(
            app.getId(),
            app.getCompany(),
            app.getPosition(),
            app.getLink(),
            app.getSalaryMin(),
            app.getSalaryMax(),
            app.getCurrency(),
            app.getSalaryType() != null ? app.getSalaryType().name() : null,
            app.getContractType() != null ? app.getContractType().name() : null,
            app.getSalarySource() != null ? app.getSalarySource().name() : null,
            app.getSource(),
            app.getStatus() != null ? app.getStatus().name() : null,
            app.getJobDescription(),
            app.getAgency(),
            app.getCurrentStage(),
            app.getRejectionReason() != null ? app.getRejectionReason().name() : null,
            app.getRejectionDetails(),
            app.getAppliedAt() != null ? app.getAppliedAt().toString() : null,
            cvExport,
            noteExports
        );
    }
}
```

- [ ] Sprawdzić czy `NoteRepository` ma metodę `findByApplicationId(Long id)`.
  Jeśli nie — dodać (bez `AndApplicationUserId`, bo aplikacje już są
  przefiltrowane po `userId` w serwisie).
- [ ] `./mvnw test` — zielone

---

### Etap 3 — Endpoint w `AuthController`

**Plik:** `controller/AuthController.java`

- [ ] Dodać zależność `UserExportService` do konstruktora kontrolera
- [ ] Dodać metodę `exportMyData`:

```java
@GetMapping("/me/export")
public ResponseEntity<UserExportResponse> exportMyData(
        @AuthenticationPrincipal AuthenticatedUser principal) {

    UserExportResponse export = userExportService.buildExport(principal.id());

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"easyapply-export.json\"")
        .body(export);
}
```

Nagłówek `Content-Disposition: attachment` powoduje że przeglądarka pobiera
plik zamiast go wyświetlać w zakładce.

- [ ] `./mvnw test` — zielone

---

### Etap 4 — Testy

**Plik:** `test/controller/AuthControllerTest.java`

- [ ] Test `GET /api/auth/me/export` — user z 1 aplikacją i 1 notatką:
  - Response `200 OK`
  - Nagłówek `Content-Disposition` zawiera `attachment`
  - Body zawiera `profile.email` usera testowego
  - Body zawiera listę `applications` z 1 elementem
  - Aplikacja ma listę `notes` z 1 elementem
- [ ] Test `GET /api/auth/me/export` — user bez aplikacji:
  - Response `200 OK`
  - `applications` to pusta lista `[]`
- [ ] Test `GET /api/auth/me/export` bez JWT:
  - Response `401 Unauthorized`
- [ ] `./mvnw test` — wszystkie testy zielone

---

## Definicja ukończenia (DoD)

- [ ] `GET /api/auth/me/export` zwraca `200` z `Content-Disposition: attachment; filename="easyapply-export.json"`
- [ ] JSON zawiera profil + aplikacje + notatki + CV usera
- [ ] JSON nie zawiera `google_id`, `refresh_token`, danych innych userów
- [ ] Endpoint bez JWT zwraca `401`
- [ ] Brak zmian w schemacie DB (brak nowej migracji Flyway)
- [ ] `./mvnw test` — 0 failed

---

## Edge cases — decyzje projektowe

| # | Scenariusz | Decyzja |
|---|---|---|
| EC-1 | CV typu `FILE` — `externalUrl` może być null (upload wyłączony od fazy 07) | Eksportujemy metadane jakie są; `externalUrl: null` w JSON to poprawne zachowanie |

---

## Poza zakresem

- **Eksport CSV** — tylko JSON; wystarczy na potrzeby RODO
- **Szyfrowanie pliku** — user pobiera przez HTTPS, odpowiada za przechowanie
- **Eksport plików CV (FILE type)** — eksportujemy tylko metadane (nazwa, URL);
  pliki PDF nie są w zakresie (CV file upload jest zresztą wyłączony od fazy 07)

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `dto/UserExportResponse.java` | **Nowy plik** — record z zagnieżdżonymi recordami |
| `service/UserExportService.java` | **Nowy plik** — logika budowania eksportu |
| `controller/AuthController.java` | Nowy endpoint `GET /me/export` |
| `repository/NoteRepository.java` | Dodać `findByApplicationId` jeśli brak |
| `test/controller/AuthControllerTest.java` | 3 nowe testy |
