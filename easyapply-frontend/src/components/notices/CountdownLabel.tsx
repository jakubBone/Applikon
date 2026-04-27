import { useTranslation } from 'react-i18next'
import type { TimeLeft } from './useCountdown'

interface Props {
  countdown: TimeLeft
}

export function CountdownLabel({ countdown }: Props) {
  const { i18n } = useTranslation()
  const pl = i18n.language === 'pl'

  const parts: string[] = []
  if (countdown.days > 0) parts.push(`${countdown.days} ${pl ? 'dni' : 'd'}`)
  if (countdown.hours > 0 || countdown.days > 0) parts.push(`${countdown.hours} ${pl ? 'godz' : 'h'}`)
  parts.push(`${pad(countdown.minutes)}:${pad(countdown.seconds)}`)

  return (
    <span className="notice-countdown">
      {' '}⏳ {pl ? 'zostało: ' : 'time left: '}{parts.join(' ')}
    </span>
  )
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
