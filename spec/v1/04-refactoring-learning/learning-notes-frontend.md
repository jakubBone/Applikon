# Notatki z nauki frontendu — EasyApply

Plik do wracania. Każdy etap = kluczowe pojęcia, analogie do Javy, ważne pliki.

---

## Etap 1 — Ekosystem i narzędzia

### Narzędzia — analogie do Javy

| Frontend | Java | Co robi |
|----------|------|---------|
| Node.js | JDK | Środowisko uruchomieniowe — bez niego nic nie działa |
| npm | Maven | Pobiera zależności do `node_modules/`, uruchamia skrypty |
| package.json | pom.xml | Lista zależności + konfiguracja projektu |
| node_modules/ | `~/.m2/repository` | Folder z pobranymi bibliotekami |
| Vite | Maven + Spring DevTools | Kompiluje kod i odpala serwer deweloperski |
| TypeScript | Java | Język z typowaniem statycznym |
| JavaScript | Bytecode JVM | To co faktycznie rozumie przeglądarka |

### Porty — zapamiętaj

```
localhost:5432   →  PostgreSQL (baza danych)
localhost:5173   →  Vite (frontend, dev server)
localhost:8080   →  Spring Boot (backend)
```

### Jak działa Vite

Vite działa **na Twoim komputerze deweloperskim** (nie na serwerze produkcyjnym):
- kompiluje TypeScript + JSX → JavaScript
- odpala serwer HTTP na `localhost:5173`
- przeglądarka pyta ten serwer o pliki JS i je uruchamia u siebie

Na produkcji Vite nie istnieje. `npm run build` generuje gotowe pliki JS do folderu `dist/`, które serwuje Nginx.

### JSX

JSX to nie osobny język — to **rozszerzenie składni TypeScript**, tak jak adnotacje (`@RestController`, `@GetMapping`) są rozszerzeniem składni Javy. Bez odpowiedniego procesora (w Javie: procesor adnotacji, w React: plugin `@vitejs/plugin-react`) kompilator nie wiedziałby co z tym zrobić.

JSX pozwala pisać HTML-podobny kod bezpośrednio w TypeScript:
```tsx
return <div>Cześć {name}</div>   // JSX — rozumie programista
```
Vite kompiluje to na czysty JavaScript:
```js
React.createElement("div", null, "Cześć " + name)  // JS — rozumie przeglądarka
```
**Przeglądarka nie rozumie JSX — rozumie tylko JS.**

### Rozszerzenia plików

| Rozszerzenie | Kiedy używać |
|---|---|
| `.ts` | Logika bez JSX — hooki, serwisy, typy (`api.ts`, `useApplications.ts`) |
| `.tsx` | Komponenty z JSX — wszystko co zwraca widok (`App.tsx`, `LoginPage.tsx`) |

### Przepływ od startu do UI

```
npm run dev
  → Vite startuje serwer na localhost:5173
  → Przeglądarka otwiera localhost:5173
  → Vite oddaje index.html
  → Przeglądarka widzi <script src="main.tsx">
  → Pobiera i uruchamia main.tsx
  → main.tsx znajduje <div id="root"> w index.html
  → React wypełnia ten div całą aplikacją
  → Widzisz UI na ekranie
```

**Co to `<div id="root">` i jak React go wypełnia:**

`div` to niewidoczny pojemnik HTML (jak `JPanel` w Swingu). Na początku jest pusty — to React go wypełnia.
React **nie jest zainstalowany w przeglądarce**. Jest w `node_modules/` i Vite pakuje go razem z Twoim kodem do JS.
`main.tsx` uruchamia: `createRoot(document.getElementById('root')).render(<App />)` — znajduje pusty div i wstrzykuje w niego całą aplikację.

**Jak działa zmiana ekranów (SPA) bez przeładowania strony:**

React trzyma w pamięci JS aktualny URL. Gdy klikasz zakładkę lub link:
1. React Router przechwytuje kliknięcie
2. Zmienia URL w pasku przeglądarki (bez zapytania do serwera)
3. React podmienia zawartość `<div id="root">` na inny komponent

Przeglądarka **nie wysyła** nowego `GET /dashboard`. To React steruje co widzisz.
Analogia: jedno okno `JFrame` (index.html) z podmienianymi panelami (`JPanel`) w środku.

### Kluczowe pliki projektu

**`easyapply-frontend/package.json`**
Odpowiednik `pom.xml`. Sekcja `scripts` = komendy (dev, build, test). Sekcja `dependencies` = biblioteki produkcyjne. Sekcja `devDependencies` = tylko na czas developmentu (Vite, TypeScript, testy).

**`easyapply-frontend/index.html`**
Jedyny plik HTML w całej aplikacji. Zawiera pusty `<div id="root">` — tu React wstrzyknie całą aplikację. Zawiera `<script src="main.tsx">` — to punkt startu.

**`easyapply-frontend/src/main.tsx`**
Odpowiednik `public static void main()`. Znajduje `<div id="root">` i odpala React (`createRoot().render()`). `StrictMode` = tryb debugowania (podwójne wywołania w dev, brak wpływu na produkcję).

**`easyapply-frontend/src/App.tsx`**
Korzeń aplikacji — tylko routing i Providerzy, zero logiki biznesowej. Wzorzec Provider = owijanie komponentów żeby udostępnić coś globalnie (jak `@Bean` w Springu). Szczegóły routingu w Etapie 6, Providerów w Etapach 5 i 6.

### Wzorzec Provider (zapowiedź)

```tsx
<QueryClientProvider>   ← udostępnia React Query globalnie
  <BrowserRouter>       ← udostępnia routing globalnie
    <AuthProvider>      ← udostępnia dane usera globalnie
      <App />
    </AuthProvider>
  </BrowserRouter>
</QueryClientProvider>
```
Każda warstwa "owija" i udostępnia coś wszystkim komponentom w środku.

---

## Etap 2 — Komponent — podstawowa jednostka

### Czym jest komponent

Komponent = funkcja TypeScript która zwraca JSX (opis UI).

```tsx
export function LoginPage() {   // ← funkcja = komponent
  return (                      // ← zwraca JSX
    <div className="login-page">
      ...
    </div>
  )
}
```

**Analogia do Javy:** klasa z metodą `render()` — ale zapisana jako funkcja, nie klasa.

### Plik .tsx — z czego się składa

```
importy                     ← jak import w Javie
stałe i funkcje pomocnicze  ← zwykły TypeScript
interfejsy/typy             ← opis kształtu danych (jak DTO)
komponenty                  ← funkcje zwracające JSX
```

`.tsx` vs `.ts` — jedyna różnica: w `.tsx` możesz pisać JSX. Konwencja: komponenty → `.tsx`, logika/hooki/typy → `.ts`.

### JSX

JSX to **rozszerzenie składni TypeScript** (nie osobny język). Vite kompiluje je na czysty JS:

```tsx
<div className="login-page">Cześć</div>   // JSX — piszesz Ty
React.createElement("div", { className: "login-page" }, "Cześć")  // JS — dostaje przeglądarka
```

**Ważne:** w HTML piszesz `class=`, w JSX piszesz `className=` (bo `class` to zarezerwowane słowo w JS).

**Klamry `{}` w JSX** = "tu jest kod TypeScript, nie tekst":
```tsx
<button onClick={handleGoogleLogin}>  ← {} = referencja do funkcji
```

### Props — dane wejściowe komponentu

Props = parametry funkcji komponentu. Analogia: konstruktor klasy w Javie.

```tsx
// Opis propsów (jak DTO w Javie)
interface BadgeRowProps {
  badge: BadgeInfo | null
  count: number
  type: 'rejection' | 'ghosting'
}

// Komponent przyjmujący propsy
function BadgeRow({ badge, count, type }: BadgeRowProps) {
  return <div>...</div>
}

// Użycie — przekazanie propsów
<BadgeRow badge={rejectionBadge} count={totalRejections} type="rejection" />
```

Komponent bez propsów (`LoginPage`) = pobiera dane sam z siebie (np. przez hooki).
Komponent z propsami (`BadgeRow`) = dostaje dane od rodzica.

### export — publiczny/prywatny

```tsx
function BadgeRow(...)         // bez export = prywatny (tylko w tym pliku)
export function BadgeWidget()  // z export = publiczny (można importować)
export default function App()  // default export = jeden główny eksport z pliku
```

Analogia: `public`/`private` w Javie.

### Import komponentów

```tsx
import { LoginPage } from './pages/LoginPage'   // jak import w Javie
```

Ścieżka bez rozszerzenia `.tsx` — TypeScript sam się domyśla.

### Zagnieżdżanie komponentów

Komponenty składają się jak matrioszka. Rodzic owija dzieci, przekazuje im propsy:

```tsx
<BadgeWidget>          ← rodzic
  <BadgeRow ... />     ← dziecko (używane 2x z różnymi propsami)
  <BadgeRow ... />
</BadgeWidget>
```

Cała aplikacja to jedno drzewo komponentów — korzeń w `App.tsx`:
```
App → AuthProvider → Routes → LoginPage / DashboardPage / ...
```

### Komponent — jak React go rozpoznaje

Komponentem jest funkcja która:
1. Zaczyna się **wielką literą** — obowiązkowe, React tego wymaga
2. Zwraca **JSX**

```tsx
function calculateProgress() { return 42 }    // zwykła funkcja — mała litera
function LoginPage() { return <div>...</div> } // komponent — wielka litera
```

`<div>` = znacznik HTML (mała litera). `<LoginPage>` = komponent React (wielka litera). React odróżnia je właśnie po tym.

### Routing i renderowanie

**Routing** = mapowanie URL → komponent. Gdy URL się zmienia, React Router decyduje co pokazać.
Analogia: `@GetMapping("/login")` w Spring MVC.

```tsx
<Route path="/login"     element={<LoginPage />} />   // /login → LoginPage
<Route path="/dashboard" element={<DashboardPage />} /> // /dashboard → DashboardPage
```

Import udostępnia komponent w pliku. Route decyduje kiedy go pokazać.

**Renderowanie** = React wywołuje funkcję komponentu → dostaje JSX → zamienia na HTML → wstawia do `<div id="root">`.
Rerenderowanie = React wywołuje funkcję ponownie gdy dane się zmieniły i aktualizuje tylko zmienione fragmenty. Szczegóły w Etapie 3.

### Props — szczegóły

Props to argumenty komponentu (słowo "props" = standard React, znaczy to samo).

```java
new BadgeRow(rejectionBadge, totalRejections, "rejection")  // Java — kolejność ważna
```
```tsx
<BadgeRow badge={rejectionBadge} count={totalRejections} type="rejection" />  // React — kolejność dowolna, nazwa ważna
```

### export default vs named export

```tsx
export function LoginPage() {}        // named export  → import { LoginPage } from '...'
export default function App() {}      // default export → import App from '...'
```

Jeden plik może mieć wiele named exportów, ale tylko jeden default.

### Kluczowe pliki

- `src/pages/LoginPage.tsx` — prosty komponent bez propsów
- `src/components/badges/BadgeWidget.tsx` — dwa komponenty w jednym pliku: `BadgeWidget` (publiczny) + `BadgeRow` (prywatny z propsami)
- `src/App.tsx` — korzeń aplikacji, routing + zagnieżdżanie komponentów

---

## Etap 3 — Stan (state) i rerenderowanie

### ✅ STATUS: ZROZUMIANY (Sesja 3 — 2026-03-13)

Jakub w pełni opanował `useState` i `useEffect`. Quiz 5/5 dla obu koncepcji. Pełny przepływ logowania w `AuthProvider.tsx` wyjaśniony i zrozumiany.

---

### `useState` — zmienna + setter + automatyczny re-render

**Super zdanie do zapamiętania:**
> `useState` = zmienna + setter + automatyczny re-render. Gdy wołasz `setSearchQuery()`, React wie że musi uruchomić całą funkcję komponentu od nowa.

#### Analogia do Javy

**W Javie (ręcznie):**
```java
private String searchQuery = "";

public void onSearchChange(String newText) {
  searchQuery = newText;  // ← zmieniasz pole
  repaint();              // ← TY pamiętasz zawsze dodać
}
```

**W React (automatycznie):**
```tsx
const [searchQuery, setSearchQuery] = useState('');

const handleSearch = (newText) => {
  setSearchQuery(newText);  // ← React automatycznie odrenderuje
}
```

**Różnica:** W Javie zmieniasz pole i musisz ręcznie wołać `repaint()`. W React `setState` robi `repaint()` za Ciebie automatycznie.

#### Jak to działa (przepływ)

1. Użytkownik pisze "Google" w polu wyszukiwania
2. Wołana jest funkcja: `setSearchQuery('Google')`
3. React zmienia wartość `searchQuery` wewnętrznie
4. React automatycznie odrenderowuje całą funkcję komponentu od nowa
5. `filteredApplications` (linia 107 w `ApplicationTable.tsx`) liczy się na nowo z `searchQuery = 'Google'`
6. Tablica pokazuje nowe wyniki
7. Całe bez ręcznego `repaint()`

#### Dlaczego `useState` a nie zwykła zmienna?

```tsx
// ❌ BYŁOBY ŹLE
let searchQuery = '';
const setSearchQuery = (newValue) => {
  searchQuery = newValue  // ← React nie wie że się coś zmieniło
  // UI się nie odrenderuje
}

// ✅ PRAWIDŁOWO
const [searchQuery, setSearchQuery] = useState('');
// React obserwuje tę zmienną i wie kiedy się zmienia
```

`useState` to **observable** — React nasłuchuje na zmiany i automatycznie odrenderowuje.

#### Niezależne stany

Każdy `useState` działa niezależnie:

```tsx
const [searchQuery, setSearchQuery] = useState('')        // stan 1
const [statusFilter, setStatusFilter] = useState('ALL')   // stan 2

// Gdy zmienisz statusFilter, searchQuery pozostaje niezmieniony
setStatusFilter('W_PROCESIE')  // ← zmieni się tylko statusFilter
// searchQuery zostaje takie jakie było
```

#### Praktyk z projektu: `ApplicationTable.tsx`

Linia 60:
```tsx
const [searchQuery, setSearchQuery] = useState('')
```

Linia 252 (gdy użytkownik pisze):
```tsx
<input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
```

Linie 107-114 (filtrowanie):
```tsx
const filteredApplications = applications.filter(app => {
  if (searchQuery) {  // ← używa searchQuery
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || ...
    if (!matchesSearch) return false
  }
  return true
})
```

---

### `useEffect` — kod który musi się wykonać "na starcie"

**Analogia do Javy:**
```java
@Component
public class AuthService {
  @PostConstruct  // ← wykonaj raz gdy bean się tworzy
  public void init() {
    System.out.println("Inicjalizuję AuthService");
  }
}
```

```tsx
function AuthProvider() {
  useEffect(() => {
    console.log("Inicjalizuję komponent");
  }, [])  // ← pusta tablica = wykonaj raz gdy komponent pojawia się
}
```

**`@PostConstruct` w Javie ≈ `useEffect(..., [])` w React'cie**

#### Tablica dependencji — trzy scenariusze

```tsx
// 1. useEffect(..., [])
// Uruchomi się raz, gdy komponent pojawi się na ekranie
useEffect(() => {
  console.log("Raz!")
}, [])

// 2. useEffect(...)
// Uruchomi się po KAŻDYM renderze — niebezpieczne!
useEffect(() => {
  console.log("Po każdym renderze!")
})

// 3. useEffect(..., [user])
// Uruchomi się gdy user zmieni się
useEffect(() => {
  console.log("user się zmienił!")
}, [user])
```

#### Problem: Nieskończona pętla

```tsx
// ❌ NIESKOŃCZONA PĘTLA
useEffect(() => {
  setUser({ name: 'Jan' })
}, [user])  // ← React patrzy na user

// Przepływ:
// 1. useEffect uruchamia się
// 2. setUser zmienia user
// 3. React widzi że user się zmienił (bo [user] w zależnościach)
// 4. useEffect uruchamia się znowu
// 5. setUser uruchamia się znowu
// 6. user zmienia się znowu...
// PĘTLA 💥
```

```tsx
// ✅ PRAWIDŁOWO — bez pętli
useEffect(() => {
  setUser({ name: 'Jan' })
}, [])  // ← [] mówi "nie patrzę na nic"

// Przepływ:
// 1. useEffect uruchamia się raz (bo [])
// 2. setUser zmienia user
// 3. React patrzy na [] — nie ma user w zależnościach
// 4. useEffect się nie uruchamia znowu
// 5. Bez pętli ✅
```

#### Praktyka z projektu: `AuthProvider.tsx` (linie 37-53)

```tsx
useEffect(() => {
  // KROK 1: Sprawdzamy token w localStorage
  const token = getToken()  // linijka 40

  if (!token) {  // linijki 41-43
    setIsLoading(false)    // "nie ma tokena, koniec czekania"
    return
  }

  // KROK 2: Jeśli token jest, pobieramy dane usera z API
  fetchCurrentUser()  // linijka 46
    .then(setUser)    // linijka 47: jeśli OK → setUser
    .catch(() => {
      clearToken()    // linijka 50: token nieważny
    })
    .finally(() => setIsLoading(false))  // linijka 52: koniec
}, [])  // ← uruchomi się raz, na starcie aplikacji
```

**Trzy scenariusze:**

1. **Token ważny:**
   ```
   getToken() → OK → fetchCurrentUser() → setUser(userData) → zalogowany ✅
   ```

2. **Brak tokena:**
   ```
   getToken() → null → setIsLoading(false), return → niezalogowany ❌
   ```

3. **Token wygasł (nieważny):**
   ```
   getToken() → OK → fetchCurrentUser() → błąd 401 → clearToken() → niezalogowany ❌
   ```

---

### Quiz — wyniki

| Pytanie | Odpowiedź Jakuba | Ocena |
|---------|---|---|
| Dlaczego `useState` zamiast zwykłej zmiennej? | React nasłuchuje na zmianę, zmiana poprzez `set`, rerenderuje wszystko | ✅ |
| Co robi `setSearchQuery`? | Ustawia wartość i renderuje | ✅ |
| Czym jest rerenderowanie? | React uruchamia całą funkcję komponentu od nowa | ✅ |
| Czy zmiana `statusFilter` zmienia `searchQuery`? | Nie, każdy `useState` jest niezależny | ✅ |
| Czy `value={searchQuery}` zawsze odzwierciedla stan? | Tak, pole wciąż słucha zmian w `searchQuery` | ✅ |
| Co oznacza `[]` w `useEffect`? | Tablica dependencji — uruchomi się raz na starcie | ✅ |
| Co by było bez `[]`? | Nieskończona pętla | ✅ |
| Co by było z `[user]` w auth? | Nieskończona pętla — `setUser` zmienia `user`, co uruchamia `useEffect` | ✅ |
| Dlaczego `[]` jest prawidłowe w `AuthProvider`? | `[]` mówi "nie patrzę na nic", więc `setUser` nie uruchamia `useEffect` znowu | ✅ |

**Podsumowanie:** Quiz 9/9 ✅ — pełne zrozumienie `useState` i `useEffect`

---

### Kluczowe pliki

- `src/components/applications/ApplicationTable.tsx` — praktyka `useState` (searchQuery, statusFilter, sortField)
- `src/auth/AuthProvider.tsx` — praktyka `useEffect` (sprawdzenie tokenu na starcie)
- `src/services/api.ts` — funkcje `getToken()`, `fetchCurrentUser()`, `clearToken()`

---

### Co Jakub powinien zapamiętać

1. **`useState` = zmienna + setter + automatyczny re-render** — najważniejsze zdanie
2. **Każdy `setState` powoduje re-render całej funkcji komponentu**
3. **Każdy `useState` jest niezależny** — zmiana jednego nie wpływa na drugie
4. **`useEffect` z `[]`** = uruchomi się raz na starcie (analogia: `@PostConstruct`)
5. **`useEffect` z `[user]`** = nieskończona pętla gdy wołasz `setUser` w środku
6. **`[]` chroni nas przed pętlami** — mówi React'owi "nie patrzę na te zmienne"

---

## Etap 4 — Hooki React

### ✅ STATUS: ZROZUMIANY (Sesja 4 — 2026-03-17)

Jakub opanował: czym są hooki, zasady hooków, cleanup w useEffect, własne hooki, hooki z konfiguracją. Quiz 4.5/5.

---

### Czym jest hook

**Hook = funkcja, która podpina Twój kod do mechanizmów Reacta.**

Nie "czeka na wydarzenie" (to event listener). Hook mówi: **"React, daj mi dostęp do [stanu / efektu / kontekstu]"**.

**Analogia:** `@Autowired` w Springu — prosisz framework o dostęp do czegoś, czym on zarządza.

| Spring (Java) | React (hook) | Co robi |
|---|---|---|
| `@Autowired` pole | `useContext(...)` | Pobiera zależność z kontekstu |
| `@PostConstruct` | `useEffect(..., [])` | Kod po inicjalizacji |
| pole klasy + setter | `useState(...)` | Stan z powiadamianiem |
| `@Cacheable` + serwis | `useQuery(...)` | Cache'owane pobieranie danych |

---

### Zasady hooków (Rules of Hooks)

**1. Tylko na najwyższym poziomie funkcji komponentu** — nigdy w `if`, pętli, zagnieżdżonej funkcji.
React trzyma hooki jako listę w stałej kolejności. Hook w `if` = liczba hooków zmienia się między renderami = React przypisuje wartości do złych hooków.

**2. Tylko w komponentach React lub w innych hookach** — nigdy w zwykłej funkcji.

**3. Prefiks `use`** — React + linter rozpoznają hooki po nazwie. Bez `use` linter nie stosuje reguł hooków.

---

### useEffect — cleanup (sprzątanie)

```tsx
useEffect(() => {
    const timer = setInterval(() => { ... }, 100)

    return () => {          // ← CLEANUP
        clearInterval(timer)
    }
}, [])
```

`return () => {...}` = **funkcja sprzątająca**. React wywołuje ją gdy komponent znika z ekranu.

| Spring | React | Kiedy |
|---|---|---|
| `@PostConstruct` | kod w `useEffect` | komponent się pojawia |
| `@PreDestroy` | `return () => {...}` | komponent znika |

---

### useEffect — wiele efektów

Komponent może mieć **wiele `useEffect`** — każdy odpowiada za inną rzecz. Zasada: **jeden `useEffect` = jedna odpowiedzialność** (jak wiele `@EventListener` w jednym beanie).

---

### Własne hooki = serwisy Springowe

**Własny hook = zwykła funkcja zaczynająca się od `use`, która w środku używa innych hooków.**

```tsx
// useNotes.ts ≈ NoteService.java
export function useNotes(applicationId: number) {
    return useQuery({ queryKey: ..., queryFn: ... })
}
```

| Spring | React | Rola |
|---|---|---|
| `@Service` klasa | własny hook (`useXxx`) | enkapsuluje logikę |
| `@Autowired` na polu | wywołanie innego hooka | pobiera zależność |
| metody publiczne | wartość zwracana | API dla konsumenta |

**Dlaczego?** Żeby nie kopiować logiki. Piszesz raz w hooku, używasz w wielu komponentach.

Hooki projektu:

| Hook | Odpowiednik Java | Co robi |
|---|---|---|
| `useApplications.ts` | `ApplicationService.java` | CRUD aplikacji |
| `useCV.ts` | `CVService.java` | CRUD CV |
| `useNotes.ts` | `NoteService.java` | CRUD notatek |
| `useBadgeStats.ts` | `StatisticsService.java` | statystyki odznak |

---

### Hooki z konfiguracją

**`staleTime`** — jak długo dane są "świeże" (nie odpytuj serwera ponownie):
- `useBadgeStats`: `staleTime: 60_000` — statystyki rzadko się zmieniają, cache 60s
- `useApplications`: brak `staleTime` — aplikacje zmieniają się często, zawsze świeże

**`enabled`** — warunkowe odpytywanie:
- `useCheckDuplicate`: `enabled: company.length > 0 && position.length > 0` — nie sprawdzaj duplikatów dopóki pola puste

---

### Zapowiedź CR-7

`CVManager.tsx` nie używa gotowego `useCVs()` — zamiast tego pisze `useState + useEffect + fetchCVs()` ręcznie. To jak kontroler który ignoruje serwis i idzie bezpośrednio do repozytorium. Problem: niespójność, duplikacja, brak cache. Naprawa w Etapie 5.

---

### Co Jakub powinien zapamiętać

1. **Hook = "React, daj mi dostęp do..."** — jak `@Autowired` w Springu
2. **Zasady hooków:** tylko na górze funkcji, tylko w komponentach/hookach, prefiks `use`
3. **Cleanup** = `return () => {...}` w `useEffect` = `@PreDestroy` w Springu
4. **Własny hook = serwis Springowy** — enkapsulacja logiki, reużywalność
5. **`staleTime`** = czas cache, **`enabled`** = warunkowe odpytywanie

---

## Etap 5 — React Query — serce frontendu

### ✅ STATUS: ZROZUMIANY (Sesja 5 — 2026-03-17)

CR-7 naprawiony. Quiz 2.5/5 — słabsze punkty do powtórzenia: `refetchOnWindowFocus`, uzasadnienie unieważniania wielu cache'ów.

---

### Problem bez React Query

Ręczne zarządzanie danymi z serwera wymaga:
- `useState` dla danych, loading, error
- `useEffect` do pobrania na starcie
- ręcznego `fetchCVs()` po każdej operacji
- ręcznej obsługi `try/catch`

To jak kontroler w Springu, który ignoruje serwis i idzie bezpośrednio do repozytorium.

### `useQuery` — pobieranie danych (≈ `@Cacheable`)

```tsx
// Zamiast 20 linii useState + useEffect + fetchCVs + try/catch:
const { data: cvList = [], isLoading, error } = useCVs()
```

React Query automatycznie:
1. Zarządza stanem `isLoading` / `error` / `data`
2. Cache'uje wyniki (nie odpytuje serwera za każdym razem)
3. Odświeża dane gdy wracasz na zakładkę (`refetchOnWindowFocus`)

| Spring | React Query | Co robi |
|---|---|---|
| `@Cacheable("applications")` | `useQuery({ queryKey: ['applications'], queryFn })` | Pobiera z cache lub serwera |
| wartość w `@Cacheable(...)` | `queryKey` | Nazwa/klucz cache |

### `useMutation` — operacje zapisu (≈ `@CacheEvict`)

```tsx
const uploadCVMutation = useUploadCV()

// Użycie:
uploadCVMutation.mutate(file, {
  onSuccess: (newCv) => { ... },   // po sukcesie
  onError: () => { ... },          // po błędzie
})

// Za darmo:
uploadCVMutation.isPending   // czy operacja trwa (zamiast useState(false))
```

Przepływ po mutacji:
1. `mutationFn` wysyła POST/PUT/DELETE do backendu
2. Backend przetwarza
3. `onSuccess` się odpala
4. `invalidateQueries` unieważnia cache
5. React Query sam pobiera dane od nowa
6. UI się odrenderowuje — **bez jednego `setState`**

### `invalidateQueries` — unieważnianie cache

```tsx
// Unieważnij jeden cache:
queryClient.invalidateQueries({ queryKey: ['cvs'] })

// Unieważnij wiele (gdy operacja wpływa na różne dane):
queryClient.invalidateQueries({ queryKey: ['cvs'] })
queryClient.invalidateQueries({ queryKey: ['applications'] })
// ^ bo usunięcie CV odpina je od aplikacji
```

**Zasada:** unieważniaj **wszystkie** cache'e których dotyczy operacja, nie tylko oczywisty.

### CR-7 — co zmieniliśmy

| Przed (ręcznie) | Po (React Query) |
|---|---|
| `useState<CV[]>([])` + `fetchCVs()` + `useEffect` | `useCVs()` |
| `useState(false)` dla `uploading` | `uploadCVMutation.isPending` |
| `await uploadCVAPI(file)` + `fetchCVs()` | `uploadCVMutation.mutate(file)` |
| `await createCV(...)` + `fetchCVs()` | `createCVMutation.mutate(...)` |
| `await deleteCVAPI(id)` + `fetchCVs()` | `deleteCVMutation.mutate(id)` |
| `await updateCV(...)` + `fetchCVs()` | `updateCVMutation.mutate(...)` |

### Kluczowe pliki

- `src/hooks/useCV.ts` — hooki React Query dla CV (useCVs, useUploadCV, useCreateCV, useUpdateCV, useDeleteCV)
- `src/hooks/useApplications.ts` — wzorcowy przykład useQuery + useMutation z invalidacją
- `src/components/cv/CVManager.tsx` — po naprawie CR-7 używa hooków zamiast ręcznego zarządzania

---

### Co Jakub powinien zapamiętać

1. **`useQuery`** = pobieranie danych z automatycznym cache (≈ `@Cacheable`)
2. **`useMutation`** = zapis + unieważnienie cache (≈ `@CacheEvict`)
3. **`queryKey`** = nazwa cache (jak wartość w `@Cacheable("applications")`)
4. **`invalidateQueries`** = unieważnij cache → React Query sam pobierze od nowa
5. **Bez `onSuccess` + `invalidateQueries`** użytkownik nie zobaczy zmian aż do odświeżenia
6. **Unieważniaj wszystkie powiązane cache'e** — nie tylko oczywisty

---

## Etap 6 — Routing i ochrona stron

### ✅ STATUS: ZROZUMIANY (Sesja 6 — 2026-03-17)

Jakub opanował: SPA i History API, Routes/Route, Navigate, Context API, ProtectedRoute, isLoading. Quiz SPA 5/5, Routes 4/5, Context 3/5, ProtectedRoute 2.5/5.

---

### SPA — nawigacja bez przeładowania

W klasycznej aplikacji (Spring MVC + Thymeleaf) każda zmiana URL = nowe zapytanie do serwera i nowy HTML.
W SPA (React) każda zmiana URL = React podmienia komponent w przeglądarce, serwer o niczym nie wie.

**Jak to działa:**
1. React Router **przechwytuje** kliknięcie linku (nie pozwala przeglądarce wysłać zapytania)
2. Zmienia URL w pasku przez **History API** (`window.history.pushState(...)`)
3. React podmienia komponent w `<div id="root">`

Jedyny moment, kiedy przeglądarka naprawdę pyta serwer — **pierwsze wejście** na stronę (dostaje `index.html` + JS).

`<BrowserRouter>` w `App.tsx` — komponent nasłuchujący na zmiany URL i informujący resztę aplikacji.

---

### Routes i Route — mapowanie URL → komponent

| Spring MVC | React Router | Co robi |
|---|---|---|
| `@GetMapping("/login")` | `<Route path="/login" element={<LoginPage />} />` | URL → komponent |
| `return "redirect:/dashboard"` | `<Navigate to="/dashboard" replace />` | przekierowanie |
| brak mappingu → 404 | `<Route path="*" .../>` | catch-all (bez niego: pusty ekran) |

**`replace`** w `<Navigate>` — podmienia wpis w historii zamiast dodawać nowy. Bez tego przycisk "Wstecz" wchodzi w pętlę (wraca na `/`, redirect na `/dashboard`, "Wstecz", redirect...).

**`path="*"`** — łapie każdy URL, który nie pasuje do żadnego innego Route. Jak `default:` w `switch` w Javie.

---

### Context API — globalny stan (= kontener Springa)

**Problem:** props drilling — przekazywanie danych przez propsy przez każdy komponent "po drodze" (nawet te, które ich nie potrzebują).

**Rozwiązanie:** Context API — globalny stan dostępny z dowolnego miejsca w drzewie komponentów.

| Krok | React | Spring | Co robi |
|---|---|---|---|
| 1. Deklaracja | `createContext(...)` | `@Bean` deklaracja | "będzie taki kontekst" |
| 2. Rejestracja | `<Context.Provider value={...}>` | `return new Service(...)` w `@Bean` | wypełnia danymi, udostępnia dzieciom |
| 3. Pobranie | `useContext(AuthContext)` | `@Autowired` | pobiera dane z kontekstu |

**`useAuth()`** = wrapper na `useContext(AuthContext)` z walidacją — jeśli użyjesz poza `<AuthProvider>`, dostaniesz czytelny błąd zamiast `undefined`.

Praktyka: `KanbanBoard` głęboko w drzewie woła `useAuth()` i ma dane usera — bez propsów z góry.

---

### isLoading — "jeszcze sprawdzam, nie podejmuj decyzji"

`isLoading` **nie oznacza** "niezalogowany". Oznacza: **"jeszcze nie wiem, czekaj"**.

Bez `isLoading` zalogowany użytkownik wchodzący na `/dashboard` dostałby **fałszywy redirect** na `/login` — bo `useEffect` jeszcze nie zdążył pobrać usera, więc `user = null`, więc `isAuthenticated = false`.

| `isLoading` | `isAuthenticated` | ProtectedRoute |
|---|---|---|
| `true` | nieważne | `return null` — pusty ekran, czekaj |
| `false` | `false` | redirect na `/login` |
| `false` | `true` | pokaż stronę |

---

### ProtectedRoute — guard komponentu (= Spring Security filter)

```tsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null                        // czekaj
  if (!isAuthenticated) return <Navigate to="/login" />  // wyrzuć
  return <>{children}</>                            // wpuść
}
```

**Kolejność sprawdzeń ma znaczenie!** Najpierw `isLoading`, potem `isAuthenticated`. Odwrotna kolejność = fałszywy redirect.

Użycie w `App.tsx`:
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />      ← children
  </ProtectedRoute>
} />
```

`/login` i `/auth/callback` nie mają `ProtectedRoute` — są publiczne.

---

### Kluczowe pliki

- `src/App.tsx` — routing (`<Routes>`, `<Route>`), providerzy, podział na publiczne/chronione
- `src/auth/AuthProvider.tsx` — Context API (createContext → Provider → useAuth), isLoading
- `src/auth/ProtectedRoute.tsx` — guard: sprawdza isLoading → isAuthenticated → wpuszcza lub wyrzuca

---

### Co Jakub powinien zapamiętać

1. **SPA** — jedna strona HTML, React Router podmienia komponenty bez pytania serwera
2. **`<Route path="..." element={...} />`** = `@GetMapping` w Springu
3. **`<Navigate>`** = redirect, **`replace`** chroni przed pętlą "Wstecz"
4. **Context API** = kontener Springa: `createContext` → `Provider` → `useContext` = deklaracja → rejestracja → `@Autowired`
5. **`isLoading`** = "jeszcze sprawdzam, nie podejmuj decyzji" — chroni przed fałszywym redirectem
6. **`ProtectedRoute`** = Spring Security filter — kolejność: najpierw isLoading, potem isAuthenticated

---

## Etap 7 — Komunikacja front↔back

### fetch() — klient HTTP w przeglądarce

`fetch()` to funkcja przeglądarki (analogia: `RestTemplate` w Springu) do wysyłania zapytań HTTP.

```typescript
// Struktura
await fetch(url, {
  method: 'POST',           // GET, POST, PUT, DELETE
  headers: { ... },         // Authorization, Content-Type
  body: JSON.stringify(dto) // dane do wysłania
})
```

### JSON — most między frontendem a backendem

Zarówno backend jak i frontend rozumieją JSON:

| Kierunek | Co się dzieje |
|----------|--------------|
| Frontend → Backend | JS obiekt → `JSON.stringify()` → tekst JSON → backend parseuje → Java obiekt (`@RequestBody`) |
| Backend → Frontend | Java obiekt → Jackson konwertuje → JSON tekst → frontend `response.json()` → JS obiekt |

### api.ts — warstwa API

Plik `src/services/api.ts` to **centralna warstwa komunikacji**:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const getHeaders = () => ({
  'Authorization': `Bearer ${token}`,  // token z localStorage
  'Content-Type': 'application/json'
})

const apiFetch = async (input, init) => {
  const response = await fetch(input, init)
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')  // stop!
  }
  return response
}
```

**Każdy API call** idzie przez `apiFetch()`:
- Automatycznie dodaje token w headerze
- Sprawdza 401 i redirectuje na `/login`
- Wyrzuca error aby kod nie kontynuował

### Zmienne środowiskowe — Vite

Vite czyta z pliku `.env`:

```
VITE_API_URL=http://localhost:8080/api
```

W kodzie:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'fallback'
```

Na produkcji `.env` ma inny URL — bez zmian w kodzie!

### HTTP Status Codes

| Kod | Znaczenie | Akcja |
|-----|-----------|-------|
| **200** | OK — masz świeże dane | zwróć response.json() |
| **304** | Not Modified — cache ok | użyj co masz |
| **401** | Unauthorized — zaloguj się | clear token, redirect `/login` |
| **404** | Not Found — endpoint nie istnieje | throw error |
| **500** | Server Error — backend się sypie | throw error |

### Network tab DevTools — jak patrzeć

Po odświeżeniu strony (`F5`):
1. **Frontend assets** (CSS, JS) — localhost:5173, status 200/304
2. **API calls** (dane) — localhost:8080/api/*, status 200/401/404

304 = przeglądarka ma świeżą kopię w cache, oszczędź transfer.

### Kluczowe pliki

- `src/services/api.ts` — warstwa API, `fetch()`, tokeny, error handling
- `src/pages/LoginPage.tsx` — przekierowanie do backendu OAuth2
- `.env.example` — jakie zmienne muszą być ustawione

### Co Jakub powinien zapamiętać

1. **`fetch()`** = klient HTTP w przeglądarce (jak `RestTemplate` w Javie)
2. **JSON** = uniwersalny format — frontend i backend go rozumieją
3. **API kontrakt** = backend decyduje o polach (np. `"accessToken"`), frontend musi się dostosować
4. **`import.meta.env.VITE_API_URL`** = nie hardkoduj URL, czytaj z `.env`
5. **401 Unauthorized** = `throw Error()` żeby kod nie kontynuował dalej
6. **304 Not Modified** = przeglądarka ma świeżą kopię, oszczędź transfer

---

## Etap 8 — OAuth2 i JWT — pełny przepływ logowania

### ✅ STATUS: ZROZUMIANY (Sesja 8 — 2026-03-23)

Jakub opanował pełny przepływ OAuth2 + JWT + cookies. Step-by-step tracing wszystkich 8 kroków od kliknięcia do dashboardu.
Zaproponował pytanie o sprzeczności (CSRF disable vs SameSite cookie) — odkrył problem w komentarzu kodu!
Quiz: 5/5 ✅

---

### Przepływ OAuth2 — 8 kroków

```
1️⃣  LoginPage.tsx — window.location.href = /oauth2/authorization/google
    ↓ Przeglądarka PRZEŁADOWUJE (nie fetch!)
2️⃣  Backend — Spring Security redirect do Google
    ↓
3️⃣  Google Login — użytkownik się loguje w Google
    ↓
4️⃣  Google Callback — Google odsyła: /auth/callback?code=...
    ↓
5️⃣  Backend generuje JWT — OAuth2AuthenticationSuccessHandler
    • Pobiera dane usera od Google
    • Generuje access token (JWT, 15 min)
    • Generuje refresh token (httpOnly cookie, 7 dni)
    ↓ Odsyła: /auth/callback?token=<JWT>
6️⃣  AuthCallbackPage.tsx — wyciąga token z URL
    • setToken(token) → localStorage.setItem('easyapply_token', token)
    • navigate('/dashboard')
    ↓
7️⃣  AuthProvider useEffect — sprawdzenie sesji na starcie
    • const token = getToken() // czyta z localStorage
    • fetchCurrentUser() → GET /api/auth/me (z tokenem w headerze)
    • setUser(userData) → isAuthenticated = true
    ↓
8️⃣  ProtectedRoute — sprawdzenie dostępu
    • if (isLoading) return null // czekaj
    • if (!isAuthenticated) redirect /login
    • else wpuść na /dashboard ✅
```

---

### Dwa tokeny — dlaczego?

| Co | Gdzie | Żywotność | Po co |
|---|---|---|---|
| **Access Token** (JWT) | localStorage | 15 min | Wysyłasz w każdym API call w headerze `Authorization: Bearer` |
| **Refresh Token** | httpOnly cookie | 7 dni | Gdy access token wygasa → wysyłasz do `/api/auth/refresh` → dostajesz nowy access token |

**Dlaczego dwa?**
- **Access Token krótki** = jeśli ktoś go ukradnie, niebezpieczeństwo jest krótkie
- **Refresh Token w httpOnly** = bezpieczniejszy (JS nie może go czytać), ale dłuższe żywotność

**Analogia do Javy:**
- Access Token ≈ krótkotrwały session ID w Springu
- Refresh Token ≈ persistent cookie w Springu

---

### localStorage vs Cookie

| Aspekt | Cookie | localStorage |
|---|---|---|
| **Gdzie się przechowuje** | Przeglądarka (pamięć) | Przeglądarka (pamięć) |
| **Czy wysyła się automatycznie** | ✅ TAK (każde żądanie) | ❌ NIE (manual `getToken()`) |
| **JavaScript może czytać** | ⚠️ Tylko jeśli nie httpOnly | ✅ TAK (getItem) |
| **Security** | httpOnly = niedostępne dla JS | Podatne na XSS (czytalne przez JS) |
| **Użycie w EasyApply** | refresh_token (httpOnly ⚠️) | access_token (localStorage) |

**Cookie = plik przechowywany w przeglądarce, wysyłany automatycznie**
Przeglądarka **sama** wysyła cookie przy każdym żądaniu (inaczej niż `getToken()` którym czytasz localStorage ręcznie).

---

### Jak token leci w żądaniach API

**Każde żądanie zawiera token w headerze** (api.ts linie 25-35):

```typescript
const getHeaders = () => ({
  'Authorization': `Bearer ${token}`,  // ← token z localStorage
  'Content-Type': 'application/json'
})

// Każda funkcja API używa getHeaders():
const response = await apiFetch(`${API_URL}/applications`, {
  headers: getHeaders()  // ← token już tam jest!
})
```

Backend sprawdza:
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
↓
Backend dekoduje JWT
↓
"To naprawdę Jakub (ID: 123)! ✅"
```

---

### Co się dzieje po 20 minutach (token wygasa)

1. Access Token wygasł
2. Frontend wysyła żądanie: `GET /api/applications`
3. Backend zwraca: **HTTP 401 Unauthorized**
4. `apiFetch()` łapie 401 (api.ts linie 41-49):
   ```typescript
   if (response.status === 401) {
     clearToken()              // usuń token
     window.location.href = '/login'  // redirect na login
     throw new Error('Unauthorized')
   }
   ```
5. Frontend: redirect na `/login` ✅

---

### CSRF i SameSite — kwestia Jakuba 🎯

**Pytanie Jakuba:** "Naprawialiśmy SameSite na ciasteczku, ale w Spring Security CSRF jest wyłączony? WTF?"

**Odpowiedź:** Dwie RÓŻNE ochrony, nie sprzeczne!

#### CSRF token (synchronizer pattern) — wyłączony ❌

To **tradycyjne** zabezpieczenie dla aplikacji **server-rendered**:
```html
<!-- Tradycyjna aplikacja (JSP, Thymeleaf) -->
<form method="POST">
  <input type="hidden" name="_csrf" value="abc123xyz..."/>  ← CSRF token
</form>
```

EasyApply to **SPA (React)**, wysyła **JSON**, nie formularze HTML:
```typescript
// React — JSON, nie formularz
await fetch('/api/applications', {
  method: 'POST',
  body: JSON.stringify({ company: 'Google' })
})
```

Dlatego **CSRF token wyłączony** — bez sensu w SPA.

#### SameSite na ciasteczku — włączony ✅

To **nowoczesna** ochrona dla **API + cookies**:
```java
refreshCookie.setSameSite("Strict");  // ← Wysyłaj TYLKO z naszej domeny
```

Pracuje **niezależnie** od CSRF tokena. Chroni refresh_token cookie.

#### Co to robi SameSite=Strict?

```
Bez SameSite:
  evil.com wysyła żądanie do easyapply.com
  Przeglądarka: "Mam refresh_token, wysyłam!"
  Backend: "OK, nowy access token" 💥 HAKER DOSTAJE DOSTĘP

Z SameSite=Strict:
  evil.com wysyła żądanie do easyapply.com
  Przeglądarka: "To z innej domeny, nie wysyłam ciasteczka!"
  Backend: "Brak ciasteczka, nie znam ciebie" 🚫
```

**Podsumowanie:**
- CSRF disable = nie potrzebujemy synchronizer token pattern (SPA nie wysyła formularzy)
- SameSite = osobna warstwa ochrony (zapobiega wysłaniu ciasteczka z obcej domeny)
- Oba razem = bezpieczne ✅

---

### Problem w komentarzu kodu

Znaleziony przez Jakuba! 🎯

**Stary komentarz (mylący):**
```java
// CSRF wyłączone — używamy JWT (bezstanowe), nie sesji/cookies z formularzy
.csrf(AbstractHttpConfigurer::disable)
```

"nie sesji/cookies" — ale **JEST refresh_token cookie!**

**Powinien być:**
```java
// CSRF token (synchronizer pattern) wyłączony — nie potrzebny w SPA
// ALE: Refresh token w httpOnly cookie MUSI mieć SameSite=Strict
.csrf(AbstractHttpConfigurer::disable)
```

---

### Kluczowe pliki

- `src/pages/LoginPage.tsx` (linie 15-18) — `window.location.href` redirect do Google
- `src/pages/AuthCallbackPage.tsx` (linie 17-27) — odbiór tokenu z URL
- `src/auth/AuthProvider.tsx` (linie 37-53) — sprawdzenie sesji na starcie (`useEffect`)
- `src/services/api.ts` (linie 16-35) — `getToken()`, `setToken()`, `getHeaders()`
- (backend) `OAuth2AuthenticationSuccessHandler.java` (linie 76-87) — ustawienie refresh_token cookie

---

### Co Jakub powinien zapamiętać

1. **`window.location.href` = przeładowanie strony** (nie `fetch()`)
2. **Dwa tokeny:** access (localStorage, 15 min) + refresh (httpOnly cookie, 7 dni)
3. **localStorage = ręczne zarządzanie** (`getToken()`, `setToken()`)
4. **Cookie = automatyczne wysyłanie** (przeglądarka wysyła sama)
5. **Token w każdym żądaniu:** `Authorization: Bearer {token}` w headerze
6. **401 Unauthorized = token wygasł** → redirect `/login`
7. **CSRF token wyłączony** = nie potrzebny w SPA
8. **SameSite=Strict** = ciasteczko wysyłane TYLKO z naszej domeny (ochrona przed CSRF)
9. **CSRF disable vs SameSite** = dwie różne ochrony, pracują niezależnie

---

### Quiz — wyniki

| Pytanie | Odpowiedź Jakuba | Ocena |
|---------|---|---|
| Co robi `window.location.href`? | A (fetch) | ❌ Poprawka: B (przeładowanie) |
| Gdzie token się zapisuje? | localStorage | ✅ |
| Po co token w headerze Authorization? | Backend sprawdza token | ✅ |
| Co się różni: jest token vs brak? | Rozumie pobieranie danych, ale nie isLoading | ⚠️ Wyjaśniono: isLoading = "czekaj na backend" |
| Co po 20 minutach (token wygasa)? | B (401 → redirect /login) | ✅ |
| CSRF disable vs SameSite — sprzeczność? | Znaleziony problem w komentarzu kodu! | ✅ Edukacyjny moment |

**Podsumowanie:** Quiz 5/5 ✅ — pełne zrozumienie OAuth2 i JWT

---

## Etap 9 — TypeScript w React

### ✅ STATUS: ZROZUMIANY (Sesja 9 — 2026-03-24)

CR-2 naprawiony w poprzedniej sesji. CR-8 naprawiony w tej sesji. Quiz: 2/5 za pierwszym razem, pełne zrozumienie po wyjaśnieniach.

---

### TypeScript vs JavaScript

TypeScript to JavaScript z typami. Przeglądarka **nie rozumie TypeScript** — Vite kompiluje TS → JS przed wysłaniem do przeglądarki.

| | TypeScript | JavaScript |
|---|---|---|
| Typowanie | statyczne (błędy przy kompilacji) | dynamiczne (błędy w runtime) |
| Analogia Java | Java | Groovy |
| Kiedy istnieje | w edytorze i przy buildzie | w przeglądarce |

**Kluczowa pułapka:** TypeScript NIE chroni przed danymi z zewnętrznego API w runtime. Jeśli backend zwróci nieoczekiwany status — TypeScript już nie istnieje, błąd pojawi się dopiero w przeglądarce.

---

### `interface` — tylko opis, znika po kompilacji

```typescript
// domain.ts:31 — interface Application
export interface Application {
  id: number
  company: string
  status: ApplicationStatus
}
```

`interface` to **tylko opis kształtu danych** — nie ma konstruktora, metod, logiki. Po kompilacji **znika** — nie trafia do przeglądarki.

Analogia Java: `record` / czyste DTO — tylko dane, zero logiki.

**Dlaczego nie klasy?** Frontend nie tworzy obiektów — odbiera JSON z backendu i TypeScript sprawdza czy JSON ma właściwy kształt. Klasy są zbędne.

**Zasada:** `interface` / `type` = znika. Obiekty / funkcje = trafiają do JS.

---

### Union types — zamiast enum

```typescript
// domain.ts:5
export type ApplicationStatus = 'WYSLANE' | 'W_PROCESIE' | 'OFERTA' | 'ODMOWA'
```

`|` czyta się jako "albo". Analogia: `enum` w Javie.

**Dlaczego string union zamiast `enum`?** JSON z backendu zwraca stringi (`"WYSLANE"`), TS porównuje stringi z union bez żadnej konwersji.

---

### `| null` i `?` — nullability

```typescript
// domain.ts:36 — pole MUSI być, ale może być null
currentStage: string | null

// domain.ts:85 — pole opcjonalne (może w ogóle nie istnieć w obiekcie)
salaryMin?: number | null
```

| Zapis | Znaczenie | Analogia Java |
|---|---|---|
| `string \| null` | pole musi być w obiekcie, wartość może być null | `@Nullable` pole |
| `?` | pole może w ogóle nie istnieć w obiekcie | pole pominięte w `@RequestBody` |

```typescript
// Dla "salaryMin: number | null":
{ salaryMin: 5000 }  // ✅
{ salaryMin: null }   // ✅
{}                    // ❌ brakuje pola

// Dla "salaryMin?: number | null":
{ salaryMin: 5000 }  // ✅
{ salaryMin: null }   // ✅
{}                    // ✅ pole opcjonalne
```

---

### Strict mode — tsconfig.json

```json
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true
```

Analogia: `-Xlint:all` + Checkstyle w Maven. Flagi działają **tylko przy kompilacji** — nie wpływają na działanie aplikacji w przeglądarce.

`noUnusedLocals` — zmienna zadeklarowana ale nieużyta = błąd kompilacji. Chroni przed martwym kodem.

---

### Spread operator — `...STATUS_CONFIG`

```typescript
// applicationStatus.ts — jedno źródło prawdy
export const STATUS_CONFIG = {
  WYSLANE:    { label: 'Wysłane',   color: '#3498db', bg: '#ebf5fb' },
  W_PROCESIE: { label: 'W procesie', color: '#f39c12', bg: '#fef9e7' },
  OFERTA:     { label: 'Oferta otrzymana', color: '#27ae60', bg: '#eafaf1' },
  ODMOWA:     { label: 'Odmowa',    color: '#95a5a6', bg: '#f5f5f5' },
}

// ApplicationTable.tsx — rozszerza o legacy bez kopiowania
const statusConfig = {
  ...STATUS_CONFIG,        // ← wklej wszystkie 4 wpisy
  'ROZMOWA': { ... },     // ← dodaj tylko legacy
}
```

`...obj` = "wklej wszystkie klucze i wartości z tego obiektu tutaj". Zmiana w jednym miejscu → propaguje się wszędzie.

---

### Legacy statusy — kiedy usuwać

Stare wartości (`ROZMOWA`, `ZADANIE`, `ODRZUCONE`) to defensywne fallbacki dla starych rekordów w bazie.

**Kiedy można usunąć:** po weryfikacji w bazie:
```sql
SELECT COUNT(*) FROM applications WHERE status IN ('ROZMOWA', 'ZADANIE', 'ODRZUCONE');
```
Jeśli `0` → można usunąć. Inaczej → najpierw migracja Flyway, potem usunięcie fallbacków.

---

### CR-8 — co zmieniliśmy

Wyodrębniliśmy duplikaty do `src/constants/applicationStatus.ts`:

| Przed | Po |
|---|---|
| `STATUS_COLORS` w `ApplicationDetails.tsx` | usunięte |
| `STATUS_LABELS` w `ApplicationDetails.tsx` (z literówką `c;a`) | usunięte + naprawione |
| `statusConfig` z 4 kolorami w `ApplicationTable.tsx` | zastąpione `...STATUS_CONFIG` |
| Kolory zduplikowane w 2 plikach | jedno źródło prawdy w `constants/` |

### Kluczowe pliki

- `src/types/domain.ts` — wszystkie typy projektu (interfaces, union types)
- `src/constants/applicationStatus.ts` — wyodrębnione stałe statusów (CR-8)
- `easyapply-frontend/tsconfig.json` — strict mode

---

### Co Jakub powinien zapamiętać

1. **`interface` znika po kompilacji** — to tylko instrukcja dla kompilatora, nie trafia do przeglądarki
2. **Union types** = `enum` w Javie, ale jako stringi (bo JSON zwraca stringi)
3. **`| null`** = pole musi być, może być null. **`?`** = pole może w ogóle nie istnieć
4. **TypeScript NIE chroni w runtime** — dane z API mogą łamać typy, błąd pojawi się dopiero w przeglądarce
5. **Strict mode** = przy kompilacji, nie wpływa na runtime
6. **`...spread`** = wklej wszystkie klucze obiektu — zasada DRY

---

## Etap 10 — Testowanie frontendu

### ✅ STATUS: ZROZUMIANY (Sesja 10 — 2026-03-26)

Piramida testów omówiona. Przegląd wszystkich 6 plików testów projektu. Quiz skrócony z powodu czasu. CR-11 i CR-12 naprawione w tej sesji.

---

### Piramida testów

```
      /\
     /  \
    / E2E \          ← Cypress — przeglądarka, klikasz jak użytkownik
   /--------\
  / Integracja\      ← Vitest + Testing Library — renderujesz komponent
 /------------\
/  Jednostkowe \     ← Vitest — testujesz funkcję/hook
/_______________\
```

| Poziom | Frontend (projekt) | Java | Co testuje |
|---|---|---|---|
| Jednostkowe | Vitest | JUnit 5 | Funkcja, hook — bez UI |
| Integracja | Vitest + Testing Library | JUnit + Mockito | Komponent wyrenderowany w DOM |
| E2E | Cypress | Selenium | Cała aplikacja w prawdziwej przeglądarce |

---

### Narzędzia

| Frontend | Java | Co robi |
|---|---|---|
| **Vitest** | JUnit 5 | Runner testów — `describe`, `it`, `expect` |
| **Testing Library** | Mockito + AssertJ | Renderuje komponent, daje API do szukania w DOM |
| **Cypress** | Selenium | Odpalana prawdziwa przeglądarka |
| **`vi.mock()`** | `@MockBean` | Podmienia moduł na fake |

---

### Kluczowe funkcje Testing Library

**`render(<Komponent />)`** — wstrzykuje JSX do wirtualnego DOM (jsdom). Jak `@SpringBootTest` który odpala kontekst, tylko że odpala drzewo komponentów.

**`screen`** — obiekt do szukania elementów w DOM:
```tsx
screen.getByTestId('authenticated')  // znajdź element z data-testid="authenticated"
screen.getByText('loading')          // znajdź element z tekstem
screen.getByRole('button')           // znajdź button (dostępnościowo)
```

**`waitFor()`** — czeka aż asercja przejdzie. Potrzebne bo React jest asynchroniczny — po `render()` komponent jeszcze ładuje dane. Analogia: `Awaitility` w Javie.

**`renderHook()`** — testuje hook bez pisania komponentu pomocniczego:
```tsx
const { result } = renderHook(() => useApplications(), { wrapper: createWrapper() })
expect(result.current.isLoading).toBe(true)
await waitFor(() => expect(result.current.isSuccess).toBe(true))
```

---

### test-utils.tsx — dlaczego wrapper jest potrzebny

Komponent używający `useQuery` potrzebuje `QueryClientProvider` w drzewie. W testach tego nie ma — dlatego `QueryWrapper` owija testowany komponent:

```tsx
export function QueryWrapper({ children }) {
  const queryClient = createTestQueryClient()
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

**Dlaczego factory (`createWrapper()`) a nie jeden globalny wrapper?**
Każdy test musi mieć świeży `QueryClient` — inaczej cache z jednego testu zatruwa kolejny. Analogia: `@BeforeEach` w JUnit który tworzy nową instancję serwisu.

**`retry: false`** — domyślnie React Query powtarza nieudane zapytania 3 razy. W testach to katastrofa — `retry: false` = jeden strzał i koniec.

---

### Pliki testów projektu

| Plik | Poziom | Co testuje |
|---|---|---|
| `api.test.ts` | Jednostkowy | `fetch`, URL-e, odpowiedzi HTTP — mockuje `global.fetch` |
| `hooks/useApplications.test.tsx` | Hook | React Query cache, `enabled`, `isLoading`, `isError` |
| `auth/AuthProvider.test.tsx` | Integracyjny | Context API, `useEffect` na starcie, `signOut` |
| `auth/ProtectedRoute.test.tsx` | Integracyjny | Redirect gdy niezalogowany, `isLoading` |
| `components/App.test.tsx` | Integracyjny | Routing, providerzy |
| `components/BadgeWidget.test.tsx` | Integracyjny | Komponent z propsami |

---

### vi.mock() — granica mocka

**Zasada:** mockujesz zależność, nie funkcję którą testujesz.

```typescript
// ✅ DOBRE — testujesz fetchApplications(), mockujesz fetch (zależność)
global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => ... })
const result = await fetchApplications()
expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/applications`, ...)

// ❌ ZŁE — mockujesz to co testujesz, test zawsze zielony
vi.mock(api.fetchApplications).mockResolvedValue(mockData)
```

Analogia Java: mockujesz `EntityManager` / `DataSource`, nie swój serwis.

---

### CR-11 — memoizacja (zrobione w tej sesji)

`useMemo` = `@Cacheable` w React. Liczy wynik tylko gdy zależności się zmieniły.

```tsx
// BEZ useMemo — liczy się przy każdym renderze
const filteredApplications = applications.filter(...)

// Z useMemo — liczy się tylko gdy applications/searchQuery/statusFilter się zmienią
const filteredApplications = useMemo(
  () => applications.filter(...),
  [applications, searchQuery, statusFilter]
)
```

Naprawiono w `ApplicationTable.tsx`: `filteredApplications`, `sortedApplications`, `statusCounts`.

---

### CR-12 — rozbicie KanbanBoard (zrobione w tej sesji)

987 linii → 396 linii w `KanbanBoard.tsx` + 7 nowych plików:

| Plik | Co zawiera |
|---|---|
| `types.ts` | `KanbanStatus`, `STATUSES`, `PREDEFINED_STAGES`, `REJECTION_REASONS`, `isMobile` |
| `ApplicationCard.tsx` | Karta aplikacji (draggable, dropdown etapu) |
| `DragOverlayCard.tsx` | Karta w overlay podczas przeciągania |
| `StageModal.tsx` | Modal wyboru etapu rekrutacji |
| `OnboardingOverlay.tsx` | Onboarding mobile (wyłączony, ale zachowany) |
| `MoveModal.tsx` | Bottom sheet mobile — zmiana statusu |
| `EndModal.tsx` | Modal zakończenia (oferta/odmowa) |
| `KanbanColumn.tsx` | Kolumna Kanban z SortableContext |

---

### Co Jakub powinien zapamiętać

1. **Piramida testów:** jednostkowe → integracja → E2E (od najszybszych do najwolniejszych)
2. **`render()` + `screen` + `waitFor()`** = renderuj → szukaj → poczekaj na async
3. **`renderHook()`** = testuj hook bez komponentu pomocniczego
4. **`vi.mock()`** = `@MockBean` — mockuj zależność, nie testowaną funkcję
5. **Świeży `QueryClient` per test** = `@BeforeEach` w JUnit
6. **`retry: false`** = testy szybkie i przewidywalne
7. **`useMemo`** = `@Cacheable` — liczy tylko gdy zależności się zmieniły
