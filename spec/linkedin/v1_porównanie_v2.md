Twoim zadaniem jest wygenerowanie pliku `spec/v1/as-built.md` dla projektu EasyApply.
Ten plik ma dokumentować rzeczywisty stan aplikacji i porównać go z tym, co było zaplanowane.

## Czego NIE robisz
- Nie uruchamiasz aplikacji ani żadnych komend (npm, mvn, java, curl itp.)
- Nie modyfikujesz żadnych istniejących plików — tylko tworzysz nowy as-built.md
- Nie zakładasz niczego bez przeczytania kodu CAŁEJ APLIKACJI — każde stwierdzenie musi mieć podstawę w pliku
- Nie piszesz ogólnikowo ("podobny do planu") — piszesz konkretnie (nazwy klas, pól, endpointów)
- Nie spieszysz się — przejdź przez KAŻDY krok zanim zaczniesz pisać

## Kroki do wykonania (w tej kolejności)

### KROK 1 — Przeczytaj wszystkie dokumenty spec
Przeczytaj po kolei:
- spec/v1/01-vision/brief.md
- spec/v1/02-implementation/mvp-implementation-plan.md
- spec/v1/05-additional-features/i18n/implementation-plan-backend.md
- spec/v1/05-additional-features/i18n/implementation-plan-frontend.md
- spec/v1/05-additional-features/logout/implementation-plan-backend.md
- spec/v1/05-additional-features/logout/implementation-plan-frontend.md
- spec/v1/06-cleanup/remove-stage-history.md

Po przeczytaniu każdego pliku zapisz w swoim kontekście: jakie funkcjonalności były planowane, jaka struktura plików, jaki schemat DB, jakie
endpointy.

### KROK 2 — Przeczytaj backend (kod źródłowy)
Zbadaj strukturę backendu:
- Wszystkie pliki w easyapply-backend/src/main/java/ (entity, controller, service, repository, dto, mapper, exception, config)
- Plik konfiguracji bazy danych / migracje (szukaj schema.sql, migration files, lub adnotacji JPA)
- plik application.properties lub application.yml
- pom.xml (zależności — co faktycznie zainstalowano)

Zapisz: jakie encje istnieją i jakie mają pola, jakie endpointy, jakie DTO, jakie zależności.

### KROK 3 — Przeczytaj frontend (kod źródłowy)
Zbadaj strukturę frontendu:
- Wszystkie pliki w easyapply-frontend/src/ (components, pages, services, types, hooks, i18n)
- package.json (zależności — co faktycznie zainstalowano)

Zapisz: jakie komponenty istnieją, jakie strony/widoki, jakie typy TypeScript, jakie wywołania API.

### KROK 4 — Porównaj plan vs rzeczywistość
Dla każdego elementu z KROKU 1 sprawdź czy istnieje w KROKU 2 i 3.
Stwórz w swoim kontekście listę:
- Co zostało zbudowane zgodnie z planem
- Co zostało zbudowane inaczej niż planowano (z konkretnym opisem różnicy)
- Co zostało dodane ponad plan (np. responsywność, i18n, OAuth2 jeśli jest)
- Co z planu NIE zostało zbudowane

### KROK 5 — Napisz as-built.md
Stwórz plik spec/v1/as-built.md z następującą strukturą:

  ---
# EasyApply v1 — As-Built Documentation
> Generated: [data]. Describes the actual implemented state of EasyApply v1.
> Source of truth: the code. This document reflects what exists, not what was planned.

## 1. Summary — Plan vs Reality
Krótka tabela: co planowano → co zbudowano → status (zgodnie / inaczej / ponad plan / nie zbudowano)

## 2. Features — Status
Dla każdej funkcjonalności z brief.md: czy jest, czy nie, czy zmieniona.

## 3. Backend — Actual Architecture
- Rzeczywista struktura pakietów (packages)
- Wszystkie encje z faktycznymi polami (nie z planu — z kodu)
- Wszystkie endpointy REST z metodami HTTP i ścieżkami
- Rzeczywiste zależności z pom.xml (tylko kluczowe)

## 4. Database — Actual Schema
- Rzeczywiste tabele i kolumny (z encji JPA lub schema.sql)
- Relacje między tabelami

## 5. Frontend — Actual Architecture
- Rzeczywista struktura komponentów i stron
- Rzeczywiste wywołania API (które endpointy używa frontend)
- Zainstalowane biblioteki (z package.json)

## 6. Deviations from Plan
Lista konkretnych różnic: co było w planie, co jest w rzeczywistości. Dla każdej różnicy — jeśli widać z kodu dlaczego (np. usunięta tabela
stage_history) — opisz.

## 7. Added Beyond Spec
Rzeczy zaimplementowane których nie było w brief ani implementation-plan.

## 8. Not Implemented (from spec)
Rzeczy które były w spec ale nie zostały zaimplementowane w v1.

## 9. v1 Completion Status
Krótka ocena: co zostało do zrobienia żeby v1 był kompletny (logout? cleanup?).
---

### KROK 6 — Weryfikacja (test)
Po napisaniu pliku wykonaj następujące sprawdzenia:

1. Weź każdy endpoint z sekcji 3 as-built.md i potwierdź że istnieje w kodzie kontrolerów
2. Weź każdą tabelę/kolumnę z sekcji 4 i potwierdź że istnieje w encjach lub schema.sql
3. Weź każdą pozycję z sekcji "Not Implemented" i potwierdź że faktycznie NIE istnieje w kodzie
4. Weź każdą pozycję z sekcji "Added Beyond Spec" i potwierdź że faktycznie NIE była w brief.md

Jeśli weryfikacja ujawni błąd — popraw as-built.md i zanotuj co poprawiłeś.

## Definicja sukcesu
- Każda funkcjonalność z brief.md jest wymieniona w sekcji 2 (ze statusem)
- Każdy endpoint backendu jest wymieniony w sekcji 3
- Schemat DB w sekcji 4 zgadza się z kodem (zero założeń)
- Wszystkie odstępstwa od planu są udokumentowane z konkretami (nie ogólnikami)
- Weryfikacja z KROKU 6 przeszła bez błędów lub błędy zostały poprawione

# WAŻNE!!!
Przeczytaj kod CAŁEJ APLIKACJI
