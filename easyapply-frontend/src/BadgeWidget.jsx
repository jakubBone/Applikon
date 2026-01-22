import { useState, useEffect } from 'react'
import { fetchBadgeStats } from './services/api'

const BadgeWidget = ({ refreshTrigger }) => {
  const [stats, setStats] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [refreshTrigger])

  const loadStats = async () => {
    try {
      const data = await fetchBadgeStats()
      setStats(data)
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) return null

  const { rejectionBadge, ghostingBadge, sweetRevengeUnlocked, totalRejections, totalGhosting } = stats

  const calculateProgress = (current, target) => {
    if (!target) return 100
    return Math.min(100, Math.round((current / target) * 100))
  }

  const getIconForBadge = (name) => {
    const icons = {
      'Rękawica': '🥊',
      'Patelnia': '🍳',
      'Niezniszczalny': '🦾',
      'Legenda Linkedina': '👑',
      'Statystyczna Pewność': '🎰',
      'Widmo': '👻',
      'Cierpliwy Mnich': '🧘',
      'Detektyw': '🔍',
      'Człowiek-Duch': '🫥',
      'Król Ciszy': '🤫'
    }
    return icons[name] || '🔒'
  }

  const renderBadgeRow = (badge, count, type) => {
    const isGhosting = type === 'ghosting'
    const hasAchieved = badge?.name
    const maxThreshold = 100
    const nextThreshold = hasAchieved ? badge.nextThreshold : (isGhosting ? 5 : 5)
    const nextName = hasAchieved ? badge.nextBadgeName : (isGhosting ? 'Widmo' : 'Rękawica')
    const isMaxed = hasAchieved && !badge.nextThreshold

    return (
      <div className="badge-row">
        <div className="badge-row-left">
          <span className={`badge-row-icon ${!hasAchieved ? 'locked' : ''}`}>
            {hasAchieved ? badge.icon : (isGhosting ? '👻' : '🥊')}
          </span>
          <div className="badge-row-info">
            <div className="badge-row-name">
              {hasAchieved ? badge.name : (isGhosting ? 'Widmo' : 'Rękawica')}
            </div>
            <div className="badge-row-description">
              {hasAchieved ? badge.description : `${count}/${isGhosting ? 5 : 5} do odblokowania`}
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

            {!isMaxed && (
              <div className="badge-row-next-line">
                Następny: {getIconForBadge(nextName)} {nextName}
              </div>
            )}
          </div>
        </div>

        {isMaxed && (
          <div className="badge-row-max">MAX</div>
        )}
      </div>
    )
  }

  return (
    <div className="badge-widget">
      <div className="badge-widget-header" onClick={() => setExpanded(!expanded)}>
        <span className="badge-header-title">🏅 Twoje odznaki</span>
        <span className="badge-expand-arrow">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="badge-widget-dropdown">
          {/* Rejection badges */}
          <div className="badge-section-label">Odrzucone aplikacje ({totalRejections})</div>
          {renderBadgeRow(rejectionBadge, totalRejections, 'rejection')}

          {/* Ghosting badges */}
          <div className="badge-section-label">Bez odzewu ({totalGhosting})</div>
          {renderBadgeRow(ghostingBadge, totalGhosting, 'ghosting')}

          {/* Sweet Revenge */}
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
      )}
    </div>
  )
}

export default BadgeWidget
