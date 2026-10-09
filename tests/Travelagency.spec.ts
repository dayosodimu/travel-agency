import { test, expect, type Page } from '@playwright/test';

// Section: Flight search setup
async function searchFlights(page: Page, fromPort: string, toPort: string) {
  await page.goto('https://blazedemo.com/');
  await page.locator('select[name="fromPort"]').selectOption(fromPort);
  await page.locator('select[name="toPort"]').selectOption(toPort);
  await page.getByRole('button', { name: 'Find Flights' }).click();
}

// Section: Flight selection
async function chooseFirstFlight(page: Page) {
  await page.getByRole('button', { name: 'Choose This Flight' }).first().click();
}

// Section: Passenger and payment details
async function fillBookingDetails(page: Page, passengerName: string) {
  await page.locator('input[name="inputName"]').fill(passengerName);
  await page.locator('input[name="address"]').fill('123 Test Street');
  await page.locator('input[name="city"]').fill('Boston');
  await page.locator('input[name="state"]').fill('MA');
  await page.locator('input[name="zipCode"]').fill('02108');
  await page.locator('select[name="cardType"]').selectOption('Visa');
  await page.locator('input[name="creditCardNumber"]').fill('4111111111111111');
  await page.locator('input[name="creditCardMonth"]').fill('12');
  await page.locator('input[name="creditCardYear"]').fill('2030');
  await page.locator('input[name="nameOnCard"]').fill('Taylor Traveler');
}

// Section: Search the primary route
test('searches flights from Paris to Buenos Aires', async ({ page }) => {
  await searchFlights(page, 'Paris', 'Buenos Aires');

  await expect(page.getByRole('heading', { name: 'Flights from Paris to Buenos Aires:' })).toBeVisible();
  await expect(page.locator('table tbody tr')).toHaveCount(5);
});

// Section: Search additional city pairs
test('searches flights for other valid city pairs', async ({ page }) => {
  const routes = [
    ['Boston', 'London'],
    ['San Diego', 'Cairo'],
    ['Mexico City', 'Rome'],
  ];

  for (const [fromPort, toPort] of routes) {
    await searchFlights(page, fromPort, toPort);
    await expect(page.getByRole('heading', { name: `Flights from ${fromPort} to ${toPort}:` })).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(5);
  }
});

// Section: Successful flight purchase
test('purchases a selected flight with passenger and payment details', async ({ page }) => {
  await searchFlights(page, 'Paris', 'Buenos Aires');
  await chooseFirstFlight(page);

  await fillBookingDetails(page, 'Taylor Traveler');
  await page.getByRole('button', { name: 'Purchase Flight' }).click();

  await expect(page.getByRole('heading', { name: 'Thank you for your purchase today!' })).toBeVisible();
  await expect(page.locator('table')).toContainText('xxxxxxxxxxxx1111');
});

// Section: Invalid booking form validation
test('requires a passenger name before purchase', async ({ page }) => {
  test.fail(true, 'BlazeDemo currently accepts a purchase with an empty passenger name.');

  await searchFlights(page, 'Paris', 'Buenos Aires');
  await chooseFirstFlight(page);

  const nameField = page.locator('input[name="inputName"]');
  await fillBookingDetails(page, '');
  await page.getByRole('button', { name: 'Purchase Flight' }).click();

  await expect(nameField).toBeFocused();
  await expect(page).toHaveURL(/purchase\.php/);
});
