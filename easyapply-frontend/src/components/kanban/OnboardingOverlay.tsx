interface OnboardingOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
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
