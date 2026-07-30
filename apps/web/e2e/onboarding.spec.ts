import { expect, test } from '@playwright/test';

test('home prompts trip setup until onboarding is seen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Set up your trip/ })).toBeVisible();
});

test('onboarding saves the trip and powers Home + the Ride driver card', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Set up my trip' }).click();

  await page.getByPlaceholder('Puerto Vallarta').fill('Oaxaca');
  await page.getByPlaceholder('Casa Kimberly').fill('Hotel Azul');
  await page.getByPlaceholder('Calle Zaragoza 445, Centro').fill('Av. Juárez 12, Centro');
  await page.getByPlaceholder('JR').fill('SE');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open Overhear' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { name: 'Oaxaca' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Trip settings' })).toContainText('SE');

  await page.getByRole('link', { name: 'Ride' }).click();
  await expect(page.getByText('Para el conductor')).toBeVisible();
  await expect(page.getByText('Hotel Azul')).toBeVisible();
});

test('skip dismisses the setup prompt', async ({ page }) => {
  await page.goto('/onboarding');
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: /Set up your trip/ })).toHaveCount(0);
});
