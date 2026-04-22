# Plan implementacji CV link-only — EasyApply Frontend

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

W modalu "Dodaj CV" opcja **"Upload PDF" ma pozostać widoczna**, ale oznaczona
jako chwilowo nieczynna: karta zdisabled, cursor `not-allowed`, tooltip po
najechaniu "Chwilowo nieczynne". Kliknięcie nie prowadzi do ekranu uploadu.

Opcja **"Link do CV"** działa bez zmian. Istniejące CV typu FILE (jeśli
są w bazie) nadal wyświetlają się w liście, można je pobierać i usuwać.

---

## Decyzje projektowe

- **Kod kroku `addStep === 'file'` zostaje** — nie usuwamy logiki ani JSX
  uploadu. Jedyna zmiana: blokujemy wejście w ten krok z ekranu wyboru.
- **Disabled karta opcji, nie hidden** — ficzer jest widoczny w portfolio
  (pokazuje zaimplementowany upload), ale nieklikalny.
- **Tooltip przez natywny atrybut `title`** — bez biblioteki tooltipów, żeby
  nie wprowadzać nowej zależności dla drobiazgu.
- **Mutacja `useUploadCV` zostaje w kodzie** — nie usuwamy, bo backend jej
  nie wywoła (endpoint 503). Unused import zostałby flaggowany, więc trzeba
  zdecydować per-przypadek (patrz Etap 3).

---

## Status realizacji

### Etap 1 — Disabled karty "Upload PDF" w modalu dodawania

**Plik:** `easyapply-frontend/src/components/cv/CVManager.tsx`

Obecnie karta (linia 406):
```tsx
<div className="add-cv-option" onClick={() => setAddStep('file')}>
```

- [ ] Dodać atrybut `data-disabled="true"` oraz klasę CSS `add-cv-option--disabled`
- [ ] Usunąć `onClick` (lub podmienić na no-op)
- [ ] Dodać `title={t('cv.uploadDisabledTooltip')}` — natywny tooltip HTML
- [ ] Opcjonalnie: pokazać ikonkę 🔒 zamiast 📁 dla jasnego sygnału wizualnego
- [ ] `npm run build` zielony

**Schemat po zmianie:**

```tsx
<div
  className="add-cv-option add-cv-option--disabled"
  data-disabled="true"
  title={t('cv.uploadDisabledTooltip')}
  aria-disabled="true"
>
  <div className="option-icon">📁</div>
  <div className="option-content">
    <h4>{t('cv.uploadOptionTitle')}</h4>
    <p>{t('cv.uploadOptionDesc')}</p>
    {/* features list bez zmian */}
  </div>
</div>
```

---

### Etap 2 — Style CSS dla stanu disabled

**Plik:** `easyapply-frontend/src/components/cv/CVManager.css` (lub odpowiedni plik stylu — do zweryfikowania)

- [ ] Zlokalizować plik stylu dla `.add-cv-option`
- [ ] Dodać regułę `.add-cv-option--disabled`:
  - `opacity: 0.5`
  - `cursor: not-allowed`
  - `pointer-events: auto` (zachować hover dla tooltipa, ale `onClick` jest usunięty)
  - Dla `:hover` — nie zmieniać `background`/`transform` (wyłączyć efekty hover)

**Schemat:**

```css
.add-cv-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-cv-option--disabled:hover {
  /* wyzerować efekty hover ze zwykłej karty */
  transform: none;
  background: inherit;
}
```

---

### Etap 3 — Klucze i18n dla tooltipa

**Pliki:** `src/i18n/locales/pl/*.json`, `src/i18n/locales/en/*.json`

- [ ] Zlokalizować plik gdzie są klucze `cv.*` (pewnie `cv.json` lub `common.json`)
- [ ] Dodać klucz `cv.uploadDisabledTooltip`:
  - PL: `"Chwilowo nieczynne"`
  - EN: `"Temporarily unavailable"`
- [ ] `npm run build` zielony (TypeScript nie narzeka na brakujący klucz)

---

### Etap 4 — Obsługa błędu 503 z backendu (defensywna)

**Plik:** `easyapply-frontend/src/hooks/useCV.ts` lub `src/services/api.ts`

Scenariusz: ktoś obejdzie UI (np. DevTools) i wywoła `uploadCV` ręcznie →
backend zwróci 503. Mimo że nasz UI już tego nie inicjuje, mutacja jest
nadal dostępna w kodzie.

- [ ] Zweryfikować jak obecnie `useUploadCV` obsługuje błędy (istniejący `onError` w `CVManager.tsx` linia 87: `alert(tErrors('cv.uploadError'))`)
- [ ] Dodać klucz błędu `errors.cv.uploadDisabled` w obu plikach i18n (PL/EN) —
      taki sam komunikat co backend zwraca
- [ ] **Decyzja do ustalenia w trakcie**: czy rozpoznawać 503 specjalnie
      (np. inny alert), czy zostawić generyczny `cv.uploadError`. Rekomendacja:
      zostawić generyczny — jest to ścieżka edge case'owa, nie warto
      komplikować kodu.

---

### Etap 5 — Aktualizacja testów

**Plik:** `easyapply-frontend/src/test/**` (lokalizacja testu CVManager do zweryfikowania)

- [ ] Znaleźć test weryfikujący flow "click Upload PDF → idź do kroku file"
- [ ] Zmienić: po kliknięciu karty "Upload PDF" ekran `file` **nie pojawia się**
      (pozostajemy na ekranie wyboru)
- [ ] Dodać asercję: karta ma atrybut `aria-disabled="true"`
- [ ] Dodać asercję: `title` karty równe wartości klucza `cv.uploadDisabledTooltip`
- [ ] Sprawdzić czy jest test flow dodawania CV typu LINK — zostawić bez zmian
- [ ] `npm run test:run` zielony

---

## Definicja ukończenia (DoD)

- [ ] Karta "Upload PDF" widoczna w modalu, ale wizualnie zdisabled (opacity, not-allowed cursor)
- [ ] Najechanie myszą pokazuje tooltip "Chwilowo nieczynne" / "Temporarily unavailable"
- [ ] Kliknięcie karty nie otwiera ekranu uploadu
- [ ] Dodawanie CV jako LINK działa jak dotychczas
- [ ] Istniejące CV typu FILE są widoczne w liście i można je pobrać / usunąć
- [ ] `npm run build` bez błędów TypeScript
- [ ] `npm run test:run` — 0 failed tests
- [ ] Weryfikacja manualna: full flow dodawania CV przez link działa end-to-end z backendem

---

## Poza zakresem

- **Usuwanie JSX kroku `addStep === 'file'` (dropzone, upload area)** — zostaje
  na wypadek przywrócenia ficzera
- **Usuwanie `useUploadCV` hooka i funkcji `uploadCV` z `api.ts`** — zostaje
  jako martwy kod ficzera
- **Custom tooltip component** — używamy natywnego `title`, wystarczy
- **Ukrywanie istniejących CV typu FILE z listy** — zostają widoczne
- **Informacja "przenieś swoje CV na Drive"** — opcjonalne, do rozważenia
  w fazie `rodo-minimum/` (komunikat w polityce prywatności)

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `components/cv/CVManager.tsx` | Karta upload disabled + tooltip, usunięcie `onClick` |
| `components/cv/CVManager.css` (lub odpowiedni) | Reguła `.add-cv-option--disabled` |
| `i18n/locales/pl/*.json` | Klucz `cv.uploadDisabledTooltip` |
| `i18n/locales/en/*.json` | Klucz `cv.uploadDisabledTooltip` |
| `test/**/CVManager.test.tsx` | Asercja na `aria-disabled` i brak navigacji do kroku file |

---

## Diagram przepływu po zmianach

```
User klika "Dodaj CV"
       ↓
Modal z dwoma opcjami:
  ┌─────────────────┐   ┌─────────────────┐
  │ Upload PDF      │   │ Dodaj link      │
  │ (disabled)      │   │ (aktywne)       │
  │ tooltip:        │   │                 │
  │ "Chwilowo..."   │   │                 │
  └────┬────────────┘   └────┬────────────┘
       │ click: no-op        │ click: setAddStep('link')
       ↓                     ↓
  (nic się nie dzieje)     Ekran wklejenia linku
                              ↓
                           POST /api/cv (type: LINK)
                              ↓
                           CV dodane, modal zamknięty
```

---

*Ostatnia aktualizacja: 2026-04-22*
