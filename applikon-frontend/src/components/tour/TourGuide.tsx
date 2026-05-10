import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './TourGuide.css'

interface TourStep {
  id: string
  title: string
  content: string
  target: string | null
  position: string
  needsView: string
  scrollIntoView?: boolean
  autoClick?: boolean
  highlightMultiple?: boolean
  avoidFab?: boolean
  compactOnMobile?: boolean
  extraSpacing?: number
  offsetX?: number
  offsetY?: number
}

interface TourGuideProps {
  onComplete?: () => void
}

function TourGuide({ onComplete }: TourGuideProps) {
  const { t } = useTranslation('tour')
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const transitioningRef = useRef(false)

  const getTourSteps = (): TourStep[] => [
    {
      id: 'welcome',
      title: t('steps.welcome.title'),
      content: t('steps.welcome.content'),
      target: null,
      position: 'center',
      needsView: 'kanban'
    },
    {
      id: 'kanban',
      title: t('steps.kanban.title'),
      content: t('steps.kanban.content'),
      target: '.tab-btn:first-child',
      position: 'bottom',
      needsView: 'kanban'
    },
    {
      id: 'demo-card',
      title: t('steps.demoCard.title'),
      content: t('steps.demoCard.content'),
      target: '.kanban-card:first-child',
      position: 'right',
      scrollIntoView: true,
      needsView: 'kanban'
    },
    {
      id: 'drag-drop',
      title: isMobile ? t('steps.dragDropMobileTitle') : t('steps.dragDropDesktopTitle'),
      content: isMobile ? t('steps.dragDropMobileContent') : t('steps.dragDropDesktopContent'),
      target: '.kanban-column',
      position: 'top',
      highlightMultiple: true,
      needsView: 'kanban'
    },
    {
      id: 'click-card',
      title: t('steps.clickCard.title'),
      content: t('steps.clickCard.content'),
      target: '.kanban-card:first-child',
      position: 'right',
      autoClick: true,
      needsView: 'kanban'
    },
    {
      id: 'details-info',
      title: t('steps.detailsInfo.title'),
      content: t('steps.detailsInfo.content'),
      target: '.details-info',
      position: 'right',
      scrollIntoView: true,
      needsView: 'details'
    },
    {
      id: 'details-notes',
      title: t('steps.detailsNotes.title'),
      content: t('steps.detailsNotes.content'),
      target: '.details-notes',
      position: 'left',
      scrollIntoView: true,
      needsView: 'details'
    },
    {
      id: 'list-view',
      title: t('steps.listView.title'),
      content: t('steps.listView.content'),
      target: '.tab-btn:nth-child(2)',
      position: 'bottom',
      needsView: 'list',
      offsetY: 16
    },
    {
      id: 'add-application',
      title: t('steps.addApplication.title'),
      content: t('steps.addApplication.content'),
      target: isMobile ? '.fab' : '.add-btn',
      position: isMobile ? 'left' : 'bottom',
      needsView: 'kanban',
      avoidFab: isMobile,
      compactOnMobile: true
    },
    {
      id: 'cv-section',
      title: t('steps.cvSection.title'),
      content: t('steps.cvSection.content'),
      target: '.tab-btn:nth-child(3)',
      position: 'bottom',
      needsView: 'cv'
    },
    {
      id: 'cv-add-button',
      title: t('steps.cvAddButton.title'),
      content: t('steps.cvAddButton.content'),
      target: '.add-cv-btn',
      position: 'bottom',
      needsView: 'cv',
      compactOnMobile: true
    },
    {
      id: 'cv-assign-open',
      title: t('steps.cvAssignOpen.title'),
      content: t('steps.cvAssignOpen.content'),
      target: '.assign-btn',
      position: 'right',
      needsView: 'cv',
      autoClick: true,
      compactOnMobile: true,
      extraSpacing: 40
    },
    {
      id: 'cv-assign-modal',
      title: t('steps.cvAssignModal.title'),
      content: t('steps.cvAssignModal.content'),
      target: '.assign-confirm-btn',
      position: 'bottom',
      needsView: 'cv',
      compactOnMobile: true,
      extraSpacing: 40
    },
    {
      id: 'badges',
      title: t('steps.badges.title'),
      content: t('steps.badges.content'),
      target: '.badge-widget',
      position: 'left',
      needsView: 'kanban'
    },
    {
      id: 'finish',
      title: t('steps.finish.title'),
      content: t('steps.finish.content'),
      target: null,
      position: 'center',
      needsView: 'kanban'
    }
  ]

  const steps = getTourSteps()

  useEffect(() => {
    const tourShown = localStorage.getItem('tour_guide_completed')
    if (!tourShown) {
      setTimeout(() => {
        setIsActive(true)
      }, 500)
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!isActive || transitioningRef.current) return

    const step = steps[currentStep]
    const currentView = getCurrentView()

    if (step.needsView && step.needsView !== currentView) {
      transitioningRef.current = true
      switchToView(step.needsView, () => {
        transitioningRef.current = false
      })
      return
    }

    if (step.id === 'cv-assign-open') {
      const selected = document.querySelector('.cv-item.selected')
      if (!selected) {
        const firstCv = document.querySelector('.cv-item')
        if (firstCv) (firstCv as HTMLElement).click()
      }
    }

    if (step.id === 'cv-assign-modal') {
      const assignModalButton = document.querySelector('.assign-confirm-btn')
      if (!assignModalButton) {
        const openAssignBtn = document.querySelector('.assign-btn')
        if (openAssignBtn) (openAssignBtn as HTMLElement).click()
      }
    }

    if (step.autoClick && step.target) {
      setTimeout(() => {
        const element = document.querySelector(step.target!)
        if (element) (element as HTMLElement).click()
      }, 300)
    }

    if (step.scrollIntoView && step.target) {
      setTimeout(() => {
        const element = document.querySelector(step.target!)
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 400)
    }
  }, [isActive, currentStep, steps])

  useEffect(() => {
    if (!isActive) return

    const step = steps[currentStep]
    if (!step.target) return

    const calculatePosition = () => {
      const element = document.querySelector(step.target!)
      if (!element || !tooltipRef.current) return

      const rect = element.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const spacing = step.extraSpacing || 30
      const offsetX = step.offsetX || 0
      const offsetY = step.offsetY || 0
      const padding = 20

      const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

      const computePosition = (position: string) => {
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

      const overlapsTarget = (pos: { top: number; left: number }) => {
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
    if (document.querySelector('.details-view')) return 'details'
    if (document.querySelector('.table-container')) return 'list'
    if (document.querySelector('.cv-manager')) return 'cv'
    return 'kanban'
  }

  const switchToView = (targetView: string, callback?: () => void) => {
    let finished = false
    const finish = () => {
      if (finished) return
      finished = true
      if (callback) callback()
    }

    const finishLater = (delay = 300) => {
      setTimeout(finish, delay)
    }

    const clickIfExists = (selector: string) => {
      const element = document.querySelector(selector)
      if (element) {
        ;(element as HTMLElement).click()
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
      if (!clickIfExists('.kanban-card:first-child')) {
        finishLater(300)
        return
      }
      finishLater(500)
    } else if (targetView === 'kanban') {
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
      if (!clickIfExists('.tab-btn:nth-child(2)')) {
        finishLater(200)
        return
      }
      finishLater(300)
    } else if (targetView === 'cv') {
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
      <div className="tour-backdrop" onClick={(e) => { e.stopPropagation() }}>
        {step.target && (
          <SpotlightHighlight
            target={step.target}
            highlightMultiple={step.highlightMultiple}
          />
        )}
      </div>

      <div
        ref={tooltipRef}
        className={`tour-tooltip ${isCenter ? 'center' : ''} ${isCompact ? 'compact' : ''} ${step.avoidFab ? 'avoid-fab' : ''}`}
        style={!isCenter ? tooltipPosition : {}}
      >
        <div className="tour-tooltip-header">
          <h3>{step.title}</h3>
          <button className="tour-close-btn" onClick={handleSkip} aria-label={t('buttons.skip')}>
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
                {t('buttons.prev')}
              </button>
            )}
            <button className="tour-btn tour-btn-primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? t('buttons.finish') : t('buttons.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SpotlightProps {
  target: string
  highlightMultiple?: boolean
}

function SpotlightHighlight({ target, highlightMultiple }: SpotlightProps) {
  const [highlights, setHighlights] = useState<{ top: number; left: number; width: number; height: number }[]>([])

  useEffect(() => {
    const calculateHighlights = () => {
      const elements = highlightMultiple
        ? document.querySelectorAll(target)
        : [document.querySelector(target)]

      const rects = Array.from(elements)
        .filter((el): el is Element => el !== null)
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
