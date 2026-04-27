import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceNotice } from '../../types/domain'
import './notices.css'

const DISMISSED_KEY = 'dismissed_notices'

function getDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') as number[]
  } catch {
    return []
  }
}

function dismiss(id: number): void {
  const current = getDismissed()
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]))
}

interface Props {
  notice: ServiceNotice
}

export function ServiceModal({ notice }: Props) {
  const [visible, setVisible] = useState(() => !getDismissed().includes(notice.id))
  const { i18n, t } = useTranslation()

  if (!visible) return null

  const message = i18n.language === 'pl' ? notice.messagePl : notice.messageEn

  function handleOk() {
    dismiss(notice.id)
    setVisible(false)
  }

  return (
    <div className="service-modal-overlay">
      <div className="service-modal">
        <p className="service-modal-message">{message}</p>
        <button className="service-modal-ok" onClick={handleOk}>
          {t('notices.ok')}
        </button>
      </div>
    </div>
  )
}
