describe('Pruebas de Subida de Acta de Reunión', () => {
  beforeEach(() => {
    cy.login('admin@gmail.com', 'admin123');
  });

  it('debe subir un acta (PDF/Word) a una reunión existente', () => {
    cy.intercept('POST', '**/reuniones/*/acta').as('subirActaReq');

    cy.visit('/reuniones');

    // Abre el detalle de la primera reunión (el botón naranja de la lista)
    cy.get('button.bg-\\[\\#EE820F\\]').first().click();

    // Dentro del modal, adjunta el archivo (el input está oculto, por eso force)
    cy.get('.fixed.inset-0').within(() => {
      cy.contains('Detalle Reunión').should('be.visible');
      cy.get('input[type="file"]').selectFile('cypress/fixtures/GuiaNeo4j.pdf', {
        force: true,
      });
    });

    // La subida se dispara sola al elegir el archivo
    cy.wait('@subirActaReq').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    cy.contains('Acta subida exitosamente').should('be.visible');
  });
});