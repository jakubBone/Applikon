// ***********************************************************
// This file is loaded automatically before test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

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
