import { expect, test } from '@playwright/test';

test('home renders the Wayfinding hero screen', async ({ page }) => {
  await page.goto('/');
  // Fresh visit: no trip yet → brand heading (Trip Context fills it later).
  await expect(page.getByRole('heading', { name: 'Overhear' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Start Listen/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Modes' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Emergency/ })).toBeVisible();
});

test('hero enters Listen, which reports connection state honestly', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start Listen/ }).click();
  await expect(page).toHaveURL(/\/listen/);
  await expect(page.getByRole('tab', { name: 'Announcements' })).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    /No caption API yet|Connecting…|Live|Reconnecting…/,
  );
});

test('mode tabs navigate between modes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Talk' }).click();
  await expect(page.getByRole('heading', { name: 'Talk' })).toBeVisible();
  await page.getByRole('link', { name: 'Ride' }).click();
  await expect(page.getByRole('heading', { name: 'Ride' })).toBeVisible();
});

test('PWA manifest is served', async ({ page }) => {
  const res = await page.request.get('/manifest.webmanifest');
  expect(res.ok()).toBeTruthy();
  const manifest = await res.json();
  expect(manifest.name).toBe('Overhear');
  expect(manifest.display).toBe('standalone');
});
