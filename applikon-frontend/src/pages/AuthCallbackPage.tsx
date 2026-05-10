import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../services/api'

/**
 * Page called after a successful Google login.
 *
 * Backend redirects to: /auth/callback#token=<JWT>
 * Token is in the URL fragment — never sent to the server by the browser.
 * This page:
 * 1. Extracts the token from the URL fragment
 * 2. Saves it in localStorage
 * 3. Redirects to the dashboard
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1))
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
