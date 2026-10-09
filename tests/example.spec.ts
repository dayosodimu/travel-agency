import { test, expect } from '@playwright/test';

// Section: Homepage title assertion
test('has title', async ({ page }) => {
  // Step: Open the Playwright documentation homepage.
  await page.goto('https://playwright.dev/');

  // Step: Confirm the page title identifies the site.
  await expect(page).toHaveTitle(/Playwright/);
});

// Section: Getting started navigation and page assertion
test('get started link', async ({ page }) => {
  // Step: Open the documentation homepage.
  await page.goto('https://playwright.dev/');

  // Step: Navigate to the getting-started documentation.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Step: Verify that the installation guide is displayed.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
