import { test, expect } from '@playwright/test';
import { seedToken } from './support/auth';
import { testData } from './support/test-data';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

test.describe('Story generation', () => {
  test.beforeEach(async ({ page }) => {
    await seedToken(page);
  });

  test('validates required fields before submit', async ({ page }) => {
    await page.goto(baseUrl + '/Home');
    await page.getByRole('button', { name: /generate story/i }).click();
    // Validation errors are rendered as role="alert" paragraphs
    await expect(page.getByRole('alert').first()).toBeVisible();
  });

  test('successful generation renders the generated story (mocked)', async ({ page }) => {
    // Mock the proxy endpoint utilized by Home.js
    await page.route(`**/*/api/story/generate`, async (route) => {
      // Accept both `apiBaseUrl` or proxy through the dev server
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: testData.story.responseStory }),
      });
    });

    await page.goto(baseUrl + '/Home');

    await page.getByLabel('Story prompt').fill(testData.story.prompt);
    await page.locator('#genre').selectOption({ value: testData.story.genre });
    await page.locator('#wordCount').fill(testData.story.wordCount);

    const submit = page.getByRole('button', { name: /generate story/i });
    await expect(submit).toBeEnabled();
    await submit.click();

    await expect(page.getByRole('heading', { name: /generated story/i })).toBeVisible();
    await expect(page.getByTestId('story-text')).toContainText(/Once upon a time/i);
  });

  test('shows configuration banner when API base URL is missing (informational)', async ({ page }) => {
    // In CRA builds, ENV is baked at build time; this check is only meaningful in envs started without REACT_APP_API_BASE_URL.
    await page.goto(baseUrl + '/Home');
    const banner = page.getByRole('alert').filter({ hasText: /configuration needed/i });
    await expect.soft(banner).toBeVisible();
  });
});
