// ***********************************************************
// This file is loaded automatically before test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

/**
 * cy.login() — symuluje zalogowanego użytkownika bez przechodzenia przez OAuth2.
 *
 * Działanie:
 * 1. Ustawia fake JWT token w localStorage zanim aplikacja się załaduje
 *    (onBeforeLoad gwarantuje że token jest PRZED inicjalizacją AuthProvider)
 * 2. Przechwytuje GET /api/auth/me i zwraca mock usera
 *    (AuthProvider wywoła ten endpoint przy starcie, musimy odpowiedzieć)
 * 3. Odwiedza stronę główną i czeka na zakończenie weryfikacji tożsamości
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
