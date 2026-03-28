describe('CV Manager', () => {
  beforeEach(() => {
    cy.interceptApi()

    // Mock CVs
    cy.intercept('GET', '/api/cv', {
      body: [
        {
          id: 1,
          originalFileName: 'CV_Frontend.pdf',
          type: 'FILE',
          fileSize: 1024000,
          uploadedAt: '2024-01-15T10:00:00'
        },
        {
          id: 2,
          originalFileName: 'CV_Backend.pdf',
          type: 'LINK',
          externalUrl: 'https://drive.google.com/file/123',
          uploadedAt: '2024-01-10T09:00:00'
        },
        {
          id: 3,
          originalFileName: 'CV_Local_Note',
          type: 'NOTE',
          uploadedAt: '2024-01-05T08:00:00'
        }
      ]
    }).as('getCVsWithData')

    cy.login()
    cy.wait('@getApplications')
    cy.wait('@getBadges')
  })

  describe('CV View', () => {
    it('should navigate to CV view', () => {
      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      cy.contains('Moje CV').should('be.visible')
    })

    it('should display list of CVs', () => {
      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      cy.contains('CV_Frontend.pdf').should('be.visible')
      cy.contains('CV_Backend.pdf').should('be.visible')
      cy.contains('CV_Local_Note').should('be.visible')
    })

    it('should show CV type indicators', () => {
      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      // Different types should be distinguishable
      cy.get('.cv-list, .cv-items').should('exist')
    })
  })

  describe('CV Upload', () => {
    it('should show upload button', () => {
      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      cy.get('[data-cy="add-cv-btn"]').should('be.visible')
    })

    it('should show upload form when clicking add button', () => {
      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      cy.get('[data-cy="add-cv-btn"]').click()

      cy.get('.cv-form, .add-cv-form, form').should('be.visible')
    })
  })

  describe('CV Delete', () => {
    it('should have delete option for CVs', () => {
      cy.intercept('DELETE', '/api/cv/1', {
        statusCode: 204
      }).as('deleteCV')

      cy.get('[data-cy="tab-cv"]').click()
      cy.wait('@getCVsWithData')

      // Find delete button for first CV
      cy.contains('CV_Frontend.pdf')
        .parents('.cv-item, .cv-card, tr')
        .find('button, .delete-btn')
        .first()
        .click()

      // Note: May need to confirm deletion
    })
  })

  describe('CV Assignment', () => {
    it('should show CV assignment section in application details', () => {
      // Mock an application with a CV assigned
      cy.intercept('GET', '/api/applications', {
        body: [{
          id: 1,
          company: 'Google',
          position: 'Developer',
          status: 'WYSLANE',
          cvId: 1,
          cvFileName: 'CV_Frontend.pdf',
          cvType: 'FILE',
          appliedAt: '2024-01-15T10:00:00'
        }]
      }).as('getApplicationsWithCV')

      cy.login()
      cy.wait('@getApplicationsWithCV')
      cy.wait('@getBadges')

      cy.contains('.kanban-card', 'Google').click()

      // Should show CV info in details
      cy.contains('CV').should('be.visible')
      cy.contains('CV_Frontend.pdf').should('be.visible')
    })

    it('should allow downloading FILE type CV', () => {
      cy.intercept('GET', '/api/applications', {
        body: [{
          id: 1,
          company: 'Google',
          position: 'Developer',
          status: 'WYSLANE',
          cvId: 1,
          cvFileName: 'CV_Frontend.pdf',
          cvType: 'FILE',
          appliedAt: '2024-01-15T10:00:00'
        }]
      }).as('getApplicationsWithFileCV')

      cy.login()
      cy.wait('@getApplicationsWithFileCV')
      cy.wait('@getBadges')

      cy.contains('.kanban-card', 'Google').click()

      // Download button should be present
      cy.contains('Pobierz').should('be.visible')
    })

    it('should show open button for LINK type CV', () => {
      cy.intercept('GET', '/api/applications', {
        body: [{
          id: 1,
          company: 'Google',
          position: 'Developer',
          status: 'WYSLANE',
          cvId: 2,
          cvFileName: 'CV_Backend.pdf',
          cvType: 'LINK',
          cvExternalUrl: 'https://drive.google.com/file/123',
          appliedAt: '2024-01-15T10:00:00'
        }]
      }).as('getApplicationsWithLinkCV')

      cy.login()
      cy.wait('@getApplicationsWithLinkCV')
      cy.wait('@getBadges')

      cy.contains('.kanban-card', 'Google').click()

      // Open button should be present for LINK type
      cy.contains('Otwórz').should('be.visible')
    })
  })
})
