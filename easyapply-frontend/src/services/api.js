const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Session ID management - izolacja danych per user
const SESSION_ID_KEY = 'easyapply_session_id'

const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_ID_KEY, sessionId)
  }
  return sessionId
}

// Helper do tworzenia headers z session ID
const getHeaders = (contentType = null) => {
  const headers = {
    'X-Session-ID': getSessionId()
  }
  if (contentType) {
    headers['Content-Type'] = contentType
  }
  return headers
}

// Applications API
export const fetchApplications = async () => {
  const response = await fetch(`${API_URL}/applications`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd pobierania aplikacji')
  return response.json()
}

export const createApplication = async (applicationData) => {
  const response = await fetch(`${API_URL}/applications`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify(applicationData)
  })
  if (!response.ok) throw new Error('Błąd dodawania aplikacji')
  return response.json()
}

export const updateApplicationStatus = async (applicationId, status) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/status`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ status })
  })
  if (!response.ok) throw new Error('Błąd zmiany statusu')
  return response.json()
}

export const updateApplicationStage = async (applicationId, stageData) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/stage`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify(stageData)
  })
  if (!response.ok) throw new Error('Błąd zmiany etapu')
  return response.json()
}

export const addStage = async (applicationId, stageName) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/stage`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ stageName })
  })
  if (!response.ok) throw new Error('Błąd dodawania etapu')
  return response.json()
}

export const checkDuplicate = async (company, position) => {
  const params = new URLSearchParams({ company, position })
  const response = await fetch(`${API_URL}/applications/check-duplicate?${params}`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd sprawdzania duplikatów')
  return response.json()
}

export const updateApplication = async (applicationId, applicationData) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: 'PUT',
    headers: getHeaders('application/json'),
    body: JSON.stringify(applicationData)
  })
  if (!response.ok) throw new Error('Błąd aktualizacji aplikacji')
  return response.json()
}

export const deleteApplication = async (applicationId) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd usuwania aplikacji')
}

// CV API
export const fetchCVs = async () => {
  const response = await fetch(`${API_URL}/cv`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd pobierania CV')
  return response.json()
}

export const uploadCV = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${API_URL}/cv/upload`, {
    method: 'POST',
    headers: { 'X-Session-ID': getSessionId() },
    body: formData
  })
  if (!response.ok) throw new Error('Błąd uploadu CV')
  return response.json()
}

export const deleteCV = async (cvId) => {
  const response = await fetch(`${API_URL}/cv/${cvId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd usuwania CV')
}

export const assignCVToApplication = async (applicationId, cvId) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/cv`, {
    method: 'PATCH',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ cvId })
  })
  if (!response.ok) throw new Error('Błąd przypisania CV')
  return response.json()
}

export const getCVDownloadUrl = (cvId) => `${API_URL}/cv/${cvId}/download`

// Notes API
export const fetchNotes = async (applicationId) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/notes`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd pobierania notatek')
  return response.json()
}

export const createNote = async (applicationId, content) => {
  const response = await fetch(`${API_URL}/applications/${applicationId}/notes`, {
    method: 'POST',
    headers: getHeaders('application/json'),
    body: JSON.stringify({ content })
  })
  if (!response.ok) throw new Error('Błąd dodawania notatki')
  return response.json()
}

export const deleteNote = async (noteId) => {
  const response = await fetch(`${API_URL}/notes/${noteId}`, {
    method: 'DELETE',
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd usuwania notatki')
}

// Statistics API
export const fetchBadgeStats = async () => {
  const response = await fetch(`${API_URL}/statistics/badges`, {
    headers: getHeaders()
  })
  if (!response.ok) throw new Error('Błąd pobierania statystyk')
  return response.json()
}
