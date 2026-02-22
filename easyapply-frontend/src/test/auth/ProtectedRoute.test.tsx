import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../../auth/ProtectedRoute'
import { useAuth } from '../../auth/AuthProvider'

// Mockujemy useAuth — ProtectedRoute testujemy w izolacji od logiki pobierania usera.
// Interesuje nas wyłącznie zachowanie na podstawie wartości zwracanych przez hook.
vi.mock('../../auth/AuthProvider', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

/**
 * Renderuje ProtectedRoute w realistycznym środowisku routera.
 * Trasa /login imituje stronę logowania — dzięki temu możemy sprawdzić
 * czy Navigate faktycznie tam trafia.
 */
function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>Strona logowania</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Chroniona treść</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('podczas ładowania — renderuje null (zapobiega flash przekierowania)', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      signOut: vi.fn(),
    })

    const { container } = renderProtectedRoute()
    expect(container).toBeEmptyDOMElement()
  })

  it('niezalogowany — przekierowuje na /login', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      signOut: vi.fn(),
    })

    renderProtectedRoute()
    expect(screen.getByText('Strona logowania')).toBeInTheDocument()
    expect(screen.queryByText('Chroniona treść')).not.toBeInTheDocument()
  })

  it('zalogowany — renderuje chronioną treść', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      signOut: vi.fn(),
    })

    renderProtectedRoute()
    expect(screen.getByText('Chroniona treść')).toBeInTheDocument()
    expect(screen.queryByText('Strona logowania')).not.toBeInTheDocument()
  })
})
