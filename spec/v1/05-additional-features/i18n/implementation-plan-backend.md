# Plan implementacji i18n — EasyApply Backend

## Proces pracy (obowiązujący dla każdego etapu)

1. **Implementacja** — Claude robi zmiany w kodzie
2. **Weryfikacja automatyczna** — `mvn test`, musi być zielony
3. **Weryfikacja manualna** — użytkownik testuje endpoint ręcznie (opcjonalnie)
4. **Aktualizacja planów** — Claude aktualizuje checkboxy w tym pliku
5. **Sugestia commita** — Claude proponuje wiadomość commita (format: `type(backend): opis`)
6. **Commit** — użytkownik sam robi `git add` + `git commit`
7. **Pytanie o kontynuację** — Claude pyta czy idziemy dalej do następnego etapu

---

## Status realizacji

### Etap 0 — Setup
- [x] Katalog `src/main/resources/i18n/`
- [x] `i18n/messages.properties` (English — fallback)
- [x] `i18n/messages_pl.properties` (Polish)
- [x] Bean `MessageSource` w `I18nConfig.java`
- [x] Bean `LocaleResolver` (`AcceptHeaderLocaleResolver`, domyślnie `en`)
- [x] `mvn test` zielony

### Etap 1 — Wiadomości walidacyjne
- [x] `dto/ApplicationRequest.java` → klucze `{validation.*}`
- [x] `dto/NoteRequest.java` → klucze `{validation.*}`
- [x] `dto/StatusUpdateRequest.java` → klucze `{validation.*}`
- [x] `controller/ApplicationController.java` (inline record) → klucze
- [x] `controller/CVController.java` (inline params) → klucze
- [x] `entity/Application.java` → klucze
- [x] `entity/Note.java` → klucze
- [x] `mvn test` zielony

### Etap 2 — Wyjątki w serwisach
- [x] `service/ApplicationService.java` — `EntityNotFoundException`
- [x] `service/CVService.java` — `EntityNotFoundException`, `IllegalArgumentException`
- [x] `service/NoteService.java` — `EntityNotFoundException`
- [x] `service/NoteService.java` — auto-nota salary change: `"Stawka zmieniona: X PLN -> Y PLN"` → i18n
- [x] `service/UserService.java` — `EntityNotFoundException`, `IllegalStateException`
- [x] `mvn test` zielony

### Etap 3 — HTTP responses
- [x] `exception/GlobalExceptionHandler.java` — `setTitle(...)`, error messages
- [x] `controller/AuthController.java` — `Map.of("error", "...")`
- [x] `mvn test` zielony

### Etap 4 — Dane demo i enum labels
- [x] `service/UserService.java` — demo aplikacja: przetłumaczyć opis oferty pracy na angielski (plain string, nie runtime i18n)
- [x] `entity/RejectionReason.java` — enum labels usunięte, frontend tłumaczy na podstawie kodu enum (patrz decyzja poniżej)
- [x] `mvn test` zielony

### Etap 5 — Komentarze i testy
- [x] Przetłumaczyć polskie komentarze i Javadoc we wszystkich plikach `.java` na angielski
- [x] Przetłumaczyć `@DisplayName` (44 metody) i komentarze w testach na angielski
- [x] `mvn test` zielony

### Etap 6 — Rename enum values to English

> **Ten etap jest tylko podsumowaniem.** Dokładna instrukcja krok po kroku, pełne mapowania
> starych→nowych wartości enum, treści SQL oraz historia wykonania (z wynikami testów po każdym kroku)
> znajdują się w: `spec/i18n/enum-rename-plan.md`

#### Migracje Flyway

- [x] `V5__rename_rejection_reasons.sql` — DROP CONSTRAINT IF EXISTS + UPDATE rejection_reason
- [x] `V6__rename_note_categories.sql` — DROP CONSTRAINT IF EXISTS + UPDATE category (incl. legacy PYTANIE, KONTAKT)
- [x] `V7__rename_salary_types.sql` — DROP CONSTRAINT IF EXISTS + UPDATE salary_type
- [x] `V8__rename_contract_types.sql` — DROP CONSTRAINT IF EXISTS + UPDATE contract_type
- [x] `V9__rename_application_statuses.sql` — DROP CONSTRAINT IF EXISTS + UPDATE status (incl. legacy ROZMOWA, ZADANIE, ODRZUCONE)
- [x] `V10__fix_column_defaults.sql` — ALTER DEFAULT `'WYSLANE'`→`'SENT'`, `'INNE'`→`'OTHER'`

#### Entities

- [x] `entity/RejectionReason.java` — `BRAK_ODPOWIEDZI`→`NO_RESPONSE`, `ODMOWA_MAILOWA`→`EMAIL_REJECTION`, `ODRZUCENIE_PO_ROZMOWIE`→`REJECTED_AFTER_INTERVIEW`, `INNE`→`OTHER`
- [x] `entity/NoteCategory.java` — `PYTANIA`→`QUESTIONS`, `INNE`→`OTHER`, usunięte legacy `PYTANIE` i `KONTAKT`
- [x] `entity/SalaryType.java` — `BRUTTO`→`GROSS`, `NETTO`→`NET`
- [x] `entity/ContractType.java` — `UOP`→`EMPLOYMENT`, `UZ`→`MANDATE`, `INNA`→`OTHER`
- [x] `entity/ApplicationStatus.java` — `WYSLANE`→`SENT`, `W_PROCESIE`→`IN_PROGRESS`, `OFERTA`→`OFFER`, `ODMOWA`→`REJECTED`
- [x] `entity/Note.java` — default `NoteCategory.INNE` → `NoteCategory.OTHER` (3 miejsca)
- [x] `entity/Application.java` — default `ApplicationStatus.WYSLANE` → `ApplicationStatus.SENT`

#### Serwisy

- [x] `service/ApplicationService.java` — wszystkie referencje do `ApplicationStatus`
- [x] `service/StatisticsService.java` — `ODMOWA`→`REJECTED`, `OFERTA`→`OFFER`, `BRAK_ODPOWIEDZI`→`NO_RESPONSE`
- [x] `service/UserService.java` — `WYSLANE`→`SENT`, `NETTO`→`NET`, `UOP`→`EMPLOYMENT`

#### Testy

- [x] `ApplicationControllerTest`, `ApplicationServiceTest`, `StatisticsControllerTest`, `StatisticsServiceTest`, `NoteControllerTest`, `NoteServiceTest`, `CVServiceTest`
- [x] `mvn test` — 84/84 ✅

---

## Decyzje architektoniczne

### RejectionReason enum labels
**Decyzja: Opcja A — frontend tłumaczy**

Backend zwraca kod: `{ "rejectionReason": "NO_RESPONSE" }`
Frontend tłumaczy przez `REJECTION_REASONS` w `kanban/types.ts` → `"Brak odpowiedzi"` / `"No response"`

**Dlaczego:** Backend zwraca dane, frontend decyduje jak je wyświetlić. Zero zmian w API kontrakcie.

> Kody enum przemianowane na angielskie w Etapie 6 (były: `BRAK_ODPOWIEDZI`, `ODMOWA_MAILOWA` itd.)

### Język domyślny
`AcceptHeaderLocaleResolver` z `defaultLocale: en`.
- Jeśli frontend wysyła `Accept-Language: pl` → odpowiedzi po polsku
- Jeśli frontend wysyła `Accept-Language: en` lub brak nagłówka → odpowiedzi po angielsku
- Frontend wysyła nagłówek automatycznie (patrz `frontend-plan.md` Etap 7)

---

## Struktura plików po zmianach

```
src/main/
  java/com/easyapply/
    config/
      I18nConfig.java          ← nowy: MessageSource + LocaleResolver beans
  resources/
    i18n/
      messages.properties      ← English (fallback)
      messages_pl.properties   ← Polish
```

---

## Klucze i18n

```properties
# messages.properties (English — fallback)
validation.company.required=Company name is required
validation.position.required=Position is required
validation.salary.positive=Salary must be positive
validation.note.required=Note content is required
validation.status.required=Status is required
validation.stage.required=Stage name is required
validation.cv.name.required=CV name is required

error.user.notFound=User not found
error.application.notFound=Application {0} not found
error.cv.notFound=CV {0} not found
error.note.notFound=Note {0} not found
error.token.invalid=Invalid or expired refresh token
error.token.expired=Refresh token has expired
error.token.missing=Refresh token is missing
error.cv.empty=File cannot be empty
error.cv.pdfOnly=Only PDF files are allowed
error.cv.tooLarge=File cannot exceed 5MB
error.cv.nameRequired=CV name cannot be empty
error.cv.useUpload=Use uploadCV method for file uploads
error.salary.changed=Salary changed: {0} {1} -> {2} {3}

error.validation.title=Validation error
error.resource.title=Resource not found
error.request.title=Invalid request
error.server=Internal server error
```

```properties
# messages_pl.properties (Polish)
validation.company.required=Nazwa firmy nie może być pusta
validation.position.required=Nazwa stanowiska nie może być pusta
validation.salary.positive=Stawka musi być dodatnia
validation.note.required=Treść notatki nie może być pusta
validation.status.required=Status nie może być pusty
validation.stage.required=Nazwa etapu nie może być pusta
validation.cv.name.required=Nazwa CV nie może być pusta

error.user.notFound=Użytkownik nie znaleziony
error.application.notFound=Aplikacja o ID {0} nie została znaleziona
error.cv.notFound=CV o ID {0} nie zostało znalezione
error.note.notFound=Notatka o ID {0} nie została znaleziona
error.token.invalid=Nieprawidłowy lub wygasły refresh token
error.token.expired=Refresh token wygasł
error.token.missing=Brak refresh token
error.cv.empty=Plik nie może być pusty
error.cv.pdfOnly=Dozwolone są tylko pliki PDF
error.cv.tooLarge=Plik nie może przekraczać 5MB
error.cv.nameRequired=Nazwa CV nie może być pusta
error.cv.useUpload=Użyj metody uploadCV dla plików
error.salary.changed=Stawka zmieniona: {0} {1} -> {2} {3}

error.validation.title=Błąd walidacji
error.resource.title=Nie znaleziono zasobu
error.request.title=Nieprawidłowe dane
error.server=Wystąpił błąd serwera
```

---

## Pattern użycia

```java
// I18nConfig.java
@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource ms = new ResourceBundleMessageSource();
        ms.setBasename("i18n/messages");
        ms.setDefaultEncoding("UTF-8");
        ms.setFallbackToSystemLocale(false);
        return ms;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.ENGLISH);
        return resolver;
    }
}
```

```java
// Validation (automatyczne przez Spring)
@NotBlank(message = "{validation.company.required}")

// W serwisach (MessageSource przez konstruktor)
throw new EntityNotFoundException(
    messageSource.getMessage("error.application.notFound",
        new Object[]{id}, LocaleContextHolder.getLocale())
);

// W GlobalExceptionHandler
problem.setTitle(messageSource.getMessage(
    "error.validation.title", null, LocaleContextHolder.getLocale()));

// NoteService — auto-nota salary change
String content = messageSource.getMessage(
    "error.salary.changed",
    new Object[]{oldSalary, oldCurrency, newSalary, newCurrency},
    LocaleContextHolder.getLocale());
```

---

## Poza zakresem

- Nazwy odznak (`"Rękawica"`, `"Widmo"` itp.) — zwracane przez API jako klucze, tłumaczone przez frontend przez `badges.json`
- Wartości domenowe w DB (`"Wysłane"` jako `StageHistory.stageName`) — migracja danych, osobny task
- `RejectionReason` enum labels — tłumaczone przez frontend (patrz decyzja powyżej)

---

*Ostatnia aktualizacja: 2026-03-29*
