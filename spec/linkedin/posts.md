<!-- Draft posts documenting the project's development methodology. Communication artifacts. -->

# Posty LinkedIn — EasyApply

---

## POST 1 — Spec-Driven Development z AI
**Status: gotowy do publikacji**

---

Przy moim EasyApply pracuję z Claude Code w podejściu spec-driven development.

Kluczowa zasada: kod na końcu, nie na początku.

🚀 Najpierw tworzę brief:
Problem, użytkownik, kontekst biznesowy, zakres MVP i edge case'y.

To jest baza dla pracy nad właściwą specyfikacją.

🚀 Następnie praca iteracyjna z AI:
Doprecyzowuję założenia (dla MVP), zadaję pytania, sprawdzam warianty z różnymi modelami i aktualizuję dokument.

Claude Code pomaga mi w analizie istniejącego kodu, doborze stacku, schematu danych i planu wdrożenia.

🚀 Kolejny etap to kroki biznesowe MVP:
Nie robię listy feature'ów, tylko rozbijam projekt na etapy, a każdy etap ma:
Cel, dlaczego jest potrzebny, warunki brzegowe, definicję sukcesu.

🚀 Czas na plan implementacji:
Konkretne kroki techniczne, zależności oraz definicja „done" dla każdego etapu.

🚀 Testy — weryfikacja założeń, nie tylko kodu:
Dla każdego etapu mam zdefiniowane kryteria sukcesu w spec. Test to nie "czy kod się kompiluje", tylko "czy spełniam założenie, które zapisałem w kroku biznesowym".

Scenariusz happy path, scenariusz błędu, test manualny API — i dopiero wtedy zamykam etap.

Najważniejsze: spec nie jest dokumentem startowym, tylko żywym źródłem prawdy. Jeśli zmienia się założenie, wracam do specyfikacji, a nie dopisuję kod na czuja.

W kolejnym wpisie pokażę, jak do tego procesu podpinam do AI „TRYB MENTORA" 🙂

---

## BRIEF — Post 2: Tryb Mentora (do napisania)

**Temat:** Jak uczę się frontendu, który AI wygenerował — system nauki z AI jako mentorem.

**Kontekst dla AI piszącego wpis:**

Jakub jest backendowcem (Java, Spring Boot). Wygenerował frontend React z pomocą AI do swojej aplikacji EasyApply (job tracker dla juniorów IT). Nie znał Reacta. Zamiast się go uczyć "z kursów", stworzył z AI system nauki oparty na własnym projekcie.

**Jak system działa — każdy szczegół ważny:**

1. **AI zrobił code review własnego kodu** — powstał plik `03-review/code-review-2026-03-01.md` z 12 konkretnymi problemami, podzielonymi na krytyczne (bezpieczeństwo: XSS przez href, błąd kontraktu refresh tokena, zahardkodowany localhost:8080, brak Error Boundary) i ważne (jakość: CVManager używał ręcznego useState zamiast React Query hooka, zduplikowane stałe kolorów statusów).

2. **CR stał się planem nauki** — powstał `04-refactoring-learning/refactor-plan-frontend.md`: 10 etapów nauki (ekosystem/Vite → komponenty → state/useState → hooki → React Query → routing → komunikacja z API → OAuth2/JWT → TypeScript → testowanie). Do każdego etapu przypisane są konkretne CR-y do naprawienia.

3. **Kluczowa zasada przypisania CR do etapu:** CR naprawiam przy etapie, który tłumaczy mechanizm błędu — nie wcześniej. Błąd dotyczący React Query naprawiam przy Etapie 5 (React Query), bo przy Etapie 2 nie wiem jeszcze co to React Query. Naprawa bez zrozumienia nic nie daje.

4. **Zasady trybu mentora:**
   - Każde zagadnienie tłumaczone przez analogie do Javy (bo Jakub ją zna) — np. `useState` ≈ pole w klasie + setter który automatycznie wywołuje `repaint()`, React Query ≈ `@Cacheable` w Springu
   - Quiz po każdym zagadnieniu — 5 pytań, nie idzie dalej bez odpowiedzi
   - AI drąży jeśli odpowiedź jest niepełna lub błędna
   - Notatki lądują w pliku `04-refactoring-learning/learning-notes-frontend.md` po każdym etapie — zostają jako ściągawka
   - Postęp śledzony w tabelce (etap → nauka ✅/⬜, CR naprawione ✅/⬜, przetestowane ✅/⬜)

5. **Flow każdej naprawy CR (obowiązkowy):**
   Wyjaśnij mechanizm → przeczytaj aktualny plik → napraw → uruchom testy → sprawdź build (TypeScript) → Jakub sprawdza w przeglądarce → pytanie o zaliczenie → aktualizacja tabelki

6. **Efekty po 9 etapach:** wszystkie CR naprawione i ręcznie przetestowane w przeglądarce. Etap 10 (testowanie) w toku.

7. **Wizja dalej:** `06-v2/vision.md` — 6 mikroserwisów, Kafka jako event broker, Redis, AI-powered features. Na to też będzie plan nauki. W tej chwili: najpierw rozumiem monolit, który mam zastąpić.

**Ton wpisu:** szczery, konkretny, bez lansowania się. Pokazać system, nie siebie. Może lekko prowokacyjny na starcie ("AI napisał mi frontend" albo "Uczę się kodu, którego nie pisałem").

**Czego unikać:** generycznych zdań typu "AI to przyszłość", "nauka nigdy się nie kończy". Każde zdanie ma mieć konkret — nazwę pliku, nazwę mechanizmu, przykład z projektu.

**Co koniecznie uwzględnić:**
- CR → plan nauki → naprawa przy właściwym etapie (to najbardziej oryginalna część)
- Quiz i zasada "nie idę dalej bez odpowiedzi"
- Analogie do Javy jako metoda tłumaczenia
- Notatki w plikach jako persistent memory
- Wzmianka o wizji mikroserwisów (żeby uciszyć komentarze "czemu nie Kafka")

**Długość:** LinkedIn, nierozwlekle. Konkretne, autentyczne, atrakcyjne. Nie może wyglądać jak napisane przez AI.

---

## POST 3 — Struktura spec/ w repozytorium
**Opublikowany**

---

Spec-driven development z AI — jak wygląda to w praktyce w repozytorium

Dużo się mówi o spec-driven development. Mało kto pokazuje jak to wygląda w plikach.

W moim projekcie EasyApply katalog `spec/` wygląda tak:

```
spec/
  v1/                        ← MVP: monolit Spring Boot
    01-vision/               ← brief: problem, użytkownik, zakres MVP
    02-implementation/       ← plan: kroki techniczne, definicja "done"
    03-review/               ← code review: bezpieczeństwo, wzorce, jakość
    04-refactoring-learning/ ← plan nauki po CR + notatki (backend i frontend)
    05-additional-features/  ← ficzery spoza MVP: każdy własny mini-cykl (spec → build → test)
  v2/
    vision.md                ← AI / Mikrousługi / Kafka - świadoma decyzja (mój rozwój)
  README.md                  ← statusy faz projektu
```

Każda wersja to osobny lifecycle. V1 — monolit MVP — jest zbudowany,
zrecenzowany i teraz refaktoryzowany z nauką. V2 to zaprojektowana
wizja architektoniczna. Na razie tylko vision — własny cykl spec
zacznie się gdy V1 będzie domknięte.

Kilka rzeczy, które nie są oczywiste:

`04-refactoring-learning/` powstał z code review. CR wskazał luki
(security, wzorce, jakość) — zamiast ślepo fixować, najpierw powstawał
plan nauki tłumaczący mechanizm błędu, a dopiero potem fix.
Efekt: naprawione i zrozumiane.

`05-additional-features/` to ficzery odkryte już po zamknięciu MVP —
np. i18n, o którym w ogóle nie myślałem planując aplikację. Każdy
traktowany jak pełnoprawna iteracja ze swoją specyfikacją:
brief → plan → build → test.

`README.md` to jedyne miejsce z aktualnym statusem faz projektu.
Jedna tabela, dwa wiersze (V1 i V2), statusy per faza.
Jeden rzut oka i wiem, gdzie jestem.

Spec nie jest dokumentacją po fakcie. To mapa, która istnieje
zanim zaczyna się kod.


## POST 4 — Struktura spec/ w repozytorium
**Do napisania**
Implementacja i18n




