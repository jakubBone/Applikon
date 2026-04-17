<!-- Draft posts documenting the project's development methodology. Communication artifacts. -->

# Posty LinkedIn — EasyApply

---

## POST 1 — Spec-Driven Development z AI
**Status: opublikowany**

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

## POST 2 — Tryb Mentora
**Status: do opublikowania**

---

Spec-first development działa nawet wtedy, gdy nie jesteś ekspertem w danej technologii.
Jest jeden warunek: nie możesz generować kodu „na pałę” i uznawać, że skoro działa - to jest dobrze.

Jestem backendowcem. Do EasyApply potrzebowałem frontendu, więc razem z Claude Code zrobilimy go w React. W podejściu spec-first, rzecz jasna ;) 

👉 Ale... nie potraktowałem tego jako „gotowego produktu”, tylko jako materiał do nauki.

Zacząłem od:
📄 code-review.md
Na tej bazie powstał:
📄 learning-plan-frontend.md

10 etapów nauki frontu (Vite → komponenty → state → hooki → React Query → … → testy)

👉 Cel:
Uczymy się i naprawiamy realne błędy jednocześnie.
Naprawiamy dopiero wtedy, kiedy zrozumiem mechanizm.

Tryb mentor (Claude Code):

🗺️ Plan nauki 
📚 AI tłumaczy (analogie do Javy, bo ją znam)
🧠 quiz (5 pytań:  brak odpowiedzi = brak progresu)
💻 kod (czytam + rozumiem)
🔧 fix (dopiero teraz)
🧪 testy
🏗️ build (TypeScript)
🌐 przeglądarka
📝 notatki → learning-notes-frontend.md
---

## POST 3 — Struktura spec/ w repozytorium
**Status: opublikowany**

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
****Status: do napisania ****
Implementacja i18n



## POST 5 — as-build.md
****Status: do napisania ****
Ze normalna sprawa, ze przy llm nie jestes w stanie wszytkiego zaplanować
jak na etapie planowania cos sie da poprawić to wracasz do spec i update
jak nie to zrobilem u mnie tak, ze po v1 mam plik as-built.md gdzie jest status reality vs plan 




