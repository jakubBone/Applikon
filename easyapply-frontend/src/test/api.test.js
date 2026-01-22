import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchApplications,
  createApplication,
  updateApplicationStatus,
  updateApplicationStage,
  addStage,
  checkDuplicate,
  updateApplication,
  deleteApplication,
  fetchCVs,
  uploadCV,
  deleteCV,
  assignCVToApplication,
  getCVDownloadUrl,
  fetchNotes,
  createNote,
  deleteNote,
  fetchBadgeStats
} from '../services/api'

const API_URL = 'http://localhost:8080/api'

describe('API Service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ==================== Applications API ====================

  describe('Applications API', () => {
    it('fetchApplications - pobiera liste aplikacji', async () => {
      const mockApplications = [
        { id: 1, company: 'Google', position: 'Dev' },
        { id: 2, company: 'Meta', position: 'Engineer' }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApplications)
      })

      const result = await fetchApplications()

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/applications`)
      expect(result).toEqual(mockApplications)
    })

    it('fetchApplications - rzuca blad przy nieudanym zapytaniu', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await expect(fetchApplications()).rejects.toThrow('Błąd pobierania aplikacji')
    })

    it('createApplication - tworzy nowa aplikacje', async () => {
      const newApp = { company: 'Google', position: 'Dev', salaryMin: 8000 }
      const createdApp = { id: 1, ...newApp, status: 'WYSLANE' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdApp)
      })

      const result = await createApplication(newApp)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newApp)
        })
      )
      expect(result).toEqual(createdApp)
    })

    it('updateApplicationStatus - zmienia status aplikacji', async () => {
      const updatedApp = { id: 1, status: 'W_PROCESIE' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedApp)
      })

      const result = await updateApplicationStatus(1, 'W_PROCESIE')

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1/status`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'W_PROCESIE' })
        })
      )
      expect(result).toEqual(updatedApp)
    })

    it('updateApplicationStage - zmienia etap aplikacji', async () => {
      const stageData = { status: 'W_PROCESIE', currentStage: 'Rozmowa z HR' }
      const updatedApp = { id: 1, ...stageData }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedApp)
      })

      const result = await updateApplicationStage(1, stageData)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1/stage`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(stageData)
        })
      )
      expect(result).toEqual(updatedApp)
    })

    it('addStage - dodaje nowy etap do aplikacji', async () => {
      const updatedApp = { id: 1, currentStage: 'Rozmowa techniczna', stageHistory: [{ stageName: 'Rozmowa techniczna' }] }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedApp)
      })

      const result = await addStage(1, 'Rozmowa techniczna')

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1/stage`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageName: 'Rozmowa techniczna' })
        })
      )
      expect(result).toEqual(updatedApp)
    })

    it('addStage - rzuca blad przy nieudanym zapytaniu', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await expect(addStage(1, 'Test')).rejects.toThrow('Błąd dodawania etapu')
    })

    it('checkDuplicate - sprawdza duplikaty', async () => {
      const duplicates = [{ id: 1, company: 'Google', position: 'Dev' }]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(duplicates)
      })

      const result = await checkDuplicate('Google', 'Dev')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('check-duplicate?company=Google&position=Dev')
      )
      expect(result).toEqual(duplicates)
    })

    it('updateApplication - aktualizuje aplikacje', async () => {
      const updateData = { company: 'Google Updated', position: 'Senior Dev' }
      const updatedApp = { id: 1, ...updateData }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedApp)
      })

      const result = await updateApplication(1, updateData)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1`,
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData)
        })
      )
      expect(result).toEqual(updatedApp)
    })

    it('deleteApplication - usuwa aplikacje', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await deleteApplication(1)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  // ==================== CV API ====================

  describe('CV API', () => {
    it('fetchCVs - pobiera liste CV', async () => {
      const mockCVs = [
        { id: 1, originalFileName: 'CV1.pdf', type: 'FILE' },
        { id: 2, originalFileName: 'CV2.pdf', type: 'LINK' }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCVs)
      })

      const result = await fetchCVs()

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/cv`)
      expect(result).toEqual(mockCVs)
    })

    it('uploadCV - uploaduje plik CV', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
      const uploadedCV = { id: 1, originalFileName: 'test.pdf', type: 'FILE' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(uploadedCV)
      })

      const result = await uploadCV(file)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/cv/upload`,
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(uploadedCV)
    })

    it('deleteCV - usuwa CV', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await deleteCV(1)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/cv/1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('assignCVToApplication - przypisuje CV do aplikacji', async () => {
      const updatedApp = { id: 1, cvId: 5, cvFileName: 'CV.pdf' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(updatedApp)
      })

      const result = await assignCVToApplication(1, 5)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1/cv`,
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ cvId: 5 })
        })
      )
      expect(result).toEqual(updatedApp)
    })

    it('getCVDownloadUrl - zwraca poprawny URL do pobrania', () => {
      const url = getCVDownloadUrl(123)
      expect(url).toBe(`${API_URL}/cv/123/download`)
    })
  })

  // ==================== Notes API ====================

  describe('Notes API', () => {
    it('fetchNotes - pobiera notatki dla aplikacji', async () => {
      const mockNotes = [
        { id: 1, content: 'Notatka 1', category: 'PYTANIA' },
        { id: 2, content: 'Notatka 2', category: 'FEEDBACK' }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotes)
      })

      const result = await fetchNotes(1)

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/applications/1/notes`)
      expect(result).toEqual(mockNotes)
    })

    it('createNote - tworzy nowa notatke', async () => {
      const createdNote = { id: 1, content: 'Test', category: 'INNE' }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdNote)
      })

      const result = await createNote(1, 'Test')

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/applications/1/notes`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Test' })
        })
      )
      expect(result).toEqual(createdNote)
    })

    it('deleteNote - usuwa notatke', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true })

      await deleteNote(1)

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_URL}/notes/1`,
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  // ==================== Statistics API ====================

  describe('Statistics API', () => {
    it('fetchBadgeStats - pobiera statystyki odznak', async () => {
      const mockStats = {
        totalRejections: 5,
        totalGhosting: 3,
        totalOffers: 1,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊' },
        ghostingBadge: { name: null }
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockStats)
      })

      const result = await fetchBadgeStats()

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/statistics/badges`)
      expect(result).toEqual(mockStats)
    })

    it('fetchBadgeStats - rzuca blad przy nieudanym zapytaniu', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await expect(fetchBadgeStats()).rejects.toThrow('Błąd pobierania statystyk')
    })
  })
})
