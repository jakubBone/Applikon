import type {
  Application,
  ApplicationRequest,
  BadgeStats,
  CV,
  Note,
  NoteCategory,
  StageUpdateRequest,
  User,
} from '../types/domain'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

const TOKEN_KEY = 'easyapply_token'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

/**
 * Buduje nagłówki HTTP dla każdego żądania.
 * JWT access token jest wysyłany w headerze Authorization: Bearer.
 * Refresh token jest w httpOnly cookie — przeglądarka wysyła go automatycznie.
 */
const getHeaders = (contentType?: string): HeadersInit => {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  return headers
}

/**
 * Wykonuje fetch i w razie 401 czyści token (wygasł lub nieważny).
 * Wyrzuca błąd — obsługa w wywołującym kodzie lub ErrorBoundary.
 */
const apiFetch = async (input: string, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init)
  if (response.status === 401) {
    clearToken()
    window.location.href = '/login'
  }
  return response
}

// ============================================================
// Auth
// ============================================================

export const fetchCurrentUser = async (): Promise<User> => {
  const response = await apiFetch(`${API_URL}/auth/me`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Błąd pobierania danych użytkownika')
  return response.json() as Promise<User>
}

export const logout = async (): Promise<void> => {
  await apiFetch(`${API_URL}/auth/logout`, { method: 'POST', headers: getHeaders() })
  clearToken()
}

export const refreshToken = async (): Promise<string> => {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // wysyła httpOnly cookie z refresh tokenem
  })
  if (!response.ok) throw new Error('Sesja wygasła')
  const data = await response.json() as { accessToken: string }
  setToken(data.accessToken)
  return data.accessToken
}

// ============================================================
// Applications
// ============================================================

export const fetchApplications = async (): Promise<Application[]> => {
  const response = await apiFetch(`${API_URL}/applications`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Błąd pobierania aplikacji')
  return response.json() as Promise<Application[]>
}

export const createApplication = async (data: ApplicationRequest): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Błąd dodawania aplikacji')
  return response.json() as Promise<Application>
}

export const updateApplication = async (id: number, data: ApplicationRequest): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications/${id}`, {
    method: 'PUT',
    headers: getHeaders('application/json'),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Błąd aktualizacji aplikacji')
  return response.json() as Promise<Application>
}

export const deleteApplication = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_URL}/applications/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd usuwania aplikacji')
}

export const updateApplicationStatus = async (id: number, status: string): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Błąd zmiany statusu')
  return response.json() as Promise<Application>
}

export const updateApplicationStage = async (id: number, data: StageUpdateRequest): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications/${id}/stage`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Błąd zmiany etapu')
  return response.json() as Promise<Application>
}

export const addStage = async (id: number, stageName: string): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications/${id}/stage`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ stageName }),
  })
  if (!response.ok) throw new Error('Błąd dodawania etapu')
  return response.json() as Promise<Application>
}

export const checkDuplicate = async (company: string, position: string): Promise<Application[]> => {
  const params = new URLSearchParams({ company, position })
  const response = await apiFetch(`${API_URL}/applications/check-duplicate?${params}`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd sprawdzania duplikatów')
  return response.json() as Promise<Application[]>
}

// ============================================================
// CV
// ============================================================

export const fetchCVs = async (): Promise<CV[]> => {
  const response = await apiFetch(`${API_URL}/cv`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Błąd pobierania CV')
  return response.json() as Promise<CV[]>
}

export const uploadCV = async (file: File): Promise<CV> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiFetch(`${API_URL}/cv/upload`, {
    method: 'POST',
    headers: getHeaders(), // bez Content-Type — przeglądarka ustawi multipart/form-data z boundary
    body: formData,
  })
  if (!response.ok) throw new Error('Błąd uploadu CV')
  return response.json() as Promise<CV>
}

export const createCV = async (data: { originalFileName: string; type: string; externalUrl?: string }): Promise<CV> => {
  const response = await apiFetch(`${API_URL}/cv`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ name: data.originalFileName, type: data.type, externalUrl: data.externalUrl }),
  })
  if (!response.ok) throw new Error('Błąd tworzenia CV')
  return response.json() as Promise<CV>
}

export const updateCV = async (id: number, data: { originalFileName: string; externalUrl?: string }): Promise<CV> => {
  const response = await apiFetch(`${API_URL}/cv/${id}`, {
    method: 'PUT',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ name: data.originalFileName, externalUrl: data.externalUrl }),
  })
  if (!response.ok) throw new Error('Błąd aktualizacji CV')
  return response.json() as Promise<CV>
}

export const deleteCV = async (id: number): Promise<void> => {
  const response = await apiFetch(`${API_URL}/cv/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd usuwania CV')
}

export const assignCVToApplication = async (applicationId: number, cvId: number | null): Promise<Application> => {
  const response = await apiFetch(`${API_URL}/applications/${applicationId}/cv`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ cvId }),
  })
  if (!response.ok) throw new Error('Błąd przypisania CV')
  return response.json() as Promise<Application>
}

export const downloadCV = async (id: number, fileName: string): Promise<void> => {
  const response = await apiFetch(`${API_URL}/cv/${id}/download`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd pobierania pliku')
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// Notes
// ============================================================

export const fetchNotes = async (applicationId: number): Promise<Note[]> => {
  const response = await apiFetch(`${API_URL}/applications/${applicationId}/notes`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd pobierania notatek')
  return response.json() as Promise<Note[]>
}

export const createNote = async (applicationId: number, content: string, category: NoteCategory | null = null): Promise<Note> => {
  const response = await apiFetch(`${API_URL}/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ content, category }),
  })
  if (!response.ok) throw new Error('Błąd dodawania notatki')
  return response.json() as Promise<Note>
}

export const updateNote = async (noteId: number, content: string, category: NoteCategory | null = null): Promise<Note> => {
  const response = await apiFetch(`${API_URL}/notes/${noteId}`, {
    method: 'PUT',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ content, category }),
  })
  if (!response.ok) throw new Error('Błąd aktualizacji notatki')
  return response.json() as Promise<Note>
}

export const deleteNote = async (noteId: number): Promise<void> => {
  const response = await apiFetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Błąd usuwania notatki')
}

// ============================================================
// Statistics
// ============================================================

export const fetchBadgeStats = async (): Promise<BadgeStats> => {
  const response = await apiFetch(`${API_URL}/statistics/badges`, { headers: getHeaders() })
  if (!response.ok) throw new Error('Błąd pobierania statystyk')
  return response.json() as Promise<BadgeStats>
}
