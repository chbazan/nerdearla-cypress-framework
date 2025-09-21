export class Purchase {
  elements = {
    // Checkout
    firstNameInput: () => cy.get('input[data-test="firstName"]'),
    lastNameInput: () => cy.get('input[data-test="lastName"]'),
    postalCodeInput: () => cy.get('input[data-test="postalCode"]'),
    checkoutBtn: () => cy.get('a[class="btn_action checkout_button"]'),
    continueCheckoutBtn: () => cy.get('input[class="btn_primary cart_button"]'),

    // Checkout overview
    summaryInfo: () => cy.get('.summary_info'),
    summaryItemPrice: () => cy.get('div[class="inventory_item_price"]'),
    summarySubtotal: () => cy.get('div[class="summary_subtotal_label"]'),
    summaryTax: () => cy.get('div[class="summary_tax_label"]'),
    summaryTotal: () => cy.get('div[class="summary_total_label"]'),
    finishBtn: () => cy.get('a[class="btn_action cart_button"]'),

    // Checkout complete
    checkoutCompleteContainer: () => cy.get('div[class="checkout_complete_container"]'),
  };

  // ==== Methods ====

  // Checkout (step 1)

  typeFirstName(name) { this.elements.firstNameInput().type(name); }
  typeLastName(name) { this.elements.lastNameInput().type(name); }
  typePostalCode(code) { this.elements.postalCodeInput().type(code); }
  clickCheckoutBtn() { this.elements.checkoutBtn().click(); }
  clickContinueCheckoutBtn() { this.elements.continueCheckoutBtn().click(); }
  
  // Checkout overview (step 2)
  getSummaryInfo() { return this.elements.summaryInfo(); }
  getSummaryItemPrice() { return this.elements.summaryItemPrice(); }
  getSummarySubtotal() { return this.elements.summarySubtotal(); }
  getSummaryTax() { return this.elements.summaryTax(); }
  getSummaryTotal() { return this.elements.summaryTotal(); }
  clickFinish() { this.elements.finishBtn().click(); }

  // Purchase complete
  getCheckoutCompleteContainer() { return this.elements.checkoutCompleteContainer(); }
  
}

export const purchase = new Purchase();
