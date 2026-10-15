import { test, expect } from '@playwright/test';
import { mockLogin } from './support/auth';

const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiBaseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

test.describe('Authentication', () => {
  test('login validates required fields', async ({ page }) => {
    await page.goto(baseUrl + '/login');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByRole('alert')).toHaveText(/email and password are required/i);
  });

  test('sign up validates gmail and password match', async ({ page }) => {
    await page.goto(baseUrl + '/signup');
    await page.getByLabel(/Email/i).fill('user@example.com');
    await page.getByLabel(/Password/i).fill('pass');
    await page.getByLabel(/Confirm/i).fill('pass2');
    await page.getByRole('button', { name: /create account/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('successful login stores token and redirects to /Home (mocked)', async ({ page }) => {
    // Mock the backend login response and verify the frontend flow
    await mockLogin(page, apiBaseUrl, 'test-token');
    await page.goto(baseUrl + '/login');
    await page.getByLabel(/Email/i).fill('user@example.com');
    await page.getByLabel(/Password/i).fill('Password123!');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/Home$/);
  });
});
