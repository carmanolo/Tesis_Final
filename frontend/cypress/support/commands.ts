// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("login", (correo = "admin@gmail.com", clave = "admin123") => {
  cy.session([correo, clave], () => {
    cy.request({
      method: "POST",
      url: "http://localhost:3000/api/login", // Ajusta esta URL a la ruta real de tu backend para hacer login
      body: {
        correo: correo,
        clave: clave,
      },
    }).then((response) => {
      // Si tu aplicación guarda un Token en localStorage, guárdalo aquí:
      window.localStorage.setItem("token", response.body.token);
    });
  });
});