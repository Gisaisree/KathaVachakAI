import { test, expect } from '@playwright/test';
import { seedToken } from './support/auth';
import { testData } from './support/test-data';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

test.describe('Text-to-speech readout', () => {
  test.beforeEach(async ({ page }) => {
    await seedToken(page);
  });

  test('play readout button is disabled when no story is present', async ({ page }) => {
    await page.goto(baseUrl + '/Home');
    await expect(page.getByRole('button', { name: /play readout/i })).toBeDisabled();
  });

  test('creates audio and renders an audio player (mocked)', async ({ page }) => {
    // Mock story generation to make a story visible
    await page.route(`***/api/story/generate`, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story: testData.story.responseStory }),
      });
    });

    // Mock readout endpoint
    await page.route(`***/api/story/readout`, async (route) => {
      await route.fulfill {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioUrl: testData.story.responseAudioUrl }),
      };
    });

    await page.goto(baseUrl + '/Home');
    await page.getByLabel('Story prompt').fill(testData.story.prompt);
    await page.locator('#genre').selectOption({ value: testData.story.genre });
    await page.locator('#wordCount').fill(testData.story.wordCount);
    await page.getByRole('button', { name: /generate story/i }).click();

    const play = page.getByRole('button', { name: /play readout/i });
    await expect(play).toBeEnabled();
    await play.click();

    await expect(page.locator('audio[controls]')).toBeVisible();
  });
});
