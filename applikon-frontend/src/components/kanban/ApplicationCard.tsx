import { useState, useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import type { Application, StageUpdateRequest } from '../../types/domain'
import { isMobile, PREDEFINED_STAGES, REJECTION_REASONS, translateStageName, normalizeStageKey } from './types'

export interface ApplicationCardProps {
  application: Application
  isDragging: boolean
  onClick: (app: Application) => void
  onStageChange: (id: number, data: StageUpdateRequest) => void
  onLongPress: (app: Application) => void
  onEdit: (app: Application) => void
  onDelete: (id: number) => void
}

export function ApplicationCard({ application, isDragging, onClick, onStageChange, onLongPress, onEdit, onDelete }: ApplicationCardProps) {
  const { t, i18n } = useTranslation()
  const [showStageDropdown, setShowStageDropdown] = useState(false)
  const [customStageInput, setCustomStageInput] = useState('')
  const [isLifting, setIsLifting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<number | null>(null)
  const touchMovedRef = useRef<boolean>(false)

  // Close stage dropdown on outside click
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

  // Close context menu on outside click
  useEffect(() => {
    if (!showMenu) return
    const close = () => setShowMenu(false)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [showMenu])

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
      // Quick tap - normal click behavior (no long press occurred)
      // Do nothing — this is handled as a drag & drop event
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
      status: 'IN_PROGRESS',
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

  const isOffer = application.status === 'OFFER'
  const isRejected = application.status === 'REJECTED'
  const isInProcess = application.status === 'IN_PROGRESS'

  return (
    <>
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
        {showHint && <div className="card-long-press-hint">{t('kanban.longPressHint')}</div>}
        <div className="card-header">
          <div className="card-header-left">
            {isOffer && <span className="card-icon offer">✓</span>}
            {isRejected && <span className="card-icon rejected">✗</span>}
            <h4>{application.company}</h4>
          </div>
          <div
            className="card-menu-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="card-menu-icon"
              onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m) }}
            >⋮</span>
            {showMenu && (
              <div className="context-menu">
                <button
                  className="context-menu-item"
                  onClick={() => { setShowMenu(false); onEdit(application) }}
                >
                  {t('details.edit')}
                </button>
                <button
                  className="context-menu-item danger"
                  onClick={() => { setShowMenu(false); setShowDeleteConfirm(true) }}
                >
                  {t('table.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
        <p className="card-position">{application.position}</p>

        {/* Current stage for W_PROCESIE with option to change */}
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
                {application.currentStage ? translateStageName(application.currentStage, t) : t('kanban.stageSelect')}
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
                    key={stage.key}
                    className={`stage-dropdown-item ${normalizeStageKey(application.currentStage) === stage.key ? 'active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStageSelect(stage.key)
                    }}
                  >
                    {normalizeStageKey(application.currentStage) === stage.key && <span className="check-icon">✓</span>}
                    {t(stage.labelKey)}
                  </button>
                ))}
                <form
                  className="custom-stage-form"
                  onSubmit={handleCustomStageSubmit}
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    placeholder={t('kanban.customStage')}
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

        {/* Rejection reason */}
        {isRejected && application.rejectionReason && (
          <div className="card-rejection">
            💬 {REJECTION_REASONS.find(r => r.id === application.rejectionReason)?.labelKey
              ? t(REJECTION_REASONS.find(r => r.id === application.rejectionReason)!.labelKey)
              : application.rejectionReason}
          </div>
        )}

        {/* Data aplikacji */}
        <div className="card-date">
          📅 {t('kanban.cardDate')} {new Date(application.appliedAt).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>{t('table.confirmDeleteTitle')}</h3>
            <p>{t('table.confirmDeleteMsg', { count: 1 })}</p>
            <p className="confirm-warning">{t('table.confirmDeleteWarning')}</p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setShowDeleteConfirm(false)}>
                {t('table.cancel')}
              </button>
              <button className="confirm-btn delete" onClick={() => { setShowDeleteConfirm(false); onDelete(application.id) }}>
                {t('table.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
