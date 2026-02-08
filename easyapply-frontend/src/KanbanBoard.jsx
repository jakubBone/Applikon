import { useState, useEffect, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  MouseSensor,
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

// Helper: Check if mobile
const isMobile = () => window.innerWidth <= 768

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
function ApplicationCard({ application, isDragging, onClick, onStageChange, onLongPress }) {
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [customStageInput, setCustomStageInput] = useState('')
  const [isLifting, setIsLifting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const dropdownRef = useRef(null)
  const pressTimerRef = useRef(null)
  const touchMovedRef = useRef(false)

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

  // Long press detection (mobile only - 500ms)
  const handleTouchStart = (e) => {
    if (!isMobile()) return

    touchMovedRef.current = false

    pressTimerRef.current = setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Visual feedback
      setIsLifting(true)

      // Trigger long press immediately
      if (onLongPress) {
        onLongPress(application)
      }

      // Hide hint after modal opens
      setTimeout(() => {
        setIsLifting(false)
        setShowHint(false)
      }, 100)
    }, 500) // 500ms = 0.5 seconds
  }

  const handleTouchMove = () => {
    touchMovedRef.current = true
    clearTimeout(pressTimerRef.current)
    setIsLifting(false)
    setShowHint(false)
  }

  const handleTouchEnd = () => {
    clearTimeout(pressTimerRef.current)
    if (!touchMovedRef.current && !showHint) {
      // Quick tap - normal click behavior
    }
    setTimeout(() => {
      if (!document.querySelector('.move-modal')) {
        setIsLifting(false)
        setShowHint(false)
      }
    }, 100)
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
      className={`kanban-card ${isOffer ? 'card-offer' : ''} ${isRejected ? 'card-rejected' : ''} ${showStageDropdown ? 'dropdown-open' : ''} ${isLifting ? 'lifting' : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {showHint && <div className="card-long-press-hint">👆 Przytrzymaj...</div>}
      <div className="card-header">
        <div className="card-header-left">
          {isOffer && <span className="card-icon offer">✓</span>}
          {isRejected && <span className="card-icon rejected">✗</span>}
          <h4>{application.company}</h4>
        </div>
        <span className="card-menu-icon">⋮</span>
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

// Onboarding Overlay (tylko mobile, pierwszy raz)
function OnboardingOverlay({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding-content" onClick={e => e.stopPropagation()}>
        <div className="onboarding-emoji">👋</div>
        <div className="onboarding-title">Witaj w Kanban Mobile!</div>

        <div className="onboarding-steps">
          <div className="onboarding-step">
            <div className="onboarding-step-icon">📱</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">Przesuń palcem</div>
              <div className="onboarding-step-desc">Swipe w lewo/prawo aby zobaczyć inne kolumny</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step-icon">👆</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">Przytrzymaj kartę</div>
              <div className="onboarding-step-desc">Long press (0.5s) aby przenieść do innej sekcji</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step-icon">📳</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">Wibracja</div>
              <div className="onboarding-step-desc">Poczujesz wibrację gdy karta będzie gotowa do przeniesienia</div>
            </div>
          </div>
        </div>

        <button className="onboarding-btn" onClick={onClose}>Rozumiem, zaczynamy!</button>
      </div>
    </div>
  )
}

// Move Modal (Bottom Sheet dla mobile)
function MoveModal({ isOpen, onClose, card, statuses, onMove, getApplicationsByStatus }) {
  const [selectedStatus, setSelectedStatus] = useState(null)

  useEffect(() => {
    if (card) {
      setSelectedStatus(card.status === 'OFERTA' || card.status === 'ODMOWA' ? 'ZAKONCZONE' : card.status)
    }
  }, [card])

  if (!isOpen || !card) return null

  const currentStatus = card.status === 'OFERTA' || card.status === 'ODMOWA' ? 'ZAKONCZONE' : card.status

  const handleMove = () => {
    if (selectedStatus && selectedStatus !== currentStatus) {
      onMove(selectedStatus)
    }
    onClose()
  }

  return (
    <div className="move-modal" onClick={onClose}>
      <div className="move-modal-content" onClick={e => e.stopPropagation()}>
        <div className="move-modal-header">
          <div className="move-modal-title">Przenieś aplikację</div>
          <div className="move-modal-card-preview">
            <div className="move-modal-card-company">{card.company}</div>
            <div className="move-modal-card-position">{card.position}</div>
          </div>
        </div>

        <div className="move-modal-label">Wybierz docelową sekcję:</div>
        <div className="move-options">
          {statuses.map(status => {
            const isCurrent = status.id === currentStatus
            const isSelected = status.id === selectedStatus
            const count = getApplicationsByStatus(status.id).length

            return (
              <div
                key={status.id}
                className={`move-option ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => !isCurrent && setSelectedStatus(status.id)}
              >
                <div className="move-option-radio"></div>
                <div className="move-option-color" style={{ background: status.color }}></div>
                <div className="move-option-text">
                  <div className="move-option-name">{status.label}</div>
                  <div className="move-option-count">{count} aplikacji</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="move-modal-actions">
          <button className="move-modal-btn cancel" onClick={onClose}>Anuluj</button>
          <button
            className="move-modal-btn confirm"
            onClick={handleMove}
            disabled={!selectedStatus || selectedStatus === currentStatus}
          >
            Przenieś
          </button>
        </div>
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

  // Mobile states
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [moveModalCard, setMoveModalCard] = useState(null)
  const [successToast, setSuccessToast] = useState(null)
  const [activeColumn, setActiveColumn] = useState(0)
  const kanbanBoardRef = useRef(null)

  // Check onboarding on mount (mobile only)
  useEffect(() => {
    if (isMobile() && !localStorage.getItem('kanban_onboarding_shown')) {
      setShowOnboarding(true)
    }
  }, [])

  // Enhanced sensors for better mobile support
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
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

  // Mobile: Onboarding close
  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    localStorage.setItem('kanban_onboarding_shown', 'true')
    if (isMobile()) {
      showAnimatedHint()
    }
  }

  // Mobile: Animated hint (first time)
  const showAnimatedHint = () => {
    setShowSwipeHint(true)
    const board = kanbanBoardRef.current
    if (board) {
      setTimeout(() => {
        board.scrollTo({ left: 250, behavior: 'smooth' })
        setTimeout(() => {
          board.scrollTo({ left: 0, behavior: 'smooth' })
          setTimeout(() => {
            setShowSwipeHint(false)
          }, 800)
        }, 1000)
      }, 500)
    }
  }

  // Mobile: Long press handler
  const handleLongPress = (application) => {
    if (!isMobile()) return
    setMoveModalCard(application)
    setMoveModalOpen(true)
  }

  // Mobile: Move card via modal
  const handleMoveCard = (targetStatus) => {
    if (!moveModalCard) return

    // Obsługa przejścia do W_PROCESIE
    if (targetStatus === 'W_PROCESIE') {
      setPendingApplication(moveModalCard)
      setStageModalOpen(true)
      setMoveModalOpen(false)
      setMoveModalCard(null)
      return
    }

    // Obsługa przejścia do ZAKONCZONE
    if (targetStatus === 'ZAKONCZONE') {
      setPendingApplication(moveModalCard)
      setEndModalOpen(true)
      setMoveModalOpen(false)
      setMoveModalCard(null)
      return
    }

    // Obsługa przejścia do WYSLANE (cofnięcie)
    if (targetStatus === 'WYSLANE') {
      onStageChange(moveModalCard.id, {
        status: 'WYSLANE',
        currentStage: null,
        rejectionReason: null,
        rejectionDetails: null
      })
    }

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([50, 100, 50])

    // Success toast
    const targetStatusLabel = STATUSES.find(s => s.id === targetStatus)?.label
    showSuccessToast(`✓ Przeniesiono do: ${targetStatusLabel}`)

    setMoveModalOpen(false)
    setMoveModalCard(null)
  }

  // Mobile: Success toast
  const showSuccessToast = (message) => {
    setSuccessToast(message)
    setTimeout(() => {
      setSuccessToast(null)
    }, 2000)
  }

  // Mobile: Scroll tracking
  useEffect(() => {
    if (!isMobile()) return

    const handleScroll = () => {
      const board = kanbanBoardRef.current
      if (!board) return

      const scrollLeft = board.scrollLeft
      const columnWidth = board.querySelector('.kanban-column')?.offsetWidth || 0
      const gap = 16
      const index = Math.round(scrollLeft / (columnWidth + gap))
      setActiveColumn(index)
    }

    const board = kanbanBoardRef.current
    if (board) {
      board.addEventListener('scroll', handleScroll)
      return () => board.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Mobile: Navigate to column
  const scrollToColumn = (index) => {
    const board = kanbanBoardRef.current
    if (!board) return

    const columnWidth = board.querySelector('.kanban-column')?.offsetWidth || 0
    const gap = 16
    board.scrollTo({ left: index * (columnWidth + gap), behavior: 'smooth' })
  }

  const activeApplication = activeId ? findApplication(activeId) : null

  return (
    <>
      {/* Mobile: Onboarding (first time) */}
      {isMobile() && (
        <OnboardingOverlay
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
        />
      )}

      {/* Mobile: Navigation buttons */}
      {isMobile() && (
        <div className="kanban-nav">
          {STATUSES.map((status, idx) => (
            <button
              key={status.id}
              className={`kanban-nav-btn ${activeColumn === idx ? 'active' : ''}`}
              onClick={() => scrollToColumn(idx)}
            >
              <span className="count">{getApplicationsByStatus(status.id).length}</span>
              {status.label}
            </button>
          ))}
        </div>
      )}

      <div className="kanban-board-container">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board" ref={kanbanBoardRef}>
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
                    onLongPress={handleLongPress}
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

        {/* Mobile: Scroll indicators */}
        {isMobile() && (
          <div className="scroll-indicator">
            {STATUSES.map((_, idx) => (
              <span key={idx} className={activeColumn === idx ? 'active' : ''}></span>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: Swipe hint */}
      {showSwipeHint && (
        <div className="swipe-hint">
          ← Przesuń palcem →
        </div>
      )}

      {/* Mobile: Success toast */}
      {successToast && (
        <div className={`success-toast ${!successToast ? 'fade-out' : ''}`}>
          {successToast}
        </div>
      )}

      {/* Mobile: Move modal */}
      <MoveModal
        isOpen={moveModalOpen}
        onClose={() => {
          setMoveModalOpen(false)
          setMoveModalCard(null)
        }}
        card={moveModalCard}
        statuses={STATUSES}
        onMove={handleMoveCard}
        getApplicationsByStatus={getApplicationsByStatus}
      />

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
