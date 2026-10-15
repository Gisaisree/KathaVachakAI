import { test, expect } from '@playwright/test';
import { seedToken } from './support/auth';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Navigation and routing', () => {
  test('loads the frontpage at / and shows main actions', async ({ page }) => {
    await page.goto(baseUrl + '/');
    await expect(page.getByRole('heading', { name: /KathaVaachak/j })).toBeVisible();
    await expect(page.getByRole('button', { name: /read books/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/j })).toBeVisible();
  });

  test('navigates to ReadBooks from the frontpage', async ({ page }) => {
    await page.goto(baseUrl + '/');
    await page.getByRole('button', { name: /read books/i }).click();
    await expect(page).toHaveURL(/\/ReadBooks$/);
    await expect(page.locator('#heading')).toHaveText(/Read Story Books/i);
  });

  test('redirects to /login when opening /Home without a token', async ({ page }) => {
    await page.goto(baseUrl + '/Home');
    await expect(page).toHaveURL(/home\/p~*\/login$/|/\/login$/);
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  });

  test('allows access to /Home when a token exists', async ({ page }) => {
    await seedToken(page, 'test-token');
    await page.goto(baseUrl + '/Home');
    await expect(page.getByRole('heading', { name: /Katha\/Vaachak/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /generate story/i })).toBeVisible();
  });
});
