# Plan Deploymentu Frontend-Only (IndexedDB)

## Cel
Aplikacja działa **tylko w przeglądarce** - zero danych na serwerze.

---

## Co się zmienia

### PRZED (Backend):
```
User → Frontend → API (Spring Boot) → PostgreSQL
                     ↓
                 Twój serwer Railway
```

### PO (Frontend-only):
```
User → Frontend → IndexedDB (przeglądarka usera)
```

**Korzyści:**
- ✅ Zero kosztów hostingu backendu
- ✅ Zero odpowiedzialności za dane
- ✅ Deploy w 5 minut (Vercel/Netlify)

---

## ETAP 1: Implementacja IndexedDB (3-4h)

### 1.1. Dodaj bibliotekę Dexie.js

```bash
cd easyapply-frontend
npm install dexie
```

**Dlaczego Dexie?** Upraszcza IndexedDB (czytelniejszy kod).

---

### 1.2. Stwórz plik `src/services/db.js`

```javascript
import Dexie from 'dexie'

// Inicjalizacja bazy danych
export const db = new Dexie('EasyApplyDB')

db.version(1).stores({
  applications: '++id, company, position, status, sessionId, appliedAt',
  cvs: '++id, fileName, sessionId, uploadedAt',
  notes: '++id, applicationId, content, createdAt'
})

// Session ID (tak jak teraz)
const SESSION_KEY = 'easyapply_session_id'

export const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

// === APPLICATIONS API ===

export const fetchApplications = async () => {
  const sessionId = getSessionId()
  return await db.applications
    .where('sessionId').equals(sessionId)
    .toArray()
}

export const createApplication = async (data) => {
  const sessionId = getSessionId()
  return await db.applications.add({
    ...data,
    sessionId,
    appliedAt: new Date().toISOString()
  })
}

export const updateApplication = async (id, data) => {
  return await db.applications.update(id, data)
}

export const deleteApplication = async (id) => {
  // Usuń powiązane notatki
  await db.notes.where('applicationId').equals(id).delete()
  return await db.applications.delete(id)
}

export const updateApplicationStatus = async (id, status) => {
  return await db.applications.update(id, { status })
}

// === CV API ===

export const fetchCVs = async () => {
  const sessionId = getSessionId()
  return await db.cvs
    .where('sessionId').equals(sessionId)
    .toArray()
}

export const uploadCV = async (file) => {
  const sessionId = getSessionId()
  return await db.cvs.add({
    fileName: file.name,
    originalFileName: file.name,
    fileSize: file.size,
    file: file, // Blob (plik PDF)
    sessionId,
    uploadedAt: new Date().toISOString()
  })
}

export const downloadCV = (cvId) => {
  return db.cvs.get(cvId).then(cv => {
    if (!cv) throw new Error('CV nie znalezione')

    const blobUrl = URL.createObjectURL(cv.file)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = cv.fileName
    link.click()
    URL.revokeObjectURL(blobUrl)
  })
}

export const deleteCV = async (id) => {
  return await db.cvs.delete(id)
}

// === NOTES API ===

export const fetchNotes = async (applicationId) => {
  return await db.notes
    .where('applicationId').equals(applicationId)
    .toArray()
}

export const createNote = async (applicationId, content) => {
  return await db.notes.add({
    applicationId,
    content,
    createdAt: new Date().toISOString()
  })
}

export const deleteNote = async (id) => {
  return await db.notes.delete(id)
}

// === STATISTICS ===

export const fetchBadgeStats = async () => {
  const sessionId = getSessionId()
  const apps = await db.applications
    .where('sessionId').equals(sessionId)
    .toArray()

  const rejections = apps.filter(a => a.status === 'ODRZUCONE').length
  const ghosting = apps.filter(a => a.rejectionReason === 'GHOSTING').length

  return { rejections, ghosting }
}
```

---

### 1.3. Zamień wszystkie wywołania API

**PRZED (`api.js`):**
```javascript
import { fetchApplications } from './services/api'
```

**PO (`db.js`):**
```javascript
import { fetchApplications } from './db'
```

**Pliki do zmiany:**
- `src/App.jsx`
- `src/ApplicationForm.jsx`
- `src/KanbanBoard.jsx`
- `src/ApplicationTable.jsx`
- `src/CVManager.jsx`
- `src/NotesList.jsx`
- `src/BadgeDisplay.jsx`

**Szukaj i zamień:**
- `./services/api` → `./db`
- Wszystkie funkcje mają **te same nazwy** → minimalne zmiany!

---

### 1.4. Usuń niepotrzebne pliki

```bash
# Usuń stary plik API
rm src/services/api.js

# Usuń zmienną środowiskową
# .env (nie potrzebna - brak backendu)
# VITE_API_URL=...
```

---

### 1.5. Test lokalny

```bash
cd easyapply-frontend
npm run dev
```

**Sprawdź:**
- [ ] Dodawanie aplikacji
- [ ] Kanban drag & drop
- [ ] Upload CV
- [ ] Pobieranie CV
- [ ] Notatki
- [ ] Odśwież stronę (F5) - dane zostają? ✅

---

## ETAP 2: Deploy na Vercel (10 minut)

### 2.1. Przygotuj projekt

```bash
cd easyapply-frontend

# Build produkcyjny
npm run build

# Sprawdź czy działa
npm run preview
```

---

### 2.2. Deploy na Vercel

**Opcja A: Przez CLI (szybciej)**

```bash
# Zainstaluj Vercel CLI
npm install -g vercel

# Deploy
cd easyapply-frontend
vercel

# Odpowiedz na pytania:
# - Link to existing project? No
# - Project name? easyapply
# - Which directory? ./

# Deploy produkcyjny
vercel --prod
```

**Opcja B: Przez Dashboard (łatwiej)**

1. Idź na https://vercel.com
2. Zaloguj się przez GitHub
3. "Add New" → "Project"
4. Wybierz repo `Easy`
5. "Root Directory" → wybierz `easyapply-frontend`
6. "Framework Preset" → Vite
7. Kliknij "Deploy"

**Gotowe!** URL: `https://easyapply-xxx.vercel.app`

---

### 2.3. Konfiguracja Vercel (opcjonalna)

**Custom domain (jeśli masz):**
- Vercel → Settings → Domains → Add
- Wpisz swoją domenę (np. `easyapply.pl`)

**Environment Variables:**
- Brak! (nie potrzebujesz VITE_API_URL)

---

## ETAP 3: Testy produkcyjne (15 min)

### 3.1. Podstawowy test

1. Otwórz URL Vercel w przeglądarce
2. Dodaj 3 testowe aplikacje
3. Uploaduj CV (PDF <5MB)
4. Przeciągnij aplikację na Kanban
5. Odśwież stronę (F5) → dane zostają? ✅

---

### 3.2. Test na telefonie

1. Otwórz URL na telefonie
2. Dodaj aplikację (sprawdź czy formularz działa)
3. Przeciągnij kartę (touch drag & drop)
4. Uploaduj CV z galerii

---

### 3.3. Test incognito (izolacja sesji)

1. Normalne okno: dodaj 2 aplikacje
2. Tryb incognito: otwórz ten sam URL
3. Incognito powinno być puste (nowy session_id) ✅
4. Dodaj 1 aplikację w incognito
5. Wróć do normalnego okna → nadal 2 aplikacje (nie 3) ✅

---

## ETAP 4: Komunikat dla userów (5 min)

**Dodaj info banner w `App.jsx`:**

```jsx
<div style={{
  background: '#fff3cd',
  padding: '12px 20px',
  borderLeft: '4px solid #ffc107',
  margin: '10px 0'
}}>
  ℹ️ <strong>Demo Mode:</strong> Dane przechowywane tylko w Twojej przeglądarce.
  Czyszczenie cache = utrata danych.
</div>
```

---

## PODSUMOWANIE

| Etap | Czas | Status |
|------|------|--------|
| 1. Implementacja IndexedDB | 3-4h | [ ] |
| 2. Deploy Vercel | 10 min | [ ] |
| 3. Testy | 15 min | [ ] |
| 4. Banner info | 5 min | [ ] |
| **RAZEM** | **~4h** | |

---

## Co user widzi

**Post na LinkedIn:**
```
🚀 EasyApply - client-side job tracker

Tracker rekrutacji działający 100% w przeglądarce:
✅ Kanban board
✅ Upload CV (IndexedDB)
✅ Notatki z rozmów
✅ Offline-first

Zero rejestracji, zero logowania - po prostu użyj!
Twoje dane zostają u Ciebie 🔒

👉 [link Vercel]

#junior #react #webdev #jobsearch
```

---

## Różnice vs Backend

| Feature | Backend | Frontend-only |
|---------|---------|---------------|
| Hosting backend | Railway ($5/m) | ❌ Nie potrzeba |
| Hosting frontend | Railway/Vercel | Vercel (free) |
| Dane na serwerze | ✅ | ❌ |
| Synchronizacja urządzeń | ❌ (bez logowania) | ❌ |
| Offline mode | ❌ | ✅ |
| Storage limit | ~1GB (PostgreSQL) | ~50MB-1GB (IndexedDB) |
| Upload CV | ✅ | ✅ |
| Pokaz backend skills | ✅ | ❌ |

---

## Troubleshooting

**Problem: IndexedDB nie działa w przeglądarce**
```javascript
// Sprawdź support
if (!window.indexedDB) {
  alert('Twoja przeglądarka nie wspiera IndexedDB')
}
```

**Problem: CV nie uploaduje się (za duże)**
```javascript
// Limit w uploadCV
if (file.size > 10 * 1024 * 1024) {
  throw new Error('Maksymalny rozmiar CV: 10MB')
}
```

**Problem: Dane znikają po zamknięciu**
- Sprawdź czy przeglądarka nie jest w trybie prywatnym
- Sprawdź ustawienia przeglądarki (czy usuwa dane przy zamknięciu)

---

## Następne kroki (opcjonalnie)

1. **Export danych** - przycisk "Pobierz backup" (JSON)
2. **Import danych** - przycisk "Wczytaj backup"
3. **PWA** - dodaj service worker (działa offline)
4. **Share feature** - export jako link (dane w URL parametrach)

---

**Gotowy do startu?** Zacznij od Etapu 1! 🚀
