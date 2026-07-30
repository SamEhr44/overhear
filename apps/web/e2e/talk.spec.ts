import { expect, test } from '@playwright/test';

test('talk chooser lists free talk and the four packs', async ({ page }) => {
  await page.goto('/talk');
  await expect(page.getByRole('heading', { name: 'Talk' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Just talk/ })).toBeVisible();
  for (const packName of ['Directions', 'Restaurant', 'Shopping', 'Hotel']) {
    await expect(page.getByRole('link', { name: new RegExp(packName) })).toBeVisible();
  }
});

test('directions conversation shows deck, speak button, and hand-off', async ({ page }) => {
  await page.goto('/talk/directions');
  await expect(page.getByRole('button', { name: 'Tap to speak English' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Hand over/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /¿Me puede decir dónde está…\?/ })).toBeVisible();
  // Honest state: CI build has no API configured.
  await expect(page.getByRole('status')).toContainText(
    /No caption API yet|Connecting…|Live|Reconnecting…/,
  );
});

test('hand-off shows the Spanish intro card once', async ({ page }) => {
  await page.goto('/talk/general');
  await page.getByRole('button', { name: /Hand over/ }).click();
  await expect(page.getByText(/Estoy usando esta aplicación/)).toBeVisible();
  await page.getByRole('button', { name: 'Entendido' }).click();
  await expect(page.getByRole('button', { name: 'Toque y hable' })).toBeVisible();
  // Back to me, then hand over again — intro should not repeat.
  await page.getByRole('button', { name: '‹ My turn' }).click();
  await page.getByRole('button', { name: /Hand over/ }).click();
  await expect(page.getByRole('button', { name: 'Toque y hable' })).toBeVisible();
});

test('unknown pack 404s', async ({ page }) => {
  const res = await page.goto('/talk/not-a-pack');
  expect(res?.status()).toBe(404);
});
