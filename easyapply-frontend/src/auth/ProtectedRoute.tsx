import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Chroni trasę przed niezalogowanymi użytkownikami.
 *
 * Scenariusze:
 * - Trwa weryfikacja tokenu (isLoading) → pokazujemy pusty ekran (unikamy flash przekierowania)
 * - Niezalogowany → redirect do /login
 * - Zalogowany → renderujemy dzieci
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
