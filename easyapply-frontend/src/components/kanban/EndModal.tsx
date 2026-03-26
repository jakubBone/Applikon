import { useState } from 'react'
import type { StageUpdateRequest } from '../../types/domain'
import { REJECTION_REASONS } from './types'

interface EndModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (endData: StageUpdateRequest) => void
}

export function EndModal({ isOpen, onClose, onSelect }: EndModalProps) {
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
