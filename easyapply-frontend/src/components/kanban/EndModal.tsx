import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { StageUpdateRequest } from '../../types/domain'
import { REJECTION_REASONS } from './types'

interface EndModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (endData: StageUpdateRequest) => void
}

export function EndModal({ isOpen, onClose, onSelect }: EndModalProps) {
  const { t } = useTranslation()
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
        rejectionReason: rejectionReason || 'OTHER',
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
        <h3>{t('endModal.title')}</h3>

        <div className="outcome-options">
          <button
            className={`outcome-option offer ${selectedOutcome === 'OFERTA' ? 'selected' : ''}`}
            onClick={() => setSelectedOutcome('OFERTA')}
          >
            <span className="outcome-icon">✓</span>
            <span>{t('endModal.offer')}</span>
          </button>
          <button
            className={`outcome-option rejected ${selectedOutcome === 'ODMOWA' ? 'selected' : ''}`}
            onClick={() => setSelectedOutcome('ODMOWA')}
          >
            <span className="outcome-icon">✗</span>
            <span>{t('endModal.rejected')}</span>
          </button>
        </div>

        {selectedOutcome === 'ODMOWA' && (
          <div className="rejection-form">
            <label>{t('endModal.reason')}</label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            >
              <option value="">{t('endModal.selectReason')}</option>
              {REJECTION_REASONS.map(reason => (
                <option key={reason.id} value={reason.id}>{t(reason.labelKey)}</option>
              ))}
            </select>
            {rejectionReason === 'OTHER' && (
              <textarea
                placeholder={t('endModal.detailsPlaceholder')}
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
              />
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="modal-close" onClick={onClose}>{t('endModal.cancel')}</button>
          <button
            className="modal-submit"
            onClick={handleSubmit}
            disabled={!selectedOutcome || (selectedOutcome === 'ODMOWA' && !rejectionReason)}
          >
            {t('endModal.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
