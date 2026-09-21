import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('curator_booted', 'true');
  });
});

test('keyboard-only path: search, filter, open project, external link', async ({ page, context }) => {
  await page.goto('/?filters=Games');
  await expect(page.locator('#project-grid [id^="project-card-"]').first()).toBeVisible();

  await page.locator('main').click();
  await page.keyboard.press('/');
  const search = page.getByPlaceholder('Search projects, tags, tech...');
  await expect(search).toBeFocused();

  await search.press('ArrowDown');
  const firstCard = page.locator('.card-focusable').first();
  await expect(firstCard).toBeFocused({ timeout: 5000 });

  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();

  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: /Open External/i }).click(),
  ]);
  await expect(newPage.url()).toMatch(/^https?:\/\//);
  await newPage.close();
});
