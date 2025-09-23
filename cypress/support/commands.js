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

import Constants from "./constants";
import { home } from "./pages/homePage";
import { login } from "./pages/loginPage";
import { purchase } from "./pages/purchasePage";

Cypress.Commands.add("login", () => {
    cy.visit(Constants.LOCATION);
    cy.get('input[name="user-name"]')
      .click()
      .type(Constants.TEST_USER);
    cy.get('input[name="password"]')
      .click()
      .type(Constants.TEST_PASSWORD);
    cy.get('input[type="submit"]').click();
    cy.get('div[class="inventory_item"]').should("be.visible");
});

Cypress.Commands.add("loginPOM", () => {
  cy.visit(Constants.LOCATION);
  login.typeUsername(Constants.TEST_USER);
  login.typePassword(Constants.TEST_PASSWORD);
  login.clickLogin();
  home.getInventoryItem().should("be.visible");
});

Cypress.Commands.add("addAllItemsToCart", () => {
  let count = 0;

  home.getItemName().each(($el, index, $list) => {
    // $el: botón actual
    // index: posición del botón
    // $list: todos los botones encontrados

    // Log para saber en qué producto estamos
    cy.log(`Agregando producto ${index + 1} de ${$list.length}: ${$el.text()}`);

    // Hacemos click en el nombre del producto actual
    home.getItemName().eq(index).click();

    // Validaciones dentro del detalle del producto
    home.getDetailsItemName().should("be.visible");
    home.getDetailsDescription().should("be.visible");

    // Agregar al carrito
    home.clickAddToCart();

    // Validar que el contador del carrito se actualiza
    home
      .getCartIconCounter()
      .should("be.visible")
      .and("have.text", String(index + 1));

    // Volver al listado de productos
    home.clickBackToProducts();

    // Validaciones del retorno
    home.getInventoryItem().should("be.visible");
    home.getRemoveBtn().should("be.visible");
  });
});

// Cypress.Commands.add("saveAppVersion", () => {
//     cy.get('div[class="footer_copy"]')
//     .invoke('text')
//     .then((text) => {
//       const match = text.match(/\d{4}/); // busca un año (4 dígitos seguidos)
//       const year = match ? match[0] : 'desconocido';

//       cy.writeFile('version.txt', year);
//       cy.log(`Guardando la versión ${year}`)
//     });
// });

Cypress.Commands.add("saveAppVersion", () => {
  cy.get('div.footer_copy')
    .invoke('text')
    .then((text) => {
      const match = text.match(/\d{4}/);       // busca un año (4 dígitos)
      const year = match ? parseInt(match[0], 10) : null;
      const nextYear = year ? year + 1 : 2021;

      cy.writeFile('version.txt', String(nextYear));
      cy.log(`Guardando la versión ${nextYear}`);
    });
});

Cypress.Commands.add("loginSession", () => {

  cy.session(
    'Nerdearla Session', () => {

      cy.visit(Constants.LOCATION);
      login.typeUsername(Constants.TEST_USER);
      login.typePassword(Constants.TEST_PASSWORD);
      login.clickLogin();
      // Validaciones mínimas para garantizar que la sesión se inició correctamente
      home.getInventoryItem().should("be.visible");
      // cy.saveAppVersion()

    },
    { cacheAcrossSpecs: true }
  )

});

Cypress.Commands.add("verifyOrderTotals", () => {

  let sumaPrecios = 0;

  // Sumamos todos los precios de los items
  purchase.getSummaryItemPrice().each(($el) => {
    const precio = parseFloat($el.text().replace("$", ""));
    sumaPrecios += precio;
  }).then(() => {
    // Validamos que la suma de los items coincida con el subtotal
    purchase.getSummarySubtotal().invoke("text").then((textoSubtotal) => {
      const subtotal = parseFloat(textoSubtotal.replace("Item total: $", ""));
      expect(sumaPrecios).to.eq(subtotal);

      // Obtenemos el tax
      purchase.getSummaryTax().invoke("text").then((textoTax) => {
        const tax = parseFloat(textoTax.replace("Tax: $", ""));

        // Obtenemos el total
        purchase.getSummaryTotal().invoke("text").then((textoTotal) => {
          const total = parseFloat(textoTotal.replace("Total: $", ""));

          // Validamos que subtotal + tax = total
          expect(subtotal + tax).to.eq(total);
        });
      });
    });
  });

});