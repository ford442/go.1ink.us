import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('curator_booted', 'true');
  });
});

function blockingViolations(results) {
  return results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
}

function formatViolations(violations) {
  return violations.map((v) => `${v.id} (${v.nodes.length} nodes): ${v.help}`).join('\n');
}

test('home page has no critical or serious axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#project-grid [id^="project-card-"]').first()).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = blockingViolations(results);
  expect(blocking, formatViolations(blocking)).toEqual([]);
});

test('quick view modal has no critical or serious axe violations', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/');
  await page.locator('#project-card-1').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = blockingViolations(results);
  expect(blocking, formatViolations(blocking)).toEqual([]);
});
