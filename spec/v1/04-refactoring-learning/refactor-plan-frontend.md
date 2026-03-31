# Plan nauki frontendu — EasyApply

## Kontekst dokumentu

Ten dokument jest przewodnikiem nauki dla Jakuba — autora projektu EasyApply.
Jakub jest backendowcem (Java/Spring), który napisał tę aplikację z pomocą Claude Code.
Z natury jest backendowcem, więc, chce zrozumieć jak działa frontend na poziomie podstawowym.

**Dokumenty źródłowe:**
- `spec/v1/04-refactoring-learning/refactor-plan-frontend.md` — ten plik (plan nauki + postęp)
- `spec/v1/03-review/code-review-2026-03-01.md` — Code Review od mentora (DR & AI, 2026-03-01) — źródło wszystkich napraw

**Jak używać tego planu:**
Wklej go do nowej sesji Claude Code i napisz: _"Kontynuujemy naukę frontendu. Jesteśmy na Etapie X."_

**Claude na początku każdej sesji czyta:**
1. `spec/v1/04-refactoring-learning/refactor-plan-frontend.md` — ten plik (plan, zasady, postęp)
2. `spec/v1/03-review/code-review-2026-03-01.md` — code review od mentora
3. `spec/v1/04-refactoring-learning/learning-notes-frontend.md` — co Jakub już przerobił i zrozumiał

`learning-notes-frontend.md` to kluczowy kontekst — pokazuje jakim językiem i analogiami tłumaczyć kolejne zagadnienia, co już wiadomo, do czego można się odwoływać.

---

## Projekt: EasyApply

**Co robi:** Aplikacja do śledzenia procesów rekrutacyjnych dla juniorów IT.
Użytkownik loguje się przez Google, dodaje aplikacje o pracę, śledzi etapy rekrutacji
na tablicy Kanban, zarządza CV i notatkami. System odznak gamifikuje szukanie pracy.

**Stack technologiczny:**
- **Backend:** Java 21, Spring Boot, Spring Security, OAuth2 + JWT (RS256), PostgreSQL, Flyway, Docker
- **Frontend:** React 18, TypeScript (strict), Vite, React Query (TanStack), React Router, Cypress

**Struktura katalogów frontendu (`easyapply-frontend/src/`):**
```
App.tsx                          — korzeń aplikacji, routing, providerzy
AppContent.tsx                   — główny layout dashboardu (wg CR: warto przemianować na DashboardLayout)
main.tsx                         — punkt wejścia aplikacji

auth/
  AuthProvider.tsx               — kontekst uwierzytelnienia, sprawdza token przy starcie
  ProtectedRoute.tsx             — blokuje dostęp do stron dla niezalogowanych

pages/
  LoginPage.tsx                  — strona logowania (tu jest błąd CR: zahardkodowany URL)
  AuthCallbackPage.tsx           — obsługuje powrót z Google OAuth2
  DashboardPage.tsx              — główna strona aplikacji

components/
  applications/
    ApplicationTable.tsx         — tabela wszystkich aplikacji z filtrowaniem i sortowaniem
    ApplicationForm.tsx          — formularz dodawania/edytowania aplikacji
    ApplicationDetails.tsx       — panel szczegółów wybranej aplikacji
    SalaryFormSection.tsx        — sekcja wynagrodzenia w formularzu
  kanban/
    KanbanBoard.tsx              — tablica Kanban (~987 linii, wg CR wymaga rozbicia)
  cv/
    CVManager.tsx                — zarządzanie CV (~650 linii, wg CR używa useState zamiast React Query)
  notes/
    NotesList.tsx                — lista notatek do aplikacji
  badges/
    BadgeWidget.tsx              — widget odznak/statystyk
  tour/
    TourGuide.tsx                — przewodnik po aplikacji (~572 linie)

hooks/
  useApplications.ts             — React Query hook: pobieranie i mutacje aplikacji
  useCV.ts                       — React Query hook: pobieranie i mutacje CV
  useNotes.ts                    — React Query hook: pobieranie i mutacje notatek
  useBadgeStats.ts               — React Query hook: statystyki odznak

services/
  api.ts                         — warstwa komunikacji z backendem (fetch, JWT, endpoints)

types/
  domain.ts                      — typy TypeScript odzwierciedlające encje backendu
```

---

## Zasady trybu Mentor (OBOWIĄZUJĄ przez całą naukę)

1. **Poziom tłumaczenia:** Jakub zna Javę i Spring na poziomie podstawowym/średnim.
   NIE zna frontendu. Tłumacz analogiami do Javy/Springa tam gdzie to możliwe.
   Łopatologicznie. Żadnych skrótów myślowych.

2. **Interakcja:** Po każdym omówionym zagadnieniu OBOWIĄZKOWO zapytaj czy coś
   wyjaśnić. Nie przechodź dalej bez wyraźnego potwierdzenia Jakuba ("ok", "rozumiem", "dalej").

3. **Quiz po każdym podtemacie:** Po omówieniu każdego małego zagadnienia w ramach etapu
   (np. "czym jest Vite", "czym jest useState") zadaj Jakubowi 5 pytań sprawdzających zrozumienie.
   Pytania mają być konkretne, odnosić się do projektu, nie do abstrakcji.
   Czekaj na odpowiedzi, poprawiaj błędy, zanim przejdziesz dalej.

4. **Notatki po każdym dużym etapie:** Po zakończeniu całego etapu (1–10) zapisz podsumowanie
   do pliku `spec/v1/04-refactoring-learning/learning-notes-frontend.md`. Format: nagłówek etapu, kluczowe pojęcia z wyjaśnieniami,
   analogie do Javy, najważniejsze pliki projektu których dotyczył etap.
   Plik ma służyć Jakubowi jako ściągawka do której może wracać.

5. **Zawsze pokazuj kod:** Omawiaj konkretne pliki z projektu, nie abstrakcyjne przykłady.
   Wskazuj linię pliku (format: `plik.tsx:42`).

6. **CR zintegrowany z nauką:** Przy każdym etapie — jeśli Code Review (spec/v1/03-review/code-review-2026-03-01.md) wskazuje
   problem w omawianym pliku — najpierw wytłumacz mechanizm, potem napraw razem z Jakubem.
   Nie naprawiaj bez wyjaśnienia "dlaczego". Przed naprawą przeczytaj aktualny stan pliku.

7. **Nie pomijaj pytań.** Jeśli Jakub zapyta o cokolwiek — odpowiedz zanim przejdziesz dalej.

8. **Nie commituj.** Jakub robi commity sam. Nigdy nie uruchamiaj `git commit`.

---

## Flow pracy przy każdej naprawie z CR

Każda zmiana w kodzie musi przejść przez ten proces. Nie pomijaj żadnego kroku.

```
1. WYJAŚNIJ   — wytłumacz mechanizm (dlaczego to błąd / jak to działa)
2. PRZECZYTAJ — odczytaj aktualny plik przed zmianą (Read tool)
3. NAPRAW     — wprowadź zmianę (Edit tool)
4. TESTY      — sprawdź czy zmiana dotyka istniejących testów:
                  a) uruchom: npm test (Vitest) w katalogu easyapply-frontend
                  b) jeśli test się sypie — zaktualizuj test, uruchom ponownie
                  c) jeśli zmiana dodaje nową logikę — zaproponuj nowy test
5. BUILD      — sprawdź czy TypeScript się kompiluje: npm run build
6. PRZEGLĄDARKA — przypomnij Jakubowi żeby ręcznie przetestował zmianę w przeglądarce
                  (podaj konkretnie co kliknąć / co sprawdzić)
7. PYTANIE    — zapytaj: "Czy zaznaczyć CR-X jako naprawione w tabeli postępu?"
8. AKTUALIZUJ — jeśli Jakub potwierdzi: zaktualizuj status w tabelach poniżej (⬜ → ✅)
                  oraz dodaj wpis w "Notatki z sesji"
```

**Ważne zasady:**
- Krok 4 (testy) jest **obowiązkowy** — nawet dla małych zmian
- Krok 6 (przeglądarka) to zawsze zadanie dla Jakuba, nie dla Claude
- Krok 7 (pytanie o zaznaczenie) — Claude pyta, Jakub decyduje
- Jeśli testy nie przechodzą — **nie przechodź dalej** dopóki nie są zielone

---

## Postęp nauki

| Etap | Temat | Nauka | CR naprawione w tym etapie |
|------|-------|-------|---------------------------|
| 1 | Ekosystem i narzędzia | ✅ | — |
| 2 | Komponent — podstawowa jednostka | ✅ | — |
| 3 | Stan (state) i rerenderowanie | ✅ | — |
| 4 | Hooki React | ✅ | — |
| 5 | React Query — serce frontendu | ✅ | CR-7 |
| 6 | Routing i ochrona stron | ✅ | — |
| 7 | Komunikacja front↔back | ✅ | CR-3, CR-4, CR-9 |
| 8 | OAuth2 i JWT — pełny przepływ | ✅ | CR-5, CR-6 |
| 9 | TypeScript w React | ✅ | CR-2, CR-8 |
| 10 | Testowanie frontendu | ✅ | — |

Po zakończeniu każdego etapu Claude pyta:
> _"Czy uznajemy Etap X za zaliczony? Zaktualizuję tabelę i notatki z sesji."_

---

## Lista napraw z CR (śledzenie postępu)

Źródło: `spec/v1/03-review/code-review-2026-03-01.md` (review z 2026-03-01, reviewer: DR & AI)

### 🔴 Krytyczne (bezpieczeństwo / poprawność)

| ID | Problem | Plik(i) | Etap | Status | Przetestowane |
|----|---------|---------|------|--------|---------------|
| CR-2 | Brak walidacji URL-i (XSS przez href) | `ApplicationDetails.tsx`, `CVManager.tsx` | Etap 9 | ✅ | ✅ |
| CR-3 | Kontrakt refresh tokena (`token` vs `accessToken`) | `api.ts` + backend kontroler | Etap 7 | ✅ | ✅ |
| CR-4 | Zahardkodowany `http://localhost:8080` w LoginPage | `LoginPage.tsx` | Etap 7 | ✅ | ✅ |
| CR-5 | Brak SameSite na ciasteczku refresh_token | `OAuth2AuthenticationSuccessHandler.java` | Etap 8 | ✅ | ✅ |
| CR-6 | Brak Error Boundary + crash `new URL()` w CVManager | `App.tsx`, `CVManager.tsx` | Etap 8 | ✅ | ✅ |

### 🟡 Ważne (jakość / spójność)

| ID | Problem | Plik(i) | Etap | Status | Przetestowane |
|----|---------|---------|------|--------|---------------|
| CR-7 | CVManager używa useState zamiast useCV() | `CVManager.tsx` | Etap 5 | ✅ | ✅ |
| CR-8 | Duplikaty stałych kolorów statusów | `ApplicationDetails.tsx`, `ApplicationTable.tsx` | Etap 9 | ✅ | ✅ |
| CR-9 | `apiFetch()` redirect bez przerywania przetwarzania | `api.ts` | Etap 7 | ✅ | ✅ |
| CR-11 | Brak memoizacji sort/filter | `ApplicationTable.tsx` | Etap 3 | ✅ | ✅ |
| CR-12 | KanbanBoard.tsx ~987 linii — wymaga rozbicia | `KanbanBoard.tsx` | opcjonalny | ✅ | ✅ |

**Legenda kolumn:**
- **Status** ⬜/✅ — czy zmiana w kodzie została wprowadzona
- **Przetestowane** ⬜/✅ — czy testy przeszły AND Jakub sprawdził w przeglądarce

---

## Szczegółowy opis etapów

---

### Etap 1 — Ekosystem i narzędzia

**Cel:** Zrozumieć czym jest React, TypeScript i Vite na poziomie "co to jest i po co".

**Analogie do Javy:**
- React ≈ framework do budowania UI (jak Spring, ale dla przeglądarki)
- TypeScript ≈ Java (typowanie statyczne) vs JavaScript ≈ dynamiczna Groovy
- Vite ≈ Maven/Gradle (buduje projekt, zarządza zależnościami)
- `package.json` ≈ `pom.xml`
- `node_modules/` ≈ repozytorium Maven `~/.m2`
- `npm run dev` ≈ `mvn spring-boot:run`

**Co omawiamy:**
- Jak przeglądarka uruchamia kod JavaScript (DOM, event loop — podstawy)
- Czym jest SPA (Single Page Application) vs tradycyjna strona
- Jak Vite kompiluje TypeScript → JavaScript i serwuje go przeglądarce
- Co to jest `index.html` + `main.tsx` jako punkt wejścia (analogia do `main()` w Javie)
- Przegląd struktury katalogów `src/`

**Pliki do otwarcia:**
- `easyapply-frontend/package.json` — zależności (jak pom.xml)
- `easyapply-frontend/vite.config.ts` — konfiguracja buildu
- `easyapply-frontend/src/main.tsx` — punkt wejścia
- `easyapply-frontend/src/App.tsx` — korzeń aplikacji

**CR powiązane:** brak na tym etapie.

---

### Etap 2 — Komponent — podstawowa jednostka

**Cel:** Zrozumieć czym jest komponent React, JSX, props.

**Analogie do Javy:**
- Komponent ≈ klasa z metodą `render()` (ale zapisana jako funkcja)
- JSX ≈ szablony (jak Thymeleaf/JSP, ale w kodzie TypeScript)
- Props ≈ parametry konstruktora / argumenty metody (dane przekazywane do komponentu)
- Renderowanie ≈ generowanie HTML (tylko dynamiczne, w przeglądarce)

**Co omawiamy:**
- Czym jest JSX (`<div>`, `<LoginPage />`) — dlaczego HTML w TypeScript?
- Jak React zamienia JSX w drzewko DOM (Virtual DOM — idea, nie szczegóły)
- Props — jak przekazywać dane do komponentu
- Eksport i import komponentów (analogia do klas w Javie)
- Jak komponenty się zagnieżdżają (App → AuthProvider → Routes → LoginPage)

**Pliki do otwarcia:**
- `src/App.tsx` — kompozycja komponentów, routing na najwyższym poziomie
- `src/pages/LoginPage.tsx` — prosty komponent strony
- `src/components/badges/BadgeWidget.tsx` — mały komponent z props

**CR powiązane:** brak na tym etapie.

---

### Etap 3 — Stan (state) i rerenderowanie

**Cel:** Zrozumieć `useState`, jak React aktualizuje UI i dlaczego to inne niż w Javie.

**Analogie do Javy:**
- `useState` ≈ pole w klasie + setter, który automatycznie odświeża widok
- W Javie zmieniasz pole → nic się nie dzieje w UI. W React zmieniasz state → React
  automatycznie przerenderowuje komponent (wywołuje funkcję komponentu od nowa)

**Co omawiamy:**
- `const [value, setValue] = useState(initial)` — destructuring, jak to czytać
- Dlaczego NIE modyfikujemy stanu bezpośrednio (jak `this.field = x` w Javie)
- Rerenderowanie — co to znaczy, że komponent "się odrenderowuje"
- Zasada: jeden stan → jeden source of truth
- Kiedy `useState` a kiedy zwykła zmienna

**Pliki do otwarcia:**
- `src/auth/AuthProvider.tsx` — `useState` dla `user` i `isLoading` (linijki 34-35)
- `src/components/applications/ApplicationTable.tsx` — filtry i sortowanie jako stan

**CR powiązane:**
- CR-11 (memoizacja): `ApplicationTable.tsx` — sort/filter bez memoizacji przy każdym renderze.
  Omawiamy co to `useMemo` i kiedy jest potrzebne.

---

### Etap 4 — Hooki React

**Cel:** Zrozumieć czym są hooki, `useEffect`, i własne hooki w projekcie.

**Analogie do Javy:**
- Hooki ≈ metody lifecycle (jak `@PostConstruct`, `@PreDestroy` w Springu)
- `useEffect` ≈ kod który musi się wykonać "po stronie" — np. po załadowaniu komponentu
- Własny hook (`useApplications`) ≈ serwis w Springu (enkapsuluje logikę, można reużywać)

**Co omawiamy:**
- `useEffect(fn, [deps])` — kiedy się odpala, co to tablica zależności
- Typowe użycia: fetch danych przy starcie, subskrypcje, sprzątanie
- Różnica między `useEffect` a `useState`
- Czym są własne hooki i dlaczego muszą zaczynać się od `use`
- Przegląd hooków projektu: `useApplications`, `useCV`, `useNotes`, `useBadgeStats`

**Pliki do otwarcia:**
- `src/auth/AuthProvider.tsx` — `useEffect` sprawdzający token przy starcie (linijki 37-53)
- `src/hooks/useApplications.ts` — własny hook oparty na React Query
- `src/hooks/useNotes.ts` — własny hook

**CR powiązane:**
- CR-7 (zapowiedź): `CVManager.tsx` używa `useState + useEffect` zamiast gotowego `useCV()`.
  Przy tym etapie tłumaczymy dlaczego to niespójność. Naprawiamy przy Etapie 5.

---

### Etap 5 — React Query — serce frontendu

**Cel:** Zrozumieć dlaczego React Query to kluczowa biblioteka i jak działa w projekcie.

**Analogie do Javy:**
- React Query ≈ warstwa cache'owania (jak Spring Cache + @Cacheable)
- `useQuery` ≈ wywołanie repozytorium z automatycznym zarządzaniem stanem loading/error/data
- `useMutation` ≈ wywołanie serwisu mutującego dane (POST/PUT/DELETE) z automatyczną invalidacją
- `queryKeys` ≈ nazwy cache'u (jak klucze w @Cacheable)

**Co omawiamy:**
- Problem bez React Query: ręczny `useState` + `useEffect` + obsługa loading/error (jak w CVManager)
- `useQuery({ queryKey, queryFn })` — pobieranie danych z automatycznym cachowaniem
- `useMutation({ mutationFn, onSuccess })` — mutacje z invalidacją cache
- Stale time i refetching — kiedy React Query sam odświeża dane
- `queryClient.invalidateQueries` — jak unieważnić cache po mutacji

**Pliki do otwarcia:**
- `src/hooks/useApplications.ts` — kompletny przykład useQuery + useMutation
- `src/hooks/useCV.ts` — hook do CV (który CVManager powinien, ale nie używa)
- `src/components/cv/CVManager.tsx` — antyprzykład: useState+useEffect

**CR powiązane:**
- **CR-7:** Naprawiamy `CVManager.tsx` — zamieniamy `useState + useEffect + fetchCVs()`
  na gotowy hook `useCV()`. Stosujemy pełny flow pracy (testy + przeglądarka).

---

### Etap 6 — Routing i ochrona stron

**Cel:** Zrozumieć jak działa nawigacja w SPA i jak chronione są strony dla niezalogowanych.

**Analogie do Javy:**
- React Router ≈ Spring MVC `@RequestMapping` (mapowanie URL → komponent)
- `ProtectedRoute` ≈ Spring Security filter (blokuje dostęp bez autentykacji)
- `AuthProvider` + Context ≈ `SecurityContextHolder` (globalny stan uwierzytelnienia)
- `useContext` ≈ wstrzykiwanie beana przez `@Autowired`

**Co omawiamy:**
- Jak SPA obsługuje URL bez przeładowania strony (history API)
- `<Routes>` i `<Route path="..." element={...}>` — mapowanie URL → komponent
- `Navigate` — przekierowanie (jak `redirect:` w Spring MVC)
- Context API — globalny stan (dlaczego nie props drilling)
- `AuthProvider` — jak `createContext`, `Provider`, `useContext` tworzą globalny stan usera
- `ProtectedRoute` — jak sprawdza czy user jest zalogowany i gdzie przekierowuje

**Pliki do otwarcia:**
- `src/App.tsx` — pełna konfiguracja routingu
- `src/auth/AuthProvider.tsx` — Context API, tworzenie globalnego stanu auth
- `src/auth/ProtectedRoute.tsx` — guard komponentu

**CR powiązane:** brak napraw, ale omawiamy ideę Error Boundary (zapowiedź CR-6 z Etapu 8).

---

### Etap 7 — Komunikacja front↔back

**Cel:** Zrozumieć w jaki sposób frontend wysyła zapytania HTTP do Spring Boota i jak obsługuje odpowiedzi.

**Analogie do Javy:**
- `fetch()` ≈ `RestTemplate` / `WebClient` (klient HTTP)
- `api.ts` ≈ klasa serwisu HTTP (enkapsuluje wszystkie wywołania REST)
- JSON request/response ≈ `@RequestBody` / `@ResponseBody` w Spring
- `Authorization: Bearer TOKEN` ≈ nagłówek weryfikowany przez Spring Security filter

**Co omawiamy:**
- Jak działa `fetch(url, options)` — metoda, nagłówki, body
- Funkcja `apiFetch()` — co robi z odpowiedzią 401 (i jaki jest CR problem z tym)
- Funkcja `getHeaders()` — skąd bierze token i dlaczego Bearer
- CORS — dlaczego backend musi "zezwolić" frontendowi na zapytania
- `credentials: 'include'` — co to znaczy (wysyłanie ciasteczek z refresh tokenem)
- Przegląd wszystkich endpointów w `api.ts` i ich odpowiedniki w Spring kontrolerach

**Pliki do otwarcia:**
- `src/services/api.ts` — cała warstwa API
- (backend) `easyapply-backend/.../controller/` — żeby zobaczyć jak pasują do siebie

**CR powiązane (do naprawy w tym etapie):**
- **CR-3:** Kontrakt refresh tokena — backend zwraca `"token"`, frontend oczekuje `"accessToken"`
  (`api.ts:71`). Wyjaśniamy + naprawiamy obydwa końce. Flow pracy + testy + przeglądarka.
- **CR-4:** `LoginPage.tsx` — zahardkodowany `http://localhost:8080`.
  Wyjaśniamy zmienne środowiskowe Vite (`import.meta.env`). Naprawiamy. Sprawdzamy `.env.example`.
- **CR-9:** `apiFetch()` po redirect nie przerywa przetwarzania — wyjaśniamy i naprawiamy.

---

### Etap 8 — OAuth2 i JWT — pełny przepływ logowania

**Cel:** Prześledzić krok po kroku co się dzieje od kliknięcia "Zaloguj przez Google"
do pojawienia się dashboardu. Rozumieć role każdego pliku.

**Analogie do Javy:**
- `AuthCallbackPage.tsx` ≈ kontroler obsługujący callback OAuth2
- JWT w localStorage ≈ sesja po stronie klienta (zamiast `HttpSession` po stronie serwera)
- httpOnly cookie z refresh tokenem ≈ sesja serwera (niedostępna dla JS)

**Co omawiamy:**
Pełny przepływ krok po kroku:
1. Klik "Zaloguj przez Google" → redirect do Google (`LoginPage.tsx`)
2. Google odsyła na `/auth/callback?token=...` (`AuthCallbackPage.tsx`)
3. Frontend zapisuje token w localStorage i przekierowuje na `/dashboard`
4. `AuthProvider` przy starcie sprawdza localStorage i pobiera dane usera (`/api/auth/me`)
5. `ProtectedRoute` sprawdza `isAuthenticated` i wpuszcza lub wyrzuca na `/login`
6. Przy każdym zapytaniu API token leci w headerze `Authorization: Bearer`
7. Po 15 minutach token wygasa → `apiFetch` dostaje 401 → redirect na `/login`
8. Refresh token w cookie → endpoint `/api/auth/refresh` → nowy access token

**Dlaczego dwa tokeny:** access token (krótki, w localStorage) vs refresh token (długi, httpOnly cookie)

**Pliki do otwarcia:**
- `src/pages/LoginPage.tsx` — przekierowanie do Google
- `src/pages/AuthCallbackPage.tsx` — odbiór tokenu
- `src/auth/AuthProvider.tsx` — sprawdzenie sesji przy starcie
- `src/services/api.ts` — `refreshToken()`, `getHeaders()`
- (backend) `OAuth2AuthenticationSuccessHandler.java` — jak Spring generuje token

**CR powiązane (do naprawy w tym etapie):**
- **CR-5:** Brak `SameSite` na ciasteczku refresh_token — wyjaśniamy CSRF,
  naprawiamy po stronie backendu (`OAuth2AuthenticationSuccessHandler.java`). Testy + restart backendu.
- **CR-6:** Error Boundary — wyjaśniamy czym jest i naprawiamy (dodajemy do `App.tsx`).
  Przy okazji naprawiamy `new URL()` crash w `CVManager.tsx`. Testy + przeglądarka.

---

### Etap 9 — TypeScript w React

**Cel:** Zrozumieć jak TypeScript dodaje bezpieczeństwo typów do kodu frontendu
i jak `domain.ts` odzwierciedla backend.

**Analogie do Javy:**
- `interface` w TypeScript ≈ `interface` / POJO / rekord w Javie
- `type` ≈ `enum` lub typ złożony
- `T | null` ≈ `Optional<T>` lub nullable w Javie
- TypeScript strict mode ≈ `-Xlint:all` + Checkstyle w Javie

**Co omawiamy:**
- Czym jest TypeScript vs JavaScript (kompilacja, type checking)
- `interface Application` vs `class Application` w Javie — dlaczego tu interfejsy
- Union types (`'WYSLANE' | 'W_PROCESIE'`) vs enum Javy
- `| null` i `?` — jak TypeScript wymusza obsługę braku wartości
- Generics w TypeScript (np. `Promise<Application[]>`)
- Strict mode — co dają flagi `noUnusedLocals`, `noUnusedParameters`

**Pliki do otwarcia:**
- `src/types/domain.ts` — wszystkie typy projektu
- `src/services/api.ts` — jak typy są używane przy fetch
- `easyapply-frontend/tsconfig.json` — konfiguracja strict mode

**CR powiązane (do naprawy w tym etapie):**
- **CR-2:** Walidacja URL-i — `javascript:` XSS przez href.
  Wyjaśniamy atak, piszemy funkcję `isSafeUrl()`, naprawiamy `ApplicationDetails.tsx` i `CVManager.tsx`.
  Flow pracy + testy + przeglądarka.
- **CR-8:** Duplikaty stałych kolorów statusów — wyodrębniamy do `src/constants/`.
  Omawiamy zasadę DRY. Naprawiamy. Testy + przeglądarka.

---

### Etap 10 — Testowanie frontendu

**Cel:** Zrozumieć piramidę testów i jak testy frontendowe różnią się od JUnit.

**Analogie do Javy:**
- Vitest ≈ JUnit 5 (testy jednostkowe)
- Testing Library (`@testing-library/react`) ≈ Mockito + asercje na zachowaniu (nie implementacji)
- Cypress ≈ Selenium (testy E2E, przeglądarka)
- Mock Service Worker (MSW) ≈ `@MockBean` w Spring Test

**Co omawiamy:**
- Piramida testów: unit → integracja → E2E
- Jak testować komponent (renderowanie, symulacja kliknięć, asercje na DOM)
- Czym jest `test-utils.tsx` w projekcie — wrapper z providerami
- Przegląd istniejących testów: `AuthProvider.test.tsx`, `useApplications.test.tsx`
- Co warto przetestować wg CR: hooki React Query, komponenty z logiką warunkową

**Pliki do otwarcia:**
- `src/test/test-utils.tsx` — setup testów
- `src/test/auth/AuthProvider.test.tsx` — test komponentu z kontekstem
- `src/test/hooks/useApplications.test.tsx` — test hooka

**CR powiązane:**
- Omawiamy co jeszcze warto pokryć testami i dlaczego — na podstawie wskazań w `spec/v1/03-review/code-review-2026-03-01.md`.

---

## Notatki z sesji

Po każdej sesji Claude uzupełnia tę sekcję. Format: data, co omówiono, co zrozumiano,
co wymaga powtórki, jakie CR naprawiono, jaki jest następny krok.

---

### Sesja 1 — 2026-03-03
**Omówiono:**
- Ustalono zakres nauki: front + security backendu + przepływ front↔back
- Ustalono poziom startowy: Jakub nie zna frontendu od zera
- Omówiono plan nauki i zatwierdzono
- Ustalono flow pracy przy naprawach CR (testy → build → przeglądarka → pytanie o zaznaczenie)
- Dodano referencję do `spec/v1/03-review/code-review-2026-03-01.md` jako dokumentu źródłowego
- Ukończono Etap 1 — ekosystem narzędzi, przepływ Vite, pliki package.json / index.html / main.tsx / App.tsx
- Do zapamiętania: porty (5432/5173/8080), JSX ≠ HTML, przeglądarka rozumie tylko JS nie JSX

**CR naprawione:** brak

**Następny krok:** Etap 3 — Stan (state) i rerenderowanie

---

### Sesja 2 — 2026-03-12
**Omówiono:**
- Etap 3 częściowo — `useState`, `useEffect`, przepływ logowania krok po kroku
- Pliki: `AuthProvider.tsx`, `ProtectedRoute.tsx`, `AuthCallbackPage.tsx`

**Co NIE przyswoił (wymagane powtórzenie):**
- Jak działa `useState` i skąd pochodzi setter (`setUser`)
- Dlaczego `[]` w `useEffect` ≠ przekazywanie wartości
- Co by się stało bez `if (isLoading) return null` w ProtectedRoute
- Łańcuch reaktywności: `setUser(null)` → `isAuthenticated=false` → ProtectedRoute → redirect

**CR naprawione:** brak

**Następny krok:** ⚠️ Powtórka Etapu 3 od początku — zacznij od `useState` na prostszym przykładzie (`ApplicationTable` filtr tekstowy), quiz po jednym pojęciu na raz. Szczegóły w `spec/v1/04-refactoring-learning/learning-notes-frontend.md`.

---

### Sesja 3 — 2026-03-13
**Omówiono:**
- **Etap 3 — UKOŃCZONY** — `useState` i `useEffect` w pełni zrozumiane
- Rozpoczęto od zera: zwykła zmienna vs `useState` (Java `repaint()` vs React auto-render)
- Przykład z rzeczywistego projektu: `ApplicationTable.tsx` (linijka 60 — `searchQuery`)
- Quiz `useState`: 5/5 ✅ — Jakub zrozumiał: `setState` → re-render całej funkcji
- `useEffect` z `[]` — analogia do `@PostConstruct` w Spring'u
- Quiz `useEffect`: 5/5 ✅ — Jakub zrozumiał nieskończoną pętlę z `[user]`
- Rzeczywisty kod: `AuthProvider.tsx` (linie 37-53) — pełny przepływ sprawdzania tokena na starcie
- Trzy scenariusze: token ważny → zalogowany, brak tokena → niezalogowany, token wygasł → niezalogowany

**Kluczowe zdanie (zapamiętane):**
> `useState` = zmienna + setter + automatyczny re-render

**CR naprawione:** brak

**Następny krok:** Etap 4 — Hooki React (`useEffect` bardziej zaawansowany, własne hooki)

---

### Sesja 4 — 2026-03-17
**Omówiono:**
- **Etap 4 — UKOŃCZONY** — hooki React w pełni zrozumiane
- Czym są hooki: funkcje podpinające logikę do frameworka (≈ `@Autowired` w Springu)
- Zasady hooków: tylko na najwyższym poziomie funkcji, tylko w komponentach/hookach, prefiks `use`
- `useEffect` zaawansowany: cleanup (`return () => {...}` ≈ `@PreDestroy`), wiele efektów w jednym komponencie
- Własne hooki = serwisy Springowe: `useNotes.ts` ≈ `NoteService.java` (enkapsulacja logiki, reużywalność)
- Hooki z konfiguracją: `staleTime` (cache — `useBadgeStats`), `enabled` (warunkowe odpytywanie — `useCheckDuplicate`)
- Zapowiedź CR-7: `CVManager.tsx` nie używa gotowego `useCVs()` — niespójność i duplikacja
- Quiz: 4.5/5 ✅

**Kluczowe zdania (zapamiętane):**
> Hook = "React, daj mi dostęp do [stanu / efektu / kontekstu / ...]" — jak `@Autowired`
> Własny hook = serwis Springowy. Enkapsuluje logikę, używasz w wielu komponentach.

**CR naprawione:** brak

**Następny krok:** Etap 5 — React Query (useQuery, useMutation, invalidacja cache, naprawa CR-7)

---

### Sesja 5 — 2026-03-17
**Omówiono:**
- **Etap 5 — UKOŃCZONY** — React Query zrozumiany, CR-7 naprawiony
- Problem bez React Query: ręczny `useState` + `useEffect` + `fetchCVs()` (CVManager jako antyprzykład)
- `useQuery` = pobieranie danych z automatycznym cache, loading, error (≈ `@Cacheable` w Springu)
- `useMutation` = operacje zapisu (POST/PUT/DELETE) z `onSuccess` do unieważnienia cache (≈ `@CacheEvict`)
- `queryKey` = nazwa cache (jak wartość w `@Cacheable("applications")`)
- `invalidateQueries` = unieważnij cache → React Query sam pobierze dane od nowa
- `refetchOnWindowFocus` = automatyczne odświeżanie przy powrocie na zakładkę
- Unieważnianie wielu cache'ów: `useDeleteCV` unieważnia `cvKeys.all` + `applicationKeys.all` (bo usunięcie CV odpina je od aplikacji)
- Naprawa CR-7: zamiana ręcznego `useState`+`useEffect`+`fetchCVs()` na hooki `useCVs()`, `useUploadCV()`, `useCreateCV()`, `useUpdateCV()`, `useDeleteCV()`
- Usunięto 2 `useState` (`cvList`, `uploading`), ręczną funkcję `fetchCVs()`, `useEffect` z pobieraniem
- Testy: 67/67 zielone, build przechodzi, Jakub przetestował w przeglądarce
- Quiz: 2.5/5 — słabsze punkty: `refetchOnWindowFocus`, uzasadnienie unieważniania wielu cache'ów

**CR naprawione:** CR-7 ✅

**Następny krok:** Etap 6 — Routing i ochrona stron

---

### Sesja 6 — 2026-03-17
**Omówiono:**
- **Etap 6 — UKOŃCZONY** — routing, Context API, ProtectedRoute zrozumiane
- SPA i History API: React Router przechwytuje kliknięcia, zmienia URL bez zapytania do serwera
- `<Routes>` i `<Route>` = `@RequestMapping` w Springu — mapowanie URL → komponent
- `<Navigate>` = `redirect:` w Spring MVC, `replace` chroni przed pętlą "Wstecz"
- `path="*"` = catch-all (jak `default:` w switch) — bez niego pusty ekran
- Context API = kontener Springa: `createContext` (deklaracja), `Provider` (rejestracja), `useContext` (`@Autowired`)
- `useAuth()` = wrapper na `useContext` z walidacją (jak `if (param == null) throw`)
- `isLoading` = "jeszcze sprawdzam, nie podejmuj decyzji" — chroni przed fałszywym redirectem na `/login`
- `ProtectedRoute` = Spring Security filter: `isLoading` → czekaj, `!isAuthenticated` → wyrzuć, inaczej → wpuść
- Kolejność sprawdzeń w ProtectedRoute ma znaczenie (najpierw isLoading, potem isAuthenticated)
- Zapowiedź Error Boundary (CR-6, Etap 8)
- Quiz SPA: 5/5, Quiz Routes: 4/5, Quiz Context: 3/5, Quiz ProtectedRoute: 2.5/5

**Kluczowe zdania (zapamiętane):**
> Context API = kontener Springa. `createContext` → `Provider` → `useContext` = deklaracja → rejestracja → `@Autowired`
> `isLoading` = "jeszcze sprawdzam, nie podejmuj decyzji"

**CR naprawione:** brak

**Następny krok:** Etap 7 — Komunikacja front↔back (api.ts, fetch, CORS, naprawa CR-3, CR-4, CR-9)

---

### Sesja 7 — 2026-03-20

**Omówiono:**
- **Etap 7 — UKOŃCZONY** — komunikacja front↔back w pełni zrozumiana
- `fetch()` — klient HTTP w przeglądarce (analogia: `RestTemplate` w Javie)
- `api.ts` — warstwa centralizująca wszystkie API calls z autentykacją
- JSON — uniwersalny format danych między frontendem a backendem
- Kontrakt API: backend zwraca konkretne pola, frontend na nich polega
- Naprawa CR-3: backend `"token"` → `"accessToken"` (align z frontend expectations)
- Naprawa CR-4: zahardkodowany URL → `import.meta.env.VITE_API_URL` (zmienne środowiskowe Vite)
- Naprawa CR-9: `apiFetch()` po 401 redirect teraz `throw new Error()` (stops execution)
- Network tab DevTools: 200 OK vs 304 Not Modified (browser caching)
- Wszystkie CR przetestowane w przeglądarce i backendu
- Commits: ebf9e4e (CR-3), c286e04 (CR-4), 7188a5d (CR-9)

**Kluczowe zdania (zapamiętane):**
> `fetch()` = klient HTTP, wysyła JSON, otrzymuje JSON
> API kontrakt = backend decyduje, frontend się dostosowuje
> 304 Not Modified = cache jest ok, oszczędność transferu
> `throw Error()` po redirect = stop przetwarzania

**Co NIE przyswoił:**
- Etap 8 — OAuth2 i JWT przepływ — wyjaśniane zbyt szybko
- Brakuje step-by-step tracingu: którego pliku do którego, jak się wywołują metody
- Jakub wyraźnie stwierdził: "Nie rozumiem. Trzeba od nowa, plik po pliku, funkcja po funkcji"

**CR naprawione:** CR-3 ✅, CR-4 ✅, CR-9 ✅

**Następny krok:** ⚠️ **Etap 8 — OD NOWA Z STEP-BY-STEP TRACINGIEM**
- Zacząć od LoginPage.tsx
- Pokazać co się wysyła do backendu i co wraca

---

### Sesja 8 — 2026-03-23

**Omówiono:**
- **Etap 8 (część 1) — UKOŃCZONY** — OAuth2 i JWT zrozumiane
- Step-by-step tracing 8 kroków: LoginPage → Google → AuthCallback → AuthProvider → ProtectedRoute
- `window.location.href` ≠ `fetch()` — to przeładowanie strony, nie API call
- Dwa tokeny: access token (localStorage, 15 min) + refresh token (httpOnly cookie, 7 dni)
- localStorage = ręczne zarządzanie, cookie = automatyczne wysyłanie
- Token w każdym żądaniu: `Authorization: Bearer {token}` w headerze
- 401 Unauthorized = token wygasł → `apiFetch()` → redirect `/login`
- **Pytanie Jakuba (edukacyjne):** "CSRF wyłączony ale SameSite włączony? WTF?"
  - Odpowiedź: dwie różne ochrony, pracują niezależnie
  - CSRF token (synchronizer pattern) zbędny w SPA
  - SameSite (na ciasteczku) = ochrona przed CSRF z obcej domeny
  - Znaleziony problem: komentarz kodu był mylący ("nie ma cookies")
- Quiz: 5/5 ✅

**Kluczowe zdania (zapamiętane):**
> `window.location.href` = przeładowanie strony, nie fetch()
> Dwa tokeny: access (localStorage, krótki) + refresh (cookie, długi)
> SameSite na ciasteczku = przeglądarka wysyła TYLKO z naszej domeny
> CSRF disable + SameSite = dwie różne warstwy ochrony, oba ważne

**CR naprawione:** CR-5 ✅ (SameSite na refresh_token cookie)

**Następny krok:** CR-6 (Error Boundary) + zakończenie Etapu 8
- Tracing: LoginPage → Google → AuthCallbackPage → AuthProvider → api.ts → backend (OAuth2AuthenticationSuccessHandler, AuthController)
- Każdy krok: co się wysyła, gdzie się zapisuje, gdzie się czyta, jakie metody się wywołują
- Rysować przepływ (strzałki między plikami)
- Później: nowy commit i testy

---

### Sesja 9 — 2026-03-24

**Omówiono:**
- **Etap 8 — UKOŃCZONY** — pełna nauka OAuth2 i JWT
- CR-6 (Error Boundary) — weryfikacja: już był w kodzie + zacommitowany
- Error Boundary jako klasa komponentu (nie funkcja) — dlaczego: lifecycle metody (`getDerivedStateFromError`, `componentDidCatch`)
- Testy: 67/67 ✅ zielonych
- Build: TypeScript się kompiluje ✅
- Przeglądarka: Error Boundary pracuje (testowali złe URL, aplikacja nie się wysypała) ✅

**Kluczowe zdania (zapamiętane):**
> Error Boundary = try/catch dla całego poddrzewa komponentów. Kiedy potomek wysypie się — fallback UI zamiast białego ekranu.

**CR naprawione:** CR-5 ✅, CR-6 ✅

**Następny krok:** Etap 9 — TypeScript w React (CR-2 walidacja URL-i XSS, CR-8 duplikaty kolorów)

---

### Sesja 10 — 2026-03-24 (ciąg dalszy)

**Omówiono:**
- **Etap 9 (część 1) — CR-2 NAPRAWIONY** — XSS walidacja URL-ów
- TypeScript union types (`'WYSLANE' | 'W_PROCESIE'`) — enum w Javie
- Interface vs Class — czemu interface do DTO
- `| null` — Optional w Javie vs TypeScript
- `isSafeUrl()` — walidacja URL-i w utility (blokuje javascript:, data:, vbscript:)
- Walidacja w **input stage** (nie output) — fail fast principle
- HTML5 `type="url"` — browser validation (słaba, łatwo obejść)
- Nasza validacja — real security, sprawdza schemat URL-a
- Testy: 67/67 ✅, Build ✅, Browser test ✅
- Commit: 794a453

**Kluczowe zdania (zapamiętane):**
> Fail fast — blokuj na wejściu, nie potem na wyświe tleniu
> Union type `'A' | 'B'` = enum w Javie
> `new URL()` sparsuje URL i wyłapie błędy formatu

**CR naprawione:** CR-2 ✅

**Następny krok:** CR-8 (duplikaty kolorów statusów — DRY principle)