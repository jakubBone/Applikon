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

- [x] Dodać atrybut `aria-disabled="true"` oraz klasę CSS `add-cv-option--disabled` (pominięto `data-disabled` — `aria-disabled` wystarcza semantycznie i jest czytane przez screen readery)
- [x] Usunąć `onClick` (usunięte, brak no-op)
- [x] Dodać `title={t('cv.uploadDisabledTooltip')}` — natywny tooltip HTML
- [x] Pokazać ikonkę 🔒 zamiast 📁 dla jasnego sygnału wizualnego
- [x] `npm run build` zielony

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

- [x] Zlokalizować plik stylu dla `.add-cv-option` (znaleziony: `components/cv/CVManager.css`)
- [x] Dodać regułę `.add-cv-option--disabled`:
  - `opacity: 0.5`
  - `cursor: not-allowed`
  - `:hover` wyzerowany (border i background bez zmian)

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

- [x] Zlokalizować plik gdzie są klucze `cv.*` (`i18n/locales/{pl,en}/common.json`)
- [x] Dodać klucz `cv.uploadDisabledTooltip`:
  - PL: `"Chwilowo niedostępne"` (edytowane przez użytkownika)
  - EN: `"Temporarily unavailable"`
- [x] `npm run build` zielony

---

### Etap 4 — Obsługa błędu 503 z backendu (defensywna) — POMINIĘTE

Zgodnie z decyzją w planie: polegamy na `ConsentGate` / disabled UI. Endpoint
503 nie jest osiągalny przez normalny flow userski, więc dedykowana obsługa
nie jest potrzebna. Istniejący `onError: alert(tErrors('cv.uploadError'))`
w `CVManager.tsx:87` pokryje każde teoretyczne wywołanie spoza UI.



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

### Etap 5 — Aktualizacja testów — N/A

**Brak pliku `CVManager.test.tsx`** w projekcie (weryfikacja: `src/test/components/`
zawiera tylko `App.test.tsx` i `BadgeWidget.test.tsx`). `api.test.ts` testuje
funkcję `uploadCV` (mock fetch) — nie zmienia się, bo sygnatura funkcji jest
ta sama, a backend behavior jest mockowany.

- [x] Wynik `npm run test:run`: **68/68 zielone** (bez regresji)

---

## Definicja ukończenia (DoD)

- [x] Karta "Upload PDF" widoczna w modalu, ale wizualnie zdisabled (opacity, not-allowed cursor)
- [x] Najechanie myszą pokazuje tooltip "Chwilowo niedostępne" / "Temporarily unavailable"
- [x] Kliknięcie karty nie otwiera ekranu uploadu (brak `onClick`)
- [x] Dodawanie CV jako LINK działa jak dotychczas (brak zmian w tej ścieżce)
- [x] Istniejące CV typu FILE są widoczne w liście i można je pobrać / usunąć (brak zmian)
- [x] `npm run build` bez błędów TypeScript
- [x] `npm run test:run` — 68/68, 0 failed
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
