import { home } from "../../support/pages/homePage";

describe("Home", () => {

    // Acá vamos a notar la diferencia entre usar session haciendo posteriormente el visit al path en particular

    // it("Login sin session", () => {

    //     cy.loginPOM();

    // });

    it("Login", () => {

        cy.loginSession();

    });

    it("Ingreso al home", () => {

        cy.visit(`https://www.saucedemo.com/v1/inventory.html`);
        home.getInventoryItem().should('be.visible')
        cy.wait(5000)

    });

    it("Navegabilidad entre items mientras se añaden al carrito", () => {
        cy.addAllItemsToCart();
    });

    // Ahora pasamos a armar nuestro 2do flujo: Eliminar del carrito items
    // Por el contrario al de agregar items, en general el usuario elimina items cuando se encuentra en el home de nuestra página, entonces ideamos un caso, aprovechando el flujo pasado, para eliminar los items agregados al carrito. Con esto tenemos una posible métrica a seguir en performance: Eliminar todos los items del carrito.

    it("Eliminar todos los items del carrito", () => {
        // Validamos si el carrito tiene items
        home.getCartIcon().then(($badge) => {
            if ($badge.length > 0) {
                cy.log(`Eliminando ${$badge.text()} items del carrito`);

                // Click en todos los botones Remove visibles
                home.getRemoveBtn().should("be.visible").click({ multiple: true });
            }
        });

        // Validamos que el carrito quedó vacío (el contador ya no existe)
        home.getCartIconCounter().should("not.exist");
    });

});