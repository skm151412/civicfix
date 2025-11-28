import { test, expect } from '@playwright/test';
import { hasUnverifiedCredentials, testEnv } from './utils/testEnv';
import { loginAs, logoutIfPossible } from './utils/session';

const missingCreds = !hasUnverifiedCredentials;

test.describe('Authentication & phone verification', () => {
  test.skip(missingCreds, 'Set E2E_UNVERIFIED_EMAIL and E2E_UNVERIFIED_PASSWORD to run auth smoke tests.');

  test('logs in with email/password and completes phone verification modal', async ({ page }) => {
    await loginAs(page, testEnv.unverified.email!, testEnv.unverified.password!, { role: 'citizen' });
    await page.goto('/citizen/report');

    const verifyButton = page.getByRole('button', { name: /Verify Phone Now/i });
    if (!(await verifyButton.isVisible().catch(() => false))) {
      test.skip(true, 'Test user is already phone verified. Provide an unverified account to run this scenario.');
    }

    await verifyButton.click();
    const modalTitle = page.getByRole('heading', { name: 'Verify your phone' });
    await expect(modalTitle).toBeVisible();
    await page.getByLabel('Phone number').fill(testEnv.phoneNumber);
    await page.getByRole('button', { name: /Send OTP/i }).click();
    await page.getByLabel('Enter OTP').fill(testEnv.phoneOtp);
    await page.getByRole('button', { name: /Verify & Link/i }).click();
    await expect(modalTitle).toBeHidden({ timeout: 7000 });
    await expect(page.getByText('Create a new issue')).toBeVisible();
    await logoutIfPossible(page);
  });
});
