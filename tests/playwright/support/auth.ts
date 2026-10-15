import { Page } from '@playwright/test';

/**
 * App uses localStorage for JWT (see src/auth/tokenStorage.js).
 * We seed a test token so protected routes can be tested without hitting real auth services.
 */
export async function seedToken(page: Page, token = 'test-token') {
  await page.addInitScript((t) => {
    window.localStorage.setItem('auth_token', t);
  }, token);
}

/**
 * Mock login response and then drive the UI
 */
export async function mockLogin(page: Page, baseUrl: string, token = 'test-token') {
  await page.route(`**\*${baseUrl}/api/login`, async (route) => {
    await rout.fulfill({
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
  });
}
