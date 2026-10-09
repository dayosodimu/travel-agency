import { test, expect, type Page } from '@playwright/test';

// Section: Flight search setup
async function searchFlights(page: Page, fromPort: string, toPort: string) {
  // Step: Open the travel agency search form.
  await page.goto('https://blazedemo.com/');
  // Step: Choose the departure and arrival cities.
  await page.locator('select[name="fromPort"]').selectOption(fromPort);
  await page.locator('select[name="toPort"]').selectOption(toPort);
  // Step: Submit the route and load matching flights.
  await page.getByRole('button', { name: 'Find Flights' }).click();
}

// Section: Flight selection
async function chooseFirstFlight(page: Page) {
  // Step: Select the first flight returned for the chosen route.
  await page.getByRole('button', { name: 'Choose This Flight' }).first().click();
}

// Section: Passenger and payment details
async function fillBookingDetails(page: Page, passengerName: string) {
  // Step: Enter passenger name and contact address.
  await page.locator('input[name="inputName"]').fill(passengerName);
  await page.locator('input[name="address"]').fill('123 Test Street');
  await page.locator('input[name="city"]').fill('Boston');
  await page.locator('input[name="state"]').fill('MA');
  await page.locator('input[name="zipCode"]').fill('02108');
  // Step: Enter payment method and card details.
  await page.locator('select[name="cardType"]').selectOption('Visa');
  await page.locator('input[name="creditCardNumber"]').fill('4111111111111111');
  await page.locator('input[name="creditCardMonth"]').fill('12');
  await page.locator('input[name="creditCardYear"]').fill('2030');
  await page.locator('input[name="nameOnCard"]').fill('Taylor Traveler');
}

// Section: Search the primary route
test('searches flights from Paris to Buenos Aires', async ({ page }) => {
  // Step: Search the primary city pair.
  await searchFlights(page, 'Paris', 'Buenos Aires');

  // Step: Verify the route heading and returned flight count.
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
    // Step: Search a route from the valid city-pair matrix.
    await searchFlights(page, fromPort, toPort);
    // Step: Verify the selected route and its available flights.
    await expect(page.getByRole('heading', { name: `Flights from ${fromPort} to ${toPort}:` })).toBeVisible();
    await expect(page.locator('table tbody tr')).toHaveCount(5);
  }
});

// Section: Successful flight purchase
test('purchases a selected flight with passenger and payment details', async ({ page }) => {
  // Step: Search for the flight and select an available option.
  await searchFlights(page, 'Paris', 'Buenos Aires');
  await chooseFirstFlight(page);

  // Step: Complete the passenger and payment form.
  await fillBookingDetails(page, 'Taylor Traveler');
  await page.getByRole('button', { name: 'Purchase Flight' }).click();

  // Step: Verify confirmation and masked payment details.
  await expect(page.getByRole('heading', { name: 'Thank you for your purchase today!' })).toBeVisible();
  await expect(page.locator('table')).toContainText('xxxxxxxxxxxx1111');
});

// Section: Invalid booking form validation
test('requires a passenger name before purchase', async ({ page }) => {
  test.fail(true, 'BlazeDemo currently accepts a purchase with an empty passenger name.');

  // Step: Choose a flight to reach the booking form.
  await searchFlights(page, 'Paris', 'Buenos Aires');
  await chooseFirstFlight(page);

  // Step: Leave only the passenger name empty and submit the form.
  const nameField = page.locator('input[name="inputName"]');
  await fillBookingDetails(page, '');
  await page.getByRole('button', { name: 'Purchase Flight' }).click();

  // Step: Expect validation to keep the traveler on the booking form.
  await expect(nameField).toBeFocused();
  await expect(page).toHaveURL(/purchase\.php/);
});
