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

- [ ] Stworzyć komponent renderujący treść polityki z pliku markdown / inline
- [ ] Źródło treści: `spec/v1/07-privacy-rodo/rodo-minimum/privacy-policy.md` (kopia do frontendu lub import jako string)
- [ ] Wybór języka na podstawie aktualnego `i18n.language` (PL/EN)
- [ ] Stylowanie spójne z resztą appki (nagłówki, lista sekcji)
- [ ] Strona publiczna — **dostępna bez logowania**

**Router:**

**Plik:** `src/App.tsx` (lub plik gdzie zdefiniowane są routy)

- [ ] Dodać route `<Route path="/privacy" element={<PrivacyPolicy />} />`
- [ ] Route nie jest opakowany w `ProtectedRoute`
- [ ] `npm run build` zielony

**Decyzja o źródle treści:** najprościej trzymać markdown jako **string
constant w pliku TS** (np. `src/content/privacyPolicy.ts` z exportami
`privacyPolicyPl` i `privacyPolicyEn`). Renderowanie przez
`react-markdown` jeśli jest w projekcie, lub ręcznie podzielić na JSX sekcje.
Do decyzji przy implementacji.

---

### Etap 2 — Typ `User` w API client rozszerzony o `privacyPolicyAcceptedAt`

**Plik:** `src/types/*` (lokalizacja do zweryfikowania) lub `src/services/api.ts`

- [ ] Dodać pole `privacyPolicyAcceptedAt: string | null` do typu `User`
- [ ] `fetchMe()` / `getCurrentUser()` (nazwa do zweryfikowania) zwraca typ z tym polem
- [ ] `npm run build` zielony

---

### Etap 3 — Ekran zgody `ConsentGate.tsx`

**Nowy plik:** `src/components/auth/ConsentGate.tsx`

- [ ] Komponent wrappujący aplikację (wewnątrz `ProtectedRoute`, przed renderem głównego UI)
- [ ] Jeśli `user.privacyPolicyAcceptedAt === null` → render pełnoekranowego ekranu zgody
- [ ] Jeśli zaakceptowane → `{children}` (czyli normalna appka)

**Zawartość ekranu zgody:**
- Nagłówek: "Zanim zaczniesz / Before you start"
- Krótki opis: "Aby korzystać z EasyApply musisz zaakceptować politykę prywatności."
- Link do `/privacy` (otwierany w nowej karcie: `target="_blank"`)
- Checkbox: "Zapoznałem/am się z polityką prywatności i akceptuję ją"
- Przycisk "Akceptuję i kontynuuję" (disabled dopóki checkbox nie zaznaczony)
- Przycisk "Wyloguj" — jako ucieczka, jeśli user nie zgadza się z polityką
- Po kliknięciu "Akceptuję": `await api.acceptConsent()` → refetch `/me` → user widzi normalną appkę

**Lokalizacja w drzewie komponentów:**

```
<ProtectedRoute>
  <ConsentGate>
    <AppContent />   {/* normalna appka z Kanbanem, listami, itd. */}
  </ConsentGate>
</ProtectedRoute>
```

---

### Etap 4 — Funkcja API `acceptConsent()`

**Plik:** `src/services/api.ts`

- [ ] Dodać funkcję `acceptConsent(): Promise<void>` → `POST /api/auth/consent`
- [ ] Obsługa błędu: jeśli 401/403 — user zostanie wylogowany przez istniejący mechanizm
- [ ] Po sukcesie frontend robi `refetch` na zapytaniu `/me` (React Query `invalidateQueries`)

---

### Etap 5 — Obsługa `403 CONSENT_REQUIRED` w API interceptor

**Plik:** `src/services/api.ts` (lub wspólny interceptor)

- [ ] Zlokalizować miejsce globalnej obsługi błędów API (jeśli istnieje)
- [ ] Dla odpowiedzi `403` z body `{"error": "CONSENT_REQUIRED"}`:
  - Odświeżyć dane usera (`/me`)
  - Wymusić re-render → `ConsentGate` zareaguje na `null` w `privacyPolicyAcceptedAt`
- [ ] Alternatywa (prostsza): polegać wyłącznie na `ConsentGate` — jeśli user nie ma zgody,
      nie zdąży nawet wywołać tych endpointów (gate blokuje UI wcześniej).
      W takim przypadku 403 jest edge case'em (teoretyczne race condition) — wystarczy logować
      do konsoli, bez specjalnej obsługi

**Decyzja:** **opcja prostsza** (polegać na `ConsentGate`). Etap 5 może okazać się zbędny.

---

### Etap 6 — Ekran/sekcja "Ustawienia profilu" z przyciskiem "Usuń konto"

**Decyzja projektowa:** Czy jest już strona ustawień? Jeśli nie, tworzymy
nową minimalną (np. `/settings` z sekcją Konto).

**Nowy plik (jeśli brak):** `src/pages/Settings.tsx`

- [ ] Dodać route `/settings` (protected)
- [ ] Sekcja "Konto" zawiera:
  - Imię i email usera (read-only, z `/me`)
  - Data akceptacji polityki (read-only, formatowana lokalnie)
  - Przycisk "Usuń konto" w sekcji zagrożenia (styling: czerwony / `danger`)
- [ ] Link do `/settings` dostępny z menu/headera (np. ikona profilu / avatar → dropdown)

**Confirm modal:**

- [ ] Klik "Usuń konto" → modal z ostrzeżeniem:
  - "Tej operacji nie można cofnąć. Zostaną trwale usunięte: Twoje konto, aplikacje, CV, notatki."
  - Pole do wpisania słowa potwierdzającego (np. "USUN" lub własny email) — redukuje przypadkowe kliknięcia
  - Przyciski "Anuluj" + "Usuń moje konto" (disabled dopóki pole nie wypełnione poprawnie)
- [ ] Po potwierdzeniu: `await api.deleteAccount()` → `POST /api/auth/logout` (lub podobne wyczyszczenie localStorage) → redirect na `/login`
- [ ] Komunikat sukcesu (toast/alert): "Twoje konto zostało usunięte"

**Plik:** `src/services/api.ts`

- [ ] Dodać funkcję `deleteAccount(): Promise<void>` → `DELETE /api/auth/me`

---

### Etap 7 — Stopka z linkiem do `/privacy` i kontaktem

**Plik:** `src/AppContent.tsx` lub odpowiedni layout

- [ ] Dodać element `<Footer />` widoczny na każdej stronie
- [ ] Zawiera: link "Privacy Policy" / "Polityka prywatności" → `/privacy`
- [ ] Email kontaktowy (kliknięcie otwiera domyślnego mail clienta): `mailto:{{CONTACT_EMAIL}}`
- [ ] Minimalistyczny styling, nie przytłacza UI

**Wartość email:** do ustalenia, prawdopodobnie `jakub.bone1990@gmail.com`
(lub osobny email "kontakt RODO"). Zaszyty w kodzie / przez env var.

---

### Etap 8 — Klucze i18n

**Pliki:** `src/i18n/locales/pl/*.json`, `src/i18n/locales/en/*.json`

- [ ] Klucze do dodania (grupować semantycznie):
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

- [ ] `npm run build` zielony

---

### Etap 9 — Testy

**Testy do dodania / aktualizacji:**

- [ ] `PrivacyPolicy.test.tsx` — renderuje się przy `/privacy` bez logowania, zawiera oczekiwane sekcje
- [ ] `ConsentGate.test.tsx`:
  - User bez zgody → renderuje ekran zgody, nie renderuje `children`
  - Klik "Akceptuję" (checkbox + button) → woła `api.acceptConsent`
  - User ze zgodą → renderuje `children`
- [ ] `Settings.test.tsx`:
  - Przycisk "Usuń konto" otwiera modal
  - Niepoprawny input → button `Usuń` disabled
  - Poprawny input + klik → woła `api.deleteAccount` → redirect na `/login`
- [ ] `npm run test:run` zielony

**Istniejące testy:** mocki `api.fetchMe()` muszą zwracać obiekt z polem `privacyPolicyAcceptedAt` (null lub data) — zależnie od testu. Przegląd i aktualizacja.

---

## Definicja ukończenia (DoD)

- [ ] `/privacy` dostępne publicznie, wyświetla politykę w języku użytkownika
- [ ] Nowy user po loginie widzi ekran zgody, nie dostaje się do głównej appki
- [ ] Po kliknięciu "Akceptuję" user od razu widzi normalną appkę
- [ ] Istnieje ekran ustawień z sekcją "Konto" i przyciskiem "Usuń konto"
- [ ] Usunięcie konta wymaga wpisania słowa potwierdzającego, działa end-to-end
- [ ] Stopka widoczna na wszystkich stronach (w tym na ekranie zgody), zawiera link do polityki i email kontaktowy
- [ ] `npm run build` zielony
- [ ] `npm run test:run` — 0 failed
- [ ] Weryfikacja manualna: nowy user → login → consent screen → akceptacja → appka → ustawienia → usuń konto → login

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

*Ostatnia aktualizacja: 2026-04-22*
