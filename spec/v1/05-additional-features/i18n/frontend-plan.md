# Plan implementacji i18n — EasyApply Frontend

## Proces pracy (obowiązujący dla każdego etapu)

1. **Implementacja** — Claude robi zmiany w kodzie
2. **Weryfikacja automatyczna** — `npm run build` + `npm run test:run`, oba muszą być zielone
3. **Weryfikacja manualna** — użytkownik odpala `npm run dev` i sprawdza wzrokowo
4. **Aktualizacja planów** — Claude aktualizuje checkboxy w tym pliku
5. **Sugestia commita** — Claude proponuje wiadomość commita (format: `type(frontend): opis`)
6. **Commit** — użytkownik sam robi `git add` + `git commit`
7. **Pytanie o kontynuację** — Claude pyta czy idziemy dalej do następnego etapu

---

## Status realizacji

### Etap 0 — Przygotowanie
- [x] Inwentaryzacja string literals w komponentach
- [x] Instalacja pakietów: `i18next react-i18next`
- [x] Stworzenie struktury katalogów `src/i18n/`
- [x] Konfiguracja `src/i18n/index.ts`
- [x] Import `i18n` w `main.tsx` (przed React)
- [x] Weryfikacja: aplikacja działa identycznie jak przed
- [x] Wypełnienie wszystkich plików JSON (pl + en): `common`, `errors`, `badges`, `tour`

### Etap 1 — Namespace `errors`
- [x] `throw new Error(...)` z `api.ts` → klucze i18n
- [x] `alert(...)` z `CVManager.tsx` → klucze i18n
- [x] `throw new Error` z `AuthProvider.tsx` → klucze i18n
- [x] `en/errors.json` przetłumaczone
- [x] `api.test.ts` — asercje zaktualizowane na klucze

### Etap 2 — Namespace `common` (główny UI)
- [x] `LoginPage.tsx`
- [x] `AppContent.tsx`
- [x] `NotesList.tsx` (częściowo — patrz Etap 2a)
- [x] `SalaryFormSection.tsx`
- [x] `EndModal.tsx`
- [x] `MoveModal.tsx`
- [x] `OnboardingOverlay.tsx`
- [x] `ApplicationCard.tsx`
- [x] `ApplicationDetails.tsx`
- [x] `ApplicationForm.tsx`
- [x] `ApplicationTable.tsx`
- [x] `CVManager.tsx`

### Etap 2a — Pominięte podczas migracji (BUGFIX)
- [x] `ErrorBoundary.tsx` — hardcoded `"Coś poszło nie tak"`, `"Przepraszamy"`, `"Odśwież stronę"` → i18n
- [x] `NotesList.tsx` — hardcoded `"Przed chwilą"` i pozostałe czasy relatywne → i18n

### Etap 3 — Namespace `badges`
- [x] `BadgeWidget.tsx` + `constants/` → `badges.json`
- [x] `BadgeWidget.test.tsx` zaktualizowany
- [x] `badges.cy.ts` zaktualizowany

### Etap 4 — Namespace `tour`
- [x] `TourGuide.tsx` → `tour.json`
- [x] Weryfikacja tour mobile i desktop

### Etap 5 — Cypress `data-cy`
- [x] Identyfikacja wszystkich `cy.contains(...)` na interaktywnych elementach
- [x] Dodanie `data-cy` do komponentów React
- [x] Migracja selektorów w plikach Cypress
- [x] Pełny suite E2E zielony

### Etap 6 — TypeScript typowanie kluczy
- [x] `src/i18n/types.ts` z deklaracją modułu
- [x] `tsc --noEmit` bez błędów

### Etap 7 — Language Detector + Switcher
- [x] Instalacja: `npm install i18next-browser-languagedetector`
- [x] Aktualizacja `src/i18n/index.ts`:
  - Usunięcie hardcoded `lng: 'pl'`
  - Dodanie `LanguageDetector` plugin
  - `fallbackLng: 'en'`
  - `supportedLngs: ['pl', 'en']`
  - `detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] }`
- [x] Nowy komponent `src/components/LanguageSwitcher.tsx` (przyciski PL / EN)
- [x] `AppContent.tsx` — LanguageSwitcher w headerze (obok BadgeWidget)
- [x] `LoginPage.tsx` — LanguageSwitcher widoczny przed zalogowaniem
- [x] `api.ts` — dodanie nagłówka `Accept-Language: i18n.language` w `getHeaders()`
- [x] CSS dla przełącznika
- [x] `src/test/setup.ts` — `i18n.changeLanguage('pl')` dla środowiska testowego
- [x] `npm run build` zielony
- [x] `npm run test:run` zielony
- [x] Weryfikacja manualna: zmiana języka działa natychmiast, zapisuje się po odświeżeniu

### Etap 7a — Stage Names i18n (nazwy etapów rekrutacji)

> Odkryty podczas weryfikacji manualnej Etapu 7. Etapy w kolumnie "W procesie"
> nie tłumaczyły się po zmianie języka, bo były przechowywane jako polskie stringi w DB.

#### Architektura
- Predefiniowane etapy: w DB przechowywany **klucz** (`"stage.hrInterview"`), nie nazwa wyświetlana
- Stare dane legacy (polskie stringi w DB): obsługiwane przez mapę `LEGACY_STAGE_MAP` — tłumaczone poprawnie bez migracji DB
- Etapy custom (wpisane ręcznie przez usera): przechowywane as-is, wyświetlane as-is — to jest user data, nie podlega tłumaczeniu

#### Pliki do zmiany

- [x] `src/i18n/locales/pl/common.json` — dodać sekcję `stage.*`
- [x] `src/i18n/locales/en/common.json` — dodać sekcję `stage.*`
- [x] `src/components/kanban/types.ts`:
  - Zmienić `PREDEFINED_STAGES: string[]` → `PREDEFINED_STAGES: { key: string; labelKey: ParseKeys<'common'> }[]`
  - Dodać `LEGACY_STAGE_MAP: Record<string, string>` (mapa stara nazwa → klucz)
  - Dodać helper `translateStageName(name, t)` — tłumaczy klucz lub legacy string, custom zwraca as-is
  - Dodać helper `normalizeStageKey(name)` — zwraca klucz niezależnie od formatu (do porównań)
- [x] `src/components/kanban/StageModal.tsx` — pełna migracja do i18n + wysyłanie `stage.key` zamiast display name
- [x] `src/components/kanban/ApplicationCard.tsx`:
  - Wyświetlanie: `translateStageName(application.currentStage, t)`
  - Dropdown active check: `normalizeStageKey(application.currentStage) === stage.key`
  - Wysyłanie: `stage.key` (nie display name)
  - Data aplikacji: `i18n.language` zamiast hardcoded `'pl-PL'`
- [x] `src/components/applications/ApplicationDetails.tsx`:
  - Wyświetlanie: `translateStageName(application.currentStage, t)`
  - `formatDate` i `formatSalary`: `i18n.language` zamiast hardcoded `'pl-PL'`
- [x] `npm run build` zielony
- [x] `npm run test:run` zielony
- [x] Weryfikacja manualna:
  - Predefiniowane etapy tłumaczą się po zmianie języka
  - Stare etapy w DB (polskie stringi) wyświetlają się poprawnie
  - Custom etapy wyświetlają się as-is niezależnie od języka
  - Zaznaczony (active) etap działa poprawnie w dropdownie

#### Klucze i18n
```json
// pl/common.json
"stage": {
  "hrInterview": "Rozmowa z HR",
  "technicalInterview": "Rozmowa techniczna",
  "managerInterview": "Rozmowa z managerem",
  "recruitmentTask": "Zadanie rekrutacyjne",
  "finalInterview": "Rozmowa finalna",
  "modalTitle": "Wybierz etap rekrutacji",
  "customPlaceholder": "Inny etap...",
  "customAdd": "Dodaj",
  "cancel": "Anuluj"
}

// en/common.json
"stage": {
  "hrInterview": "HR Interview",
  "technicalInterview": "Technical Interview",
  "managerInterview": "Manager Interview",
  "recruitmentTask": "Recruitment Task",
  "finalInterview": "Final Interview",
  "modalTitle": "Select recruitment stage",
  "customPlaceholder": "Other stage...",
  "customAdd": "Add",
  "cancel": "Cancel"
}
```

#### Helpers w `types.ts`
```ts
// Maps legacy Polish DB values to i18n keys (backward compatibility — no DB migration needed)
export const LEGACY_STAGE_MAP: Record<string, string> = {
  'Rozmowa z HR':         'stage.hrInterview',
  'Rozmowa techniczna':   'stage.technicalInterview',
  'Rozmowa z managerem':  'stage.managerInterview',
  'Zadanie rekrutacyjne': 'stage.recruitmentTask',
  'Rozmowa finalna':      'stage.finalInterview',
}

// Returns display string for any stored value (key, legacy Polish, or custom text)
export const translateStageName = (name: string | null | undefined, t: TFunction): string => {
  if (!name) return ''
  if (name.startsWith('stage.')) return t(name as ParseKeys<'common'>)
  const mappedKey = LEGACY_STAGE_MAP[name]
  if (mappedKey) return t(mappedKey as ParseKeys<'common'>)
  return name // custom stage — show as-is
}

// Returns canonical key for comparisons (active state in dropdown)
export const normalizeStageKey = (name: string | null | undefined): string => {
  if (!name) return ''
  if (name.startsWith('stage.')) return name
  return LEGACY_STAGE_MAP[name] ?? name
}
```

### Etap 8 — Komentarze i testy EN
- [x] Komentarze w kodzie źródłowym → angielski (`KanbanBoard.tsx`, `LoginPage.tsx`, `AuthCallbackPage.tsx`, `ProtectedRoute.tsx`)
- [x] `it()` w testach Vitest → angielski (`App.test.tsx`, `BadgeWidget.test.tsx`)
- [x] Komentarz w `cypress/support/e2e.ts` → angielski
- [x] `it()` w `cypress/e2e/application-crud.cy.ts` → angielski
- [x] `npm run test:run` zielony

### Etap 9 — Rename enum values to English + i18n key cleanup

> **Ten etap jest tylko podsumowaniem.** Dokładna instrukcja krok po kroku, pełne mapowania
> starych→nowych wartości enum, lista zmienionych plików per-etap oraz historia wykonania
> (z wynikami testów po każdym kroku) znajdują się w: `spec/i18n/enum-rename-plan.md`

#### Typy domenowe (`types/domain.ts`)
- [x] `ApplicationStatus` — `'SENT' | 'IN_PROGRESS' | 'OFFER' | 'REJECTED'`
- [x] `ContractType` — `'B2B' | 'EMPLOYMENT' | 'MANDATE' | 'OTHER'`
- [x] `SalaryType` — `'GROSS' | 'NET'`
- [x] `RejectionReason` — `'NO_RESPONSE' | 'EMAIL_REJECTION' | 'REJECTED_AFTER_INTERVIEW' | 'OTHER'`
- [x] `NoteCategory` — `'QUESTIONS' | 'FEEDBACK' | 'OTHER'`

#### Kanban

- [x] `kanban/types.ts` — `STATUSES` ids (`SENT`, `IN_PROGRESS`, `FINISHED`) i labelKeys (`kanban.statusSENT` itd.)
- [x] `kanban/types.ts` — `REJECTION_REASONS` ids i labelKeys (`kanban.rejectionNoResponse` itd.)
- [x] `kanban/KanbanBoard.tsx` — wszystkie literały statusów i rejection reasons
- [x] `kanban/ApplicationCard.tsx` — literały `W_PROCESIE`/`OFFER`/`ODMOWA`
- [x] `kanban/EndModal.tsx` — `'OFERTA'`/`'ODMOWA'`/`'INNE'`
- [x] `kanban/MoveModal.tsx` — `'OFERTA'`/`'ODMOWA'`/`'ZAKONCZONE'`

#### Aplikacje

- [x] `constants/applicationStatus.ts` — `STATUS_CONFIG` klucze (`SENT`, `IN_PROGRESS`, `OFFER`, `REJECTED`), labelKeys (`statusConfig.SENT` itd.), usunięte legacy entries
- [x] `components/applications/ApplicationTable.tsx` — inline `contractKeys` map, `t()` dla contractType; usunięte legacy statusConfig entries
- [x] `components/applications/ApplicationDetails.tsx` — `CONTRACT_TYPE_KEYS` map, `formatSalary` przyjmuje `t: TFunction`
- [x] `components/applications/SalaryFormSection.tsx` — `value="GROSS/NET"`, `value="EMPLOYMENT/MANDATE/OTHER"`, etykiety przez `t()`
- [x] `components/applications/ApplicationForm.tsx` — default `'BRUTTO'` → `'GROSS'`

#### Notes

- [x] `components/notes/NotesList.tsx` — `CATEGORIES` values i labelKeys, `LEGACY_CATEGORY_MAP`, default `useState` `'PYTANIA'` → `'QUESTIONS'`, reset po zapisie `'PYTANIA'` → `'QUESTIONS'`

#### i18n JSON (cleanup kluczy + nowe klucze)

- [x] `en/common.json` + `pl/common.json` — rename: `salary.brutto/netto` → `salary.gross/net`
- [x] `en/common.json` + `pl/common.json` — rename: `notes.catPytania/catInne` → `notes.catQuestions/catOther`
- [x] `en/common.json` + `pl/common.json` — rename: `kanban.rejectionBrak*` → `kanban.rejectionNoResponse` itd.
- [x] `en/common.json` + `pl/common.json` — dodano: `salary.contractB2B`, `contractEmployment`, `contractMandate`, `contractOther`
- [x] `en/common.json` + `pl/common.json` — usunięte: legacy `statusConfig.ROZMOWA/ZADANIE/ODRZUCONE`

#### Testy

- [x] `App.test.tsx`, `useApplications.test.tsx` — zaktualizowane asercje statusów
- [x] `npm run test:run` — 67/67 ✅

---

## Struktura plików

```
src/
  i18n/
    index.ts                  ← konfiguracja i18next + LanguageDetector
    types.ts                  ← TypeScript typowanie kluczy
    locales/
      pl/
        common.json
        errors.json
        badges.json
        tour.json
      en/
        common.json
        errors.json
        badges.json
        tour.json
  components/
    LanguageSwitcher.tsx      ← nowy komponent (Etap 7)
```

---

## Konfiguracja docelowa `src/i18n/index.ts`

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import plCommon from './locales/pl/common.json'
import plErrors from './locales/pl/errors.json'
import plBadges from './locales/pl/badges.json'
import plTour from './locales/pl/tour.json'

import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import enBadges from './locales/en/badges.json'
import enTour from './locales/en/tour.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['pl', 'en'],
    defaultNS: 'common',
    ns: ['common', 'errors', 'badges', 'tour'],
    resources: {
      pl: { common: plCommon, errors: plErrors, badges: plBadges, tour: plTour },
      en: { common: enCommon, errors: enErrors, badges: enBadges, tour: enTour },
    },
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  })

export default i18n
```

---

## Kolejność etapów do wykonania

```
Etap 2a (bugfix — pominięte pliki)
    ↓
Etap 7 (language detector + switcher)
    ↓
Etap 8 (komentarze EN)
    ↓
Etap 5 (pełny E2E — do zweryfikowania)
```

---

## Definicja ukończenia (DoD)

- [x] Zero hardcoded polskich stringów w komponentach React
- [x] Zero hardcoded polskich stringów w plikach `*.ts` poza `locales/`
- [x] Wszystkie klucze z `pl/*.json` mają odpowiednik w `en/*.json`
- [x] `npm run build` bez błędów TypeScript
- [x] `npm run test:run` — 0 failed tests
- [x] Zmiana języka w UI działa natychmiast i zapisuje się po odświeżeniu
- [x] Backend otrzymuje `Accept-Language` header z każdym requestem

---

*Ostatnia aktualizacja: 2026-03-29*