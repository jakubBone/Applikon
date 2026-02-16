import { useState, useEffect, useRef } from 'react'
import './TourGuide.css'

// Tour steps definition
const getTourSteps = (isMobile) => [
  {
    id: 'welcome',
    title: '👋 Witaj w EasyApply!',
    content: 'Jestem Kuba i pokażę Ci teraz, jak korzystać z aplikacji do zarządzania procesem Twojej rekrutacji.',
    target: null,
    position: 'center',
    needsView: 'kanban'
  },
  {
    id: 'kanban',
    title: '📋 Tablica Kanban',
    content: 'Tutaj wszystkie Twoje aplikacje są podzielone na statusy: Wysłane, W procesie oraz Zakończone.',
    target: '.tab-btn:first-child',
    position: 'bottom',
    needsView: 'kanban'
  },
  {
    id: 'demo-card',
    title: '🎯 Przykładowa aplikacja',
    content: 'Dodałem dla Ciebie przykładową aplikację do Google. Użyję jej teraz, aby zaprezentowaać Ci wszystkie funkcje.',
    target: '.kanban-card:first-child',
    position: 'right',
    scrollIntoView: true,
    needsView: 'kanban'
  },
  {
    id: 'drag-drop',
    title: isMobile ? '👆 Przytrzymaj kartę' : '🖱️ Przeciągnij kartę',
    content: isMobile
      ? 'Przytrzymaj kartę (0.5s), aby zmienić jej status. Po przytrzymaniu pojawi się menu wyboru statusu.'
      : 'Przeciągnaj karty między kolumnami, aby zmieniać status aplikacji. Po prostu złap kartę i przenieś ją do odpowiedniej kolumny.',
    target: '.kanban-column',
    position: 'top',
    highlightMultiple: true,
    needsView: 'kanban'
  },
  {
    id: 'click-card',
    title: '👁️ Kliknij w kartę',
    content: 'Możesz kliknąć w daną aplikację, aby zobaczyć jej szczegóły...',
    target: '.kanban-card:first-child',
    position: 'right',
    autoClick: true,
    needsView: 'kanban'
  },
  {
    id: 'details-info',
    title: '📋 Szczegóły aplikacji',
    content: 'Tu znajdziesz wszystkie informacje o aplikacji: firmę, stanowisko, datę aplikacji, link do oferty, czy treść ogłoszenia.',
    target: '.details-info',
    position: 'right',
    scrollIntoView: true,
    needsView: 'details'
  },
  {
    id: 'details-notes',
    title: '📝 Sekcja notatek',
    content: 'Tutaj możesz dodawać notatki do aplikacji - pytania z rozmów, uwagi o firmie, czy feedback po rozmowie.',
    target: '.details-notes',
    position: 'left',
    scrollIntoView: true,
    needsView: 'details'
  },
  {
    id: 'list-view',
    title: '📝 Lista aplikacji',
    content: 'Tutaj znajdziesz wszystkie swoje aplikacje w formie listy. Możesz je sortować i filtrować.',
    target: '.tab-btn:nth-child(2)',
    position: 'bottom',
    needsView: 'list',
    offsetY: 16
  },
  {
    id: 'add-application',
    title: '➕ Dodawanie aplikacji',
    content: isMobile
      ? 'Kliknij, aby dodać nową aplikację. Wypełnij dane firmy, stanowiska, i inne szczegóły.'
      : 'Kliknij, aby dodać nową aplikację. Wypełnij dane firmy, stanowiska, i inne szczegóły.',
    target: isMobile ? '.fab' : '.add-btn',
    position: isMobile ? 'left' : 'bottom',
    needsView: 'kanban',
    avoidFab: isMobile,  // Specjalna flaga dla tooltipa na mobile
    compactOnMobile: true
  },
  {
    id: 'cv-section',
    title: '📄 Zarządzanie CV',
    content: 'Tutaj możesz dodawać swoje CV. Spokojnie... wszystkie dane są zapisane tylko w Twojej przeglądarce - bezpiecznie i lokalnie.',
    target: '.tab-btn:nth-child(3)',
    position: 'bottom',
    needsView: 'cv'
  },
  {
    id: 'cv-add-button',
    title: '📎 Dodaj swoje CV',
    content: 'Dodaj swoje CV. Możesz przesłać plik PDF, podać link do chmury (Google Drive, Dropbox) lub po prostu zanotować nazwę pliku.',
    target: '.add-cv-btn',
    position: 'bottom',
    needsView: 'cv',
    compactOnMobile: true
  },
  {
    id: 'cv-assign-open',
    title: '🔗 Przypisywanie CV',
    content: 'Możesz przypisać wybrane CV do konkretnej aplikacji.',
    target: '.assign-btn',
    position: 'right',
    needsView: 'cv',
    autoClick: true,
    compactOnMobile: true,
    extraSpacing: 40
  },
  {
    id: 'cv-assign-modal',
    title: '✅ Zatwierdź przypisanie',
    content: 'Wybierz konkretną firmę i kliknij "Przypisz", aby zapisać powiązanie.',
    target: '.assign-confirm-btn',
    position: 'bottom',
    needsView: 'cv',
    compactOnMobile: true,
    extraSpacing: 40
  },
  {
    id: 'badges',
    title: '🏆 Odznaki',
    content: 'Zbieraj odznaki za wytrwałość! I pamiętej... rekrutacja to skill, a nie jednorazowy test!',
    target: '.badge-widget',
    position: 'left',
    needsView: 'kanban'
  },
  {
    id: 'finish',
    title: '🎉 Gotowe!',
    content: 'Teraz znasz już wszystkie funkcje EasyApply. Powodzenia w poszukiwaniu pracy! Oni jeszcze nie wiedzą z kim zadzierają...',
    target: null,
    position: 'center',
    needsView: 'kanban'
  }
]

function TourGuide({ onComplete }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const tooltipRef = useRef(null)
  const transitioningRef = useRef(false)

  const steps = getTourSteps(isMobile)

  useEffect(() => {
    // Check if tour was already shown
    const tourShown = localStorage.getItem('tour_guide_completed')
    if (!tourShown) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        setIsActive(true)
      }, 500)
    }

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle view transitions when step changes
  useEffect(() => {
    if (!isActive || transitioningRef.current) return

    const step = steps[currentStep]
    const currentView = getCurrentView()

    // Check if we need to change view
    if (step.needsView && step.needsView !== currentView) {
      transitioningRef.current = true
      switchToView(step.needsView, () => {
        transitioningRef.current = false
      })
      return
    }

    // Ensure a CV is selected before showing assign step
    if (step.id === 'cv-assign-open') {
      const selected = document.querySelector('.cv-item.selected')
      if (!selected) {
        const firstCv = document.querySelector('.cv-item')
        if (firstCv) {
          firstCv.click()
        }
      }
    }

    // Ensure assign modal is open for the confirmation step
    if (step.id === 'cv-assign-modal') {
      const assignModalButton = document.querySelector('.assign-confirm-btn')
      if (!assignModalButton) {
        const openAssignBtn = document.querySelector('.assign-btn')
        if (openAssignBtn) {
          openAssignBtn.click()
        }
      }
    }

    // Auto-click if needed
    if (step.autoClick && step.target) {
      setTimeout(() => {
        const element = document.querySelector(step.target)
        if (element) {
          element.click()
        }
      }, 300)
    }

    // Scroll into view if needed
    if (step.scrollIntoView && step.target) {
      setTimeout(() => {
        const element = document.querySelector(step.target)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 400)
    }
  }, [isActive, currentStep, steps])

  // Calculate tooltip position whenever step changes
  useEffect(() => {
    if (!isActive) return

    const step = steps[currentStep]
    if (!step.target) {
      // Center position for welcome/finish screens
      return
    }

    // Calculate tooltip position
    const calculatePosition = () => {
      const element = document.querySelector(step.target)
      if (!element || !tooltipRef.current) return

      const rect = element.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const spacing = step.extraSpacing || 30
      const offsetX = step.offsetX || 0
      const offsetY = step.offsetY || 0
      const padding = 20

      const clamp = (value, min, max) => Math.max(min, Math.min(value, max))

      const computePosition = (position) => {
        let top = 0
        let left = 0

        switch (position) {
          case 'top':
            top = rect.top - tooltipRect.height - spacing
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2)
            break
          case 'bottom':
            top = rect.bottom + spacing
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2)
            break
          case 'left':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2)
            left = rect.left - tooltipRect.width - spacing
            break
          case 'right':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2)
            left = rect.right + spacing
            break
          default:
            break
        }

        top += offsetY
        left += offsetX

        top = clamp(top, padding, window.innerHeight - tooltipRect.height - padding)
        left = clamp(left, padding, window.innerWidth - tooltipRect.width - padding)

        return { top, left }
      }

      const overlapsTarget = (pos) => {
        const tooltipBox = {
          left: pos.left,
          right: pos.left + tooltipRect.width,
          top: pos.top,
          bottom: pos.top + tooltipRect.height
        }
        const targetBox = {
          left: rect.left - 6,
          right: rect.right + 6,
          top: rect.top - 6,
          bottom: rect.bottom + 6
        }

        return !(
          tooltipBox.right < targetBox.left ||
          tooltipBox.left > targetBox.right ||
          tooltipBox.bottom < targetBox.top ||
          tooltipBox.top > targetBox.bottom
        )
      }

      const preferred = ['top', 'bottom', 'left', 'right']
      const ordered = [step.position, ...preferred.filter(pos => pos !== step.position)]

      let finalPos = computePosition(step.position)

      if (overlapsTarget(finalPos)) {
        for (const pos of ordered) {
          const candidate = computePosition(pos)
          if (!overlapsTarget(candidate)) {
            finalPos = candidate
            break
          }
        }
      }

      setTooltipPosition(finalPos)
    }

    // Initial calculation with delay to ensure DOM is ready
    const timeoutId = setTimeout(calculatePosition, 100)

    calculatePosition()
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [isActive, currentStep, steps])

  const getCurrentView = () => {
    // Check if we're in details view
    if (document.querySelector('.details-view')) return 'details'
    // Check if we're in list view
    if (document.querySelector('.table-container')) return 'list'
    // Check if we're in CV view
    if (document.querySelector('.cv-manager')) return 'cv'
    // Default to kanban
    return 'kanban'
  }

  const switchToView = (targetView, callback) => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      if (callback) callback()
    }

    const finishLater = (delay = 300) => {
      setTimeout(finish, delay)
    }

    const clickIfExists = (selector) => {
      const element = document.querySelector(selector)
      if (element) {
        element.click()
        return true
      }
      return false
    }

    const inDetails = document.querySelector('.details-view')

    if (inDetails && targetView !== 'details') {
      const clickedBack = clickIfExists('.back-btn') || clickIfExists('.back-btn-mobile')
      setTimeout(() => {
        if (targetView === 'kanban') {
          clickIfExists('.tab-btn:first-child')
        } else if (targetView === 'list') {
          clickIfExists('.tab-btn:nth-child(2)')
        } else if (targetView === 'cv') {
          clickIfExists('.tab-btn:nth-child(3)')
        }
        finishLater(300)
      }, clickedBack ? 450 : 100)
      return
    }

    if (targetView === 'details') {
      // Click on first kanban card
      if (!clickIfExists('.kanban-card:first-child')) {
        finishLater(300)
        return
      }
      finishLater(500)
    } else if (targetView === 'kanban') {
      // Click back button if in details view
      if (clickIfExists('.back-btn') || clickIfExists('.back-btn-mobile')) {
        finishLater(500)
        return
      }
      if (!clickIfExists('.tab-btn:first-child')) {
        finishLater(200)
        return
      }
      finishLater(300)
    } else if (targetView === 'list') {
      // Click list tab
      if (!clickIfExists('.tab-btn:nth-child(2)')) {
        finishLater(200)
        return
      }
      finishLater(300)
    } else if (targetView === 'cv') {
      // Click CV tab
      if (!clickIfExists('.tab-btn:nth-child(3)')) {
        finishLater(200)
        return
      }
      finishLater(300)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setIsActive(false)
    localStorage.setItem('tour_guide_completed', 'true')

    // Make sure we're back in kanban view
    const currentView = getCurrentView()
    if (currentView !== 'kanban') {
      switchToView('kanban')
    }

    if (onComplete) {
      onComplete()
    }
  }

  if (!isActive) return null

  const step = steps[currentStep]
  const isCenter = step.position === 'center'
  const isCompact = isMobile && step.compactOnMobile

  return (
    <div className="tour-guide-overlay">
      {/* Backdrop with light dimming */}
      <div className="tour-backdrop" onClick={(e) => {
        // Prevent clicks on backdrop from propagating
        e.stopPropagation()
      }}>
        {step.target && (
          <SpotlightHighlight
            target={step.target}
            highlightMultiple={step.highlightMultiple}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`tour-tooltip ${isCenter ? 'center' : ''} ${isCompact ? 'compact' : ''} ${step.avoidFab ? 'avoid-fab' : ''}`}
        style={!isCenter ? tooltipPosition : {}}
      >
        <div className="tour-tooltip-header">
          <h3>{step.title}</h3>
          <button className="tour-close-btn" onClick={handleSkip} aria-label="Zamknij">
            ✕
          </button>
        </div>

        <div className="tour-tooltip-content">
          <p>{step.content}</p>
        </div>

        <div className="tour-tooltip-footer">
          <div className="tour-progress">
            <span>{currentStep + 1} / {steps.length}</span>
            <div className="tour-progress-bar">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`tour-progress-dot ${index <= currentStep ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="tour-actions">
            {currentStep > 0 && (
              <button className="tour-btn tour-btn-secondary" onClick={handlePrevious}>
                Wstecz
              </button>
            )}
            <button className="tour-btn tour-btn-primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Zakończ' : 'Dalej'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Spotlight component to highlight target elements
function SpotlightHighlight({ target, highlightMultiple }) {
  const [highlights, setHighlights] = useState([])

  useEffect(() => {
    const calculateHighlights = () => {
      const elements = highlightMultiple
        ? document.querySelectorAll(target)
        : [document.querySelector(target)]

      const rects = Array.from(elements)
        .filter(el => el)
        .map(el => {
          const rect = el.getBoundingClientRect()
          return {
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16
          }
        })

      setHighlights(rects)
    }

    calculateHighlights()
    const intervalId = setInterval(calculateHighlights, 100)
    window.addEventListener('resize', calculateHighlights)
    window.addEventListener('scroll', calculateHighlights)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('resize', calculateHighlights)
      window.removeEventListener('scroll', calculateHighlights)
    }
  }, [target, highlightMultiple])

  return (
    <>
      {highlights.map((rect, index) => (
        <div
          key={index}
          className="tour-spotlight"
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`
          }}
        />
      ))}
    </>
  )
}

export default TourGuide
