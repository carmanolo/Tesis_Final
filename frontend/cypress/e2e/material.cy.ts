describe('Gestión de Edición de Materiales', () => {
  beforeEach(() => {
    // Iniciar sesión con un usuario con permisos de edición (Administrador o CEE)
    cy.login('admin@gmail.com', 'admin123');
  });

  it('debe editar un material existente exitosamente', () => {
    // 1. Interceptar las peticiones a la API
    cy.intercept('GET', '**/materiales*').as('getMateriales');
    cy.intercept('PATCH', '**/materiales/editar/*').as('patchMaterial');

    // 2. Visitar la vista de materiales
    cy.visit('/materiales');
    cy.wait('@getMateriales');
    cy.url().should('include', '/materiales');

    // 3. Desplegar el acordeón de DaisyUI del primer material
    cy.get('.collapse input[type="checkbox"]').first().check({ force: true });

    // 4. Hacer clic en el botón "Editar inventario"
    cy.contains('button', /editar inventario/i).click();

    // 5. Validar que el ModalMaterial se despliegue con el título de edición
    cy.get('.fixed').contains('h3', /editar material/i).should('be.visible');

    // 6. Modificar los campos del formulario dentro del modal
    // Campo: Nombre del material
    cy.get('.fixed form input[placeholder*="Calculadora"]').clear().type('Calculadora Científica Editada');

    // Campo: Tipo de material
    cy.get('.fixed form select').select('calculadora');

    // Campo: Stock disponible
    cy.get('.fixed form input[type="number"]').clear().type('10');

    // 7. Guardar los cambios
    cy.contains('button', /guardar cambios/i).click();

    // 8. Validar la respuesta del backend (PATCH /materiales/editar/:id)
    cy.wait('@patchMaterial').its('response.statusCode').should('be.oneOf', [200, 201]);

    // 9. Validar la aparición de la alerta de éxito de SweetAlert
    cy.get('.swal2-popup').should('be.visible');
    cy.contains('.swal2-title', /material actualizado/i).should('be.visible');
  });
});