import { test, expect } from '@playwright/test';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('ReadBooks', () => {
  test('displays a list of books with images and pdf links', async ({ page }) => {
    await page.goto(baseUrl + '/ReadBooks');
    await expect(page.locator('#heading')).toHaveText(/Read Story Books/i);
    const books = page.locator('.books-grid .book');
    await expect(books).toHaveCount(20);

    const first = books.first();
    await expect(first.locator('a')).toHaveAttribute('href', /\/pdfs\/.+\.pdf$/);
    await expect(first.locator('img')).toBeVisible();
  });

  test('book links open in a new tab (target=_blank)', async ({ page }) => {
    await page.goto(baseUrl + '/ReadBooks');
    const firstLink = page.locator('.books-grid .book a').first();
    await expect(firstLink).toHaveAttribute('target', '_blank');
  });
});
