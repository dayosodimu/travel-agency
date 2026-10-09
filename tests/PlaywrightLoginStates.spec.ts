import { test, expect, type Page } from '@playwright/test';

// Section: Accounts expected to complete checkout
const checkoutUsers = [
  'standard_user',
  'performance_glitch_user',
  'visual_user',
];

// Section: User authentication
async function login(page: Page, username: string) {
  // Step: Open SauceDemo and enter the selected account credentials.
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill('secret_sauce');
  // Step: Submit login and confirm the inventory page opens.
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

// Section: Shared cart and checkout setup
async function continueToCheckoutOverview(page: Page, username: string) {
  // Step: Sign in and add the backpack to the cart.
  await login(page, username);

  const backpack = page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  // Step: Review the cart and open checkout.
  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();

  // Step: Complete checkout information and continue to the overview.
  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();
}

// Section: Successful checkout outcomes by account
for (const username of checkoutUsers) {
  test(`${username} can complete checkout`, async ({ page }) => {
    // Step: Sign in and reach the checkout overview.
    await continueToCheckoutOverview(page, username);

    // Step: Verify the order summary and finish the order.
    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
    await expect(page.locator('[data-test="inventory-item-name"]'))
      .toHaveText(['Sauce Labs Backpack']);
    await page.locator('[data-test="finish"]').click();
    // Step: Confirm the order completion message.
    await expect(page.locator('[data-test="complete-header"]'))
      .toHaveText('Thank you for your order!');
  });
}

// Section: Checkout failure for problem_user
test('problem_user remains on checkout information after Continue', async ({ page }) => {
  // Step: Attempt checkout with the problem_user account.
  await continueToCheckoutOverview(page, 'problem_user');

  // Step: Verify checkout remains on the information page.
  await expect(page.locator('[data-test="title"]'))
    .toHaveText('Checkout: Your Information');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

// Section: Checkout failure for error_user
test('error_user remains on checkout overview after Finish', async ({ page }) => {
  // Step: Reach the checkout overview as error_user.
  await continueToCheckoutOverview(page, 'error_user');

  // Step: Submit the order and verify the user remains on the overview.
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.locator('[data-test="complete-header"]')).toHaveCount(0);
});

// Section: Locked account login rejection
test('locked_out_user cannot log in', async ({ page }) => {
  // Step: Open SauceDemo and enter credentials for the locked account.
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill('locked_out_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  // Step: Verify the access-denied message and unchanged login URL.
  await expect(page.locator('[data-test="error"]'))
    .toContainText('Sorry, this user has been locked out.');
  await expect(page).toHaveURL(/\/$/);
});
