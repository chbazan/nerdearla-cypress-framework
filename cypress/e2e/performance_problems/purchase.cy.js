import { home } from "../../support/pages/homePage";
import { purchase } from "../../support/pages/purchasePage";

describe("Compra", () => {

  it("Login", () => {

    cy.loginSession();

  });

  it("Ingreso al home", () => {

    cy.visit(`https://www.saucedemo.com/v1/inventory.html`);
    home.getInventoryItem().should('be.visible')
    cy.wait(5000)

  });

  it("Ingreso al carrito vacío", () => {

    // Ingresar al carrito sin tener items añadidos
    home.clickCartIcon()
    // Volver al home
    home.clickContinueShopping()
    home.getInventoryItem().should("be.visible")
    cy.wait(5000)

  });

  it("Agregar todos los items al carrito", () => {

    home.getAddToCartBtn()
    .should("be.visible")
    .click({ multiple: true });
    cy.wait(5000)

  });

  it("Ingresar al carrito lleno", () => {
    // Ingresar al carrito teniendo todos los items añadidos
    home.clickCartIcon()
    cy.wait(5000)
  });

  it("Checkout de la compra", () => {

    // Checkout paso 1: Formulario de datos
    purchase.clickCheckoutBtn()
    purchase.typeFirstName("testName")
    purchase.typeLastName("lastName")
    purchase.typePostalCode("postalCode")
    purchase.clickContinueCheckoutBtn()
    cy.wait(5000)
    
    // Checkout paso 2: Resumen de compra y validación de suma correcta de los precios
    purchase.getSummaryInfo().should("be.visible");
    cy.wait(5000)
    cy.verifyOrderTotals()

  });

  it("Confirmar la compra", () => {

    purchase.clickFinish();
    cy.wait(5000)
    // Validamos que la compra haya sido confirmada
    purchase.getCheckoutCompleteContainer().should("be.visible");
    // Validamos que el carrito quedó vacío
    home.getCartIconCounter().should("not.exist");

  });


});