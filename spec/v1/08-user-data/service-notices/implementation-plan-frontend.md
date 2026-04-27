# Service Notices — Plan implementacji frontend

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

Wyświetlać aktywne powiadomienia serwisowe dla zalogowanego usera:
- `BANNER` — pasek na górze appki, można zamknąć
- `MODAL` — popup przy wejściu, wymaga "OK", nie wraca po zamknięciu
  (zapamiętane w `localStorage`)

---

## Architektura

```
DashboardPage montuje się
        ↓
useServiceNotices() — React Query, GET /api/system/notices/active
        ↓
notices.filter(type === BANNER) → <ServiceBanner />
notices.filter(type === MODAL)  → <ServiceModal />

ServiceBanner:
  sticky top, zamykany przez X
  stan zamknięcia: useState (wraca po odświeżeniu, bo rzadki komunikat)

ServiceModal:
  wyświetla się jeśli noticeId NIE jest w localStorage "dismissed_notices"
  po "OK": dodaje id do localStorage, nie wraca
```

---

## Status realizacji

### Etap 1 — Typ i funkcja API

**Plik:** `src/types/domain.ts` (lub odpowiednik z typami)

- [ ] Dodać typ:

```ts
export interface ServiceNotice {
  id: number;
  type: 'BANNER' | 'MODAL';
  messagePl: string;
  messageEn: string;
  expiresAt: string | null;
}
```

**Plik:** `src/services/api.ts`

- [ ] Dodać funkcję:

```ts
export async function fetchActiveNotices(): Promise<ServiceNotice[]> {
  const response = await apiFetch('/api/system/notices/active');
  if (!response.ok) return []; // nie blokuj appki jeśli endpoint nie działa
  return response.json();
}
```

Błędy z tego endpointu nie powinny blokować appki — `return []` zamiast rzucania
wyjątku.

- [ ] `npm run build` zielony

---

### Etap 2 — Hook `useServiceNotices`

**Nowy plik:** `src/hooks/useServiceNotices.ts`

```ts
export function useServiceNotices() {
  return useQuery({
    queryKey: ['service-notices'],
    queryFn: fetchActiveNotices,
    staleTime: 5 * 60 * 1000, // 5 minut — nie odpytuj przy każdym kliknięciu
  });
}
```

- [ ] `npm run build` zielony

---

### Etap 3 — Komponent `ServiceBanner`

**Nowy plik:** `src/components/notices/ServiceBanner.tsx`

```tsx
interface Props {
  notice: ServiceNotice;
}

export function ServiceBanner({ notice }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const { i18n } = useTranslation();

  if (dismissed) return null;

  const message = i18n.language === 'pl' ? notice.messagePl : notice.messageEn;

  return (
    <div className="service-banner">
      <span>{message}</span>
      <button onClick={() => setDismissed(true)} aria-label="Zamknij">×</button>
    </div>
  );
}
```

Stan `dismissed` w `useState` — banner wraca po odświeżeniu strony.
To celowe: powiadomienia serwisowe są ważne i rzadkie.

**Stylowanie:**
- Sticky na górze contentu (poniżej głównego headera appki)
- Tło odróżniające się od reszty UI (np. żółte / niebieskie info)
- Pełna szerokość, padding, przycisk zamknięcia po prawej
- Użyć istniejących zmiennych CSS z projektu

- [ ] `npm run build` zielony

---

### Etap 4 — Komponent `ServiceModal`

**Nowy plik:** `src/components/notices/ServiceModal.tsx`

```tsx
const DISMISSED_KEY = 'dismissed_notices';

function getDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function dismiss(id: number): void {
  const current = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]));
}

interface Props {
  notice: ServiceNotice;
}

export function ServiceModal({ notice }: Props) {
  const [visible, setVisible] = useState(() => !getDismissed().includes(notice.id));
  const { i18n, t } = useTranslation();

  if (!visible) return null;

  const message = i18n.language === 'pl' ? notice.messagePl : notice.messageEn;

  function handleOk() {
    dismiss(notice.id);
    setVisible(false);
  }

  return (
    <div className="service-modal-overlay">
      <div className="service-modal">
        <p>{message}</p>
        <button onClick={handleOk}>{t('notices.ok')}</button>
      </div>
    </div>
  );
}
```

Po kliknięciu "OK": `id` notice zapisywany w `localStorage`.
Przy kolejnym wejściu: modal się nie pojawi dla tego `id`.

**Stylowanie:**
- Pełnoekranowy overlay (analogiczny do istniejących modali w projekcie)
- Wycentrowane okienko z treścią i przyciskiem OK
- Użyć istniejących klas CSS modali

- [ ] `npm run build` zielony

---

### Etap 5 — Integracja w `DashboardPage`

**Plik:** `src/pages/DashboardPage.tsx` (lub `AppContent.tsx` — sprawdzić
gdzie w projekcie montowany jest główny layout po zalogowaniu)

- [ ] Zaimportować hook i komponenty:

```tsx
const { data: notices = [] } = useServiceNotices();

const banners = notices.filter(n => n.type === 'BANNER');
const modals  = notices.filter(n => n.type === 'MODAL');
```

- [ ] Wyrenderować pod headerem:

```tsx
{banners.map(n => <ServiceBanner key={n.id} notice={n} />)}
{modals.map(n  => <ServiceModal  key={n.id} notice={n} />)}
```

- [ ] `npm run build` zielony

---

### Etap 6 — Klucze i18n

**Pliki:** `src/i18n/locales/pl/common.json`, `src/i18n/locales/en/common.json`

- [ ] Dodać (PL):

```json
"notices": {
  "ok": "OK, rozumiem"
}
```

- [ ] Dodać (EN):

```json
"notices": {
  "ok": "OK, got it"
}
```

- [ ] `npm run build` zielony

---

### Etap 7 — Testy

**Nowy plik:** `src/test/components/ServiceBanner.test.tsx`

- [ ] Test: banner renderuje wiadomość w aktualnym języku (PL)
- [ ] Test: banner renderuje wiadomość w aktualnym języku (EN)
- [ ] Test: kliknięcie "×" ukrywa banner
- [ ] Test: banner widoczny ponownie po remount (stan w useState, nie localStorage)

**Nowy plik:** `src/test/components/ServiceModal.test.tsx`

- [ ] Test: modal renderuje wiadomość w aktualnym języku
- [ ] Test: kliknięcie "OK" ukrywa modal
- [ ] Test: modal nie pojawia się jeśli `id` jest już w localStorage
- [ ] Test: po kliknięciu "OK" `id` trafia do localStorage

- [ ] `npm run test:run` — wszystkie testy zielone

---

### Etap 8 — Weryfikacja manualna

```
1. Backend: utwórz notice przez curl:
   curl -X POST http://localhost:8080/api/admin/notices \
     -H "X-Admin-Key: <twój-klucz>" \
     -H "Content-Type: application/json" \
     -d '{"type":"BANNER","messagePl":"Test komunikat PL","messageEn":"Test message EN","expiresAt":null}'

2. npm run dev, zaloguj się

3. Sprawdź czy BANNER pojawia się na górze appki
4. Kliknij × — banner znika
5. Odśwież stronę — banner wraca (stan w useState, nie localStorage)

6. Utwórz notice MODAL analogicznie
7. Wejdź na /dashboard — modal pojawia się
8. Kliknij "OK" — znika
9. Odśwież stronę — modal nie wraca (id w localStorage)
10. Otwórz DevTools → Application → Local Storage → sprawdź "dismissed_notices"
```

---

## Definicja ukończenia (DoD)

- [ ] Aktywny `BANNER` widoczny dla zalogowanego usera na górze UI
- [ ] Kliknięcie "×" zamyka banner (wraca po odświeżeniu)
- [ ] Aktywny `MODAL` pojawia się przy wejściu
- [ ] Kliknięcie "OK" zamyka modal i nie wraca w tej przeglądarce
- [ ] Wiadomość wyświetla się w języku appki (PL/EN)
- [ ] Błąd endpointu `/api/system/notices/active` nie blokuje appki
- [ ] `npm run build` zielony
- [ ] `npm run test:run` — 0 failed

---

## Poza zakresem

- **Animacje wejścia/wyjścia bannera i modala** — poza zakresem
- **Wiele modali jednocześnie** — jeśli będzie kilka aktywnych MODAL,
  wyświetlamy wszystkie; w praktyce będzie maksymalnie jeden
- **Resetowanie localStorage** — użytkownik może ręcznie wyczyścić
  `dismissed_notices` w DevTools jeśli chce zobaczyć modal ponownie

---

## Pliki do zmiany

| Plik | Zmiana |
|------|--------|
| `types/domain.ts` | Typ `ServiceNotice` |
| `services/api.ts` | `fetchActiveNotices()` |
| `hooks/useServiceNotices.ts` | **Nowy** — React Query hook |
| `components/notices/ServiceBanner.tsx` | **Nowy** — komponent bannera |
| `components/notices/ServiceModal.tsx` | **Nowy** — komponent modala |
| `pages/DashboardPage.tsx` | Integracja hooka + komponentów |
| `i18n/locales/pl/common.json` | Klucze `notices.*` |
| `i18n/locales/en/common.json` | Klucze `notices.*` |
| `test/components/ServiceBanner.test.tsx` | **Nowy** — 4 testy |
| `test/components/ServiceModal.test.tsx` | **Nowy** — 4 testy |
