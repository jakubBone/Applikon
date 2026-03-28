// ***********************************************************
// This file is loaded automatically before test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

declare global {
  namespace Cypress {
    interface Chainable {
      login(path?: string): void
      createApplication(company: string, position: string, options?: { salaryMin?: number; source?: string }): void
      waitForApi(): void
      interceptApi(): void
    }
  }
}

/**
 * cy.login() — simulates a logged-in user without going through OAuth2.
 *
 * How it works:
 * 1. Sets a fake JWT token in localStorage before the app loads
 *    (onBeforeLoad ensures the token is present BEFORE AuthProvider initializes)
 * 2. Intercepts GET /api/auth/me and returns a mock user
 *    (AuthProvider calls this endpoint on startup, we need to respond)
 * 3. Visits the main page and waits for identity verification to complete
 */
Cypress.Commands.add('login', (path = '/') => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' }

  cy.intercept('GET', '**/api/auth/me', mockUser).as('authMe')

  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('easyapply_token', 'fake-test-token')
    },
  })

  cy.wait('@authMe')
})

// Custom commands
Cypress.Commands.add('createApplication', (company, position, options = {}) => {
  cy.get('button').contains('+ Dodaj aplikację').click()
  cy.get('#company').type(company)
  cy.get('#position').type(position)

  if (options.salaryMin) {
    cy.get('input[name="salaryMin"]').type(options.salaryMin.toString())
  }

  if (options.source) {
    cy.get('#source').type(options.source)
  }

  cy.get('button[type="submit"]').contains(/Dodaj aplikację|Kontynuuj/).click()
})

Cypress.Commands.add('waitForApi', () => {
  // Wait for the loading state to disappear
  cy.get('.loading').should('not.exist')
})

// API intercepts
Cypress.Commands.add('interceptApi', () => {
  cy.intercept('GET', '/api/applications').as('getApplications')
  cy.intercept('POST', '/api/applications').as('createApplication')
  cy.intercept('PATCH', '/api/applications/*/status').as('updateStatus')
  cy.intercept('PATCH', '/api/applications/*/stage').as('updateStage')
  cy.intercept('DELETE', '/api/applications/*').as('deleteApplication')
  cy.intercept('GET', '/api/statistics/badges').as('getBadges')
  cy.intercept('GET', '/api/cv').as('getCVs')
  cy.intercept('GET', '/api/applications/check-duplicate*').as('checkDuplicate')
})
