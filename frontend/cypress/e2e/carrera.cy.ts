describe("Carreras · Crear (E2E Visual)", () => {
  beforeEach(() => {
    // 1. Login con un administrador (admin@gmail.com tiene el rol correcto)
    cy.login("admin@gmail.com", "admin123");
    
    // 2. Visitar la página donde está la tabla de carreras
    // (Ajusta la ruta si tu página se llama distinto, ej: /admin/carreras)
    cy.visit("/carreras"); 
  });

  it("abre el Swal, crea la carrera y muestra el mensaje de éxito", () => {
    // 3. Mockeamos la respuesta del backend para que no falle por CORS
    cy.intercept("POST", "**/api/carreras/crear/", {
      statusCode: 201,
      body: { 
        message: "Carrera registrada exitosamente",
        data: { id_carrera: 99, nombre_carrera: "Ingeniería de Prueba", sigla: "IP" } 
      }
    }).as("crearCarrera");

    // 4. Buscar y hacer clic en el botón para crear carrera
    cy.contains("button", /nueva carrera|crear carrera/i).click();

    // 5. Validar que el Swal de tu hook useCrearCarrera.jsx se abrió
    cy.get(".swal2-popup").should("be.visible");
    cy.contains("Crear Nueva Carrera").should("be.visible");

    // 6. Llenar el formulario dentro del Swal
    cy.get("#swal2-input1").type("Ingeniería de Prueba");
    cy.get("#swal2-input2").type("IP");

    // 7. Hacer clic en el botón "Crear" del Swal
    cy.get(".swal2-confirm").click();

    // 8. Esperar la petición HTTP
    cy.wait("@crearCarrera").its("response.statusCode").should("eq", 201);

    // 9. Verificar el mensaje de éxito de tu fireDynamicSwal
    cy.get(".swal2-popup").should("be.visible");
    cy.contains("Carrera registrada exitosamente").should("be.visible");

    // 10. El Swal de éxito tiene un timer de 2000ms, esperamos a que se cierre
    cy.get(".swal2-popup", { timeout: 5000 }).should("not.exist");
  });
});