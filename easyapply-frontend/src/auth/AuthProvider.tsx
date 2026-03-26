import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../types/domain'
import { fetchCurrentUser, getToken, clearToken } from '../services/api'

// ============================================================
// Typy kontekstu
// ============================================================

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => void
}

// ============================================================
// Kontekst
// createContext z undefined jako wartość startowa — wymusza użycie
// hooka useAuth() tylko wewnątrz AuthProvider (sprawdzamy niżej).
// ============================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ============================================================
// Provider
// ============================================================

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Przy starcie aplikacji sprawdzamy czy mamy token i pobieramy dane usera.
    // Jeśli token wygasł lub nie istnieje — user pozostaje null.
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    fetchCurrentUser()
      .then(setUser)
      .catch(() => {
        // Token nieważny — czyścimy i user zostaje niezalogowany
        clearToken()
      })
      .finally(() => setIsLoading(false))
  }, [])

  const signOut = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: user !== null, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
