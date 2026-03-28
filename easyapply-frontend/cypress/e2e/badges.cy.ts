describe('Badge Widget', () => {
  beforeEach(() => {
    cy.interceptApi()
  })

  describe('Badge Display', () => {
    it('should display badge widget header', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 0,
          totalGhosting: 0,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: { name: null },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesEmpty')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesEmpty')

      cy.contains('Twoje odznaki').should('be.visible')
    })

    it('should expand on click to show badge details', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 5,
          totalGhosting: 3,
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
        }
      }).as('getBadgesWithData')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesWithData')

      // Click to expand
      cy.get('[data-cy="badge-widget-header"]').click()

      // Should show badge details
      cy.contains('Odrzucone aplikacje').should('be.visible')
      cy.contains('Rękawica').should('be.visible')
      cy.contains('🥊').should('be.visible')
    })

    it('should show ghosting badge section', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 10,
          totalGhosting: 5,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Patelnia',
            icon: '🍳',
            threshold: 10
          },
          ghostingBadge: {
            name: 'Widmo',
            icon: '👻',
            threshold: 5,
            description: '5 firm nie odpowiedziało.'
          }
        }
      }).as('getBadgesWithGhosting')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesWithGhosting')

      cy.get('[data-cy="badge-widget-header"]').click()

      cy.contains('Bez odzewu').should('be.visible')
      cy.contains('Widmo').should('be.visible')
      cy.contains('👻').should('be.visible')
    })
  })

  describe('Sweet Revenge Achievement', () => {
    it('should display Sweet Revenge when unlocked', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 15,
          totalGhosting: 5,
          totalOffers: 1,
          sweetRevengeUnlocked: true,
          rejectionBadge: {
            name: 'Patelnia',
            icon: '🍳',
            threshold: 10
          },
          ghostingBadge: {
            name: 'Widmo',
            icon: '👻',
            threshold: 5
          }
        }
      }).as('getBadgesWithSweetRevenge')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesWithSweetRevenge')

      cy.get('[data-cy="badge-widget-header"]').click()

      cy.contains('Sweet Revenge').should('be.visible')
      cy.contains('Kto się śmieje ostatni').should('be.visible')
    })

    it('should not display Sweet Revenge when not unlocked', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 5,
          totalGhosting: 0,
          totalOffers: 1,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Rękawica',
            icon: '🥊',
            threshold: 5
          },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesNoSweetRevenge')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesNoSweetRevenge')

      cy.get('[data-cy="badge-widget-header"]').click()

      cy.contains('Sweet Revenge').should('not.exist')
    })
  })

  describe('Progress Tracking', () => {
    it('should show next badge information', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 7,
          totalGhosting: 0,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Rękawica',
            icon: '🥊',
            threshold: 5,
            currentCount: 7,
            nextThreshold: 10,
            nextBadgeName: 'Patelnia'
          },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesWithProgress')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesWithProgress')

      cy.get('[data-cy="badge-widget-header"]').click()

      // Should show next badge info
      cy.contains('Patelnia').should('be.visible')
      cy.contains('Następny').should('be.visible')
    })

    it('should show MAX for highest badge', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 100,
          totalGhosting: 0,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Statystyczna Pewność',
            icon: '🎰',
            threshold: 100,
            currentCount: 100,
            nextThreshold: null,
            nextBadgeName: null
          },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesMax')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesMax')

      cy.get('[data-cy="badge-widget-header"]').click()

      cy.contains('Statystyczna Pewność').should('be.visible')
      cy.contains('MAX').should('be.visible')
    })
  })

  describe('Badge Refresh', () => {
    it('should refresh badges when applications change', () => {
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 5,
          totalGhosting: 0,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Rękawica',
            icon: '🥊',
            threshold: 5
          },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesInitial')

      cy.login()
      cy.wait('@getApplications')
      cy.wait('@getBadgesInitial')

      // Now create a new application which should trigger badge refresh
      cy.intercept('GET', '/api/statistics/badges', {
        body: {
          totalRejections: 6,
          totalGhosting: 0,
          totalOffers: 0,
          sweetRevengeUnlocked: false,
          rejectionBadge: {
            name: 'Rękawica',
            icon: '🥊',
            threshold: 5,
            currentCount: 6
          },
          ghostingBadge: { name: null }
        }
      }).as('getBadgesUpdated')

      cy.get('[data-cy="add-application-btn"]').click()
      cy.get('#company').type('Test Company')
      cy.get('#position').type('Test Position')
      cy.get('[data-cy="form-submit-btn"]').click()

      // Badge widget should refresh
      cy.wait('@getBadgesUpdated')
    })
  })
})
