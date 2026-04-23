import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { Settings } from './Settings'
import { AuthProvider } from '../auth/AuthProvider'
import * as api from '../services/api'

// Mock API
vi.mock('../services/api', () => ({
  fetchCurrentUser: vi.fn(),
  getToken: vi.fn(),
  clearToken: vi.fn(),
  logout: vi.fn(),
  deleteAccount: vi.fn(),
}))

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'app.loading': 'Loading...',
        'settings.title': 'Settings',
        'settings.accountSection': 'Account',
        'form.company': 'Email',
        'settings.privacyAcceptedAt': 'Privacy policy accepted:',
        'settings.dateLocale': 'en-US',
        'settings.dangerZone': 'Danger zone',
        'settings.deleteAccount.button': 'Delete account',
        'settings.deleteAccount.confirmTitle': 'Delete account?',
        'settings.deleteAccount.warning': 'This action is irreversible.',
        'settings.deleteAccount.confirmInputPrompt': 'Type DELETE to confirm',
        'settings.deleteAccount.confirmWord': 'DELETE',
        'settings.deleteAccount.cancel': 'Cancel',
        'settings.deleteAccount.confirm': 'Delete my account',
        'settings.deleteAccount.success': 'Account deleted',
        'settings.deleteAccount.error': 'Failed to delete account',
      }
      return translations[key] || key
    },
    i18n: { language: 'en' },
  }),
}))

// Mock Footer
vi.mock('../components/layout/Footer', () => ({
  Footer: () => <div>Footer</div>,
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const user = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    privacyPolicyAcceptedAt: '2026-04-23T10:00:00',
  }
  vi.mocked(api.fetchCurrentUser).mockResolvedValue(user)
  vi.mocked(api.getToken).mockReturnValue('test-token')

  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock alert
    window.alert = vi.fn()
  })

  it('renders settings page with account info', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Account')).toBeInTheDocument()
    })

    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
  })

  it('displays privacy policy acceptance date', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Privacy policy accepted:/)).toBeInTheDocument()
    })
  })

  it('renders delete account button', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete account/i })).toBeInTheDocument()
    })
  })

  it('opens delete confirmation modal on button click', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete account/i })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeInTheDocument()
      expect(screen.getByText(/This action is irreversible/)).toBeInTheDocument()
    })
  })

  it('requires confirmation word in modal', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete account/i })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /Delete my account/i })
    expect(confirmButton).toBeDisabled()

    // Type incorrect word
    const input = screen.getByPlaceholderText('DELETE')
    await userEvent.type(input, 'WRONG')
    expect(confirmButton).toBeDisabled()

    // Clear and type correct word
    await userEvent.clear(input)
    await userEvent.type(input, 'DELETE')
    expect(confirmButton).not.toBeDisabled()
  })

  it('calls deleteAccount API on confirmation', async () => {
    vi.mocked(api.deleteAccount).mockResolvedValue(undefined)

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete account/i })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('DELETE')
    await userEvent.type(input, 'DELETE')

    const confirmButton = screen.getByRole('button', { name: /Delete my account/i })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(api.deleteAccount).toHaveBeenCalled()
    })
  })

  it('closes modal when cancel is clicked', async () => {
    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete account/i })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Delete account?')).not.toBeInTheDocument()
    })
  })

  it('shows error message on delete failure', async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(new Error('API error'))

    render(
      <TestWrapper>
        <Settings />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    const deleteButton = screen.getByRole('button', { name: /Delete account/i })
    await userEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete account?')).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText('DELETE')
    await userEvent.type(input, 'DELETE')

    const confirmButton = screen.getByRole('button', { name: /Delete my account/i })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/Failed to delete account/)).toBeInTheDocument()
    })
  })
})
