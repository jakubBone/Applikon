# Data Export — Plan implementacji frontend

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

Dodać przycisk "Pobierz moje dane" w `/settings`, który pobiera plik
`easyapply-export.json` z backendu. Realizuje wymóg RODO Art. 20.

---

## Status realizacji

### Etap 1 — Funkcja API `exportMyData`

**Plik:** `src/services/api.ts` (lub plik z wywołaniami auth API w projekcie)

- [x] Sprawdzić jak w projekcie przekazywany jest token autoryzacyjny do `fetch`
  (interceptor, wrapper, headers wprost) — dostosować do istniejącego wzorca
- [x] Dodać funkcję `exportMyData`:

```ts
export async function exportMyData(): Promise<void> {
  const response = await apiFetch('/api/auth/me/export'); // apiFetch = istniejący wrapper z tokenem

  if (!response.ok) {
    throw new Error(`Export failed: ${response.status}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'easyapply-export.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [x] `npm run build` zielony

---

### Etap 2 — Sekcja eksportu w `Settings.tsx`

**Plik:** `src/pages/Settings.tsx`

- [x] Dodać stan lokalny:

```ts
const [exporting, setExporting] = useState(false);
const [exportError, setExportError] = useState(false);
```

- [x] Dodać handler:

```ts
async function handleExport() {
  setExporting(true);
  setExportError(false);
  try {
    await exportMyData();
  } catch {
    setExportError(true);
  } finally {
    setExporting(false);
  }
}
```

- [x] Dodać sekcję w JSX (przed sekcją "Usuń konto"):

```tsx
<section>
  <h2>{t('settings.exportTitle')}</h2>
  <p>{t('settings.exportDescription')}</p>
  <button onClick={handleExport} disabled={exporting}>
    {exporting ? t('settings.exporting') : t('settings.exportButton')}
  </button>
  {exportError && <p className="error">{t('settings.exportError')}</p>}
</section>
```

Użyć istniejących klas CSS / komponentów Button z projektu.

- [x] `npm run build` zielony

---

### Etap 3 — Klucze i18n

**Pliki:** `src/i18n/locales/pl/common.json`, `src/i18n/locales/en/common.json`

- [x] Sprawdzić strukturę istniejących kluczy `settings.*` i dopasować poziom zagnieżdżenia
- [x] Dodać klucze (PL):

```json
"settings": {
  "exportTitle": "Twoje dane",
  "exportDescription": "Pobierz wszystkie swoje dane zapisane w EasyApply.",
  "exportButton": "Pobierz moje dane",
  "exporting": "Przygotowuję...",
  "exportError": "Coś poszło nie tak. Spróbuj ponownie."
}
```

- [x] Dodać klucze (EN):

```json
"settings": {
  "exportTitle": "Your data",
  "exportDescription": "Download all your data stored in EasyApply.",
  "exportButton": "Download my data",
  "exporting": "Preparing...",
  "exportError": "Something went wrong. Try again."
}
```

- [x] `npm run build` zielony

---

### Etap 4 — Testy

**Plik:** `src/test/pages/Settings.test.tsx` (lub odpowiednik w projekcie)

- [x] Test: sekcja eksportu renderuje się w `/settings`
- [x] Test: kliknięcie przycisku wywołuje `exportMyData()`
- [x] Test: podczas pobierania przycisk jest `disabled` z tekstem "Przygotowuję..."
- [x] Test: gdy `exportMyData()` rzuca błąd — widoczny komunikat błędu
- [x] Test: gdy `exportMyData()` się powiedzie — brak komunikatu błędu
- [x] `npm run test:run` — wszystkie testy zielone

---

### Etap 5 — Weryfikacja manualna

```
1. npm run dev
2. Zaloguj się
3. Przejdź do /settings
4. Sprawdź czy sekcja "Twoje dane" / "Your data" jest widoczna
5. Kliknij "Pobierz moje dane"
6. Sprawdź czy plik easyapply-export.json pojawił się w folderze Downloads
7. Otwórz plik — sprawdź czy zawiera twoje aplikacje i notatki
8. Sprawdź czy przycisk był disabled podczas pobierania (trudne do zauważenia
   przy szybkim połączeniu — można sprawdzić w DevTools → Network → Throttle)
```

---

## Definicja ukończenia (DoD)

- [x] Przycisk "Pobierz moje dane" widoczny w `/settings`
- [x] Kliknięcie pobiera plik `easyapply-export.json`
- [x] Podczas pobierania przycisk jest `disabled`
- [x] Przy błędzie pojawia się komunikat
- [x] Tłumaczenia działają w PL i EN
- [x] `npm run build` zielony
- [x] `npm run test:run` — 0 failed

---

## Poza zakresem

- **Podgląd danych w UI** — tylko pobranie pliku, bez wyświetlania danych w appce
- **Eksport do CSV** — tylko JSON

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `services/api.ts` | Nowa funkcja `exportMyData()` |
| `pages/Settings.tsx` | Nowa sekcja z przyciskiem eksportu |
| `i18n/locales/pl/common.json` | Klucze `settings.export*` |
| `i18n/locales/en/common.json` | Klucze `settings.export*` |
| `test/pages/Settings.test.tsx` | 5 nowych testów |
