import { expect, test } from '@playwright/test';

test('ride renders destination setup, inbound box, call flow, and driver deck', async ({
  page,
}) => {
  await page.goto('/ride');
  await expect(page.getByRole('heading', { name: 'Ride' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Set destination' })).toBeVisible();
  await expect(page.getByPlaceholder('Pega el mensaje aquí…')).toBeVisible();
  await expect(page.getByRole('link', { name: /Speaker \+ Listen/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /¿Cuánto le debo\?/ })).toBeVisible();
});

test('destination persists and renders as the driver card', async ({ page }) => {
  await page.goto('/ride');
  await page.getByRole('button', { name: 'Set destination' }).click();
  await page.getByPlaceholder('Casa Kimberly').fill('Hotel Rosita');
  await page.getByPlaceholder('Calle Zaragoza 445, Centro').fill('Díaz Ordaz 901, Centro');
  await page.getByRole('button', { name: 'Save destination' }).click();
  await expect(page.getByText('Para el conductor')).toBeVisible();
  await expect(page.getByText('Hotel Rosita')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Hotel Rosita')).toBeVisible();
});

test('SOS ribbon opens the essentials board with tap-to-say phrases', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Emergency/ }).click();
  await expect(page.getByRole('heading', { name: 'Essentials' })).toBeVisible();
  await expect(page.getByRole('link', { name: '911' })).toBeVisible();
  await expect(page.getByRole('button', { name: /¡Ayuda, por favor!/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Necesito un médico/ })).toBeVisible();
});

test('ride deep-links Listen into one-person focus', async ({ page }) => {
  await page.goto('/listen?focus=one-person');
  await expect(page.getByRole('tab', { name: 'One person' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
});
