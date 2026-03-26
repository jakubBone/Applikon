import { useState, useEffect } from 'react'
import type { Application } from '../../types/domain'
import type { KanbanStatus } from './types'

interface MoveModalProps {
  isOpen: boolean
  onClose: () => void
  card: Application | null
  statuses: KanbanStatus[]
  onMove: (status: string) => void
  getApplicationsByStatus: (statusId: string) => Application[]
}

export function MoveModal({ isOpen, onClose, card, statuses, onMove, getApplicationsByStatus }: MoveModalProps) {
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
