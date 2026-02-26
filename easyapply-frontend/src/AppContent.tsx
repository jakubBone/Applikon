import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import KanbanBoard from './components/kanban/KanbanBoard'
import CVManager from './components/cv/CVManager'
import ApplicationTable from './components/applications/ApplicationTable'
import { BadgeWidget } from './components/badges/BadgeWidget'
import TourGuide from './components/tour/TourGuide'
import { ApplicationForm } from './components/applications/ApplicationForm'
import { ApplicationDetails } from './components/applications/ApplicationDetails'
import {
  useApplications,
  useUpdateStatus,
  useUpdateStage,
  useDeleteApplication,
  applicationKeys,
} from './hooks/useApplications'
import type { Application, StageUpdateRequest } from './types/domain'
import './App.css'

type View = 'kanban' | 'list' | 'cv' | 'details'

export default function AppContent() {
  const [view, setView] = useState<View>('kanban')
  const [previousView, setPreviousView] = useState<View>('kanban')
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const queryClient = useQueryClient()
  const { data: applications = [], isLoading } = useApplications()
  const updateStatus = useUpdateStatus()
  const updateStage = useUpdateStage()
  const deleteApplication = useDeleteApplication()

  // Derive selected application from the cache — always fresh after any mutation
  const selectedApp = applications.find(a => a.id === selectedAppId) ?? null

  // Synchronize logo width with view tabs width
  useEffect(() => {
    const syncLogoWidth = () => {
      const viewTabs = document.querySelector('.view-tabs') as HTMLElement | null
      const logoWrapper = document.querySelector('.logo-wrapper') as HTMLElement | null
      const logoImg = document.querySelector('.logo') as HTMLElement | null

      if (viewTabs && logoWrapper && logoImg) {
        const targetWidth = viewTabs.offsetWidth
        logoWrapper.style.width = `${targetWidth}px`
        logoImg.style.width = `${targetWidth}px`
      }
    }

    syncLogoWidth()
    window.addEventListener('resize', syncLogoWidth)
    const timeoutId = setTimeout(syncLogoWidth, 100)

    return () => {
      window.removeEventListener('resize', syncLogoWidth)
      clearTimeout(timeoutId)
    }
  }, [view])

  const handleViewDetails = (app: Application) => {
    setPreviousView(view)
    setSelectedAppId(app.id)
    setView('details')
  }

  const handleBackToList = () => {
    setSelectedAppId(null)
    setView(previousView)
  }

  const handleStatusChange = (applicationId: number, newStatus: string) => {
    updateStatus.mutate({ id: applicationId, status: newStatus })
  }

  const handleStageChange = (applicationId: number, stageData: StageUpdateRequest) => {
    updateStage.mutate({ id: applicationId, data: stageData })
  }

  const handleDeleteApplications = (ids: Set<number>) => {
    ids.forEach(id => deleteApplication.mutate(id))
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-wrapper">
            <img src="/logo-trim.png" alt="EasyApply logo" className="logo" />
          </div>
        </div>
        <BadgeWidget />
      </header>

      <TourGuide />

      {view !== 'details' && (
        <div className="toolbar">
          <div className="view-tabs">
            <button
              className={`tab-btn ${view === 'kanban' ? 'active' : ''}`}
              onClick={() => setView('kanban')}
            >
              Kanban
            </button>
            <button
              className={`tab-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              Lista
            </button>
            <button
              className={`tab-btn ${view === 'cv' ? 'active' : ''}`}
              onClick={() => setView('cv')}
            >
              CV
            </button>
          </div>
          <button className="add-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Zamknij' : '+ Dodaj aplikację'}
          </button>
        </div>
      )}

      {/* Floating Action Button (Mobile only) */}
      <button className="fab" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕' : '+'}
      </button>

      {showForm && (
        <ApplicationForm mode="create" onClose={() => setShowForm(false)} />
      )}

      <main className="main-content">
        {isLoading ? (
          <p className="loading">Ładowanie...</p>
        ) : view === 'details' && selectedApp ? (
          <ApplicationDetails application={selectedApp} onBack={handleBackToList} />
        ) : view === 'kanban' ? (
          <KanbanBoard
            applications={applications}
            onStatusChange={handleStatusChange}
            onStageChange={handleStageChange}
            onCardClick={handleViewDetails}
          />
        ) : view === 'cv' ? (
          <CVManager
            applications={applications}
            onCVAssigned={() => queryClient.invalidateQueries({ queryKey: applicationKeys.all })}
          />
        ) : (
          <ApplicationTable
            applications={applications}
            onRowClick={handleViewDetails}
            onStatusChange={handleStatusChange}
            onDelete={handleDeleteApplications}
          />
        )}
      </main>
    </div>
  )
}