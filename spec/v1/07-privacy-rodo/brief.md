# EasyApply — Faza 07: Privacy & RODO (przygotowanie do publikacji)

## 1. Kontekst

Aplikacja ma zostać udostępniona publicznie jako **projekt portfolio** —
prezentowana na LinkedIn jako "realny, działający produkt", z którego mogą
korzystać rekruterzy i inni odwiedzający. Bez monetyzacji, bez marketingu, bez
sprzedaży danych. Cel: **pokazać dojrzałość inżynierską**, nie budować SaaS.

Ten kontekst determinuje podejście: **minimum wiarygodnej zgodności RODO**
przy maksymalnej redukcji ryzyka związanego z przechowywaniem danych osobowych.

---

## 2. Problem

Obecnie aplikacja:

1. **Zapisuje dane osobowe userów w bazie** (`users`: email, name, google_id,
   refresh_token) po każdym logowaniu Google — bez zgody, bez polityki
   prywatności, bez możliwości usunięcia konta.
2. **Hostuje pliki CV** na serwerze (`uploads/cv/` + metadane w tabeli `cvs`).
   CV jako dokument zawiera szeroki zakres PII: adres, telefon, datę urodzenia,
   często zdjęcie, historię zatrudnienia, wykształcenie.
3. **Nie ma retencji** — dane trzymane są w nieskończoność, również dla
   nieaktywnych userów.

Każdy z tych punktów rodzi obowiązki z RODO. W obecnej formie publikacja
projektu = świadome wystawienie się na ryzyko prawne bez żadnych zabezpieczeń.

---

## 3. Decyzja architektoniczna

**CV tylko jako link zewnętrzny (Google Drive / Dropbox / własna strona),
bez uploadu plików na nasz serwer.**

Rozwiązanie redukuje najcięższą daną (plik CV z PII) z naszej
infrastruktury, pozostawiając ficzer w działaniu — user wkleja link do CV
hostowanego u siebie i sam zarządza dostępem. Baza u nas zawiera wtedy:
email + imię + google_id + link — dane porównywalne z publicznym profilem
LinkedIn.

W kodzie mamy już `CVType.LINK` obok `CVType.FILE`, więc zmiana
sprowadza się do wyłączenia ścieżki FILE (backend odrzuca upload, frontend
blokuje akcję).

**Ważne:** przycisk "Upload PDF" **zostaje widoczny w UI**, ale disabled z
tooltipem "Chwilowo nieczynne" — zachowujemy widoczność ficzera w portfolio,
sygnalizując że istnieje jako pełnoprawna funkcja w kodzie.

---

## 4. Zakres

Trzy logicznie niezależne wątki, każdy z własnym planem wdrożenia:

### 4.1. `cv-link-only/` — przejście na link-only
- Backend: zablokować endpoint uploadu PDF (503 / komunikat)
- Frontend: przycisk uploadu disabled + tooltip, ścieżka linku w pełni funkcjonalna
- Decyzja co z istniejącymi rekordami `CVType.FILE` w bazie (read-only? migracja? — do ustalenia w planie)

### 4.2. `rodo-minimum/` — minimum prawne RODO
- Strona `/privacy` z polityką prywatności (PL + EN)
- Zgoda "zapoznałem się z polityką prywatności" przy pierwszym logowaniu
- Endpoint `DELETE /me` kasujący usera + kaskadowo wszystkie jego dane
- Przycisk "Usuń konto" w UI (w ustawieniach profilu) z potwierdzeniem
- Email kontaktowy do spraw danych w polityce + stopce

### 4.3. `retention-hygiene/` — retencja i higiena danych
- Cron auto-usuwania kont nieaktywnych > 12 miesięcy
- Audyt logów (MDC, loggery) pod kątem wycieków email/name/tokenów w plaintext
- Szyfrowanie lub hashowanie `refresh_token` w bazie (do ustalenia w planie)

---

## 5. Poza zakresem

Świadomie **nie** wchodzimy w:

- **DPO (Inspektor Ochrony Danych)** — niewymagany dla skali projektu
- **DPIA (ocena skutków przetwarzania)** — niewymagana dla skali i rodzaju danych
- **Rejestr czynności przetwarzania** — realizowany jako sekcja w README, nie formalny dokument
- **Szyfrowanie end-to-end CV** (wariant C) — odrzucone w sekcji 3
- **Audyt zewnętrzny / certyfikacja / ISO** — niewspółmierne do skali
- **Cookie consent banner** — aplikacja nie używa trackerów ani reklamowych cookies, tylko techniczne (sesja)
- **Prawo do przenoszenia danych** (`GET /me/export`) — rozważane jako opcjonalne, poza MVP tej fazy
- **Multi-language privacy policy beyond PL/EN** — tylko dwie wersje
- **Migracja istniejących plików CV na inne miejsce** — rozstrzygane per user przez usunięcie konta

---

## 6. Kryteria sukcesu (Definition of Done fazy)

Faza 07 zamknięta gdy:

1. ✅ W UI nie da się uploadować pliku CV (disabled + tooltip), można nadal dodawać link
2. ✅ Strona `/privacy` publicznie dostępna, zawiera wszystkie wymagane sekcje (kto, co, po co, jak długo, prawa usera, kontakt)
3. ✅ Nowy user przy pierwszym logowaniu musi zaakceptować politykę — bez tego brak wpisu w bazie
4. ✅ Zalogowany user może usunąć swoje konto jednym kliknięciem; po usunięciu w bazie nie ma żadnego jego śladu (user, cv, notes, applications)
5. ✅ Job uruchamia się okresowo i kasuje konta nieaktywne > 12 miesięcy
6. ✅ Logi produkcyjne nie zawierają emaili / nazw userów / tokenów w plaintext
7. ✅ README sekcja "Privacy & Data" opisuje świadome decyzje architektoniczne
8. ✅ `as-built.md` zaktualizowany: nowe endpointy, flow CV, strona `/privacy`

---

## 7. Kolejność wdrożenia

Sugerowana kolejność (każdy krok niezależnie commitowalny):

1. **`cv-link-only/`** — najtańsze zwycięstwo, od razu redukuje ryzyko
2. **`rodo-minimum/`** — najwięcej roboty, ale niezbędne przed publikacją
3. **`retention-hygiene/`** — domknięcie, można robić po publikacji beta

---

## 8. Powiązane dokumenty

- `spec/v1/as-built.md` — aktualizujemy po każdym wątku
- `README.md` — sekcja "Privacy & Data" po zakończeniu fazy
- `spec/README.md` — dodajemy wiersz o fazie 07
- `spec/v1/07-privacy-rodo/cv-link-only/` — plany CV link-only (backend + frontend)
- `spec/v1/07-privacy-rodo/rodo-minimum/` — plany RODO + treść polityki (backend + frontend + privacy-policy.md)
- `spec/v1/07-privacy-rodo/retention-hygiene/` — plan retencji i audytu logów

---

*Data utworzenia: 2026-04-22*
