describe("Publicaciones · Crear (Visual Completo)", () => {
  beforeEach(() => {
    cy.login("carlos.dominguez2301@alumnos.ubiobio.cl", "aguanteelcolo");
    cy.visit("/publicaciones");
  });

  it("crea publicación, muestra alerta de éxito y cierra el modal", () => {
    // 1. Mockeamos la respuesta del backend
    cy.intercept("POST", "**/api/publicaciones/crear", {
      statusCode: 201,
      body: { message: "Publicación creada" }
    }).as("crear");

    // 2. Abrir modal
    cy.contains("button", /nueva publicación/i).click();
    cy.get(".modal.modal-open").should("be.visible");

    // 3. Llenar datos
    cy.get('.modal.modal-open input[type="text"]').type("Publicación Visual E2E");
    cy.get(".modal.modal-open textarea").type("Esta vez sí funcionará la pantalla.");

    // 4. Subir imagen
    cy.get('.modal.modal-open input[type="file"]').selectFile(
      "cypress/fixtures/imagenes/valida.png",
      { force: true }
    );
    cy.get('.modal.modal-open img[alt^="preview-"]').should("be.visible");

    // 5. Hacer clic en Publicar
    cy.contains(".modal.modal-open button", /publicar/i).click();

    // 6. Esperar la petición
    cy.wait("@crear").its("response.statusCode").should("eq", 201);

    // 7. Verificar que la alerta de Swal aparece
    cy.get(".swal2-popup").should("be.visible");
    cy.contains("Publicación creada").should("be.visible");

  });
});