import { useState } from 'react'
import { useBadgeStats } from '../../hooks/useBadgeStats'

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
  badge: { name: string; icon: string; description: string; nextThreshold: number | null; nextBadgeName?: string } | null
  count: number
  type: 'rejection' | 'ghosting'
}

function BadgeRow({ badge, count, type }: BadgeRowProps) {
  const isGhosting = type === 'ghosting'
  const hasAchieved = Boolean(badge?.name)
  const maxThreshold = 100
  const nextName = hasAchieved ? badge?.nextBadgeName : (isGhosting ? 'Widmo' : 'Rękawica')
  const isMaxed = hasAchieved && !badge?.nextThreshold

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
            {hasAchieved ? badge?.description : `${count}/${isGhosting ? 5 : 5} do odblokowania`}
          </div>
          <div className="badge-row-progress">
            <div className={`badge-progress-bar ${isGhosting ? 'ghosting' : ''}`}>
              <div
                className="badge-progress-fill"
                style={{ width: `${calculateProgress(count, maxThreshold)}%` }}
              />
            </div>
            <span className="badge-progress-count">{count}/{maxThreshold}</span>
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

  const { rejectionBadge, ghostingBadge, hasSpecialBadge, rejectionCount, ghostingCount } = stats

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
              <div className="badge-section-label">Odrzucone aplikacje ({rejectionCount})</div>
              <BadgeRow badge={rejectionBadge} count={rejectionCount} type="rejection" />

              <div className="badge-section-label">Bez odzewu ({ghostingCount})</div>
              <BadgeRow badge={ghostingBadge} count={ghostingCount} type="ghosting" />

              {hasSpecialBadge && (
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
