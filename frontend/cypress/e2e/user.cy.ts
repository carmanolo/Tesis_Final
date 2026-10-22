describe('Gestión de usuarios', () => {
  beforeEach(() => {
    cy.login('admin@gmail.com', 'admin123');
  });

  it('debe crear un usuario y mostrar el mensaje de confirmación', () => {
    // 1. Interceptar endpoints de la API (usuarios y carreras)
    cy.intercept('GET', '**/api/users*').as('getUsers');
    cy.intercept('GET', '**/carreras*').as('getCarreras'); // Ajustar patrón según tu backend si difiere
    cy.intercept('POST', '**/api/users/crear*').as('createUser');

    // 2. Cargar vista y esperar a que terminen AMBAS peticiones
    cy.visit('/users');
    cy.wait(['@getUsers', '@getCarreras']);
    cy.url().should('include', '/users');

    // 3. Abrir modal
    cy.contains('button', /crear usuario/i).click();
    cy.get('.swal2-popup').should('be.visible');

    // 4. Llenar campos
    cy.get('#swal2-input1').clear().type('Fernado mesia');
    cy.get('#swal2-input2').clear().type('juan.perez@alumnos.ubiobio.cl');
    cy.get('#swal2-input3').clear().type('ClaveSegura123!');

    // Seleccionar rol
    cy.get('#swal2-input4').select('presidente cee');

    // 5. Esperar explícitamente a que existan opciones en el desplegable de Carrera
    cy.get('#swal2-input5 option').should('have.length.gt', 1);
    cy.get('#swal2-input5').select(1);

    // 6. Confirmar envío
    cy.get('.swal2-confirm').click();

    // 7. Validaciones finales
    cy.wait('@createUser').its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-title, .swal2-html-container').should('be.visible');
  });
});