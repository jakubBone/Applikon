import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Application, StageUpdateRequest } from '../../types/domain'
import { isMobile, PREDEFINED_STAGES, REJECTION_REASONS } from './types'

export interface ApplicationCardProps {
  application: Application
  isDragging: boolean
  onClick: (app: Application) => void
  onStageChange: (id: number, data: StageUpdateRequest) => void
  onLongPress: (app: Application) => void
}

export function ApplicationCard({ application, isDragging, onClick, onStageChange, onLongPress }: ApplicationCardProps) {
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
