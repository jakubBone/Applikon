import { useState } from 'react'
import { PREDEFINED_STAGES } from './types'

interface StageModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (stage: string) => void
  currentStage?: string | null
}

export function StageModal({ isOpen, onClose, onSelect, currentStage }: StageModalProps) {
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
