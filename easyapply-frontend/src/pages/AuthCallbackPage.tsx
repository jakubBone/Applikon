import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/api'

/**
 * Strona wywoływana po udanym logowaniu Google.
 *
 * Backend przekierowuje na: /auth/callback?token=<JWT>
 * Ta strona:
 * 1. Wyciąga token z URL parametru
 * 2. Zapisuje go w localStorage
 * 3. Przekierowuje na dashboard
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
      setToken(token)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [navigate])

  return null
}
