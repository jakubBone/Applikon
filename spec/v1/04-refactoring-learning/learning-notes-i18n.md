# Notatki z nauki i18n — EasyApply

Plik do wracania. Tłumaczy ideę internacjonalizacji od zera — co to jest, jak działa na backendzie (Spring Boot), jak działa na frontendzie (React + i18next), i jak obie warstwy współpracują.

---

## Część 1 — Idea i18n (o co chodzi?)

### Co to jest i18n?

**i18n** to skrót od „internationalization" (18 liter między „i" a „n"). Chodzi o to, żeby aplikacja mogła wyświetlać teksty w różnych językach bez zmiany kodu — tylko na podstawie plików z tłumaczeniami.

**Analogia z życia codziennego:**
Wyobraź sobie automat biletowy. Ten sam automat, ten sam hardware, ta sama logika — ale ekran wyświetla po polsku lub po angielsku zależnie od tego, który język wybrałeś. Kod automatu się nie zmienia, zmienia się tylko plik z tekstami.

**Bez i18n (hardcoded):**
```java
throw new EntityNotFoundException("Aplikacja o ID 5 nie została znaleziona");
```
```tsx
<button>Dodaj aplikację</button>
```

**Z i18n (dynamiczne):**
```java
throw new EntityNotFoundException(
    messageSource.getMessage("error.application.notFound", new Object[]{5}, locale)
);
```
```tsx
<button>{t('app.addApplication')}</button>
```

Teraz teksty mieszkają w plikach `.properties` (backend) i `.json` (frontend). Chcesz zmienić język → ładujesz inny plik. Chcesz poprawić literówkę → edytujesz plik, nie kod.

### Dwie warstwy i18n w EasyApply

```
Przeglądarka użytkownika
  │
  ├── Frontend (React)
  │     Wyświetla UI po polsku lub angielsku
  │     Pliki tłumaczeń: src/i18n/locales/pl/*.json + en/*.json
  │
  └── wysyła nagłówek "Accept-Language: pl" lub "Accept-Language: en"
        │
        ▼
      Backend (Spring Boot)
        Zwraca komunikaty błędów po polsku lub angielsku
        Pliki tłumaczeń: src/main/resources/i18n/messages*.properties
```

---

## Część 2 — Backend i18n (Spring Boot)

### Kluczowy komponent: MessageSource

`MessageSource` to bean Springa, który czyta pliki `.properties` i zwraca tekst po odpowiednim języku. To centralny punkt całego i18n na backendzie.

**Jak go skonfigurowałeś:** `src/main/java/com/easyapply/config/I18nConfig.java`

```java
@Bean
public MessageSource messageSource() {
    ResourceBundleMessageSource ms = new ResourceBundleMessageSource();
    ms.setBasename("i18n/messages");        // szuka plików: messages.properties, messages_pl.properties itp.
    ms.setDefaultEncoding("UTF-8");
    ms.setFallbackToSystemLocale(false);    // jeśli nie ma tłumaczenia → używa fallbacku, nie systemu
    return ms;
}
```

`setBasename("i18n/messages")` = "szukaj plików o nazwie `messages` w folderze `i18n/` na classpath". Spring automatycznie dodaje sufiks `_pl`, `_en` itp.

### Pliki tłumaczeń (backend)

**Lokalizacja:** `src/main/resources/i18n/`

```
i18n/
  messages.properties       ← angielski (fallback — używany gdy brak innego języka)
  messages_pl.properties    ← polski
```

**Struktura:** klucz=wartość, parametry jako `{0}`, `{1}` itd.

```properties
# messages.properties (angielski)
error.application.notFound=Application {0} not found
error.user.notFound=User not found
validation.company.required=Company name is required
error.salary.changed=Salary changed: {0} {1} -> {2} {3}

# messages_pl.properties (polski)
error.application.notFound=Aplikacja o ID {0} nie została znaleziona
error.user.notFound=Użytkownik nie znaleziony
validation.company.required=Nazwa firmy nie może być pusta
error.salary.changed=Stawka zmieniona: {0} {1} -> {2} {3}
```

Parametry `{0}`, `{1}` to miejsca na wartości dynamiczne (np. ID, kwota). Przekazujesz je jako tablicę `Object[]`.

### Jak Spring wybiera język: LocaleResolver

`LocaleResolver` to bean który przy każdym HTTP request decyduje „jaki język?". Używasz `AcceptHeaderLocaleResolver` — patrzy na nagłówek `Accept-Language` w requescie.

```java
@Bean
public LocaleResolver localeResolver() {
    AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
    resolver.setDefaultLocale(Locale.ENGLISH);  // domyślnie angielski gdy brak nagłówka
    return resolver;
}
```

**Przepływ:**
```
Frontend wysyła:  GET /api/applications  +  Accept-Language: pl
                                                        ↓
Spring wywołuje:  localeResolver.resolveLocale(request)
                                                        ↓
                  Zwraca:  Locale("pl")
                                                        ↓
Kod serwisu:      messageSource.getMessage("error.application.notFound",
                      new Object[]{id}, LocaleContextHolder.getLocale())
                                                        ↓
                  Zwraca:  "Aplikacja o ID 5 nie została znaleziona"
```

### LocaleContextHolder — jak dostać bieżący język w kodzie

`LocaleContextHolder.getLocale()` to statyczna metoda Springa, która zwraca aktualny `Locale` z kontekstu wątku. W normalnym flow HTTP zawsze zwróci to co `LocaleResolver` wyciągnął z nagłówka.

```java
// W serwisie — nie przekazujesz locale jako parametr, po prostu pytasz kontekst:
throw new EntityNotFoundException(
    messageSource.getMessage("error.application.notFound",
        new Object[]{id}, LocaleContextHolder.getLocale())
);
```

Analogia do Javy: jak `ThreadLocal` — każdy wątek (każdy request HTTP) ma swój kontekst.

### Gdzie MessageSource jest używany w projekcie

**Serwisy** — wyjątki z komunikatami:

```java
// ApplicationService.java, NoteService.java, CVService.java, UserService.java
// Konstruktor wstrzykuje MessageSource:
public ApplicationService(ApplicationRepository repo, MessageSource messageSource) {
    this.messageSource = messageSource;
}

// Użycie:
throw new EntityNotFoundException(
    messageSource.getMessage("error.application.notFound",
        new Object[]{id}, LocaleContextHolder.getLocale())
);
```

**GlobalExceptionHandler** — tytuły odpowiedzi błędów:

```java
// exception/GlobalExceptionHandler.java
problem.setTitle(messageSource.getMessage(
    "error.validation.title", null, LocaleContextHolder.getLocale()));
```

**AuthController** — komunikaty o tokenach:

```java
// controller/AuthController.java
return Map.of("error", messageSource.getMessage(
    "error.token.missing", null, LocaleContextHolder.getLocale()));
```

**NoteService — auto-nota o zmianie wynagrodzenia:**

```java
// Treść notatki jest i18n — użytkownik widzi ją po swoim języku:
String content = messageSource.getMessage(
    "error.salary.changed",
    new Object[]{oldSalary, oldCurrency, newSalary, newCurrency},
    LocaleContextHolder.getLocale());
```

### Wiadomości walidacyjne — specjalny przypadek

Bean Validation (`@NotBlank`, `@Min` itp.) normalnie używa własnego systemu komunikatów. Żeby podłączyć go do naszego `MessageSource`, potrzebny jest `LocalValidatorFactoryBean`:

```java
// I18nConfig.java
@Bean
public LocalValidatorFactoryBean validator(MessageSource messageSource) {
    LocalValidatorFactoryBean factory = new LocalValidatorFactoryBean();
    factory.setValidationMessageSource(messageSource);
    return factory;
}
```

Dzięki temu w DTO możesz pisać:

```java
// Klamry {} = "szukaj w MessageSource", bez klamr = dosłowny tekst
@NotBlank(message = "{validation.company.required}")
private String company;

// Vs hardcoded (ŹLE dla i18n):
@NotBlank(message = "Nazwa firmy nie może być pusta")
private String company;
```

**Pliki z adnotacjami walidacyjnymi w projekcie:**
- `dto/ApplicationRequest.java`
- `dto/NoteRequest.java`
- `dto/StatusUpdateRequest.java`
- `entity/Application.java`
- `entity/Note.java`
- `controller/ApplicationController.java` (inline record `AddStageRequest`)
- `controller/CVController.java` (inline records)

---

## Część 3 — Frontend i18n (React + i18next)

### Biblioteka: i18next + react-i18next

**i18next** to popularna biblioteka do i18n w JavaScript. Działa samodzielnie (plain JS), ale do Reacta używasz nakładki **react-i18next**, która dodaje hooki (jak `useTranslation`).

Analogia do Javy: i18next = silnik (jak Hibernate), react-i18next = integracja ze Springiem (jak Spring Data JPA).

### Konfiguracja: `src/i18n/index.ts`

To odpowiednik `I18nConfig.java` z backendu. Inicjalizujesz tu bibliotekę — podajesz zasoby, języki, domyślny namespace itp.

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)      // automatycznie wykrywa język (z localStorage lub przeglądarki)
  .use(initReactI18next)      // integracja z React
  .init({
    fallbackLng: 'en',        // gdy brak tłumaczenia → angielski
    supportedLngs: ['pl', 'en'],
    defaultNS: 'common',      // domyślny namespace (plik JSON)
    ns: ['common', 'errors', 'badges', 'tour'],
    resources: {
      pl: { common: plCommon, errors: plErrors, badges: plBadges, tour: plTour },
      en: { common: enCommon, errors: enErrors, badges: enBadges, tour: enTour },
    },
    detection: {
      order: ['localStorage', 'navigator'],  // najpierw localStorage, potem ustawienia przeglądarki
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',      // klucz w localStorage
    },
  })
```

**Ważne:** `import i18n from './i18n'` jest w `main.tsx` — **przed** `ReactDOM.render()`. To zapewnia że tłumaczenia są gotowe zanim React zacznie renderować.

### Pliki tłumaczeń (frontend)

**Lokalizacja:** `src/i18n/locales/`

```
locales/
  pl/
    common.json    ← główny UI (przyciski, etykiety, formularze, status, kanban...)
    errors.json    ← komunikaty błędów (z api.ts, AuthProvider.tsx)
    badges.json    ← widget odznak (tytuły, nazwy odznak)
    tour.json      ← przewodnik po aplikacji (TourGuide.tsx)
  en/
    common.json
    errors.json
    badges.json
    tour.json
```

**Dlaczego rozdzielono na namespacey?** Żeby ładować tylko potrzebne tłumaczenia. Każdy namespace to osobny plik JSON. Komponent odznak nie musi ładować całego common.json — ładuje tylko badges.json.

**Struktura pliku JSON:**

```json
// pl/common.json (fragment)
{
  "form": {
    "titleCreate": "Dodaj nową aplikację",
    "titleEdit": "Edytuj aplikację",
    "company": "Firma *",
    "duplicateWarning": "Już aplikowałeś do {{company}} na stanowisko {{position}} ({{date}})"
  },
  "kanban": {
    "statusWYSLANE": "Wysłane",
    "statusW_PROCESIE": "W procesie"
  }
}
```

Parametry dynamiczne to `{{nazwaParametru}}` (nie `{0}` jak w Javie).

### Używanie tłumaczeń w komponentach: `useTranslation`

```tsx
import { useTranslation } from 'react-i18next'

function ApplicationForm() {
  const { t } = useTranslation()         // domyślny namespace = 'common'
  const { t: tBadges } = useTranslation('badges')   // inny namespace

  return (
    <div>
      <h2>{t('form.titleCreate')}</h2>                    // "Dodaj nową aplikację"
      <button>{t('form.cancel')}</button>                 // "Anuluj"
      <p>{t('form.duplicateWarning', { company: 'Google', position: 'Dev', date: '...' })}</p>
                                                          // "Już aplikowałeś do Google..."
    </div>
  )
}
```

`t('klucz.podklucz')` → szuka w JSON po zagnieżdżonej ścieżce.
`t('klucz', { param: wartość })` → interpoluje `{{param}}` w tekście.

### LanguageDetector — jak wybierany jest język

`i18next-browser-languagedetector` przy starcie aplikacji sprawdza po kolei:
1. `localStorage` → klucz `i18nextLng` (jeśli użytkownik wcześniej wybrał język)
2. Ustawienia przeglądarki (`navigator.language`) → np. `pl-PL`

Jeśli żaden z tych języków nie jest w `supportedLngs` → `fallbackLng: 'en'`.

**Gdzie to jest zapisywane:** `localStorage.i18nextLng = 'pl'` lub `'en'`.

### LanguageSwitcher — komponent do zmiany języka

**Plik:** `src/components/LanguageSwitcher.tsx`

```tsx
import i18n from '../i18n'

function LanguageSwitcher() {
  return (
    <div>
      <button onClick={() => i18n.changeLanguage('pl')}>PL</button>
      <button onClick={() => i18n.changeLanguage('en')}>EN</button>
    </div>
  )
}
```

`i18n.changeLanguage('en')` robi dwie rzeczy:
1. Zapisuje `i18nextLng = 'en'` do localStorage
2. Powiadamia wszystkie komponenty → React re-renderuje je z nowymi tłumaczeniami (bez przeładowania)

**Gdzie użyty:** w `AppContent.tsx` (header) i `LoginPage.tsx`.

### Accept-Language — łącznik frontendu z backendem

Frontend przy każdym API request wysyła nagłówek `Accept-Language` z bieżącym językiem. Dzięki temu backend wie po jakim języku odpowiadać.

**Gdzie jest dodawany:** `src/services/api.ts` → funkcja `getHeaders()`

```ts
import i18n from '../i18n'

const getHeaders = (contentType?: string): HeadersInit => {
  const headers: Record<string, string> = {}
  // ... token ...
  headers['Accept-Language'] = i18n.language    // ← 'pl' lub 'en'
  return headers
}
```

`i18n.language` to bieżący język wybrany przez użytkownika. Każde `fetch()` do backendu automatycznie niesie ten nagłówek.

### TypeScript typowanie kluczy: `src/i18n/types.ts`

Żeby TypeScript wiedział jakie klucze istnieją (i dał autocomplete + błędy kompilacji przy literówkach):

```ts
// src/i18n/types.ts
import 'i18next'
import type plCommon from './locales/pl/common.json'
// ...

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof plCommon
      // ...
    }
  }
}
```

Teraz `t('form.typo')` → błąd TypeScript. `t('form.titleCreate')` → OK.

---

## Część 4 — Jak obie warstwy współpracują

### Pełny przepływ: użytkownik zmienia język na EN

```
1. Użytkownik klika "EN" w LanguageSwitcher
   → i18n.changeLanguage('en')
   → localStorage.i18nextLng = 'en'
   → Wszystkie komponenty re-renderują się z en/*.json
   → UI od razu po angielsku

2. Użytkownik otwiera formularz i robi błąd walidacji (puste pole firma)
   → Frontend: t('form.companyRequired') → "Company name cannot be empty"

3. Użytkownik wysyła request do backendu
   → getHeaders() dodaje: Accept-Language: en
   → Backend widzi nagłówek
   → LocaleResolver.resolveLocale(request) → Locale("en")
   → LocaleContextHolder.getLocale() → Locale("en")
   → messageSource.getMessage("error.application.notFound", ..., en) → "Application 5 not found"
   → Frontend wyświetla błąd po angielsku
```

### Co jest po której stronie

| Co | Gdzie mieszka | Dlaczego |
|---|---|---|
| Etykiety przycisków, formularzy | Frontend JSON | To są elementy UI, tylko frontend je renderuje |
| Nazwy kolumn Kanban | Frontend JSON | UI logika |
| Nazwy etapów rekrutacji (predefiniowane) | Frontend JSON | Wyświetlane przez frontend, backend trzyma klucz |
| Wiadomości błędów HTTP | Backend `.properties` | Backend generuje te błędy |
| Komunikaty walidacji (@NotBlank itp.) | Backend `.properties` | Bean Validation działa na backendzie |
| Auto-nota o zmianie wynagrodzenia | Backend `.properties` | Generowana przez serwis, nie przez UI |
| Nazwy odznak (Rękawica, Widmo...) | Frontend `badges.json` | API zwraca kod (np. `"Rękawica"`), frontend tłumaczy |
| Powody odrzucenia (ODMOWA_MAILOWA itp.) | Frontend JSON | Enum z backendu, tłumaczony przez frontend |

### Co NIE jest i18n w projekcie

- **Dane użytkownika w bazie** — np. notatki, własne nazwy etapów wpisane przez użytkownika. To dane, nie UI. Nie tłumaczysz danych.
- **Enum wartości** (`WYSLANE`, `ODMOWA`) — to kody, nie tekst do wyświetlenia. Frontend mapuje je na tekst w JSON (`kanban.statusWYSLANE`).
- **Nazwy odznak jako klucze API** — backend zwraca `"Rękawica"` (polska nazwa jako klucz), frontend używa jej jako klucz w `badges.names.Rękawica` → tłumaczy na "The Gauntlet" po angielsku. To świadoma decyzja architektoniczna.

---

## Część 5 — Podsumowanie: kluczowe pliki projektu

### Backend

| Plik | Rola |
|---|---|
| `config/I18nConfig.java` | Konfiguracja MessageSource, LocalValidatorFactoryBean, LocaleResolver |
| `resources/i18n/messages.properties` | Angielskie tłumaczenia (fallback) |
| `resources/i18n/messages_pl.properties` | Polskie tłumaczenia |
| `exception/GlobalExceptionHandler.java` | Używa MessageSource do tytułów błędów HTTP |
| `controller/AuthController.java` | Używa MessageSource do komunikatów o tokenach |
| `service/ApplicationService.java` | Używa MessageSource w EntityNotFoundException |
| `service/NoteService.java` | Używa MessageSource w wyjątkach + auto-nota salary |
| `service/CVService.java` | Używa MessageSource w wyjątkach plików |
| `service/UserService.java` | Używa MessageSource w wyjątkach + demo dane po angielsku |

### Frontend

| Plik | Rola |
|---|---|
| `src/main.tsx` | Importuje i18n PRZED Reactem — inicjalizuje bibliotekę |
| `src/i18n/index.ts` | Konfiguracja i18next (zasoby, LanguageDetector, fallback) |
| `src/i18n/types.ts` | TypeScript typowanie kluczy — autocomplete i błędy kompilacji |
| `src/i18n/locales/pl/*.json` | Polskie tłumaczenia (4 pliki: common, errors, badges, tour) |
| `src/i18n/locales/en/*.json` | Angielskie tłumaczenia (4 pliki) |
| `src/components/LanguageSwitcher.tsx` | Przyciski PL/EN, wywołuje `i18n.changeLanguage()` |
| `src/services/api.ts` → `getHeaders()` | Dodaje `Accept-Language` do każdego HTTP request |
| `src/components/kanban/types.ts` | `LEGACY_STAGE_MAP`, `translateStageName()`, `normalizeStageKey()` |

---

## Część 6 — Najczęstsze pytania

### Dlaczego fallback to angielski, nie polski?

Projekt jest portfolio — możesz pokazywać go rekruterom z różnych krajów. Angielski jest bezpieczniejszym domyślnym. Polska wersja jest dostępna, ale musisz ją aktywnie wybrać.

### Co się dzieje gdy brak tłumaczenia dla danego klucza?

**Frontend (i18next):** zwraca sam klucz, np. `"form.missingKey"`. W konsoli pojawia się warning. Dlatego masz `types.ts` — TypeScript wyłapuje brakujące klucze już na etapie kompilacji.

**Backend (MessageSource):** jeśli nie ma klucza dla `pl` → szuka w `messages.properties` (fallback angielski). Jeśli nie ma nigdzie → rzuca `NoSuchMessageException`.

### Dlaczego `{validation.company.required}` ma klamry a nie cudzysłowy?

`{klucz}` to składnia Bean Validation — mówi "to jest klucz do rozwiązania w MessageSource, nie dosłowny tekst". Bez klamr Spring potraktuje to jako treść komunikatu.

### Jak działają stage names — dlaczego są skomplikowane?

Problem: etapy rekrutacji (Rozmowa z HR, Zadanie rekrutacyjne...) są przechowywane w DB jako tekst. Stare dane mają polskie nazwy (`"Rozmowa z HR"`), nowe dane mają klucze i18n (`"stage.hrInterview"`). Trzeba obsłużyć oba formaty bez migracji bazy.

Rozwiązanie — `src/components/kanban/types.ts`:
```ts
// Nowy format (klucz):
translateStageName("stage.hrInterview", t) → t("stage.hrInterview") → "Rozmowa z HR" / "HR Interview"

// Stary format (polska nazwa — legacy):
translateStageName("Rozmowa z HR", t) → LEGACY_STAGE_MAP → "stage.hrInterview" → t(...) → "Rozmowa z HR" / "HR Interview"

// Custom (wpisany przez usera):
translateStageName("Mój etap", t) → "Mój etap" (bez tłumaczenia — to dane usera)
```

### Jak Cypress testy wiedzą jakiego języka użyć?

Cypress odwiedza stronę jak normalny użytkownik. LanguageDetector sprawdzi localStorage. Dlatego w `cy.login()` ustawiamy:
```ts
win.localStorage.setItem('i18nextLng', 'pl')
```
Teraz aplikacja zawsze startuje po polsku w testach → asercje `cy.contains('Wysłane')` działają deterministycznie.

---

*Ostatnia aktualizacja: 2026-03-28*
