import { useState, useEffect } from 'react'

export interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  expired: boolean
}

export function useCountdown(expiresAt: string | null): TimeLeft | null {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculate(expiresAt))

  useEffect(() => {
    if (!expiresAt) return
    const id = setInterval(() => setTimeLeft(calculate(expiresAt)), 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return timeLeft
}

function calculate(expiresAt: string | null): TimeLeft | null {
  if (!expiresAt) return null
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds, expired: false }
}
