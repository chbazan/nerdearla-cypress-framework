export class Home {
  elements = {

    // Home / Inventory
    inventoryItem: () => cy.get('div[class="inventory_item"]'),
    itemName: () => cy.get('div[class="inventory_item_name"]'),
    detailsItemName: () => cy.get('div[class="inventory_details_name"]'),  // Esta clase solo aparece cuando ingresamos a cada item
    detailsDescription: () => cy.get('div[class="inventory_details_desc"]'),  // Esta clase solo aparece cuando ingresamos a cada item
    itemPrice: () => cy.get('div[class="inventory_item_price"]'),
    addToCartBtn: () => cy.get('button[class="btn_primary btn_inventory"]'),
    removeBtn: () => cy.get('button[class="btn_secondary btn_inventory"'),
    backToProducts: () => cy.get('button[class="inventory_details_back_button"]'),

    // Cart
    cartIcon: () => cy.get('svg[data-icon="shopping-cart"]'),
    cartIconCounter: () => cy.get('span[class="fa-layers-counter shopping_cart_badge"]'), // Ese es el simbolo que aparece con el número corrrespondiente a la cantidad de items agregados al carrito
    cartContinueShoppingBtn: () => cy.get('a[class="btn_secondary"]'),
    checkoutBtn: () => cy.get('a[class="btn_action checkout_button"]'),
  };

  // ==== Methods ====

  // Home / Inventory

  getInventoryItem() {
    return this.elements.inventoryItem();
  }

  getItemName() {
    return this.elements.itemName();
  }

  getDetailsItemName() {
    return this.elements.detailsItemName();
  }

  getDetailsDescription() {
    return this.elements.detailsDescription();
  }

  getItemPrice() {
    return this.elements.itemPrice();
  }

  clickFirstItemName() {                             // Este método solo se utiliza para mostrar como ingresaria a un único item en específico.
    this.elements.itemName().eq(0).click();
  }

  clickSecondItemName() {                             // Este método solo se utiliza para mostrar como ingresaria a un único item en específico.
    this.elements.itemName().eq(1).click();
  }

  clickItemName() {
    this.elements.itemName().click();
  }

  getAddToCartBtn() {
    return this.elements.addToCartBtn();
  }

  clickAddToCart() {
    this.elements.addToCartBtn().click();
  }

  clickBackToProducts() {
    this.elements.backToProducts().click();
  }

  getRemoveBtn() {
    return this.elements.removeBtn();
  }

  //  Cart
  clickContinueShopping() {
    this.elements.cartContinueShoppingBtn().click(); 
  }
  clickCheckout() {
    this.elements.checkoutBtn().click(); 
  }

  getCartIcon() {
    return this.elements.cartIcon();
  }

  clickCartIcon() {
    this.elements.cartIcon().click();
  }

  getCartIconCounter() {
    return this.elements.cartIconCounter();
  }


}

export const home = new Home();
