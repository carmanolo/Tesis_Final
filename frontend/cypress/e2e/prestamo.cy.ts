describe('Gestión de Préstamos de Materiales', () => {
  beforeEach(() => {
    cy.login('admin@gmail.com', 'admin123');
  });

  it('debe registrar un préstamo de material exitosamente', () => {
    // 1. Interceptores de la API
    cy.intercept('GET', '**/materiales*').as('getMateriales');
    cy.intercept('POST', '**/prestamos/crear*').as('createPrestamo');

    // 2. Navegar a la página
    cy.visit('/materiales');
    cy.wait('@getMateriales');
    cy.url().should('include', '/materiales');

    // 3. Desplegar el acordeón de DaisyUI
    cy.get('.collapse input[type="checkbox"]').first().check({ force: true });

    // 4. Abrir modal
    cy.contains('button', /prestar a estudiante/i).click();
    cy.get('.fixed').contains('h3', /prestar material/i).should('be.visible');

    // 5. Completar el formulario
    cy.get('input[placeholder="Nombre y apellido del alumno"]')
      .clear()
      .type('Carlos Mendoza');

    // Especifica que busque el select dentro del modal (.fixed form select)
    cy.get('.fixed form select').select('Sí');

    // 6. Enviar el formulario
    cy.contains('button', /registrar préstamo/i).click();

    // 7. Validaciones
    cy.wait('@createPrestamo').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-confirm').click();
  });
});