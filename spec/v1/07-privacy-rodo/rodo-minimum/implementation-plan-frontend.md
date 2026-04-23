# Plan implementacji RODO minimum — EasyApply Frontend

## Proces pracy (obowiązujący dla każdego etapu)

1. **Implementacja** — Claude robi zmiany w kodzie
2. **Weryfikacja automatyczna** — `npm run build` + `npm run test:run`, oba muszą być zielone
3. **Weryfikacja manualna** — użytkownik odpala `npm run dev` i sprawdza wzrokowo
4. **Aktualizacja planów** — Claude aktualizuje checkboxy w tym pliku
5. **Sugestia commita** — Claude proponuje wiadomość commita (format: `type(frontend): opis`)
6. **Commit** — użytkownik sam robi `git add` + `git commit`
7. **Pytanie o kontynuację** — Claude pyta czy idziemy dalej do następnego etapu

---

## Cel

Zbudować frontendową warstwę RODO:
1. **Strona `/privacy`** — publicznie dostępna, zawiera treść polityki (PL/EN)
2. **Ekran zgody** — blokuje UI appki dla zalogowanego usera bez zaakceptowanej polityki
3. **Obsługa `403 CONSENT_REQUIRED`** z backendu — przekierowanie na ekran zgody
4. **Przycisk "Usuń konto"** — w ekranie profilu / ustawień, z confirmem
5. **Link do `/privacy`** + email kontaktowy w stopce appki

---

## Status realizacji

### Etap 1 — Route `/privacy` + komponent statyczny

**Nowy plik:** `src/pages/PrivacyPolicy.tsx`

- [x] Stworzyć komponent renderujący treść polityki z pliku markdown / inline
- [x] Źródło treści: `src/content/privacyPolicy.ts` (import jako constants)
- [x] Wybór języka na podstawie aktualnego `i18n.language` (PL/EN)
- [x] Stylowanie spójne z resztą appki (nagłówki, lista sekcji)
- [x] Strona publiczna — **dostępna bez logowania**
- [x] react-markdown do renderowania markdown'u

**Router:**

**Plik:** `src/App.tsx`

- [x] Dodać route `<Route path="/privacy" element={<PrivacyPolicy />} />`
- [x] Route nie jest opakowany w `ProtectedRoute`
- [x] `npm run build` zielony ✅

**Decyzja o źródle treści:** najprościej trzymać markdown jako **string
constant w pliku TS** (np. `src/content/privacyPolicy.ts` z exportami
`privacyPolicyPl` i `privacyPolicyEn`). Renderowanie przez
`react-markdown` jeśli jest w projekcie, lub ręcznie podzielić na JSX sekcje.
Do decyzji przy implementacji.

---

### Etap 2 — Typ `User` w API client rozszerzony o `privacyPolicyAcceptedAt`

**Plik:** `src/types/domain.ts`

- [x] Dodać pole `privacyPolicyAcceptedAt: string | null` do typu `User`
- [x] `fetchCurrentUser()` zwraca typ z tym polem
- [x] `npm run build` zielony ✅

---

### Etap 3 — Ekran zgody `ConsentGate.tsx`

**Nowy plik:** `src/components/auth/ConsentGate.tsx`

- [x] Komponent wrappujący aplikację (wewnątrz `ProtectedRoute`)
- [x] Jeśli `user.privacyPolicyAcceptedAt === null` → render pełnoekranowego ekranu zgody
- [x] Jeśli zaakceptowane → `{children}` (czyli normalna appka)

**Zawartość ekranu zgody:**
- [x] Nagłówek: "Before you start" / "Zanim zaczniesz"
- [x] Krótki opis wymogu
- [x] Link do `/privacy` (otwierany w nowej karcie)
- [x] Checkbox do akceptacji
- [x] Przycisk "Accept and continue" (disabled dopóki checkbox nie zaznaczony)
- [x] Przycisk "Log out" — ucieczka
- [x] Po kliknięciu: `await api.acceptConsent()` → `window.location.reload()` → user widzi appkę

**Lokalizacja w drzewie komponentów:**

```
<ProtectedRoute>
  <ConsentGate>
    <AppContent />   {/* normalna appka z Kanbanem, listami, itd. */}
  </ConsentGate>
</ProtectedRoute>
```

---

### Etap 4 — Funkcje API

**Plik:** `src/services/api.ts`

- [x] Dodać `acceptConsent(): Promise<void>` → `POST /api/auth/consent`
- [x] Dodać `deleteAccount(): Promise<void>` → `DELETE /api/auth/me`
- [x] clearToken() na deleteAccount ✅

---

### Etap 5 — Obsługa `403 CONSENT_REQUIRED` (opcjonalne)

**Decyzja:** **Pominięte** — polegamy na ConsentGate
- ConsentGate blokuje UI wcześniej dla userów bez zgody
- 403 jest edge case'em (race condition) — wystarczy logować do konsoli

---

### Etap 6 — Settings page `/settings` z przyciskiem "Usuń konto"

**Nowy plik:** `src/pages/Settings.tsx`

- [x] Dodać route `/settings` (protected)
- [x] Sekcja "Konto" zawiera:
  - [x] Email usera (read-only)
  - [x] Data akceptacji polityki (read-only, formatowana)
  - [x] Przycisk "Usuń konto" (czerwony, danger styling)
- [x] Link ⚙️ w header AppContent
- [x] Confirm modal z ostrzeżeniem
- [x] Pole do wpisania "USUN" (PL) / "DELETE" (EN)
- [x] Po potwierdzeniu: deleteAccount() → alert → czysz localStorage → redirect /login
- [x] Czyszczenie EasyApply-specific flags (nie wszystkich cookies) ✅

---

### Etap 7 — Footer

**Nowy plik:** `src/components/layout/Footer.tsx`

- [x] Komponent `<Footer />` widoczny na AppContent i Settings
- [x] Link "Privacy policy" / "Polityka prywatności" → `/privacy`
- [x] Email kontaktowy: `mailto:jakub.bone1990@gmail.com`
- [x] Minimalistyczny styling, spójny z resztą appki ✅

**Wartość email:** do ustalenia, prawdopodobnie `jakub.bone1990@gmail.com`
(lub osobny email "kontakt RODO"). Zaszyty w kodzie / przez env var.

---

### Etap 8 — Klucze i18n

**Pliki:** `src/i18n/locales/pl/common.json`, `src/i18n/locales/en/common.json`

- [x] Klucze do dodania (grupować semantycznie):
  - `consent.title` — "Zanim zaczniesz" / "Before you start"
  - `consent.description` — krótki opis wymogu akceptacji
  - `consent.linkToPolicy` — "Przeczytaj politykę prywatności"
  - `consent.checkbox` — "Zapoznałem/am się z polityką prywatności i akceptuję ją"
  - `consent.acceptButton` — "Akceptuję i kontynuuję"
  - `consent.logoutButton` — "Wyloguj"
  - `settings.title` — "Ustawienia"
  - `settings.accountSection` — "Konto"
  - `settings.privacyAcceptedAt` — "Zgoda na politykę: {{date}}"
  - `settings.deleteAccount.button` — "Usuń konto"
  - `settings.deleteAccount.confirmTitle` — "Usunąć konto?"
  - `settings.deleteAccount.warning` — ostrzeżenie o nieodwracalności
  - `settings.deleteAccount.confirmInputPrompt` — "Wpisz USUN aby potwierdzić"
  - `settings.deleteAccount.confirmWord` — "USUN" (dla PL) / "DELETE" (dla EN)
  - `settings.deleteAccount.cancel` — "Anuluj"
  - `settings.deleteAccount.confirm` — "Usuń moje konto"
  - `settings.deleteAccount.success` — "Twoje konto zostało usunięte"
  - `footer.privacyLink` — "Polityka prywatności"
  - `footer.contact` — "Kontakt"

- [x] `npm run build` zielony ✅

---

### Etap 9 — Testy

**Testy dodane:**

- [x] `PrivacyPolicy.test.tsx` (7 testów) — renders, headings, content, markdown formatting
- [x] `ConsentGate.test.tsx` (6 testów) — accepts, rejects, checkbox validation, API calls
- [x] `Settings.test.tsx` (8 testów) — renders, displays, delete flow, confirmation, error handling
- [x] `npm run test:run` — **89 passed, 0 failed** ✅

---

## Poza zakresem

- **Export danych usera (GET /me/export)** — poza MVP tej fazy
- **Historia zaakceptowanych wersji polityki** — jedna polityka, bez wersjonowania
- **Cookie consent banner** — nie używamy trackerów, tylko techniczne cookies sesyjne
- **Strona regulaminu / ToS** — osobny dokument, poza zakresem fazy 07
- **Custom modal library** — używamy istniejących komponentów/patternów z projektu

---

## Pliki do zmiany / dodania

| Plik | Status | Zmiana |
|------|--------|--------|
| `pages/PrivacyPolicy.tsx` | **nowy** | Publiczna strona z treścią polityki |
| `content/privacyPolicy.ts` | **nowy** | Treść polityki (PL + EN) jako const |
| `components/auth/ConsentGate.tsx` | **nowy** | Wrapper blokujący UI dla userów bez zgody |
| `pages/Settings.tsx` | **nowy** | Strona ustawień z sekcją usuwania konta |
| `components/layout/Footer.tsx` | **nowy** | Stopka z linkiem do polityki + kontaktem |
| `App.tsx` | modyfikacja | Routy `/privacy`, `/settings`, opakowanie w `ConsentGate` |
| `services/api.ts` | modyfikacja | `acceptConsent()`, `deleteAccount()`, typ `User` z polem zgody |
| `i18n/locales/pl/*.json` | modyfikacja | Klucze `consent.*`, `settings.*`, `footer.*` |
| `i18n/locales/en/*.json` | modyfikacja | Klucze jak wyżej |
| `test/**` | modyfikacja | Mocki `/me` z polem `privacyPolicyAcceptedAt` |

---

## Definicja ukończenia (DoD)

- [x] `/privacy` dostępne publicznie, wyświetla politykę w języku użytkownika (markdown rendering)
- [x] Nowy user po loginie widzi ekran zgody, nie dostaje się do głównej appki
- [x] Po kliknięciu "Akceptuję" user od razu widzi normalną appkę
- [x] Istnieje ekran ustawień z sekcją "Konto" i przyciskiem "Usuń konto"
- [x] Usunięcie konta wymaga wpisania słowa potwierdzającego, działa end-to-end
- [x] Stopka widoczna na wszystkich stronach, zawiera link do polityki i email kontaktowy
- [x] `npm run build` zielony ✅
- [x] `npm run test:run` — 89 passed, 0 failed ✅
- [x] Weryfikacja manualna: nowy user → login → consent screen → akceptacja → appka → ustawienia → usuń konto → re-login → tour pojawia się ✅

---

## Diagram flow consent

```
User loguje się Google
       ↓
Frontend dostaje JWT
       ↓
GET /api/auth/me → user.privacyPolicyAcceptedAt === null
       ↓
<ConsentGate> renderuje ekran zgody (blokada UI)
       ↓
User zaznacza checkbox + klika "Akceptuję"
       ↓
POST /api/auth/consent → 204
       ↓
Invalidate queries /me → refetch
       ↓
user.privacyPolicyAcceptedAt = "2026-04-22T10:30:00Z"
       ↓
<ConsentGate> renderuje children (normalna appka)
```

---

*Ostatnia aktualizacja: 2026-04-23 — COMPLETE ✅*
