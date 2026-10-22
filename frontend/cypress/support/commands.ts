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


/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(correo?: string, clave?: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (correo = "admin@gmail.com", clave = "admin123") => {
  cy.session(
    [correo, clave],
    () => {
      cy.request({
        method: "POST",
        url: "http://localhost:3000/api/auth/login",
        body: { email: correo, password: clave },
      }).then((response) => {
        const { accessToken } = response.body;

        // 1. Cookie de autenticación
        cy.setCookie("jwt-auth", accessToken, { path: "/" });

        // 2. Datos del usuario a partir del payload del token
        const payloadBase64 = accessToken.split(".")[1];
        const decodedPayload = JSON.parse(window.atob(payloadBase64));

        const userData = {
          username: decodedPayload.username,
          email: decodedPayload.email,
          rut: decodedPayload.rut,
          role: decodedPayload.role,
        };

        // 3. Guardar el usuario en el sessionStorage de la APP (no del runner).
        //    Se visita primero el origen de la app para escribir en su storage.
        cy.visit("/login");
        cy.window().then((win) => {
          win.sessionStorage.setItem("usuario", JSON.stringify(userData));
        });
      });
    },
    {
      // Si la cookie no existe, la sesión se considera inválida y se recrea
      validate() {
        cy.getCookie("jwt-auth").should("exist");
      },
    }
  );
});

export {};