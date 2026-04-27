import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ServiceModal } from '../../components/notices/ServiceModal'
import type { ServiceNotice } from '../../types/domain'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'pl' },
    t: (key: string) => (key === 'notices.ok' ? 'OK, rozumiem' : key),
  }),
}))

const notice: ServiceNotice = {
  id: 42,
  type: 'MODAL',
  messagePl: 'Ważna informacja',
  messageEn: 'Important notice',
  expiresAt: null,
}

describe('ServiceModal', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders modal message', () => {
    render(<ServiceModal notice={notice} />)
    expect(screen.getByText('Ważna informacja')).toBeInTheDocument()
  })

  it('hides modal after clicking OK', async () => {
    render(<ServiceModal notice={notice} />)
    expect(screen.getByText('Ważna informacja')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /OK/i }))

    expect(screen.queryByText('Ważna informacja')).not.toBeInTheDocument()
  })

  it('does not show modal when id is already in localStorage', () => {
    localStorage.setItem('dismissed_notices', JSON.stringify([42]))
    render(<ServiceModal notice={notice} />)
    expect(screen.queryByText('Ważna informacja')).not.toBeInTheDocument()
  })

  it('saves id to localStorage after clicking OK', async () => {
    render(<ServiceModal notice={notice} />)
    await userEvent.click(screen.getByRole('button', { name: /OK/i }))

    const dismissed = JSON.parse(localStorage.getItem('dismissed_notices') || '[]') as number[]
    expect(dismissed).toContain(42)
  })
})
