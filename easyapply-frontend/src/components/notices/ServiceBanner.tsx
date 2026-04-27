import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ServiceNotice } from '../../types/domain'
import { useCountdown } from './useCountdown'
import { CountdownLabel } from './CountdownLabel'
import './notices.css'

interface Props {
  notice: ServiceNotice
}

export function ServiceBanner({ notice }: Props) {
  const [dismissed, setDismissed] = useState(false)
  const { i18n } = useTranslation()
  const countdown = useCountdown(notice.expiresAt)

  if (dismissed) return null

  const message = i18n.language === 'pl' ? notice.messagePl : notice.messageEn

  return (
    <div className="service-banner">
      <span className="service-banner-message">
        {message}
        {countdown && !countdown.expired && (
          <CountdownLabel countdown={countdown} />
        )}
      </span>
      <button
        className="service-banner-close"
        onClick={() => setDismissed(true)}
        aria-label="Zamknij"
      >
        ×
      </button>
    </div>
  )
}
