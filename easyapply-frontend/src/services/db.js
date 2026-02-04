import Dexie from 'dexie'

// Inicjalizacja bazy danych IndexedDB
export const db = new Dexie('EasyApplyDB')

db.version(1).stores({
  applications: '++id, company, position, status, sessionId, appliedAt, currentStage',
  cvs: '++id, fileName, sessionId, uploadedAt',
  notes: '++id, applicationId, content, createdAt'
})

// Session ID management - identyczne jak w api.js
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

// === APPLICATIONS API ===

export const fetchApplications = async () => {
  const sessionId = getSessionId()
  return await db.applications
    .where('sessionId').equals(sessionId)
    .toArray()
}

export const createApplication = async (applicationData) => {
  const sessionId = getSessionId()
  const id = await db.applications.add({
    ...applicationData,
    sessionId,
    status: applicationData.status || 'WYSLANE', // Domyślny status dla Kanban
    currentStage: applicationData.currentStage || null,
    stages: applicationData.stages || [],
    appliedAt: applicationData.appliedAt || new Date().toISOString()
  })

  // Zwróć utworzony obiekt (API też zwraca pełny obiekt)
  return await db.applications.get(id)
}

export const updateApplicationStatus = async (applicationId, status) => {
  await db.applications.update(applicationId, { status })
  return await db.applications.get(applicationId)
}

export const updateApplicationStage = async (applicationId, stageData) => {
  await db.applications.update(applicationId, stageData)
  return await db.applications.get(applicationId)
}

export const addStage = async (applicationId, stageName) => {
  const app = await db.applications.get(applicationId)
  if (!app) throw new Error('Aplikacja nie znaleziona')

  // Dodaj nowy stage do listy stages
  const stages = app.stages || []
  stages.push(stageName)

  await db.applications.update(applicationId, {
    stages,
    currentStage: stageName
  })

  return await db.applications.get(applicationId)
}

export const checkDuplicate = async (company, position) => {
  const sessionId = getSessionId()
  const duplicates = await db.applications
    .where('sessionId').equals(sessionId)
    .filter(app =>
      app.company.toLowerCase() === company.toLowerCase() &&
      app.position.toLowerCase() === position.toLowerCase()
    )
    .toArray()

  return { isDuplicate: duplicates.length > 0 }
}

export const updateApplication = async (applicationId, applicationData) => {
  await db.applications.update(applicationId, applicationData)
  return await db.applications.get(applicationId)
}

export const deleteApplication = async (applicationId) => {
  // Usuń powiązane notatki
  await db.notes.where('applicationId').equals(applicationId).delete()
  // Usuń aplikację
  await db.applications.delete(applicationId)
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

  // Sprawdź rozmiar pliku (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Maksymalny rozmiar CV: 10MB')
  }

  const id = await db.cvs.add({
    fileName: file.name,
    originalFileName: file.name,
    fileSize: file.size,
    file: file, // Blob (plik PDF)
    sessionId,
    uploadedAt: new Date().toISOString()
  })

  // Zwróć obiekt w formacie API
  return await db.cvs.get(id)
}

export const deleteCV = async (cvId) => {
  await db.cvs.delete(cvId)
}

export const assignCVToApplication = async (applicationId, cvId) => {
  if (cvId === null) {
    // Usuń przypisanie CV
    await db.applications.update(applicationId, {
      cvId: null,
      cvFileName: null,
      cvType: null
    })
  } else {
    // Pobierz dane CV
    const cv = await db.cvs.get(cvId)
    if (!cv) throw new Error('CV nie znalezione')

    // Przypisz CV z pełnymi danymi
    await db.applications.update(applicationId, {
      cvId: cv.id,
      cvFileName: cv.originalFileName || cv.fileName,
      cvType: cv.type || 'FILE'
    })
  }

  return await db.applications.get(applicationId)
}

export const getCVDownloadUrl = (cvId) => {
  // Dla IndexedDB zwracamy specjalny URL, który obsłużymy inaczej
  return `indexeddb://cv/${cvId}`
}

export const createCV = async (cvData) => {
  const sessionId = getSessionId()
  const id = await db.cvs.add({
    ...cvData,
    sessionId,
    uploadedAt: new Date().toISOString()
  })
  return await db.cvs.get(id)
}

export const updateCV = async (cvId, cvData) => {
  await db.cvs.update(cvId, cvData)
  return await db.cvs.get(cvId)
}

// Helper do pobierania CV (dla IndexedDB)
export const downloadCVFromIndexedDB = async (cvId) => {
  const cv = await db.cvs.get(cvId)
  if (!cv) throw new Error('CV nie znalezione')

  const blobUrl = URL.createObjectURL(cv.file)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = cv.fileName
  link.click()
  URL.revokeObjectURL(blobUrl)
}

// === NOTES API ===

export const fetchNotes = async (applicationId) => {
  return await db.notes
    .where('applicationId').equals(applicationId)
    .toArray()
}

export const createNote = async (applicationId, content, category = 'INNE') => {
  const id = await db.notes.add({
    applicationId,
    content,
    category,
    createdAt: new Date().toISOString()
  })

  return await db.notes.get(id)
}

export const updateNote = async (noteId, content, category = 'INNE') => {
  await db.notes.update(noteId, { content, category })
  return await db.notes.get(noteId)
}

export const deleteNote = async (noteId) => {
  await db.notes.delete(noteId)
}

// === STATISTICS API ===

// Definicje odznak (zgodne z backend)
const BADGE_THRESHOLDS = {
  rejection: [
    { threshold: 5, name: 'Rękawica', icon: '🥊', description: 'Zakładasz rękawice. Rynek pracy jeszcze nie wie, z kim zadziera.' },
    { threshold: 10, name: 'Patelnia', icon: '🍳', description: 'Odrzucenia spływają po Tobie jak jajecznica po patelni.' },
    { threshold: 25, name: 'Niezniszczalny', icon: '🦾', description: '25 firm nie doceniło Twojego potencjału. To ich problem.' },
    { threshold: 50, name: 'Legenda Linkedina', icon: '👑', description: 'Pół setki odmów i wciąż w grze. Szacunek.' },
    { threshold: 100, name: 'Statystyczna Pewność', icon: '🎰', description: 'Przy takiej próbie, kolejna MUSI być ta właściwa.' }
  ],
  ghosting: [
    { threshold: 5, name: 'Widmo', icon: '👻', description: 'Firma się nie odezwała. Sprawdź, czy mają internet.' },
    { threshold: 15, name: 'Cierpliwy Mnich', icon: '🧘', description: '15 firm milczy jak zaklęte. Medytacja przed laptopem to Twoja codzienność.' },
    { threshold: 30, name: 'Detektyw', icon: '🔍', description: '30 aplikacji w próżni. Może ich serwer pocztowy zjadł pies?' },
    { threshold: 50, name: 'Człowiek-Duch', icon: '🫥', description: '50 firm udaje, że nie istniejesz. Zaczynasz wątpić w swoją realność.' },
    { threshold: 100, name: 'Król Ciszy', icon: '🤫', description: 'Mistrz ciszy. 100 firm milczy, a Ty wciąż wysyłasz. Legenda.' }
  ]
}

const calculateBadge = (count, type) => {
  const thresholds = BADGE_THRESHOLDS[type]
  let currentBadge = null
  let nextBadge = thresholds[0]

  for (let i = 0; i < thresholds.length; i++) {
    if (count >= thresholds[i].threshold) {
      currentBadge = thresholds[i]
      nextBadge = thresholds[i + 1] || null
    } else {
      break
    }
  }

  if (currentBadge) {
    return {
      name: currentBadge.name,
      icon: currentBadge.icon,
      description: currentBadge.description,
      nextThreshold: nextBadge?.threshold || null,
      nextBadgeName: nextBadge?.name || null
    }
  }

  return null
}

export const fetchBadgeStats = async () => {
  const sessionId = getSessionId()
  const apps = await db.applications
    .where('sessionId').equals(sessionId)
    .toArray()

  // Status ODMOWA = odrzucenie (nowy format)
  // Status ODRZUCONE = odrzucenie (stary format - kompatybilność)
  const totalRejections = apps.filter(a =>
    a.status === 'ODMOWA' || a.status === 'ODRZUCONE'
  ).length

  // Ghosting = brak odpowiedzi
  const totalGhosting = apps.filter(a =>
    (a.status === 'ODMOWA' || a.status === 'ODRZUCONE') &&
    a.rejectionReason === 'BRAK_ODPOWIEDZI'
  ).length

  const rejectionBadge = calculateBadge(totalRejections, 'rejection')
  const ghostingBadge = calculateBadge(totalGhosting, 'ghosting')

  // Sweet Revenge: oferta po 10+ odrzuceniach
  const totalOffers = apps.filter(a => a.status === 'OFERTA').length
  const sweetRevengeUnlocked = totalRejections >= 10 && totalOffers > 0

  return {
    rejectionBadge,
    ghostingBadge,
    sweetRevengeUnlocked,
    totalRejections,
    totalGhosting
  }
}
