import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PrivacyPolicy } from './PrivacyPolicy'

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

// Mock privacy policy content
vi.mock('../content/privacyPolicy', () => ({
  privacyPolicyPl: `
# Polityka prywatności EasyApply

## 1. Kim jestem?

Administratorem Twoich danych osobowych w aplikacji **EasyApply** jest Jakub Boniecki.

## 2. Jakie dane zbieram?

Zbieram minimalny zakres danych:
- Email
- Imię i nazwisko
- Dane o aplikacjach o pracę

**Czego NIE zbieram:**
- Plików CV
- Danych o lokalizacji
`,
  privacyPolicyEn: `
# EasyApply Privacy Policy

## 1. Who am I?

The data controller for your personal data in the **EasyApply** application is Jakub Boniecki.

## 2. What data do I collect?

I collect the minimum data necessary:
- Email address
- Name
- Job application data

**What I do NOT collect:**
- CV files
- Location data
`,
}))

describe('PrivacyPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders privacy policy page', () => {
    render(<PrivacyPolicy />)

    expect(screen.getByText(/EasyApply Privacy Policy/)).toBeInTheDocument()
  })

  it('displays main headings', () => {
    render(<PrivacyPolicy />)

    expect(screen.getByText(/Who am I/)).toBeInTheDocument()
    expect(screen.getByText(/What data do I collect/)).toBeInTheDocument()
  })

  it('displays content with proper formatting', () => {
    render(<PrivacyPolicy />)

    // Check for content
    expect(screen.getByText(/Jakub Boniecki/)).toBeInTheDocument()
    expect(screen.getByText(/Email address/)).toBeInTheDocument()
  })

  it('renders lists', () => {
    render(<PrivacyPolicy />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThan(0)
  })

  it('applies proper CSS classes', () => {
    const { container } = render(<PrivacyPolicy />)

    expect(container.querySelector('.privacy-policy-page')).toBeInTheDocument()
    expect(container.querySelector('.privacy-container')).toBeInTheDocument()
    expect(container.querySelector('.privacy-content')).toBeInTheDocument()
  })

  it('renders with markdown formatting (headings)', () => {
    render(<PrivacyPolicy />)

    // Check for markdown-rendered headings
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/EasyApply Privacy Policy/)

    const h2Elements = screen.getAllByRole('heading', { level: 2 })
    expect(h2Elements.length).toBeGreaterThan(0)
  })

  it('does NOT display raw markdown syntax', () => {
    render(<PrivacyPolicy />)

    // Should NOT contain raw markdown
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
  })
})
