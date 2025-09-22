import Constants from "../support/constants"; // Import relativo ES Modules (ESM)
import { home } from "../support/pages/homePage";
import { purchase } from "../support/pages/purchasePage";

// 1) Explicación de que flujos automatizar y la importancia de las definiciones funcionales.

// 2) Para instalar las dependencias > Node 22 (NVM opcional).

// 3) Enfoque de las pruebas.

// 4) Estructura de los casos de cypress, replicando los flujos debatidos y concordados funcionalmente 2) Buenas prácticas en cypress: configuraciones de resolución de pantalla, timeout, la importancia de los shoulds, seteo de dotnev, uso de comandos, variables de entorno y POM 3) Modularizacón de los specs y run mediante npm de los scripts generados en package.json y el uso de reportes html y json

// 5) Explicación del framework: Complementando cypress
// Vista por arriba del script de python y que arhivos genera: explicación de los archivos de descripción y sección generados y porque el uso del p95.
// Explicación del workflow en GH Actions y el seteo de sus tokens y secrets: Ver el paso a paso del workflow y sus diferentes métodos de ejecución (cron - dispatch - push - llamando a otro job - etc)

// 6) Sugerencias finales y como "aprovechar" este framework.

// Intro a estrcutra, selectores y acciones en cypress

/*

¿Qué son los it en Cypress?

Representan casos de prueba individuales dentro de un suite (describe). La idea es que cada it exprese en lenguaje natural claro, y puntual, qué se está probando.

Sentencias básicas de Cypress:

cy.visit() → Visita una URL específica.
cy.origin() → Permite interactuar con una URL diferente (cross-origin).
cy.get() → Selecciona un elemento en la página mediante un selector.
cy.click() → Simula un clic en un elemento.
cy.type() → Escribe texto en un campo de entrada.
cy.contains() → Busca un elemento que contenga un texto específico.
cy.should() → Hace una aserción (verifica que algo cumpla una condición).

Formas de poder tomar un selector en Cypress:

Mediante un texto en particular: cy.contains('Simular Inversión')
Mediante una clase: cy.get('.col-xl-4')
Mediante ID: cy.get('#investmentAmount')
Un elemento dentro de otro: cy.get(':nth-child(5) > #exchangeRate')
Un atributo particular de un elemento: cy.get('div[class="gy-4 row"]') → Más recomendada por cypress.

*/

// Para hacer la "prueba desde cero" se puede ir haciendo un .only a los it que se quieran probar en cada paso que vamos a ir viendo.
describe("Login", () => {
  // Ejemplo de posibles selectores, recomendados y no recomendados

  it("Login con selectores no recomendados", () => {
    cy.visit("https://www.saucedemo.com/");
    cy.get(".input_error.form_input").eq(0).type("standard_user");
    // Otras posibilidades de selectores NO recomendados: .input_error.form_input | input.input_error.form_input | input[class="input_error form_input"]
    // Otras posibilidades de selectores: input[placeholder="Username"] | input[data-test="username"] | input[name="user-name"]| #user-name
    cy.get(".input_error.form_input").eq(1).type("secret_sauce");
    cy.contains("Login").click();
  });

  // Ejemplo con selectores recomendados, pero con it incompleto

  it("Login incompleto", () => {
    cy.visit("https://www.saucedemo.com/");
    cy.get('input[name="user-name"]')
      .click()
      .type("standard_user");
    cy.get('input[name="password"]')
      .click()
      .type("secret_sauce");
    cy.get('input[name="login-button"]').click();
  });

  // It de login completo (con aserción)

  it("Login completo", () => {
    cy.visit("https://www.saucedemo.com/");
    cy.get('input[name="user-name"]')
      .click()
      .type("standard_user");
    cy.get('input[name="password"]')
      .click()
      .type("secret_sauce");
    cy.get('input[name="login-button"]').click();
    cy.get('div[class="inventory_item"]').should("be.visible");
  });

  // Instalamos las dependencias y configuramos el reporter en cypress.config.js

  // Dependencias a instalar:
  //
  // mochawesome: npm i mochawesome
  // mochawesome-merge: npm i mochawesome-merge
  // dotenv: npm i dotenv
  //
  // Para instalar todo junto: npm i mochawesome mochawesome-merge dotenv
  // Esto lo vamos a ver reflejado en nuestro package.json en "dependencies" una vez se encuentra dentro ese archivo solamente, a partir de ese momento solo hace falta hacer npm ci para instalar todo (esto mismo vamos a hacer en el workflow de GH Actions más adelante).

  //  Para el manejo de variables de entorno creamos en cypress\support\ el archivo constants.js y en nuestra raíz un archivo .env.
  // Utilizamos variables de entorno principalmente para: 
  // 1- Poder cambiar de entornos facilmente: Producción, Staging, Testing, UAT, etc.  De esa forma la misma suite de pruebas se corre para cada uno de esos ambientes. 
  // 2. Proteger información sensible como: Usuarios, Contraseñas, Keys, Tokens, etc. 
  // 3. Re-utilizar valores que cuenten con un mismo flujo de test, para variar dinámicamente los datos de prueba y no tener que modificar el código.

  // Variables de entorno son la mejor opción para proteger secretos y parámetros clave. Pero cuando hablamos de manejar grandes volúmenes de datos de prueba, usamos otras herramientas como fixtures, data builders o incluso servicios externos. La elección depende del tipo de dato y del nivel de protección que necesitamos.

  // Login con variables de entorno: reemplazamos el código con las constantes que contienen los datos que vamos a definir en nuestro .env

  // Pasamos de este Login sin uso de variables y con información sensible:

  it("Login completo previo uso de variables", () => {
    cy.visit("https://www.saucedemo.com/");
    cy.get('input[name="user-name"]')
      .click()
      .type("standard_user");
    cy.get('input[name="password"]')
      .click()
      .type("secret_sauce");
    cy.get('input[name="login-button"]').click();
    cy.get('div[class="inventory_item"]').should("be.visible");
  });

  // En nuestro archivo .env tenemos definido: LOCATION=https://www.saucedemo.com/ ; TEST_USER=standard_user y TEST_PASSWORD=secret_sauce.
  // A este login con el uso de variables:

  it("Login usando variables de entorno", () => {
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

  // Ahora pasamos nuestro login a un comando, utilizando el archivo cypress\support\commands.js

  //¿Qué son los commands en Cypress? 
  // Son funciones personalizadas que encapsulan acciones repetitivas. Beneficios: reutilización, organización y legibilidad de los tests.

  it("Login usando comando", () => {
    cy.login();
  });

  // Aplicamos POM con selectores y acciones del login y sumamos la obtención de la "versión" del aplicativo.

  it("Login usando POM y guardado de versión", () => {

    cy.loginPOM();
    cy.get('[class="footer_copy"]')
    .invoke('text')
    .then((text) => {
      const match = text.match(/\d{4}/); // busca un año (4 dígitos seguidos)
      const year = match ? match[0] : 'desconocido';

      cy.writeFile('version.txt', year);
      cy.log(`Guardando la versión ${year}`)
    });
    
  });

  // Este es el it final que vamos a utilizar

  it.only("Login y preseteo de datos", () => {

    cy.loginPOM();
    cy.saveAppVersion()
  });
});

// Ahora armamos un nuevo suite de pruebas estando en el Home de la página, ya habiendo analizado que flujo de negocio es importante validar. Para este ejemplo tenemos:
// 1) Ingresar a los items. 2.) Añadir al carrito los items. 3.) Eliminar del carrito los items. 4.) Hacer una compra de los items.

describe("Home", () => {
  // Creamos un "flujo" de tests haciendo foco en un solo item, sin ingresar al mismo, sin POM y con selectores mejorables.

  it("Ingresar al primer item y añadirlo al carrito", () => {

    // Teniendo el login realizado hacemos una verificación que se muestren los precios del inventarios
    cy.get('div[class="inventory_item_price"]')
      .should("be.visible")
      .and("contain.text", "$");
    // Ingresamos al primer item del inventario
    cy.get('div[class="inventory_item_name"]').eq(0).click();
    // Validamos las clases exclusivas del título y la descripción estando dentro del producto
    cy.get('div[class="inventory_details_name"]')
    .should("be.visible");
    cy.get('div[class="inventory_details_desc"]')
    .should("be.visible");
    // Añadimos al carrito el producto estando en su descripción
    cy.get('button[class="btn_primary btn_inventory"]').click();
    // Volvemos al home
    cy.get('button[class="inventory_details_back_button"]').click();
    // Validamos que nos encontramos en el home y que el botón Remove esté disponible
    cy.get('div[class="inventory_item"]').should("be.visible");
    cy.get('button[class="btn_secondary btn_inventory"]').should("be.visible");
  });

  it("Ingresar al segundo item y añadirlo al carrito", () => {
    // Teniendo el login realizado hacemos una verificación que se muestren los precios del inventarios
    cy.get('div[class="inventory_item_price"]')
      .should("be.visible")
      .and("contain.text", "$");
    // Ingresamos al segundo item del inventario cambiando el equal.
    cy.get('div[class="inventory_item_name"]').eq(1).click();
    // Validamos las clases exclusivas del título y la descripción estando dentro del producto
    cy.get('div[class="inventory_details_name"]')
    .should("be.visible");
    cy.get('div[class="inventory_details_desc"]')
    .should("be.visible");
    // Añadimos al carrito el producto estando en su descripción
    cy.get('button[class="btn_primary btn_inventory"]').click();
    // Volvemos al home
    cy.get('button[class="inventory_details_back_button"]').click();
    // Validamos que nos encontramos en el home y que el botón Remove esté disponible
    cy.get('div[class="inventory_item"]').should("be.visible");
    cy.get('button[class="btn_secondary btn_inventory"]').should("be.visible");
  });

  it("Eliminar los dos items añadidos", () => {
    cy.contains("Remove", {matchCase:false}).eq(0).click();
    cy.contains("Remove", {matchCase:false}).eq(0).click();
  });

  // Hacemos un flujo más sólido pensando en que cuando un usuario añade un item al carrito muy probablemente lo haga una vez ingresado al item y revisado su detalle.
  // También aplicamos POM pero mantenemos una lógica repetida por item.

  it("Ingresar al primer item y añadirlo al carrito con POM", () => {
    home.getItemPrice().should("be.visible").and("contain.text", "$");
    home.clickFirstItemName(); // Forma no óptima con equal 0.
    home.getDetailsItemName().should("be.visible");
    home.getDetailsDescription().should("be.visible");
    home.clickAddToCart();
    home.getCartIconCounter().should("be.visible").and("have.text", "1"); // Forma no óptima para validar "fijamente"
    home.clickBackToProducts();
    home.getInventoryItem().should("be.visible");
    home.getRemoveBtn().should("be.visible");
  });

  it("Ingresar al segundo item y añadirlo al carrito con POM", () => {
    // Una vez armado todo el flujo para el primer item repetimos lo mismo para el segundo item (de forma no óptima con un equal)

    home.getItemPrice().should("be.visible").and("contain.text", "$");
    home.clickSecondItemName(); // Forma no óptima con equal 1.
    home.getDetailsItemName().should("be.visible");
    home.getDetailsDescription().should("be.visible");
    home.clickAddToCart();
    home.getCartIconCounter().should("be.visible").and("have.text", "2"); // Forma no óptima para validar "fijamente"
    home.clickBackToProducts();
    home.getInventoryItem().should("be.visible");
    home.getRemoveBtn().should("be.visible");
  });

  // Para no tener que escribir un it por cada item que querramos validar, podemos validar cada uno de los items con un each.
  // De esta manera obtenemos un flujo completo que valida: Que cada item sea accesible desde el home, que la descripción de cada item se muestre correctamente, que sea posible añadir al carrito cada item, que el contador del carrito sea congruente.

  it("Recorrer todos los items y añadirlos al carrito", () => {
    home.getItemName().each(($el, index, $list) => {
      // $el: botón actual
      // index: posición del botón
      // $list: todos los botones encontrados

      // Log para saber en qué producto estamos
      cy.log(
        `Agregando producto ${index + 1} de ${$list.length}: ${$el.text()}`
      );

      // Hacemos click en el nombre del producto actual
      home.getItemName().eq(index).click();

      // Validaciones dentro del detalle del producto
      home.getDetailsItemName().should("be.visible");
      home.getDetailsDescription().should("be.visible");

      // Agregar al carrito
      home.clickAddToCart();

      // Validar que el contador del carrito se actualiza
      home.getCartIconCounter()
      .should("be.visible")
      .and("have.text", String(index + 1));

      // Volver al listado de productos
      home.clickBackToProducts();

      // Validaciones del retorno
      home.getInventoryItem().should("be.visible");
      home.getRemoveBtn().should("be.visible");
    });
  });

  // Adicionalmente tenemos una posible métrica a seguir en performance: Navegabilidad de los items mientras se añaden al carrito.
  // También lo incluimos en un comando

  it.only("Navegabilidad entre items mientras se añaden al carrito", () => {
    cy.addAllItemsToCart();
  });

  // Ahora pasamos a armar nuestro 2do flujo: Eliminar del carrito items
  // Por el contrario al de agregar items, en general el usuario elimina items cuando se encuentra en el home de nuestra página, entonces ideamos un caso, aprovechando el flujo pasado, para eliminar los items agregados al carrito. Con esto tenemos una posible métrica a seguir en performance: Eliminar todos los items del carrito.

  it.only("Eliminar todos los items del carrito", () => {
    // Click en todos los botones Remove visibles
    home.getRemoveBtn().should("be.visible").click({ multiple: true });
    // Validamos que el carrito quedó vacío
    home.getCartIconCounter().should("not.exist");
  });

});

// Por último vamos a armar nuestro tercer y último flujo: Hacer una compra de los items, 
// para esto en vez de utilizar Home, o Cart o Checkout como "sección de prueba" (suite de prueba / describe) vamos a ponerle un nombre que nos sirva para englobar los casos que querramos contemplar y nos interese tenerlo como "sección" a seguir como métrica de performance, por ejemplo vamos a usar directamente "Compra"

describe.only("Compra", () => {

  // Ahora podemos ver como las clases y métodos generados con POM interactúan en distintas partes del test cruzandose entre distintas "pages"

  it("Ingreso al carrito vacío", () => {

    // Ingresar al carrito sin tener items añadidos
    home.clickCartIcon()
    // Volver al home
    home.clickContinueShopping()
    home.getInventoryItem().should("be.visible")

  });

  it("Agregar todos los items al carrito", () => {

    home.getAddToCartBtn()
    .should("be.visible")
    .click({ multiple: true });

  });

  it("Ingresar al carrito lleno", () => {
    // Ingresar al carrito teniendo todos los items añadidos
    home.clickCartIcon()
  });

  it("Checkout de la compra", () => {

    // Checkout paso 1: Formulario de datos
    purchase.clickCheckoutBtn()
    purchase.typeFirstName("testName")
    purchase.typeLastName("lastName")
    purchase.typePostalCode("postalCode")
    purchase.clickContinueCheckoutBtn()
    
    // Checkout paso 2: Resumen de compra y validación de suma correcta de los precios
    purchase.getSummaryInfo().should("be.visible");
    cy.verifyOrderTotals()

  });

  it("Confirmar la compra", () => {

    purchase.clickFinish();
    // Validamos que la compra haya sido confirmada
    purchase.getCheckoutCompleteContainer().should("be.visible");
    // Validamos que el carrito quedó vacío
    home.getCartIconCounter().should("not.exist");

  });


});

// Modularizando-ando: Separación de "secciones (describes/suites)" en distintos archivos .cy.js y uso de cy.session con run headless
// Explicación del script de python
// Explicación del workflow en GH Actions
// Cierre con ideas para transformar/mejorar o darle distintos usos al framework.

// Aclaración importante: Prohibido usar cy.waits() (salvo último recurso) ya que ensucia las métricas de performance.
