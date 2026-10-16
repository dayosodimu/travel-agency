import { test, expect, type Page } from '@playwright/test';

// Section: Standard-user authentication
async function loginAsStandardUser(page: Page) {
  // Step: Open SauceDemo and enter standard-user credentials.
  await page.goto('https://www.saucedemo.com/');
  await expect(page.locator('[data-test="username"]')).toBeVisible();
  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await expect(page.locator('[data-test="username"]')).toHaveValue('standard_user');
  await expect(page.locator('[data-test="password"]')).toHaveValue('secret_sauce');
  // Step: Submit login and confirm the inventory page opens.
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

// Section: Named-user authentication
async function loginAsUser(page: Page, username: string) {
  // Step: Open SauceDemo and enter the requested account credentials.
  await page.goto('https://www.saucedemo.com/');
  await expect(page.locator('[data-test="username"]')).toBeVisible();
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await expect(page.locator('[data-test="username"]')).toHaveValue(username);
  await expect(page.locator('[data-test="password"]')).toHaveValue('secret_sauce');
  // Step: Submit login and verify navigation to inventory.
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

// Section: Shared checkout setup
async function continueToCheckoutOverview(page: Page, username: string) {
  // Step: Sign in and add the backpack to the cart.
  await loginAsUser(page, username);

  const backpack = page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  // Step: Review the cart and open checkout.
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Your Information');

  // Step: Enter checkout information and continue to the overview.
  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  if (username !== 'problem_user' && username !== 'error_user') {
    await expect(page.locator('[data-test="firstName"]')).toHaveValue('Test');
    await expect(page.locator('[data-test="lastName"]')).toHaveValue('Customer');
    await expect(page.locator('[data-test="postalCode"]')).toHaveValue('10001');
  }
  await page.locator('[data-test="continue"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText(
    username === 'problem_user' ? 'Checkout: Your Information' : 'Checkout: Overview',
  );
}

// Section: Site availability and title
test('SauceDemo page loads with the expected title', async ({ page }) => {
  // Step: Navigate to the SauceDemo login page.
  await page.goto('https://www.saucedemo.com/');

  // Step: Confirm the expected page title.
  await expect(page).toHaveTitle(/Swag Labs/i);
});

// Section: Successful product-page login
test('user can log in and see the products page', async ({ page }) => {
  // Step: Open the login page and enter standard-user credentials.
  await page.goto('https://www.saucedemo.com/');
  await expect(page.locator('[data-test="username"]')).toBeVisible();

  await page.locator('[data-test="username"]').fill('standard_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await expect(page.locator('[data-test="username"]')).toHaveValue('standard_user');
  await expect(page.locator('[data-test="password"]')).toHaveValue('secret_sauce');
  // Step: Submit credentials to open the inventory.
  await page.locator('[data-test="login-button"]').click();

  // Step: Verify the destination page and its product list.
  await expect(page).toHaveURL(/\/inventory\.html$/);
  await expect(page.locator('[data-test="title"]')).toHaveText('Products');
  await expect(page.locator('[data-test="inventory-item"]')).not.toHaveCount(0);
});

// Section: Single-product purchase flow
test('user can purchase one in-stock product', async ({ page }) => {
  // Step: Sign in and add the backpack to the cart.
  await loginAsStandardUser(page);

  const backpack = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  // Step: Review the cart and enter checkout details.
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);

  // Step: Verify totals and complete the purchase.
  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $29.99');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $32.39');
  await page.locator('[data-test="finish"]').click();
  // Step: Confirm the order completion message.
  await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
});

// Section: Multi-product cart and checkout flow
test('user can select multiple products, remove one, and checkout the remaining product', async ({ page }) => {
  // Step: Sign in and add both products to the cart.
  await loginAsStandardUser(page);

  const backpack = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Backpack' });
  const bikeLight = page.locator('[data-test="inventory-item"]').filter({ hasText: 'Sauce Labs Bike Light' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await bikeLight.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('2');

  // Step: Review the cart, remove the backpack, and proceed with the remaining item.
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText([
    'Sauce Labs Backpack',
    'Sauce Labs Bike Light',
  ]);
  await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]')).toHaveText(['Sauce Labs Bike Light']);
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  await page.locator('[data-test="checkout"]').click();

  // Step: Enter customer details and continue to the order overview.
  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Bike Light']);

  // Step: Verify the remaining item's totals and finish checkout.
  await expect(page.locator('[data-test="subtotal-label"]')).toHaveText('Item total: $9.99');
  await expect(page.locator('[data-test="total-label"]')).toHaveText('Total: $10.79');
  await page.locator('[data-test="finish"]').click();
  // Step: Confirm the order completion message.
  await expect(page.locator('[data-test="complete-header"]')).toHaveText('Thank you for your order!');
});

// Section: Missing first-name validation
test('checkout requires a first name', async ({ page }) => {
  // Step: Sign in and add a product to begin checkout.
  await loginAsStandardUser(page);
  await page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' })
    .getByRole('button', { name: 'Add to cart' })
    .click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Your Information');

  // Step: Leave the first name blank and submit the other checkout details.
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await expect(page.locator('[data-test="firstName"]')).toHaveValue('');
  await expect(page.locator('[data-test="lastName"]')).toHaveValue('Customer');
  await expect(page.locator('[data-test="postalCode"]')).toHaveValue('10001');
  await page.locator('[data-test="continue"]').click();

  // Step: Verify validation keeps the user on the information page.
  await expect(page.locator('[data-test="error"]')).toContainText('Error: First Name is required');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

// Section: Accounts that complete checkout successfully
const checkoutUsers = [
  'standard_user',
  'performance_glitch_user',
  'visual_user',
];

// Section: Successful checkout outcomes
for (const username of checkoutUsers) {
  test(`${username} can complete checkout`, async ({ page }) => {
    // Step: Sign in and complete the shared checkout setup.
    await continueToCheckoutOverview(page, username);

    // Step: Verify the order overview, then finish checkout.
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
    await expect(page.locator('[data-test="inventory-item-name"]'))
      .toHaveText(['Sauce Labs Backpack']);
    await page.locator('[data-test="finish"]').click();
    // Step: Confirm successful order completion.
    await expect(page.locator('[data-test="complete-header"]'))
      .toHaveText('Thank you for your order!');
  });
}

// Section: Checkout blocked for problem_user
test('problem_user remains on checkout information after Continue', async ({ page }) => {
  // Step: Attempt checkout using the problem_user account.
  await continueToCheckoutOverview(page, 'problem_user');

  // Step: Verify the user is still on the checkout information page.
  await expect(page.locator('[data-test="title"]'))
    .toHaveText('Checkout: Your Information');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

// Section: Checkout blocked for error_user
test('error_user remains on checkout overview after Finish', async ({ page }) => {
  // Step: Reach the order overview as error_user.
  await continueToCheckoutOverview(page, 'error_user');

  // Step: Attempt to finish the order and verify completion is blocked.
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.locator('[data-test="complete-header"]')).toHaveCount(0);
});

// Section: Locked account authentication rejection
test('locked_out_user cannot log in', async ({ page }) => {
  // Step: Open SauceDemo and submit locked-account credentials.
  await page.goto('https://www.saucedemo.com/');
  await expect(page.locator('[data-test="username"]')).toBeVisible();
  await page.locator('[data-test="username"]').fill('locked_out_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await expect(page.locator('[data-test="username"]')).toHaveValue('locked_out_user');
  await expect(page.locator('[data-test="password"]')).toHaveValue('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  // Step: Verify the rejection message and that login did not navigate.
  await expect(page.locator('[data-test="error"]'))
    .toContainText('Sorry, this user has been locked out.');
  await expect(page).toHaveURL(/\/$/);
});
