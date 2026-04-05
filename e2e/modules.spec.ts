import { expect, test } from '@playwright/test';

test('add module', async ({ page }) => {
  await page.goto('/');
  await page.locator('app-module-list').getByText('add').click();
  await page.getByRole('menuitem', { name: 'HTTP Server' }).click();
});
