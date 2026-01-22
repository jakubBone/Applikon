import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BadgeWidget from '../../BadgeWidget'
import * as api from '../../services/api'

// Mock API
vi.mock('../../services/api', () => ({
  fetchBadgeStats: vi.fn()
}))

describe('BadgeWidget', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  // ==================== RENDERING Tests ====================

  describe('Rendering', () => {
    it('nie renderuje nic podczas ładowania', async () => {
      api.fetchBadgeStats.mockImplementation(() => new Promise(() => {})) // Never resolves

      const { container } = render(<BadgeWidget refreshTrigger={[]} />)

      // Initially returns null while loading
      expect(container.firstChild).toBeNull()
    })

    it('renderuje nagłówek z ikoną odznak', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 0,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: null },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        expect(screen.getByText(/Twoje odznaki/)).toBeInTheDocument()
      })
    })

    it('jest domyślnie zwinięty', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊', threshold: 5 },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        expect(screen.getByText(/Twoje odznaki/)).toBeInTheDocument()
      })

      // Dropdown content should not be visible initially
      expect(screen.queryByText(/Twoje odrzucenia/)).not.toBeInTheDocument()
    })

    it('rozwija się po kliknięciu nagłówka', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊', threshold: 5 },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        expect(screen.getByText(/Twoje odznaki/)).toBeInTheDocument()
      })

      // Click to expand
      fireEvent.click(screen.getByText(/Twoje odznaki/))

      // Dropdown content should now be visible
      await waitFor(() => {
        expect(screen.getByText(/Twoje odrzucenia/)).toBeInTheDocument()
      })
    })
  })

  // ==================== REJECTION BADGE Tests ====================

  describe('Rejection Badges', () => {
    it('wyświetla "Rękawica" przy 5 odmowach', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: {
          name: 'Rękawica',
          icon: '🥊',
          threshold: 5,
          description: 'Dopiero zaczynasz.',
          nextThreshold: 10,
          nextBadgeName: 'Patelnia'
        },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText('Rękawica')).toBeInTheDocument()
        expect(screen.getByText('🥊')).toBeInTheDocument()
      })
    })

    it('wyświetla następną odznakę do zdobycia', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 7,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: {
          name: 'Rękawica',
          icon: '🥊',
          threshold: 5,
          description: 'Dopiero zaczynasz.',
          nextThreshold: 10,
          nextBadgeName: 'Patelnia'
        },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText(/Następny.*Patelnia/)).toBeInTheDocument()
      })
    })

    it('pokazuje MAX gdy osiągnięto najwyższą odznakę', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 100,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: {
          name: 'Statystyczna Pewność',
          icon: '🎰',
          threshold: 100,
          description: 'Przy takiej próbie, kolejna MUSI być ta właściwa.',
          nextThreshold: null,
          nextBadgeName: null
        },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText('MAX')).toBeInTheDocument()
      })
    })
  })

  // ==================== GHOSTING BADGE Tests ====================

  describe('Ghosting Badges', () => {
    it('wyświetla "Widmo" przy 5 ghostingach', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 5,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊', threshold: 5 },
        ghostingBadge: {
          name: 'Widmo',
          icon: '👻',
          threshold: 5,
          description: '5 firm nie odpowiedziało wcale.',
          nextThreshold: 15,
          nextBadgeName: 'Cierpliwy Mnich'
        }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText('Widmo')).toBeInTheDocument()
      })
    })

    it('wyświetla liczbę ghostingów', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 10,
        totalGhosting: 8,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Patelnia', icon: '🍳', threshold: 10 },
        ghostingBadge: {
          name: 'Widmo',
          icon: '👻',
          threshold: 5
        }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText(/Ghosting.*8/)).toBeInTheDocument()
      })
    })
  })

  // ==================== SWEET REVENGE Tests ====================

  describe('Sweet Revenge', () => {
    it('wyświetla Sweet Revenge gdy odblokowane', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 15,
        totalGhosting: 5,
        totalOffers: 2,
        sweetRevengeUnlocked: true,
        rejectionBadge: { name: 'Patelnia', icon: '🍳', threshold: 10 },
        ghostingBadge: { name: 'Widmo', icon: '👻', threshold: 5 }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.getByText('Sweet Revenge')).toBeInTheDocument()
        expect(screen.getByText(/Kto się śmieje ostatni/)).toBeInTheDocument()
      })
    })

    it('nie wyświetla Sweet Revenge gdy nie odblokowane', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 0,
        totalOffers: 1,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊', threshold: 5 },
        ghostingBadge: { name: null }
      })

      render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Twoje odznaki/))
      })

      await waitFor(() => {
        expect(screen.queryByText('Sweet Revenge')).not.toBeInTheDocument()
      })
    })
  })

  // ==================== REFRESH Tests ====================

  describe('Refresh Trigger', () => {
    it('odświeża dane gdy zmieni się refreshTrigger', async () => {
      api.fetchBadgeStats.mockResolvedValue({
        totalRejections: 5,
        totalGhosting: 0,
        totalOffers: 0,
        sweetRevengeUnlocked: false,
        rejectionBadge: { name: 'Rękawica', icon: '🥊', threshold: 5 },
        ghostingBadge: { name: null }
      })

      const { rerender } = render(<BadgeWidget refreshTrigger={[{ id: 1 }]} />)

      await waitFor(() => {
        expect(api.fetchBadgeStats).toHaveBeenCalledTimes(1)
      })

      // Change trigger
      rerender(<BadgeWidget refreshTrigger={[{ id: 1 }, { id: 2 }]} />)

      await waitFor(() => {
        expect(api.fetchBadgeStats).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ==================== ERROR HANDLING Tests ====================

  describe('Error Handling', () => {
    it('obsługuje błąd API gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      api.fetchBadgeStats.mockRejectedValue(new Error('API Error'))

      const { container } = render(<BadgeWidget refreshTrigger={[]} />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Should not crash - returns null when no stats
      expect(container.firstChild).toBeNull()

      consoleSpy.mockRestore()
    })
  })
})
