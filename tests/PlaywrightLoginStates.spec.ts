import { test, expect, type Page } from '@playwright/test';

// Section: Accounts expected to complete checkout
const checkoutUsers = [
  'standard_user',
  'performance_glitch_user',
  'visual_user',
];

// Section: User authentication
async function login(page: Page, username: string) {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill(username);
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();
  await expect(page).toHaveURL(/\/inventory\.html$/);
}

// Section: Shared cart and checkout setup
async function continueToCheckoutOverview(page: Page, username: string) {
  await login(page, username);

  const backpack = page.locator('[data-test="inventory-item"]')
    .filter({ hasText: 'Sauce Labs Backpack' });
  await backpack.getByRole('button', { name: 'Add to cart' }).click();
  await expect(page.locator('[data-test="shopping-cart-badge"]')).toHaveText('1');

  await page.locator('[data-test="shopping-cart-link"]').click();
  await expect(page.locator('[data-test="inventory-item-name"]'))
    .toHaveText(['Sauce Labs Backpack']);
  await page.locator('[data-test="checkout"]').click();

  await page.locator('[data-test="firstName"]').fill('Test');
  await page.locator('[data-test="lastName"]').fill('Customer');
  await page.locator('[data-test="postalCode"]').fill('10001');
  await page.locator('[data-test="continue"]').click();
}

// Section: Successful checkout outcomes by account
for (const username of checkoutUsers) {
  test(`${username} can complete checkout`, async ({ page }) => {
    await continueToCheckoutOverview(page, username);

    await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
    await expect(page.locator('[data-test="inventory-item-name"]'))
      .toHaveText(['Sauce Labs Backpack']);
    await page.locator('[data-test="finish"]').click();
    await expect(page.locator('[data-test="complete-header"]'))
      .toHaveText('Thank you for your order!');
  });
}

// Section: Checkout failure for problem_user
test('problem_user remains on checkout information after Continue', async ({ page }) => {
  await continueToCheckoutOverview(page, 'problem_user');

  await expect(page.locator('[data-test="title"]'))
    .toHaveText('Checkout: Your Information');
  await expect(page).toHaveURL(/checkout-step-one\.html$/);
});

// Section: Checkout failure for error_user
test('error_user remains on checkout overview after Finish', async ({ page }) => {
  await continueToCheckoutOverview(page, 'error_user');

  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await page.locator('[data-test="finish"]').click();
  await expect(page.locator('[data-test="title"]')).toHaveText('Checkout: Overview');
  await expect(page).toHaveURL(/checkout-step-two\.html$/);
  await expect(page.locator('[data-test="complete-header"]')).toHaveCount(0);
});

// Section: Locked account login rejection
test('locked_out_user cannot log in', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.locator('[data-test="username"]').fill('locked_out_user');
  await page.locator('[data-test="password"]').fill('secret_sauce');
  await page.locator('[data-test="login-button"]').click();

  await expect(page.locator('[data-test="error"]'))
    .toContainText('Sorry, this user has been locked out.');
  await expect(page).toHaveURL(/\/$/);
});
