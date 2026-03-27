import { useTranslation } from 'react-i18next'

interface OnboardingOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="onboarding-overlay" onClick={onClose}>
      <div className="onboarding-content" onClick={e => e.stopPropagation()}>
        <div className="onboarding-emoji">👋</div>
        <div className="onboarding-title">{t('onboarding.title')}</div>

        <div className="onboarding-steps">
          <div className="onboarding-step">
            <div className="onboarding-step-icon">📱</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">{t('onboarding.swipeTitle')}</div>
              <div className="onboarding-step-desc">{t('onboarding.swipeDesc')}</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step-icon">👆</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">{t('onboarding.holdTitle')}</div>
              <div className="onboarding-step-desc">{t('onboarding.holdDesc')}</div>
            </div>
          </div>

          <div className="onboarding-step">
            <div className="onboarding-step-icon">📳</div>
            <div className="onboarding-step-text">
              <div className="onboarding-step-title">{t('onboarding.vibrationTitle')}</div>
              <div className="onboarding-step-desc">{t('onboarding.vibrationDesc')}</div>
            </div>
          </div>
        </div>

        <button className="onboarding-btn" onClick={onClose}>{t('onboarding.understood')}</button>
      </div>
    </div>
  )
}
