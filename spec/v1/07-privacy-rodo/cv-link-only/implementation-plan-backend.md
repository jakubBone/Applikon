# Plan implementacji CV link-only — EasyApply Backend

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

Zablokować możliwość uploadowania plików PDF jako CV przez REST API.
Ścieżka `CVType.LINK` (CV jako link zewnętrzny) pozostaje w pełni funkcjonalna.
Istniejące rekordy `CVType.FILE` w bazie pozostają dostępne (download, delete) —
nie łamiemy użytkowników którzy już wrzucili pliki.

---

## Decyzje projektowe

- **Kod metody `CVService.uploadCV` zostaje** — nie usuwamy logiki biznesowej.
  Daje to trywialny rollback (odblokować endpoint = jedna linia) i zachowuje
  kod jako pełnoprawny ficzer w portfolio.
- **Endpoint `POST /api/cv/upload` zwraca 503 Service Unavailable** — zamiast
  usuwania mapowania. 503 semantycznie komunikuje "chwilowo nieczynne".
- **Do zablokowania używamy `ResponseStatusException`** — wbudowane w Spring,
  bez potrzeby tworzenia nowej klasy wyjątku ani feature flagi.
- **Pozostałe endpointy CV (`GET`, `POST`, `PUT`, `DELETE`, `GET /{id}/download`)
  nie są ruszane** — obsługują zarówno LINK, jak i istniejące FILE.

---

## Status realizacji

### Etap 1 — Zablokowanie endpointu `POST /api/cv/upload`

**Plik:** `easyapply-backend/src/main/java/com/easyapply/controller/CVController.java`

- [ ] Dodać rzucenie `ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, ...)`
      jako pierwsza linia w metodzie `uploadCV` (przed `cvService.uploadCV(...)`)
- [ ] Komunikat: klucz i18n `error.cv.uploadDisabled` (resolvowany przez
      `MessageSource`, żeby obsłużyć PL/EN tak jak reszta errorów)
- [ ] Dodać wstrzyknięcie `MessageSource` do kontrolera (jeśli jeszcze go nie ma)
- [ ] `./mvnw test` — test uploadowy ma failować (spodziewane), przechodzimy do Etapu 2

**Schemat zmiany:**

```java
@PostMapping("/upload")
public ResponseEntity<CVResponse> uploadCV(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestParam("file") MultipartFile file) throws IOException {
    throw new ResponseStatusException(
            HttpStatus.SERVICE_UNAVAILABLE,
            messageSource.getMessage("error.cv.uploadDisabled", null, LocaleContextHolder.getLocale())
    );
}
```

> Metoda `cvService.uploadCV(...)` zostaje nietknięta — nie jest już
> wywoływana z HTTP, ale tests jednostkowe `CVServiceTest` dalej z niej
> korzystają i muszą przechodzić.

---

### Etap 2 — Klucz i18n komunikatu błędu

**Pliki:** `easyapply-backend/src/main/resources/messages.properties`,
`messages_pl.properties` (i ewentualnie `messages_en.properties` — zgodnie z istniejącą konwencją projektu)

- [ ] Zweryfikować które pliki messages istnieją w projekcie i jaki jest tam
      wzorzec kluczy `error.cv.*`
- [ ] Dodać klucz `error.cv.uploadDisabled`:
  - PL: `"Upload plików CV jest chwilowo niedostępny. Użyj opcji linku zewnętrznego."`
  - EN: `"CV file upload is temporarily unavailable. Please use the external link option."`
- [ ] `./mvnw test` — test nadal fail (oczekiwane), przechodzimy do Etapu 3

---

### Etap 3 — Aktualizacja testów

**Plik:** `easyapply-backend/src/test/java/com/easyapply/controller/CVControllerTest.java`

- [ ] Zmienić test uploadu (istniejący test `POST /api/cv/upload` happy path):
  - Oczekiwany status: `503 Service Unavailable` zamiast `201 Created`
  - Asercja: response body zawiera komunikat z klucza `error.cv.uploadDisabled`
  - W bazie **nie ma** nowego rekordu CV po wywołaniu
  - Na dysku **nie ma** nowego pliku (folder `uploads/cv/` — liczba plików bez zmian)
- [ ] Dodać test: `POST /api/cv/upload` z pustym plikiem nadal zwraca 503
      (walidacja nie jest wykonywana, bo endpoint jest zablokowany wcześniej)
- [ ] Pozostałe testy CVController (CRUD dla LINK, download, delete) **bez zmian**
- [ ] `CVServiceTest` — **bez zmian** (metoda service dalej działa, testy unitowe zostają)
- [ ] `./mvnw test` — zielony

---

## Definicja ukończenia (DoD)

- [ ] `POST /api/cv/upload` zwraca `503 Service Unavailable` z komunikatem i18n
- [ ] `POST /api/cv` (create) dla `CVType.LINK` działa jak dotychczas
- [ ] `GET /api/cv`, `GET /api/cv/{id}`, `GET /api/cv/{id}/download`, `DELETE /api/cv/{id}`, `PUT /api/cv/{id}` — bez zmian
- [ ] Istniejące rekordy `CVType.FILE` w bazie nadal dostępne (odczyt, download, delete)
- [ ] `./mvnw test` — 0 failed
- [ ] Komunikat błędu wyświetla się w języku ustawionym w `Accept-Language`

---

## Poza zakresem

- **Usuwanie kolumn `file_name`, `file_path`, `file_size` z tabeli `cvs`** — zostają
  jako nullable dla rekordów historycznych i ewentualnego rollbacku
- **Migracja istniejących plików CV** — pliki w `uploads/cv/` zostają na dysku,
  są usuwane per user przez normalny flow (`DELETE /api/cv/{id}` lub kasowanie konta)
- **Feature flag w `application.properties`** — prostsze hardcode; jeśli kiedyś będzie potrzeba dynamicznego przełączania, można dodać później
- **Usuwanie metody `CVService.uploadCV`** — zostaje dla łatwego rollbacku i jako kod ficzera
- **Komunikat frontendowy (tooltip "Chwilowo nieczynne")** — obsłużony w planie frontendowym

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `controller/CVController.java` | `uploadCV` rzuca `ResponseStatusException(503)`, wstrzyknięcie `MessageSource` |
| `resources/messages*.properties` | Nowy klucz `error.cv.uploadDisabled` (PL/EN) |
| `test/controller/CVControllerTest.java` | Test uploadu oczekuje 503 zamiast 201 |

---

*Ostatnia aktualizacja: 2026-04-22*
