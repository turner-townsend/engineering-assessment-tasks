describe('Project Controls Hub - portfolio', () => {
  it('lists projects and navigates to detail', () => {
    cy.visit('/');

    cy.get('[data-testid="project-card"]').should('have.length.at.least', 1);
    cy.contains('Riverside Hospital Expansion').click();

    cy.location('pathname').should('include', '/projects/');
    cy.contains('Cost trend').should('be.visible');
    cy.contains('Schedule milestones').should('be.visible');
    cy.contains('Benchmarks vs peers').should('be.visible');
  });
});
