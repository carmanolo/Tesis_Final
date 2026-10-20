describe('Pruebas de Subida de Acta de Reunión', () => {
  beforeEach(() => {
    // 1. Inicia sesión con un usuario autorizado (administrador, secretario, etc.)
    cy.login('admin@gmail.com', 'admin123');
  });

  it('debe subir un acta (PDF/Word) a una reunión existente', () => {
    // 2. Intercepta la petición HTTP POST al backend usando un comodín (*) para la ID
    cy.intercept('POST', '**/reuniones/*/acta').as('subirActaReq');

    // 3. Visita la página de reuniones
    cy.visit('/reuniones');

    // 4. (Opcional) Si necesitas seleccionar o abrir el detalle de una reunión primero
    cy.get('button').contains('Subir Acta').click();

    // 5. Adjunta el archivo ahora que el modal/input está disponible
    cy.get('input[type="file"]').selectFile('cypress/fixtures/GuiaNeo4j.pdf', {
      force: true,
    });


    // 6. Haz clic en el botón de subir/guardar
    cy.get('button').contains('Subir Acta').click();

    // 7. Espera la respuesta de la API y valida que el status sea 200 o 201
    cy.wait('@subirActaReq').then((interception) => {
      expect(interception.response?.statusCode).to.be.oneOf([200, 201]);
    });

    // 8. Valida la respuesta visual en tu interfaz gráfica
    cy.contains('Acta subida correctamente').should('be.visible');
  });
});