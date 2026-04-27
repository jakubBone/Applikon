# EasyApply — Faza 08: User Data & Service Notifications

## 1. Kontekst

Faza 07 zamknęła minimalną zgodność RODO: consent flow, polityka prywatności,
usunięcie konta. Brakuje dwóch ficzerów, które uzupełniają tę warstwę:

- **Przenoszalność danych** — user może pobrać wszystko co o sobie trzymamy.
  Wymóg RODO Art. 20, świadomie pominięty w fazie 07 jako "poza MVP".
- **System powiadomień serwisowych** — admin może wyświetlić komunikat
  wszystkim userom (przerwy techniczne, zmiany regulaminu, aktualizacje).

---

## 2. Problem

Obecnie:

1. **Brak eksportu danych** — user może tylko usunąć konto, ale nie może
   pobrać swoich danych (aplikacje, notatki, CV linki). Luka w RODO Art. 20.
2. **Brak kanału komunikacji z userami** — nie ma mechanizmu poinformowania
   userów o zmianach w serwisie bez modyfikacji kodu i redeployu.

---

## 3. Decyzja architektoniczna

### Eksport danych

Endpoint `GET /api/auth/me/export` zwraca plik JSON ze wszystkimi danymi
usera: profil, lista aplikacji z polami, notatki, CV linki. Dostępny
z poziomu `/settings`.

### System powiadomień

Tabela `service_notices` — admin dodaje wpis (treść PL + EN, data wygaśnięcia,
typ). Frontend odpytuje `GET /api/system/notices/active` i wyświetla aktywne
komunikaty. Admin zarządza przez `POST /api/admin/notices` (zabezpieczony rolą
ADMIN).

Typy powiadomień:
- `BANNER` — pasek na górze UI, można zamknąć
- `MODAL` — popup przy wejściu, wymaga kliknięcia "OK"; nie wraca po zamknięciu
  (zapamiętane w localStorage)

---

## 4. Zakres

### 4.1. `data-export/` — eksport danych usera
- Backend: `GET /api/auth/me/export` → JSON z profilem, aplikacjami, notatkami, CV
- Frontend: przycisk "Pobierz moje dane" w `/settings`, pobiera `easyapply-export.json`
- Flyway: brak zmian w schemacie

### 4.2. `service-notices/` — system powiadomień serwisowych
- Backend: tabela `service_notices`, endpointy admin + public
- Frontend: `ServiceBanner` + `ServiceModal`
- Flyway: migracja V14 dodająca tabelę `service_notices`

---

## 5. Poza zakresem

- **Push notifications / e-mail** — powiadomienia tylko in-app
- **Eksport CSV** — tylko JSON
- **Dashboard admina w UI** — admin zarządza przez API
- **Wersjonowanie eksportu** — jeden format v1
- **Szyfrowanie eksportu** — plik niezaszyfrowany, user pobiera przez HTTPS

---

## 6. Kryteria sukcesu (Definition of Done fazy)

Faza 08 zamknięta gdy:

1. ✅ Zalogowany user może pobrać `easyapply-export.json` z `/settings`;
   plik zawiera profil, wszystkie aplikacje z notatkami i CV linkami
2. ✅ Eksport nie ujawnia danych innych userów
3. ✅ Admin może utworzyć aktywny notice przez `POST /api/admin/notices`
4. ✅ Aktywny `BANNER` widoczny dla każdego zalogowanego usera na górze UI
5. ✅ Aktywny `MODAL` wyświetla się przy wejściu; po "OK" nie wraca w tej sesji
6. ✅ Wygasłe notices (po `expiresAt`) nie są zwracane przez public endpoint
7. ✅ `as-built.md` zaktualizowany: nowe endpointy, nowa tabela, nowe komponenty

---

## 7. Kolejność wdrożenia

1. **`data-export/`** — jeden endpoint + jeden przycisk w UI, zero zmian w DB
2. **`service-notices/`** — Flyway migracja + backend + dwa komponenty frontend

---

## 8. Powiązane dokumenty

- `spec/v1/as-built.md` — aktualizujemy po każdym wątku
- `spec/README.md` — dodajemy wiersz o fazie 08
- `spec/v1/08-user-data/data-export/` — plan backendu i frontendu
- `spec/v1/08-user-data/service-notices/` — plan backendu i frontendu

---

*Data utworzenia: 2026-04-26*
