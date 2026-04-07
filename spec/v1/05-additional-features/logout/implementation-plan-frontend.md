# Plan implementacji logout — EasyApply Frontend

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

### Etap 1 — Podpięcie backendu do `signOut()`

**Problem:** `AuthProvider.signOut()` tylko czyści localStorage i resetuje stan Reacta.
Nie wywołuje `POST /api/auth/logout`, przez co refresh token zostaje w bazie danych.

**Plik:** `src/auth/AuthProvider.tsx`

- [x] Zaimportować `logout` z `../services/api`
- [x] Zmienić `signOut` na funkcję `async`, która wywołuje `await logout()` przed `clearToken()` + `setUser(null)`
- [x] Obsłużyć błąd (np. brak sieci): mimo błędu backendu wyczyścić token lokalnie i wylogować usera
- [x] `npm run test:run` zielony

**Schemat po zmianie:**

```ts
const signOut = async () => {
  try {
    await logout()
  } catch {
    // Backend unreachable — log out locally anyway
  }
  clearToken()
  setUser(null)
}
```

> `api.ts` już eksportuje `logout()` (linia 63) — nie trzeba pisać nowej funkcji.

---

### Etap 2 — Klucze i18n dla przycisku wylogowania

**Pliki:** `src/i18n/locales/pl/common.json`, `src/i18n/locales/en/common.json`

- [x] Dodać klucz `auth.logout` w obu plikach JSON
- [x] `npm run build` zielony (TypeScript nie narzeka na nieznany klucz)

**Klucze:**

```json
// pl/common.json
"auth": {
  "logout": "Wyloguj"
}

// en/common.json
"auth": {
  "logout": "Log out"
}
```

> Jeśli sekcja `auth` już istnieje w plikach JSON — dopisać tylko klucz `logout` do istniejącego obiektu.

---

### Etap 3 — Przycisk wylogowania w headerze

**Plik:** `src/AppContent.tsx`

- [x] Zaimportować `useAuth` z `./auth/AuthProvider`
- [x] Pobrać `signOut` i `user` z `useAuth()`
- [x] Dodać przycisk `Wyloguj` w `.header-right` (obok `LanguageSwitcher` i `BadgeWidget`)
- [x] Przycisk wywołuje `signOut()` po kliknięciu
- [x] Przycisk używa klucza `t('auth.logout')`
- [x] Dodać atrybut `data-cy="logout-btn"` do przycisku
- [x] `npm run build` zielony
- [ ] Weryfikacja manualna: przycisk widoczny w headerze, kliknięcie wylogowuje i przekierowuje na login

**Schemat w JSX:**

```tsx
// header-right
<LanguageSwitcher />
<BadgeWidget />
<button
  data-cy="logout-btn"
  className="logout-btn"
  onClick={() => void signOut()}
>
  {t('auth.logout')}
</button>
```

> `void signOut()` — `signOut` jest teraz `async`, `onClick` nie przyjmuje Promise, `void` tłumi warning TypeScripta.

---

### Etap 4 — Aktualizacja testów

**Plik:** `src/test/auth/AuthProvider.test.tsx`

Obecny test `signOut` (linia 83) sprawdza tylko `clearToken`. Po Etapie 1 `signOut` wywołuje też `api.logout`.

- [x] Dodać `logout: vi.fn()` do mocka `vi.mock('../../services/api', ...)`
- [x] Zaktualizować test `'signOut — clears token and resets user state to null'`:
  - `vi.mocked(api.logout).mockResolvedValue(undefined)` (happy path)
  - `expect(api.logout).toHaveBeenCalledOnce()`
  - `expect(api.clearToken).toHaveBeenCalled()` (jak dotychczas)
- [x] Dodać test dla przypadku błędu backendu:
  - `vi.mocked(api.logout).mockRejectedValue(new Error('network error'))`
  - Po kliknięciu `signOut` user nadal zostaje wylogowany (`isAuthenticated: false`)
  - `clearToken` nadal został wywołany
- [x] Zmienić tekst przycisku w teście z `'Wyloguj'` na `'auth.logout'` (klucz i18n) lub użyć `data-testid`
- [x] `npm run test:run` zielony

---

## Definicja ukończenia (DoD)

- [x] `POST /api/auth/logout` jest wywoływany przy każdym wylogowaniu
- [x] Mimo błędu sieciowego user zostaje wylogowany lokalnie
- [x] Przycisk widoczny w headerze po zalogowaniu
- [x] Klucze i18n działają w PL i EN
- [x] `npm run build` bez błędów TypeScript
- [x] `npm run test:run` — 0 failed tests
- [ ] Weryfikacja manualna: kliknięcie przycisku wylogowuje i pokazuje stronę logowania

---

## Diagram przepływu

```
User klika "Log out"
       ↓
signOut() (AuthProvider)
       ↓
await api.logout()  →  POST /api/auth/logout  →  204
   (lub błąd — ignorowany)
       ↓
clearToken()           (localStorage)
       ↓
setUser(null)          (React state)
       ↓
ProtectedRoute wykrywa brak usera → redirect do /login
```

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `src/auth/AuthProvider.tsx` | `signOut` wywołuje backend przed wyczyszczeniem stanu |
| `src/i18n/locales/pl/common.json` | Klucz `auth.logout` |
| `src/i18n/locales/en/common.json` | Klucz `auth.logout` |
| `src/AppContent.tsx` | Przycisk wylogowania w headerze |
| `src/test/auth/AuthProvider.test.tsx` | Mock `api.logout`, nowe asercje |

---

*Ostatnia aktualizacja: 2026-04-07*
