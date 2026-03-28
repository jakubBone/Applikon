import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/api'

/**
 * Page called after a successful Google login.
 *
 * Backend redirects to: /auth/callback?token=<JWT>
 * This page:
 * 1. Extracts the token from the URL parameter
 * 2. Saves it in localStorage
 * 3. Redirects to the dashboard
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
