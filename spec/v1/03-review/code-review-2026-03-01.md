### 👤 Informacje podstawowe
**Autor:** Jakub
**Projekt:** EasyApply — aplikacja do śledzenia procesów rekrutacyjnych dla juniorów IT
**Data review:** 2026-03-01
**Reviewer:** DR & AI
**Poziom zaawansowania:** Początkujący/średniozaawansowany — widać solidne podstawy oraz ambicję w zakresie architektury, ale pojawiają się luki typowe dla osób bez doświadczenia komercyjnego

---

## 🌟 CZĘŚĆ I: PODSUMOWANIE OGÓLNE

### ✅ Co zasługuje na pochwałę

1. **Dojrzała architektura full-stack** — projekt łączy Spring Boot (Java 21) z React + TypeScript, PostgreSQL i Docker Compose. To nie jest trywialne zadanie i świadczy o odwadze i ambicji. Podział na backend/frontend z wyraźnymi warstwami (controller → service → repository → entity) to wzorcowe podejście.

2. **Poprawne zastosowanie OAuth2 + JWT** — przepływ autentykacji przez Google OAuth2, generowanie access tokenów (RS256) z 15-minutowym czasem życia i refresh tokenów przechowywanych w httpOnly cookie to solidna implementacja. Komentarze w kodzie (np. w `OAuth2AuthenticationSuccessHandler`) wyjaśniają „dlaczego", a nie tylko „co" — tak pisze się dobrą dokumentację.

3. **Migracje bazodanowe z Flyway** — zamiast polegać na `ddl-auto=update` (częsty błąd początkujących), projekt używa wersjonowanych migracji SQL. Ustawienie `ddl-auto=validate` w produkcji to profesjonalna decyzja.

4. **React Query (TanStack Query)** — świetny wybór do zarządzania stanem serwerowym. Hooki (`useApplications`, `useCV`, `useNotes`) są czytelne, poprawnie konfigurują cache i invalidację. Wzorzec z `queryKeys` jako stałymi zapobiega literówkom.

5. **TypeScript z trybem strict** — cała konfiguracja (`noUnusedLocals`, `noUnusedParameters`, `isolatedModules`) wymusza dyscyplinę. Typy domenowe w `domain.ts` są dobrze zaprojektowane.

6. **Docker Compose z health checks** — konfiguracja wielokontenerowa z warunkiem `service_healthy` dla bazy danych, volume'ami dla danych i uploadu, oraz health checkami dla backendu świadczy o myśleniu operacyjnym.

7. **MDC Logging** — dodanie `userId` do kontekstu logowania (via `MdcUserFilter`) to zaawansowana technika, która ułatwia debugowanie w środowisku wieloużytkownikowym.

---

## 🎓 CZĘŚĆ II: ROZWÓJ I EDUKACJA

### 💭 Pytania do przemyślenia

1. **Co się stanie, gdy użytkownik kliknie „Zaloguj przez Google" i backend jest niedostępny?** Przyjrzyj się plikowi `LoginPage.tsx` — czy adres URL backendu powinien być na sztywno zapisany w kodzie? Jak to wpłynie na deployment?

2. **Wyobraź sobie, że masz 500 aplikacji o pracę. Jak zachowa się widok tabeli i Kanban board?** Zastanów się, co oznaczają operacje `filter()` i `sort()` wykonywane przy każdym renderze bez memoizacji. Poczytaj o `useMemo` i kiedy jest naprawdę potrzebne.

3. **Dlaczego `markCurrentStageCompleted()` jest oznaczone `@Transactional` na prywatnej metodzie?** Sprawdź, jak Spring AOP obsługuje adnotacje na metodach prywatnych. Odpowiedź może Cię zaskoczyć.

4. **Co się dzieje z plikiem CV na dysku, jeśli zapis do bazy danych się nie powiedzie?** Przyjrzyj się kolejności operacji w `CVService.uploadCV()` — czy operacje na plikach są objęte transakcją bazodanową?

5. **Jakie dane zobaczy atakujący, jeśli zdoła wstrzyknąć skrypt JavaScript na stronę z linkiem do oferty pracy?** Zastanów się nad walidacją linków URL w `ApplicationDetails.tsx` i `CVManager.tsx`.

### 📚 Koncepcje do zgłębienia

| Koncepcja | Dlaczego jest ważna | Gdzie się pojawia w Twoim kodzie |
|-----------|---------------------|----------------------------------|
| **Memoizacja w React** | Zapobiega kosztownym przeliczeniom przy każdym renderze | `ApplicationTable.tsx` — sortowanie i filtrowanie |
| **Spring AOP Proxy** | Adnotacje `@Transactional` na prywatnych metodach nie działają | `ApplicationService.markCurrentStageCompleted()` |
| **State Machine Pattern** | Porządkuje złożone przejścia stanów | `ApplicationService.updateStage()` |
| **Content Security Policy** | Chroni przed atakami XSS na poziomie nagłówków HTTP | Konfiguracja Nginx i Spring Security |
| **SameSite Cookie Attribute** | Ochrona przed CSRF w nowoczesnych przeglądarkach | `OAuth2AuthenticationSuccessHandler` |
| **React Error Boundary** | Zapobiega „białemu ekranowi" po błędzie w komponencie | Brak w projekcie — warto dodać |
| **Paginacja API** | Niezbędna przy dużych zbiorach danych | Endpointy `/api/applications` |
| **Interceptor HTTP (retry po odświeżeniu tokenu)** | Pozwala na przezroczyste odświeżanie sesji bez przerywania pracy użytkownika | `api.ts` — brak interceptora, redirect na 401 |
| **Integralność danych (NOT NULL constraints)** | Gwarantuje, że każdy rekord ma właściciela | Migracja V4 — kolumna user_id bez NOT NULL |

### 📖 Słowniczek terminów

| Termin | Wyjaśnienie | Materiały do nauki |
|--------|-------------|-------------------|
| **OAuth2** | Protokół autoryzacji pozwalający logować się przez zewnętrzne serwisy (np. Google) | [OAuth 2.0 Simplified](https://www.oauth.com/) |
| **JWT (JSON Web Token)** | Standardowy format tokenu do bezstanowej autentykacji | [JWT.io Introduction](https://jwt.io/introduction) |
| **RS256** | Algorytm podpisu asymetrycznego (klucz prywatny podpisuje, publiczny weryfikuje) | [Auth0 - RS256 vs HS256](https://auth0.com/blog/rs256-vs-hs256-whats-the-difference/) |
| **httpOnly Cookie** | Ciasteczko niewidoczne dla JavaScript — ochrona przed XSS | [MDN - Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie) |
| **CSRF** | Atak polegający na wykonaniu akcji w imieniu zalogowanego użytkownika | [OWASP - CSRF](https://owasp.org/www-community/attacks/csrf) |
| **N+1 Problem** | Wykonanie N dodatkowych zapytań SQL zamiast jednego z JOIN | [Hibernate N+1](https://vladmihalcea.com/n-plus-1-query-problem/) |
| **EntityGraph (JPA)** | Mechanizm sterowania eager/lazy loading bez zmiany mappingu | [Baeldung - JPA EntityGraph](https://www.baeldung.com/jpa-entity-graph) |
| **Flyway** | Narzędzie do wersjonowania i migracji schematu bazy danych | [Flyway Documentation](https://documentation.red-gate.com/flyway) |
| **React Query** | Biblioteka do zarządzania stanem serwerowym i cachowaniem | [TanStack Query Docs](https://tanstack.com/query/latest) |
| **useMemo** | Hook React do memoizacji kosztownych obliczeń | [React Docs - useMemo](https://react.dev/reference/react/useMemo) |
| **Spring AOP Proxy** | Mechanizm proxy w Spring — adnotacje działają tylko na publicznych metodach wywołanych z zewnątrz beana | [Baeldung - Spring AOP](https://www.baeldung.com/spring-aop) |
| **ProblemDetail (RFC 9457)** | Standardowy format odpowiedzi błędów w REST API | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) |
| **Path Traversal** | Atak polegający na ucieczce z dozwolonego katalogu plików | [OWASP - Path Traversal](https://owasp.org/www-community/attacks/Path_Traversal) |
| **XSS** | Wstrzyknięcie złośliwego kodu JavaScript do strony | [OWASP - XSS](https://owasp.org/www-community/attacks/xss/) |
| **Magic Bytes** | Pierwsze bajty pliku identyfikujące jego typ niezależnie od rozszerzenia (np. PDF: `%PDF-`) | [Wikipedia - File Signatures](https://en.wikipedia.org/wiki/List_of_file_signatures) |
| **JaCoCo** | Narzędzie do mierzenia pokrycia kodu testami w projektach Java | [JaCoCo Documentation](https://www.jacoco.org/jacoco/trunk/doc/) |
| **HTTP Interceptor** | Mechanizm przechwytywania żądań/odpowiedzi HTTP w celu dodania logiki (np. odświeżanie tokenu) | [Axios Interceptors](https://axios-http.com/docs/interceptors) |

### 🔍 Obszary do samodzielnej analizy

1. **Przyjrzyj się plikowi `KanbanBoard.tsx`** — ma blisko 1000 linii kodu. Zastanów się, ile komponentów, hooków i modali jest w nim zagnieżdżonych. Poczytaj o zasadzie Single Responsibility Principle i spróbuj wyodrębnić przynajmniej 3 niezależne pliki.

2. **Sprawdź, jak `CVManager.tsx` pobiera dane** — porównaj to z tym, jak dane pobierają `ApplicationTable` czy `NotesList`. Zauważ różnicę: jeden komponent używa React Query, drugi `useState` + `useEffect` z ręcznym `fetchCVs()`. Zastanów się, dlaczego to niespójność i jakie problemy może powodować.

3. **Przeanalizuj endpoint `/api/applications`** — zwraca wszystkie aplikacje użytkownika bez paginacji. Wyobraź sobie, że użytkownik ma 2000 rekordów z historią etapów. Poczytaj o Spring Data `Pageable` i jak wpływa na wydajność.

### 🎯 Niedostatki wiedzy do uzupełnienia

1. **Bezpieczeństwo aplikacji webowych** — walidacja URL-i, ochrona przed XSS, poprawne ustawianie atrybutów cookies (SameSite), Content Security Policy. To absolutna podstawa przed wejściem na rynek pracy.

2. **Optymalizacja wydajności React** — memoizacja (`useMemo`, `useCallback`, `React.memo`), wirtualizacja długich list, dekompozycja dużych komponentów. Kluczowe przy skalowaniu aplikacji.

3. **Wzorce projektowe w Spring** — w szczególności State Machine Pattern (dla przejść statusów), prawidłowe użycie `@Transactional` (proxy vs self-invocation), obsługa błędów i walidacja danych wejściowych.

4. **Testowanie** — projekt ma infrastrukturę testową (Vitest, Cypress), ale pokrycie kodu testami wymaga rozszerzenia. Poczytaj o piramidzie testów i strategii „test the behavior, not the implementation".

---

## ⚙️ CZĘŚĆ III: TECHNICZNY CODE REVIEW

### 📊 Analiza tematyczna

#### 1️⃣ Poprawność algorytmu

Ogólna logika aplikacji jest poprawna — CRUD aplikacji, zarządzanie CV, notatki, system odznak. Przepływ OAuth2 działa zgodnie ze specyfikacją. Kilka uwag:

```
⚠️ Problem: [KRYTYCZNY] Kontrakt JSON dla refresh tokena jest niespójny między backendem a frontendem
📍 Lokalizacja: Kontroler autentykacji (backend) i warstwa API (frontend)
💡 Wskazówka: Backend zwraca klucz "token", a frontend oczekuje "accessToken". To oznacza, że mechanizm odświeżania sesji faktycznie nie działa — po wygaśnięciu access tokena użytkownik jest wylogowywany zamiast cicho odświeżany. Sprawdź oba pliki i ujednolić nazwy kluczy.
```

```
⚠️ Problem: [WAŻNY] Historia etapów rekrutacji nie jest aktualizowana przy głównym przepływie zmiany statusu
📍 Lokalizacja: Serwis aplikacji — metoda aktualizacji etapu oraz metoda dodawania etapu (backend)
💡 Wskazówka: Gdy przeciągasz kartę na tablicy Kanban, frontend wywołuje metodę aktualizacji etapu, która zmienia status, ale nie tworzy wpisów w tabeli historii etapów. Osobna metoda dodawania etapu (z zapisem historii) istnieje, ale nie jest wywoływana z poziomu UI. W efekcie tabela stage_history nie odzwierciedla rzeczywistych przejść użytkownika. Zastanów się nad ujednoliceniem tych dwóch ścieżek w jeden spójny przepływ.
```

```
⚠️ Problem: Metoda markCurrentStageCompleted() jest prywatna i oznaczona @Transactional
📍 Lokalizacja: Serwis obsługujący logikę aplikacji (backend)
💡 Wskazówka: Spring AOP nie przechwytuje wywołań prywatnych metod — adnotacja @Transactional jest tu ignorowana. W tym konkretnym przypadku wpływ praktyczny jest minimalny, bo metoda jest wywoływana z publicznej metody addStage(), która już ma aktywną transakcję. Mimo to warto usunąć mylącą adnotację — dla czytelności kodu i pokazania, że rozumiesz jak działa Spring AOP.
```

```
⚠️ Problem: Logika przejść stanów (WYSLANE → W_PROCESIE → OFERTA/ODMOWA) jest rozproszona w jednej dużej metodzie z wieloma zagnieżdżonymi warunkami
📍 Lokalizacja: Metoda aktualizacji etapu w serwisie aplikacji
💡 Wskazówka: Poczytaj o wzorcu State Machine — pozwala on zdefiniować dozwolone przejścia i akcje towarzyszące w sposób deklaratywny. Spring Statemachine lub nawet prosty enum z metodą canTransitionTo() znacząco uprościłby kod.
```

#### 2️⃣ Krytyczne problemy

```
⚠️ Problem: [KRYTYCZNY] Adres URL backendu jest zahardkodowany na "http://localhost:8080" w komponencie logowania
📍 Lokalizacja: Strona logowania (frontend)
💡 Wskazówka: W produkcji ten link nie zadziała. Sprawdź, jak używasz zmiennych środowiskowych Vite (import.meta.env) w innych częściach kodu — zastosuj to samo podejście tutaj.
```

```
⚠️ Problem: [KRYTYCZNY] Brak walidacji URL-i zewnętrznych (linki do ofert pracy i CV)
📍 Lokalizacja: Komponenty wyświetlające szczegóły aplikacji i menedżer CV (frontend)
💡 Wskazówka: Link może zawierać schemat "javascript:" zamiast "https://". Poczytaj o XSS przez atrybut href i napisz prostą funkcję walidującą, która dopuszcza tylko schematy http/https/mailto.
```

```
⚠️ Problem: [KRYTYCZNY] Brak atrybutu SameSite na ciasteczku refresh_token
📍 Lokalizacja: Handler sukcesu OAuth2 (backend security)
💡 Wskazówka: Bez SameSite atakujący może wykonać żądanie CSRF do endpointu /api/auth/refresh i uzyskać nowy access token. Sprawdź, jak ustawić SameSite=Strict lub Lax na obiekcie Cookie w Javie.
```

```
⚠️ Problem: [KRYTYCZNY] Walidacja plików CV opiera się wyłącznie na nagłówku Content-Type
📍 Lokalizacja: Serwis obsługi CV (backend)
💡 Wskazówka: Content-Type jest ustawiany przez przeglądarkę i można go łatwo sfałszować. Poczytaj o "magic bytes" (sygnatura pliku) — plik PDF zawsze zaczyna się od "%PDF-". Sprawdzaj faktyczną zawartość pliku, nie tylko deklarowany typ.
```

```
⚠️ Problem: [KRYTYCZNY] Podatność na path traversal przy uploadzie plików CV
📍 Lokalizacja: Serwis obsługi CV — metoda uploadu (backend)
💡 Wskazówka: Oryginalna nazwa pliku z żądania multipart trafia bezpośrednio do ścieżki zapisu (UUID + "_" + oryginalna nazwa). Atakujący może manipulować nazwą pliku w żądaniu (np. "../../etc/cron.d/malicious") i zapisać plik poza katalogiem uploads. Sprawdź, czy po resolve() wynikowa ścieżka nadal zaczyna się od katalogu docelowego (normalize() + startsWith()). Jeszcze lepsze podejście — używaj wyłącznie UUID jako nazwy pliku na dysku, a oryginalną nazwę przechowuj tylko w bazie danych.
```

```
⚠️ Problem: [WAŻNY] Pole status w żądaniu aktualizacji etapu nie ma walidacji @NotNull
📍 Lokalizacja: DTO żądania aktualizacji etapu (backend)
💡 Wskazówka: Jeśli frontend wyśle żądanie bez pola status (lub z wartością null), serwis wywoła setStatus(null) na encji, co skutkuje błędem 500 zamiast czytelnego 400. Dodaj adnotację @NotNull i zastanów się nad regułami biznesowymi — np. czy przy statusie ODMOWA pole rejectionReason powinno być wymagane.
```

#### 3️⃣ Zasada KISS (prostota)

```
⚠️ Problem: KanbanBoard.tsx ma blisko 1000 linii z wieloma zagnieżdżonymi komponentami, modalami i logiką drag & drop
📍 Lokalizacja: Komponent tablicy Kanban (frontend)
💡 Wskazówka: Zastanów się nad rozbiciem na: KanbanCard, KanbanColumn, StageModal, EndModal, MoveModal i hook useKanbanDragDrop. Każdy plik powinien mieć jedną odpowiedzialność.
```

```
⚠️ Problem: TourGuide.tsx — ponad 570 linii z interwałem uruchamianym co 100ms do przeliczania pozycji
📍 Lokalizacja: Komponent przewodnika po aplikacji (frontend)
💡 Wskazówka: Poczytaj o ResizeObserver — to natywne API przeglądarki, które reaguje na zmiany rozmiaru elementów bez potrzeby ciągłego odpytywania (polling). Jest bardziej wydajne niż setInterval.
```

```
⚠️ Problem: Statystyki odznak — 5 równoległych tablic (nazwy, ikony, opisy, progi, kolory) muszą być idealnie zsynchronizowane
📍 Lokalizacja: Serwis statystyk (backend)
💡 Wskazówka: Jeden element przesunięty o indeks psuje wszystkie odznaki. Zastanów się nad stworzeniem klasy Badge lub rekordu, który grupuje te dane razem.
```

#### 4️⃣ Czytelność kodu

```
⚠️ Problem: Zapytanie statystyczne w repozytorium zwraca Object[] — utrata czytelności i bezpieczeństwa typów
📍 Lokalizacja: Repozytorium aplikacji i serwis statystyk (backend)
💡 Wskazówka: Poczytaj o JPQL constructor expressions (SELECT new com.easyapply.dto.StatsDto(...) FROM ...) lub interface-based projections w Spring Data. Pozwalają one zwrócić typowany wynik zamiast surowej tablicy obiektów.
```

```
⚠️ Problem: Mapowanie pól entity ↔ DTO wykonywane ręcznie setter po setterze
📍 Lokalizacja: Metoda create() i update() w serwisie aplikacji (backend)
💡 Wskazówka: Przyjrzyj się bibliotece MapStruct lub zastanów się nad metodą fabryczną Application.fromRequest(). Ręczne mapowanie 12+ pól jest podatne na pominięcie nowego pola.
```

#### 5️⃣ Styl i konwencje

Ogólnie styl kodu jest spójny i czytelny. Polskie komunikaty UI to dobry wybór dla docelowego użytkownika. Kilka uwag:

```
⚠️ Problem: Niespójność w podejściu do pobierania danych — CVManager używa useState+useEffect, reszta komponentów React Query
📍 Lokalizacja: Menedżer CV vs. pozostałe komponenty (frontend)
💡 Wskazówka: Masz gotowe hooki useCV() — zastanów się, dlaczego CVManager ich nie używa i czy warto to ujednolicić. Spójność w kodzie ułatwia jego utrzymanie.
```

```
⚠️ Problem: Zdeprecjonowane wartości w enumie kategorii notatek (PYTANIE, KONTAKT) współistnieją z nowymi (PYTANIA, FEEDBACK, INNE)
📍 Lokalizacja: Enum kategorii notatek (backend) i mapowanie w komponencie notatek (frontend)
💡 Wskazówka: Poczytaj o strategiach migracji danych — jeśli stare wartości nie są już używane, rozważ migrację Flyway, która je zamieni, a potem usunięcie z enuma.
```

#### 6️⃣ Struktura i organizacja

Pozytywne:
- Podział na warstwy (controller/service/repository/entity) jest wzorcowy
- Frontend ma logiczny podział: auth/, pages/, components/, hooks/, services/, types/
- Komponenty przeniesione do subdirectoriów (applications/, kanban/, cv/, notes/)

```
⚠️ Problem: Komponent AppContent.tsx to generyczna nazwa, a pełni rolę głównego layoutu dashboardu
📍 Lokalizacja: Główny komponent zawartości (frontend)
💡 Wskazówka: Rozważ zmianę nazwy na DashboardLayout lub MainLayout — nazwa powinna komunikować przeznaczenie.
```

```
⚠️ Problem: Stałe kolorów statusów są zduplikowane w co najmniej dwóch komponentach
📍 Lokalizacja: Szczegóły aplikacji i tabela aplikacji (frontend)
💡 Wskazówka: Wyodrębnij wspólne stałe (kolory statusów, formatowanie dat) do pliku utils/ lub constants/ — zasada DRY (Don't Repeat Yourself).
```

```
⚠️ Problem: [WAŻNY] Kolumna user_id w tabelach applications i cvs pozostaje bez ograniczenia NOT NULL
📍 Lokalizacja: Migracja bazodanowa V4 (backend)
💡 Wskazówka: Migracja dodaje kolumnę user_id jako nullable („na razie nullable, bo istniejące wiersze mają null"), ale nigdy nie dodaje finalnego ograniczenia NOT NULL. To oznacza, że baza danych dopuszcza rekordy bez właściciela — takie „osierocone" dane będą niewidoczne w zapytaniach filtrowanych po użytkowniku. Dodaj kolejną migrację Flyway, która ustawi NOT NULL po wyczyszczeniu ewentualnych nulli.
```

#### 7️⃣ Dokumentacja i komentarze

Pozytywne:
- Komentarze w `OAuth2AuthenticationSuccessHandler` wyjaśniają "dlaczego" (np. dlaczego token w URL)
- JSDoc w `api.ts` opisuje logikę nagłówków i autentykacji
- Polskie komentarze w `App.tsx` wyjaśniają konfigurację React Query

```
⚠️ Problem: Brak komentarzy przy regułach biznesowych w updateStage()
📍 Lokalizacja: Serwis aplikacji — metoda aktualizacji etapu (backend)
💡 Wskazówka: Złożona logika warunkowa (co się dzieje przy przejściu z ODMOWA do W_PROCESIE?) powinna mieć komentarze wyjaśniające reguły biznesowe. Przyszłe "Ty" podziękujesz obecnemu "Ty".
```

#### 8️⃣ Testowalność

```
⚠️ Problem: Infrastruktura testowa istnieje (Vitest, Cypress, test-utils.tsx), ale pokrycie kodu jest ograniczone
📍 Lokalizacja: Katalog test/ (frontend)
💡 Wskazówka: Priorytety testowania: 1) Hooki React Query, 2) Komponenty z logiką warunkową (KanbanBoard, CVManager), 3) Funkcje pomocnicze. Poczytaj o piramidzie testów — unit testy na dole, E2E na szczycie.
```

```
⚠️ Problem: Backend — testy jednostkowe serwisów istnieją (ApplicationServiceTest, CVServiceTest, NoteServiceTest, StatisticsServiceTest), ale warto sprawdzić ich pokrycie
📍 Lokalizacja: Katalog test/ (backend)
💡 Wskazówka: Dobrze, że testy serwisów są napisane — to ważny fundament. Sprawdź, czy pokrywają kluczowe scenariusze brzegowe: co się dzieje przy null status w updateStage()? Czy path traversal w nazwie pliku jest przetestowany? Poczytaj o JaCoCo — narzędziu do mierzenia pokrycia kodu testami.
```

#### 9️⃣ Obsługa błędów

```
⚠️ Problem: [WAŻNY] Brak globalnego Error Boundary w aplikacji React
📍 Lokalizacja: Komponent główny aplikacji (frontend)
💡 Wskazówka: Bez Error Boundary jeden błąd w dowolnym komponencie powoduje "biały ekran". Poczytaj o React Error Boundaries — to klasa komponentu z metodą componentDidCatch().
```

```
⚠️ Problem: [WAŻNY] Błędy walidacji w API zwracane jako jeden ciąg tekstowy zamiast struktury klucz-wartość
📍 Lokalizacja: Globalny handler wyjątków (backend)
💡 Wskazówka: Frontend nie może zmapować błędów do konkretnych pól formularza (np. "pole company jest wymagane"). Poczytaj o ProblemDetail.setProperty() — pozwala dodać dodatkowe dane do odpowiedzi.
```

```
⚠️ Problem: [WAŻNY] Usuwanie pliku CV po błędzie logowane jako warning, ale CV oznaczane jako usunięte w bazie
📍 Lokalizacja: Serwis CV (backend)
💡 Wskazówka: To powoduje "wyciek" plików na dysku. Zastanów się nad wzorcem kompensacji — co robić, gdy operacja na pliku się nie powiedzie.
```

```
⚠️ Problem: [WAŻNY] Wywołanie new URL() bez obsługi wyjątku powoduje crash komponentu
📍 Lokalizacja: Menedżer CV — wyświetlanie listy (frontend)
💡 Wskazówka: Jeśli użytkownik zapisał nieprawidłowy adres URL jako link do CV, wywołanie new URL(externalUrl).hostname rzuca wyjątek TypeError, który — przy braku Error Boundary — powoduje „biały ekran". Owiń parsowanie URL w try/catch i wyświetl tekst zastępczy (np. samą wartość URL lub komunikat „nieprawidłowy link").
```

```
⚠️ Problem: Funkcja apiFetch() przy odpowiedzi 401 wykonuje redirect, ale nie przerywa dalszego przetwarzania
📍 Lokalizacja: Warstwa API (frontend)
💡 Wskazówka: Po window.location.href dalszy kod może się jeszcze wykonać. Zastanów się, czy throw new Error() po redirectcie nie byłby bezpieczniejszy.
```

---

## ⚖️ CZĘŚĆ IV: ANALIZA ROZWIĄZAŃ

### Porównanie podejść

| Twoje rozwiązanie | Zalety | Wady | Alternatywa | Kiedy stosować |
|---|---|---|---|---|
| Token JWT w parametrze URL po OAuth2 | Proste do implementacji w przepływie redirect | Widoczny w logach serwera, historii przeglądarki, podatny na XSS | Fragment URL (#token=...) lub postMessage() | Fragment URL — gdy masz SPA z client-side routing |
| localStorage do przechowywania access tokena | Łatwy dostęp z JavaScript, przeżywa odświeżenie strony | Dostępny dla każdego skryptu JS (XSS) | httpOnly cookie z flagą Secure + SameSite | Cookie — gdy priorytetem jest bezpieczeństwo |
| Ręczne mapowanie entity → DTO (setter po setterze) | Brak dodatkowej biblioteki, pełna kontrola | Łatwo pominąć pole, boilerplate | MapStruct, ModelMapper lub metoda fabryczna | MapStruct — dla projektów z wieloma DTO |
| useState + useEffect w CVManager | Działa, prostota implementacji | Brak cache, ręczne loading/error state, niespójne z resztą kodu | React Query (TanStack Query) — już używany w projekcie | React Query — zawsze, gdy pobierasz dane z API |
| Object[] dla zapytań statystycznych | Szybkie do napisania | Brak typów, zmiana kolejności kolumn psuje odczyt | JPQL constructor expression lub interface projection | Constructor expression — dla złożonych zapytań |
| 5 równoległych tablic w StatisticsService | Szybkie do napisania | Każda zmiana wymaga synchronizacji 5 tablic | Klasa/rekord Badge z polami: name, icon, description, threshold, color | Rekord — gdy dane są powiązane logicznie |
| Walidacja Content-Type pliku | Minimalna ochrona, łatwa implementacja | Content-Type jest deklaratywny, łatwo go sfałszować | Walidacja magic bytes (sygnatura pliku) + Content-Type + rozszerzenie | Trojna walidacja — dla upload plików w produkcji |
| setInterval(100ms) w TourGuide | Proste, zawsze aktualne pozycje | Zużywa CPU, 10 wywołań na sekundę | ResizeObserver + MutationObserver | Observer — gdy reagujesz na zmiany DOM |
| Redirect do /login na 401 | Proste, gwarancja wylogowania | Użytkownik traci kontekst, brak cichego odświeżania | Interceptor: 401 → refresh → ponowienie żądania | Interceptor — gdy masz mechanizm refresh token |

---

## 📊 CZĘŚĆ V: METRYKI I STANDARDY

### Zgodność z konwencjami

| Obszar | Ocena | Uwagi |
|--------|-------|-------|
| **Nazewnictwo (Java)** | ✅ Bardzo dobrze | CamelCase, klasy/interfejsy poprawne, metody opisowe |
| **Nazewnictwo (TypeScript)** | ✅ Bardzo dobrze | PascalCase dla komponentów, camelCase dla zmiennych |
| **Struktura projektu** | ✅ Dobrze | Warstwy backend i frontend poprawnie rozdzielone |
| **REST API** | ✅ Dobrze | Poprawne metody HTTP, kody statusu (201, 204), nazwy zasobów |
| **Git commits** | ✅ Dobrze | Conventional Commits, sensowne opisy |
| **TypeScript strict** | ✅ Bardzo dobrze | Włączony tryb strict z dodatkowymi regułami |
| **Obsługa null/undefined** | ⚠️ Do poprawy | Zdarzają się non-null assertions (!) bez walidacji |
| **Separacja warstw** | ✅ Dobrze | Kontrolery nie zawierają logiki biznesowej |

### Złożoność kodu

| Plik | Linie kodu | Ocena złożoności | Uwagi |
|------|-----------|-----------------|-------|
| `KanbanBoard.tsx` | ~987 | 🔴 Wysoka | Wymaga dekompozycji — za dużo odpowiedzialności |
| `CVManager.tsx` | ~650 | 🟡 Średnia | Można wydzielić modele i formularze |
| `TourGuide.tsx` | ~572 | 🟡 Średnia | Logika pozycjonowania do osobnego hooka |
| `ApplicationService.java` | ~196 | 🟢 Niska | Ale metoda updateStage() jest zbyt złożona |
| `StatisticsService.java` | ~120 | 🟡 Średnia | Kruchy kod z równoległymi tablicami |
| `api.ts` | ~275 | 🟢 Niska | Czytelny, dobrze zorganizowany |

### Potencjalne problemy wydajnościowe

| Problem | Wpływ | Gdzie |
|---------|-------|-------|
| Brak paginacji API | 🔴 Wysoki przy wielu rekordach | Endpoint `/api/applications` |
| Brak memoizacji sort/filter | 🟡 Średni | `ApplicationTable.tsx` |
| Brak cachowania statystyk | 🟡 Średni | `StatisticsService` — przelicza przy każdym żądaniu |
| setInterval(100ms) | 🟡 Średni | `TourGuide.tsx` |
| 10+ useState w jednym komponencie | 🟡 Niski-średni | `KanbanBoard.tsx` — potencjalne nadmiarowe renderowania |

### Potencjalne problemy z integralnością danych

| Problem | Wpływ | Gdzie |
|---------|-------|-------|
| user_id nullable (brak NOT NULL) | 🔴 Wysoki — osierocone rekordy | Migracja V4: tabele applications, cvs |
| Niespójna historia etapów | 🟡 Średni — brak audytu przejść | updateStage() nie zapisuje do stage_history |
| Kontrakt refresh token rozbieżny | 🔴 Wysoki — mechanizm nie działa | Backend: "token", frontend: "accessToken" |

---

## 🎯 CZĘŚĆ VI: PLAN DZIAŁANIA

### Do zrobienia teraz (przed merge)

1. **🔴 Zabezpiecz upload CV przed path traversal** — ścieżka zapisu pliku zawiera oryginalną nazwę bez sanityzacji. Dodaj walidację: po `resolve()` sprawdź `normalize()` + `startsWith(uploadDir)`. Najlepiej — zapisuj pliki pod samym UUID, a oryginalną nazwę trzymaj tylko w bazie danych.

2. **🔴 Dodaj walidację URL-i (backend + frontend)** — w serwisie CV backend akceptuje dowolny `externalUrl` bez sprawdzenia schematu. Na frontendzie linki trafiają do `href` i `window.open()` bez filtrowania. Dodaj centralną walidację dopuszczającą wyłącznie schematy `http:` / `https:`.

3. **🔴 Napraw kontrakt refresh tokena** — backend zwraca klucz `"token"`, frontend oczekuje `"accessToken"`. Ujednolić nazwy i rozważyć dodanie interceptora, który przy 401 spróbuje odświeżyć token zanim przekieruje na stronę logowania.

4. **🔴 Przenieś adres URL backendu do zmiennej środowiskowej** — `LoginPage.tsx` ma zahardkodowane `http://localhost:8080`. Użyj `import.meta.env.VITE_API_URL` lub dedykowanej zmiennej `VITE_BACKEND_URL`.

5. **🔴 Dodaj atrybut SameSite do ciasteczka refresh_token** — w handlerze sukcesu OAuth2 ustaw jawnie `SameSite=Lax` lub `Strict` — nie polegaj na domyślnym zachowaniu przeglądarek.

6. **🔴 Dodaj Error Boundary i napraw crash w CVManager** — jeden błąd (np. `new URL()` na nieprawidłowym adresie) powoduje „biały ekran". Dodaj globalny Error Boundary i owiń parsowanie URL w try/catch z tekstem zastępczym.

### Do przemyślenia i poprawy

7. **🟡 Ujednolić przepływ zmiany etapów i historię** — metoda aktualizacji etapu (wywoływana z Kanbana) nie tworzy wpisów w historii etapów. Metoda dodawania etapu (z zapisem historii) nie jest używana przez UI. Ujednolicić w jeden spójny przepływ, który zawsze aktualizuje historię.

8. **🟡 Dodaj walidację @NotNull do pola status w StageUpdateRequest** — brak walidacji prowadzi do błędu 500 zamiast czytelnego 400. Rozważ też wymagalność pola rejectionReason przy statusie ODMOWA.

9. **🟡 Dodaj ograniczenie NOT NULL na kolumnie user_id** — migracja V4 dodaje kolumnę jako nullable, ale nigdy nie ustawia NOT NULL. Utwórz nową migrację Flyway z backfillem i ograniczeniem.

10. **🟡 Wzmocnij walidację uploadów CV** — sprawdzaj magic bytes pliku (sygnatura PDF: `%PDF-`), nie tylko nagłówek Content-Type.

11. **🟡 Rozbij KanbanBoard.tsx** — wyodrębnij KanbanCard, KanbanColumn, modale (StageModal, EndModal, MoveModal) i hook `useKanbanDragDrop` do osobnych plików.

12. **🟡 Ujednolić pobieranie danych w CVManager** — zamień useState+useEffect na hooki React Query (masz już `useCV()`). To poprawi spójność i obsługę cache.

13. **🟡 Dodaj paginację do `/api/applications`** — użyj Spring Data `Pageable`. Frontend może domyślnie ładować stronę po stronie, zyskasz wydajność przy dużej ilości danych.

14. **🟡 Popraw strukturę odpowiedzi walidacyjnych** — zamiast łączyć błędy w jeden ciąg tekstowy, zwracaj mapę `{pole: komunikat}` przez `ProblemDetail.setProperty()`.

15. **🟡 Uporządkuj @Transactional na prywatnej metodzie** — adnotacja na `markCurrentStageCompleted()` jest ignorowana przez Spring AOP. Wpływ praktyczny jest zerowy (wywoływana z transakcyjnej metody), ale warto usunąć mylącą adnotację dla czytelności.

16. **🟡 Wyodrębnij stałe kolorów statusów** — przenieś `STATUS_COLORS` do wspólnego pliku `constants/` i importuj w obu komponentach.

### Do nauki na przyszłość

17. **📘 Bezpieczeństwo webowe** — poczytaj o OWASP Top 10, Content Security Policy, path traversal, Subresource Integrity. To fundamenty pracy komercyjnej.

18. **📘 Wzorzec State Machine** — dla logiki przejść statusów aplikacji. Poczytaj o Spring Statemachine lub prostszych implementacjach z enumem.

19. **📘 Testowanie** — testy serwisów istnieją (dobra baza!). Sprawdź ich pokrycie narzędziem JaCoCo. Rozważ dodanie testów dla scenariuszy brzegowych (null status, path traversal, niespójne URL). Na frontendzie — testy komponentów z Testing Library.

20. **📘 Optymalizacja wydajności** — poczytaj o React Profiler, memoizacji (`useMemo`), wirtualizacji list (react-window/react-virtuoso), code splitting z React.lazy().

21. **📘 Cachowanie backendowe** — Spring Cache z @Cacheable dla statystyk odznak, nagłówki Cache-Control w odpowiedziach HTTP.

22. **📘 Monitoring i obserwabilność** — Micrometer z Spring Boot Actuator, distributed tracing, strukturyzowane logi w formacie JSON.

---

## 💬 KOŃCOWA MOTYWACJA

Ten projekt robi naprawdę duże wrażenie jak na osobę na początku drogi programistycznej. Nie jest to kolejna „to-do lista" — to pełnoprawna aplikacja full-stack z OAuth2, JWT, bazą danych, Docker Compose i systemem odznak gamifikacyjnych. Architektura jest przemyślana, podział na warstwy poprawny, a wybór technologii trafiony.

Uwagi w tym review nie są krytyką — to wskazówki na następny poziom. Większość „problemów" to rzeczy, które nawet doświadczeni programiści przeoczają. Fakt, że używasz Flyway zamiast `ddl-auto=update`, React Query zamiast ręcznego zarządzania stanem, httpOnly cookies zamiast localStorage dla refresh tokenów — to pokazuje, że czytasz dobre źródła i podejmujesz świadome decyzje architektoniczne.

Skup się na problemach oznaczonych jako 🔴 — to kwestie bezpieczeństwa i poprawności, które warto naprawić przed udostępnieniem aplikacji. Reszta to kierunki rozwoju, które będziesz naturalnie zgłębiać w miarę nabierania doświadczenia.

Powodzenia na drodze do pierwszej pracy w IT — z takim projektem w portfolio masz solidny argument na rozmowie rekrutacyjnej! 💪

---

*Review z dnia: 2026-03-01*