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

test('lite-mode quick view bypasses warp, traps focus, and restores scrolling', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('curator_perf', 'lite'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-perf', 'lite');
  await page.getByRole('button', { name: /View details for/i }).first().click();
  const dialog = page.getByRole('dialog');
  const closeButton = page.getByRole('button', { name: 'Close modal' });
  await expect(page.locator('.animate-warp-speed')).toHaveCount(0);
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await expect(closeButton.first()).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await closeButton.click();
  await expect(closeButton).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('quick view exposes related systems, source, and patch notes', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('curator_perf', 'lite'));
  await page.goto('/?q=Cave%20Crystals');
  await page.getByRole('button', { name: 'View details for Cave Crystals' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Related Systems' })).toBeVisible();
  const sourceLink = dialog.getByRole('link', { name: /View Source/i });
  await expect(sourceLink).toHaveAttribute('href', 'https://github.com/ford442/cave_crystals');
  await expect(sourceLink).toHaveAttribute('target', '_blank');
  await expect(sourceLink).toHaveAttribute('rel', 'noopener noreferrer');

  const patchNotes = dialog.getByText('Patch Notes');
  await patchNotes.click();
  await expect(dialog.getByText(/campaign catalog/i)).toBeVisible();

  await dialog.getByRole('button', { name: 'Open related project Candy World' }).click();
  await expect(dialog.getByRole('heading', { name: 'Candy World' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Open related project Cave Crystals' })).toBeVisible();
});

test('theme, CRT, and Matrix settings persist across reload', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('curator_theme', 'purple');
    localStorage.setItem('curator_crt', 'true');
    localStorage.setItem('curator_matrix', 'true');
    localStorage.setItem('curator_perf', 'full');
  });
  await page.goto('/');

  const assertPersistedEffects = async () => {
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'purple');
    await expect(page.locator('.crt-scanlines')).toBeAttached();
    await expect(page.locator('canvas.fixed.inset-0.w-full.h-full.pointer-events-none.z-0')).toBeAttached({ timeout: 10_000 });
  };

  await assertPersistedEffects();
  await page.reload();
  await assertPersistedEffects();
});

test('terminal autocomplete opens HoloTerminal and shortcut map remains wired', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '`' })));
  const terminalInput = page.getByRole('textbox', { name: 'Terminal command input' });
  await terminalInput.fill('hol');
  await terminalInput.press('Tab');
  await expect(terminalInput).toHaveValue('holo ');
  await terminalInput.press('Enter');
  await expect(page.getByText('HOLO.TERM // v2.0')).toBeVisible();

  await page.getByRole('button', { name: 'Close terminal' }).click();
  await expect(terminalInput).not.toBeVisible();
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Global Shortcuts' })).toBeVisible({ timeout: 10_000 });
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

test('transmissions panel displays dispatches and opens quick view on click', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('curator_perf', 'lite'));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'TRANSMISSIONS' }).first()).toBeVisible();
  const dispatchButton = page.getByRole('button', { name: /Open dispatch for/i }).first();
  await expect(dispatchButton).toBeVisible();
  await dispatchButton.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog.getByText('Patch Notes')).toBeVisible();
});


