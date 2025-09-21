describe("Login", () => {

    // Para hacer una sola vez login y utilizarlo para los distintos specs compartidos utilizamos cy.session, para esto creamos un nuevo comando

    it("Login y preseteo de datos", () => {

        //cy.loginPOM(); vamos a usar este comando primero para mostrar la diferencia con session
        cy.loginSession()

    });
});