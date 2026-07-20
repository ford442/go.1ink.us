import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('curator_booted', 'true');
  });
});

test('home page renders project cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#project-grid [id^="project-card-"]').first()).toBeVisible();
  await expect(page.locator('#project-grid [id^="project-card-"]')).not.toHaveCount(0);
});

test('search filters the project list', async ({ page }) => {
  await page.goto('/');
  const search = page.getByPlaceholder('Search projects, tags, tech...');
  await search.fill('Hyphon');
  await expect(page.locator('#project-grid [id^="project-card-"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View details for Hyphon' })).toBeVisible();
});

test('deep link query param filters projects', async ({ page }) => {
  await page.goto('/?q=Pixelocity');
  await expect(page.locator('#project-grid [id^="project-card-"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'View details for Pixelocity' })).toBeVisible();
});

test('share link ?ids= applies favorites filter', async ({ page }) => {
  await page.goto('/?ids=1,4,9');
  await expect(page.locator('#project-grid [id^="project-card-"]')).toHaveCount(3, { timeout: 10_000 });
  await expect(page.locator('#project-card-1')).toBeVisible();
  await expect(page.locator('#project-card-4')).toBeVisible();
  await expect(page.locator('#project-card-9')).toBeVisible();
});

test('offline shows banner and cached catalog after SW install', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.locator('#project-grid [id^="project-card-"]').first()).toBeVisible();
  await page.waitForFunction(
    () => navigator.serviceWorker?.controller != null,
    { timeout: 20_000 },
  );
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText(/OFFLINE PROTOCOL/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#project-grid [id^="project-card-"]').first()).toBeVisible({ timeout: 10_000 });
});

test('quick view modal opens and closes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#project-card-1').click();
  const closeButton = page.getByRole('button', { name: 'Close modal' });
  await expect(closeButton).toBeVisible();
  await closeButton.click();
  await expect(closeButton).not.toBeVisible();
});

test('keyboard / focuses search input', async ({ page }) => {
  await page.goto('/');
  const search = page.getByPlaceholder('Search projects, tags, tech...');
  await expect(search).toBeVisible();
  await page.locator('main').click();
  await page.keyboard.press('/');
  await expect(search).toBeFocused();
});

test('project cards show reachability badge', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('project-connectivity-badge').first()).toBeVisible();
  await expect(page.getByTestId('project-connectivity-badge').first()).toContainText(/LIVE|DEGRADED|UNKNOWN/);
});

test('map view loads without crashing', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Neural Map View' }).click();
  await expect(page.getByText('NEURAL_MAP_VIEW')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
});
