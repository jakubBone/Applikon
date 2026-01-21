import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './KanbanBoard.css'

// Statusy Kanban - 3 kolumny
const STATUSES = [
  { id: 'WYSLANE', label: 'Wysłane', color: '#3498db' },
  { id: 'W_PROCESIE', label: 'W procesie', color: '#f39c12' },
  { id: 'ZAKONCZONE', label: 'Zakończone', color: '#95a5a6' },
]

// Predefiniowane etapy rekrutacji
const PREDEFINED_STAGES = [
  'Rozmowa z HR',
  'Rozmowa techniczna',
  'Rozmowa z managerem',
  'Zadanie rekrutacyjne',
  'Rozmowa finalna',
]

// Powody odmowy
const REJECTION_REASONS = [
  { id: 'BRAK_ODPOWIEDZI', label: 'Brak odpowiedzi' },
  { id: 'ODMOWA_MAILOWA', label: 'Odmowa mailowa' },
  { id: 'ODRZUCENIE_PO_ROZMOWIE', label: 'Odrzucenie po rozmowie' },
  { id: 'INNE', label: 'Inny powód' },
]

// Karta aplikacji (draggable)
function ApplicationCard({ application, isDragging, onClick, onStageChange }) {
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [customStageInput, setCustomStageInput] = useState('')
  const dropdownRef = useRef(null)

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    if (!showStageDropdown) return

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowStageDropdown(false)
        setCustomStageInput('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showStageDropdown])

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: application.id.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleClick = (e) => {
    if (e.defaultPrevented) return
    if (onClick) onClick(application)
  }

  const handleStageSelect = (stage) => {
    if (onStageChange) {
      onStageChange(application.id, {
        status: 'W_PROCESIE',
        currentStage: stage
      })
    }
    setShowStageDropdown(false)
    setCustomStageInput('')
  }

  const handleCustomStageSubmit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (customStageInput.trim()) {
      handleStageSelect(customStageInput.trim())
    }
  }

  const isOffer = application.status === 'OFERTA'
  const isRejected = application.status === 'ODMOWA'
  const isInProcess = application.status === 'W_PROCESIE'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card ${isOffer ? 'card-offer' : ''} ${isRejected ? 'card-rejected' : ''} ${showStageDropdown ? 'dropdown-open' : ''}`}
      onClick={handleClick}
    >
      <div className="card-header">
        {isOffer && <span className="card-icon offer">✓</span>}
        {isRejected && <span className="card-icon rejected">✗</span>}
        <h4>{application.company}</h4>
      </div>
      <p className="card-position">{application.position}</p>

      {/* Aktualny etap dla W_PROCESIE z możliwością zmiany */}
      {isInProcess && (
        <div className="card-stage-section" ref={dropdownRef}>
          <button
            className="stage-selector-btn"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowStageDropdown(!showStageDropdown)
            }}
          >
            <span className="stage-label">
              {application.currentStage || 'Wybierz etap...'}
            </span>
            <span className="stage-arrow">{showStageDropdown ? '▲' : '▼'}</span>
          </button>

          {showStageDropdown && (
            <div
              className="stage-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              {PREDEFINED_STAGES.map(stage => (
                <button
                  key={stage}
                  className={`stage-dropdown-item ${application.currentStage === stage ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleStageSelect(stage)
                  }}
                >
                  {application.currentStage === stage && <span className="check-icon">✓</span>}
                  {stage}
                </button>
              ))}
              <form
                className="custom-stage-form"
                onSubmit={handleCustomStageSubmit}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Inny etap..."
                  value={customStageInput}
                  onChange={(e) => setCustomStageInput(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
                <button
                  type="submit"
                  disabled={!customStageInput.trim()}
                  onClick={(e) => e.stopPropagation()}
                >
                  +
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Powód odmowy */}
      {isRejected && application.rejectionReason && (
        <div className="card-rejection">
          💬 {REJECTION_REASONS.find(r => r.id === application.rejectionReason)?.label || application.rejectionReason}
        </div>
      )}

      {/* Data aplikacji */}
      <div className="card-date">
        📅 Aplikowano: {new Date(application.appliedAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>
    </div>
  )
}

// Karta w overlay podczas przeciągania
function DragOverlayCard({ application }) {
  return (
    <div className="kanban-card dragging">
      <h4>{application.company}</h4>
      <p className="card-position">{application.position}</p>
    </div>
  )
}

// Modal wyboru etapu
function StageModal({ isOpen, onClose, onSelect, currentStage }) {
  const [customStage, setCustomStage] = useState('')

  if (!isOpen) return null

  const handleSelect = (stage) => {
    onSelect(stage)
    onClose()
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (customStage.trim()) {
      onSelect(customStage.trim())
      setCustomStage('')
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>Wybierz etap rekrutacji</h3>
        <div className="stage-options">
          {PREDEFINED_STAGES.map(stage => (
            <button
              key={stage}
              className={`stage-option ${currentStage === stage ? 'active' : ''}`}
              onClick={() => handleSelect(stage)}
            >
              {stage}
            </button>
          ))}
        </div>
        <form onSubmit={handleCustomSubmit} className="custom-stage">
          <input
            type="text"
            placeholder="Inny etap..."
            value={customStage}
            onChange={(e) => setCustomStage(e.target.value)}
          />
          <button type="submit" disabled={!customStage.trim()}>Dodaj</button>
        </form>
        <button className="modal-close" onClick={onClose}>Anuluj</button>
      </div>
    </div>
  )
}

// Modal zakończenia - wybór oferty lub odmowy
function EndModal({ isOpen, onClose, onSelect }) {
  const [selectedOutcome, setSelectedOutcome] = useState(null) // 'OFERTA' lub 'ODMOWA'
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionDetails, setRejectionDetails] = useState('')

  if (!isOpen) return null

  const handleSubmit = () => {
    if (selectedOutcome === 'OFERTA') {
      onSelect({ status: 'OFERTA' })
    } else if (selectedOutcome === 'ODMOWA') {
      onSelect({
        status: 'ODMOWA',
        rejectionReason: rejectionReason || 'INNE',
        rejectionDetails: rejectionDetails || null
      })
    }
    setSelectedOutcome(null)
    setRejectionReason('')
    setRejectionDetails('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content end-modal" onClick={e => e.stopPropagation()}>
        <h3>Jak zakończył się proces?</h3>

        <div className="outcome-options">
          <button
            className={`outcome-option offer ${selectedOutcome === 'OFERTA' ? 'selected' : ''}`}
            onClick={() => setSelectedOutcome('OFERTA')}
          >
            <span className="outcome-icon">✓</span>
            <span>Oferta otrzymana</span>
          </button>
          <button
            className={`outcome-option rejected ${selectedOutcome === 'ODMOWA' ? 'selected' : ''}`}
            onClick={() => setSelectedOutcome('ODMOWA')}
          >
            <span className="outcome-icon">✗</span>
            <span>Odmowa / Rezygnacja</span>
          </button>
        </div>

        {selectedOutcome === 'ODMOWA' && (
          <div className="rejection-form">
            <label>Powód:</label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            >
              <option value="">Wybierz powód...</option>
              {REJECTION_REASONS.map(reason => (
                <option key={reason.id} value={reason.id}>{reason.label}</option>
              ))}
            </select>
            {rejectionReason === 'INNE' && (
              <textarea
                placeholder="Szczegóły (opcjonalnie)..."
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
              />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-close" onClick={onClose}>Anuluj</button>
          <button
            className="modal-submit"
            onClick={handleSubmit}
            disabled={!selectedOutcome || (selectedOutcome === 'ODMOWA' && !rejectionReason)}
          >
            Zapisz
          </button>
        </div>
      </div>
    </div>
  )
}

// Kolumna Kanban
function KanbanColumn({ status, applications, children }) {
  const { setNodeRef } = useSortable({
    id: status.id,
    data: { type: 'column' }
  })

  return (
    <div className="kanban-column" ref={setNodeRef}>
      <div className="column-header" style={{ borderTopColor: status.color }}>
        <h3>{status.label}</h3>
        <span className="column-count">{applications.length}</span>
      </div>
      <div className="column-content">
        <SortableContext
          items={applications.map(app => app.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {children}
        </SortableContext>
      </div>
    </div>
  )
}

// Główny komponent Kanban
function KanbanBoard({ applications, onStatusChange, onStageChange, onCardClick }) {
  const [activeId, setActiveId] = useState(null)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [pendingApplication, setPendingApplication] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Sortowanie po dacie aplikacji (najnowsze na górze)
  const sortByDate = (apps) => {
    return [...apps].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
  }

  // Grupowanie aplikacji według statusu (łączymy OFERTA i ODMOWA w ZAKONCZONE)
  // Obsługuje też stare statusy: ROZMOWA, ZADANIE -> W_PROCESIE, ODRZUCONE -> ZAKONCZONE
  const getApplicationsByStatus = (statusId) => {
    let filtered
    if (statusId === 'ZAKONCZONE') {
      filtered = applications.filter(app =>
        app.status === 'OFERTA' ||
        app.status === 'ODMOWA' ||
        app.status === 'ODRZUCONE'  // stary status
      )
    } else if (statusId === 'W_PROCESIE') {
      filtered = applications.filter(app =>
        app.status === 'W_PROCESIE' ||
        app.status === 'ROZMOWA' ||  // stary status
        app.status === 'ZADANIE'     // stary status
      )
    } else {
      filtered = applications.filter(app => app.status === statusId)
    }
    return sortByDate(filtered)
  }

  const findApplication = (id) => {
    return applications.find(app => app.id.toString() === id)
  }

  const getColumnByStatus = (status) => {
    // Nowe statusy
    if (status === 'OFERTA' || status === 'ODMOWA') return 'ZAKONCZONE'
    // Stare statusy (kompatybilność wsteczna)
    if (status === 'ODRZUCONE') return 'ZAKONCZONE'
    if (status === 'ROZMOWA' || status === 'ZADANIE') return 'W_PROCESIE'
    return status
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeApp = findApplication(active.id)
    if (!activeApp) return

    let targetColumn = null

    // Sprawdź czy upuszczono na kartę lub kolumnę
    const overApp = findApplication(over.id)
    if (overApp) {
      targetColumn = getColumnByStatus(overApp.status)
    } else {
      const isColumn = STATUSES.find(s => s.id === over.id)
      if (isColumn) {
        targetColumn = over.id
      }
    }

    const currentColumn = getColumnByStatus(activeApp.status)

    // Jeśli nie ma zmiany kolumny, nic nie rób
    if (!targetColumn || targetColumn === currentColumn) return

    // Obsługa przejścia do W_PROCESIE
    if (targetColumn === 'W_PROCESIE') {
      setPendingApplication(activeApp)
      setStageModalOpen(true)
      return
    }

    // Obsługa przejścia do ZAKONCZONE
    if (targetColumn === 'ZAKONCZONE') {
      setPendingApplication(activeApp)
      setEndModalOpen(true)
      return
    }

    // Obsługa przejścia do WYSLANE (cofnięcie - czyści wszystkie dane)
    if (targetColumn === 'WYSLANE') {
      onStageChange(activeApp.id, {
        status: 'WYSLANE',
        currentStage: null,
        rejectionReason: null,
        rejectionDetails: null
      })
    }
  }

  const handleStageSelect = (stageName) => {
    if (pendingApplication) {
      onStageChange(pendingApplication.id, {
        status: 'W_PROCESIE',
        currentStage: stageName
      })
      setPendingApplication(null)
    }
  }

  const handleEndSelect = (endData) => {
    if (pendingApplication) {
      onStageChange(pendingApplication.id, endData)
      setPendingApplication(null)
    }
  }

  const activeApplication = activeId ? findApplication(activeId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {STATUSES.map(status => (
            <KanbanColumn
              key={status.id}
              status={status}
              applications={getApplicationsByStatus(status.id)}
            >
              {getApplicationsByStatus(status.id).map(app => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isDragging={activeId === app.id.toString()}
                  onClick={onCardClick}
                  onStageChange={onStageChange}
                />
              ))}
            </KanbanColumn>
          ))}
        </div>

        <DragOverlay>
          {activeApplication ? (
            <DragOverlayCard application={activeApplication} />
          ) : null}
        </DragOverlay>
      </DndContext>

      <StageModal
        isOpen={stageModalOpen}
        onClose={() => {
          setStageModalOpen(false)
          setPendingApplication(null)
        }}
        onSelect={handleStageSelect}
        currentStage={pendingApplication?.currentStage}
      />

      <EndModal
        isOpen={endModalOpen}
        onClose={() => {
          setEndModalOpen(false)
          setPendingApplication(null)
        }}
        onSelect={handleEndSelect}
      />
    </>
  )
}

export default KanbanBoard
