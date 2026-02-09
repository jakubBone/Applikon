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

// Flaga zapobiegająca równoczesnemu dodawaniu demo (race condition)
let isAddingDemo = false

// Jednorazowe czyszczenie starej flagi (może być usunięte po migracji)
if (typeof window !== 'undefined') {
  localStorage.removeItem('easyapply_demo_initialized')
}

// Funkcja do inicjalizacji przykładowej aplikacji (demo)
// Demo pojawia się TYLKO gdy baza jest PUSTA
export const ensureDemoApplication = async () => {
  // Jeśli już trwa proces dodawania demo, poczekaj
  if (isAddingDemo) {
    return
  }

  try {
    isAddingDemo = true

    // Pobierz wszystkie aplikacje użytkownika
    const allApps = await fetchApplications()

    // Jeśli użytkownik ma JAKIEKOLWIEK aplikacje, nie dodawaj demo
    if (allApps.length > 0) {
      return
    }

    // Baza pusta → dodaj demo aplikację
    const demoApplication = {
      company: 'Google',
      position: 'Junior Software Engineer',
      salaryMin: 7000,
      salaryMax: 8000,
      currency: 'PLN',
      salaryType: 'NETTO',
      contractType: 'UOP',
      source: 'JustJoinIT',
      link: 'https://justjoin.it/',
      jobDescription: `🚀 Junior Software Developer (Java)

We are looking for a motivated Junior Java Developer to join our growing team 💻

🛠 Requirements (must have):

- Good understanding of Java SE ☕ (collections, OOP, exceptions)
- Basic knowledge of Spring / Spring Boot
- Ability to work with REST APIs
- Basic experience with SQL and relational databases 🗄️
- Knowledge of Git (basic commands)
- Understanding of clean code principles ✨
- English at a communicative level

✨ Nice to have:

- Basic knowledge of Hibernate / JPA
- Familiarity with Maven or Gradle
- Basic understanding of unit testing (JUnit)
- Any commercial, academic, or personal Java projects 🚀

🎁 We offer:

- Mentorship from experienced developers 👨‍🏫
- Real projects and hands-on experience
- Friendly team and good atmosphere 😊
- Flexible working hours ⏰

Remote or hybrid work options 🌍

📍 Location: Poland / Remote
📄 Employment type: To be agreed

📩 Sounds interesting? Send us your CV and start your Java career with us! 💙`
    }

    await createApplication(demoApplication)
    console.log('✅ Demo aplikacja dodana (baza była pusta)')
  } finally {
    isAddingDemo = false
  }
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
