import { useState } from 'react'
import { useBadgeStats } from '../../hooks/useBadgeStats'
import type { BadgeInfo } from '../../types/domain'

const getIconForBadge = (name: string): string => {
  const icons: Record<string, string> = {
    'Rękawica': '🥊',
    'Patelnia': '🍳',
    'Niezniszczalny': '🦾',
    'Legenda Linkedina': '👑',
    'Statystyczna Pewność': '🎰',
    'Widmo': '👻',
    'Cierpliwy Mnich': '🧘',
    'Detektyw': '🔍',
    'Człowiek-Duch': '🫥',
    'Król Ciszy': '🤫',
  }
  return icons[name] ?? '🔒'
}

const calculateProgress = (current: number, target: number | null): number => {
  if (!target) return 100
  return Math.min(100, Math.round((current / target) * 100))
}

interface BadgeRowProps {
  badge: BadgeInfo | null
  count: number
  type: 'rejection' | 'ghosting'
}

// Próg pierwszej odznaki — taki sam dla odrzuceń i ghostingu
const FIRST_THRESHOLD = 5

function BadgeRow({ badge, count, type }: BadgeRowProps) {
  const isGhosting = type === 'ghosting'
  const hasAchieved = Boolean(badge?.name)
  const isMaxed = hasAchieved && !badge?.nextThreshold

  // Cel paska: gdy brak odznaki — próg pierwszej (5); gdy mamy — próg następnej
  const progressTarget = hasAchieved ? (badge?.nextThreshold ?? null) : FIRST_THRESHOLD
  const progressLabel = hasAchieved ? (badge?.nextThreshold ?? null) : FIRST_THRESHOLD

  const nextName = hasAchieved ? badge?.nextBadgeName : (isGhosting ? 'Widmo' : 'Rękawica')

  return (
    <div className="badge-row">
      <div className="badge-row-left">
        <span className={`badge-row-icon ${!hasAchieved ? 'locked' : ''}`}>
          {hasAchieved ? badge?.icon : (isGhosting ? '👻' : '🥊')}
        </span>
        <div className="badge-row-info">
          <div className="badge-row-name">
            {hasAchieved ? badge?.name : (isGhosting ? 'Widmo' : 'Rękawica')}
          </div>
          <div className="badge-row-description">
            {hasAchieved ? badge?.description : `${count}/${FIRST_THRESHOLD} do odblokowania`}
          </div>
          <div className="badge-row-progress">
            <div className={`badge-progress-bar ${isGhosting ? 'ghosting' : ''}`}>
              <div
                className="badge-progress-fill"
                style={{ width: `${calculateProgress(count, progressTarget)}%` }}
              />
            </div>
            <span className="badge-progress-count">{count}/{progressLabel ?? '∞'}</span>
          </div>
          {!isMaxed && nextName && (
            <div className="badge-row-next-line">
              Następny: {getIconForBadge(nextName)} {nextName}
            </div>
          )}
        </div>
      </div>
      {isMaxed && <div className="badge-row-max">MAX</div>}
    </div>
  )
}

export function BadgeWidget() {
  const [expanded, setExpanded] = useState(false)
  const { data: stats } = useBadgeStats()

  // Nie renderuj nic jeśli dane jeszcze nie są gotowe
  if (!stats) return null

  const { rejectionBadge, ghostingBadge, sweetRevengeUnlocked, totalRejections, totalGhosting } = stats

  return (
    <div className="badge-widget">
      <div className="badge-widget-header" onClick={() => setExpanded(!expanded)}>
        <span className="badge-header-title">🏅 Twoje odznaki</span>
        <span className="badge-expand-arrow">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="badge-modal" onClick={() => setExpanded(false)}>
          <div className="badge-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="badge-modal-header">
              <div className="badge-modal-title">🏅 Twoje odznaki</div>
            </div>

            <div className="badge-modal-body">
              <div className="badge-section-label">Odrzucone aplikacje ({totalRejections})</div>
              <BadgeRow badge={rejectionBadge} count={totalRejections} type="rejection" />

              <div className="badge-section-label">Bez odzewu ({totalGhosting})</div>
              <BadgeRow badge={ghostingBadge} count={totalGhosting} type="ghosting" />

              {sweetRevengeUnlocked && (
                <div className="badge-row sweet-revenge">
                  <div className="badge-row-left">
                    <span className="badge-row-icon special">🏆</span>
                    <div className="badge-row-info">
                      <div className="badge-row-name special">Sweet Revenge</div>
                      <div className="badge-row-description">Kto się śmieje ostatni, ten dostał robotę.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="badge-modal-actions">
              <button className="badge-modal-btn" onClick={() => setExpanded(false)}>
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
