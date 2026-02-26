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
import type { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Application, StageUpdateRequest } from './types/domain'
import './KanbanBoard.css'

// Helper: Check if mobile
const isMobile = () => window.innerWidth <= 768

interface KanbanStatus {
  id: string
  label: string
  color: string
}

// Statusy Kanban - 3 kolumny
const STATUSES: KanbanStatus[] = [
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
interface ApplicationCardProps {
  application: Application
  isDragging: boolean
  onClick: (app: Application) => void
  onStageChange: (id: number, data: StageUpdateRequest) => void
  onLongPress: (app: Application) => void
}

function ApplicationCard({ application, isDragging, onClick, onStageChange, onLongPress }: ApplicationCardProps) {
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [customStageInput, setCustomStageInput] = useState('')
  const [isLifting, setIsLifting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<number | null>(null)
  const touchMovedRef = useRef<boolean>(false)

  // Zamknij dropdown przy kliknięciu poza
  useEffect(() => {
    if (!showStageDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  const handleTouchStart = () => {
    if (!isMobile()) return

    touchMovedRef.current = false

    pressTimerRef.current = window.setTimeout(() => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Visual feedback
      setIsLifting(true)

      // Trigger long press immediately
      onLongPress(application)

      // Hide hint after modal opens
      setTimeout(() => {
        setIsLifting(false)
        setShowHint(false)
      }, 100)
    }, 500) // 500ms = 0.5 seconds
  }

  const handleTouchMove = () => {
    touchMovedRef.current = true
    if (pressTimerRef.current !== null) clearTimeout(pressTimerRef.current)
    setIsLifting(false)
    setShowHint(false)
  }

  const handleTouchEnd = () => {
    if (pressTimerRef.current !== null) clearTimeout(pressTimerRef.current)
    if (!touchMovedRef.current && !showHint) {
      // Quick tap - normal click behavior (jeśli nie było long press)
      // Nic nie robimy, bo to drag & drop event
    }
    setTimeout(() => {
      if (!document.querySelector('.move-modal')) {
        setIsLifting(false)
        setShowHint(false)
      }
    }, 100)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return
    onClick(application)
  }

  const handleStageSelect = (stage: string) => {
    onStageChange(application.id, {
      status: 'W_PROCESIE',
      currentStage: stage
    })
    setShowStageDropdown(false)
    setCustomStageInput('')
  }

  const handleCustomStageSubmit = (e: React.FormEvent) => {
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
interface DragOverlayCardProps {
  application: Application
}

function DragOverlayCard({ application }: DragOverlayCardProps) {
  return (
    <div className="kanban-card dragging">
      <h4>{application.company}</h4>
      <p className="card-position">{application.position}</p>
    </div>
  )
}

// Modal wyboru etapu
interface StageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (stage: string) => void
  currentStage?: string | null
}

function StageModal({ isOpen, onClose, onSelect, currentStage }: StageModalProps) {
  const [customStage, setCustomStage] = useState('')

  if (!isOpen) return null

  const handleSelect = (stage: string) => {
    onSelect(stage)
    onClose()
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
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
interface OnboardingOverlayProps {
  isOpen: boolean
  onClose: () => void
}

function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
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
interface MoveModalProps {
  isOpen: boolean
  onClose: () => void
  card: Application | null
  statuses: KanbanStatus[]
  onMove: (status: string) => void
  getApplicationsByStatus: (statusId: string) => Application[]
}

function MoveModal({ isOpen, onClose, card, statuses, onMove, getApplicationsByStatus }: MoveModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

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
          <div className="move-modal-title">Zmień status aplikacji</div>
        </div>

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
interface EndModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (endData: StageUpdateRequest) => void
}

function EndModal({ isOpen, onClose, onSelect }: EndModalProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<'OFERTA' | 'ODMOWA' | null>(null)
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
interface KanbanColumnProps {
  status: KanbanStatus
  applications: Application[]
  children: React.ReactNode
}

function KanbanColumn({ status, applications, children }: KanbanColumnProps) {
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
interface KanbanBoardProps {
  applications: Application[]
  onStatusChange: (id: number, status: string) => void
  onStageChange: (id: number, data: StageUpdateRequest) => void
  onCardClick: (app: Application) => void
}

function KanbanBoard({ applications, onStatusChange: _onStatusChange, onStageChange, onCardClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stageModalOpen, setStageModalOpen] = useState(false)
  const [endModalOpen, setEndModalOpen] = useState(false)
  const [pendingApplication, setPendingApplication] = useState<Application | null>(null)

  // Mobile states
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(false)
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [moveModalCard, setMoveModalCard] = useState<Application | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const [activeColumn, setActiveColumn] = useState(0)
  const kanbanBoardRef = useRef<HTMLDivElement>(null)

  // Check onboarding on mount (mobile only) - DISABLED (replaced by main TourGuide)
  // useEffect(() => {
  //   if (isMobile() && !localStorage.getItem('kanban_onboarding_shown')) {
  //     setShowOnboarding(true)
  //   }
  // }, [])

  // Enhanced sensors for better mobile support
  // Na mobile wyłączamy TouchSensor, żeby long-press działał bez konfliktów
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 }
    }),
    // WYŁĄCZ TouchSensor na mobile - long press wtedy zadziała
    ...(isMobile() ? [] : [
      useSensor(TouchSensor, {
        activationConstraint: {
          delay: 250,
          tolerance: 5
        }
      })
    ]),
    useSensor(KeyboardSensor)
  )

  // Sortowanie po dacie aplikacji (najnowsze na górze)
  const sortByDate = (apps: Application[]): Application[] => {
    return [...apps].sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime())
  }

  // Grupowanie aplikacji według statusu (łączymy OFERTA i ODMOWA w ZAKONCZONE)
  // Obsługuje też stare statusy: ROZMOWA, ZADANIE -> W_PROCESIE, ODRZUCONE -> ZAKONCZONE
  const getApplicationsByStatus = (statusId: string): Application[] => {
    let filtered: Application[]
    if (statusId === 'ZAKONCZONE') {
      filtered = applications.filter(app =>
        app.status === 'OFERTA' ||
        app.status === 'ODMOWA'
      )
    } else if (statusId === 'W_PROCESIE') {
      filtered = applications.filter(app =>
        app.status === 'W_PROCESIE'
      )
    } else {
      filtered = applications.filter(app => app.status === statusId)
    }
    return sortByDate(filtered)
  }

  const findApplication = (id: string): Application | undefined => {
    return applications.find(app => app.id.toString() === id)
  }

  const getColumnByStatus = (status: string): string => {
    // Nowe statusy
    if (status === 'OFERTA' || status === 'ODMOWA') return 'ZAKONCZONE'
    // Stare statusy (kompatybilność wsteczna)
    if (status === 'ODRZUCONE') return 'ZAKONCZONE'
    if (status === 'ROZMOWA' || status === 'ZADANIE') return 'W_PROCESIE'
    return status
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeApp = findApplication(active.id as string)
    if (!activeApp) return

    let targetColumn: string | null = null

    // Sprawdź czy upuszczono na kartę lub kolumnę
    const overApp = findApplication(over.id as string)
    if (overApp) {
      targetColumn = getColumnByStatus(overApp.status)
    } else {
      const isColumn = STATUSES.find(s => s.id === over.id)
      if (isColumn) {
        targetColumn = over.id as string
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

  const handleStageSelect = (stageName: string) => {
    if (pendingApplication) {
      onStageChange(pendingApplication.id, {
        status: 'W_PROCESIE',
        currentStage: stageName
      })
      setPendingApplication(null)
    }
  }

  const handleEndSelect = (endData: StageUpdateRequest) => {
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
  const handleLongPress = (application: Application) => {
    if (!isMobile()) return
    setMoveModalCard(application)
    setMoveModalOpen(true)
  }

  // Mobile: Move card via modal
  const handleMoveCard = (targetStatus: string) => {
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
  const showSuccessToast = (message: string) => {
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
      const columnEl = board.querySelector('.kanban-column') as HTMLElement | null
      const columnWidth = columnEl?.offsetWidth ?? 0
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
  const scrollToColumn = (index: number) => {
    const board = kanbanBoardRef.current
    if (!board) return

    const columnEl = board.querySelector('.kanban-column') as HTMLElement | null
    const columnWidth = columnEl?.offsetWidth ?? 0
    const gap = 16
    board.scrollTo({ left: index * (columnWidth + gap), behavior: 'smooth' })
  }

  const activeApplication = activeId ? findApplication(activeId) : null

  return (
    <>
      {/* Mobile: Onboarding - DISABLED (replaced by main TourGuide) */}
      {/* {isMobile() && (
        <OnboardingOverlay
          isOpen={showOnboarding}
          onClose={handleOnboardingClose}
        />
      )} */}

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
