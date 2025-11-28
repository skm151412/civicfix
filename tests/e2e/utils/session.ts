import { expect, Page } from '@playwright/test';
import { testEnv } from './testEnv';

export const loginAs = async (
  page: Page,
  email: string,
  password: string,
  options: { role?: 'citizen' | 'staff' | 'admin' } = {}
) => {
  await page.goto('/login');
  await page.getByLabel('Email or Phone').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await expect(page.getByText(/Login successful|Signed in with Google/i)).toBeVisible({ timeout: 15000 });
  const expectedRole = options.role ?? 'citizen';
  await page.waitForURL(`**/${expectedRole}/**`, { timeout: 20000 });
};

export const logoutIfPossible = async (page: Page) => {
  const logoutButton = page.getByRole('button', { name: /Logout/i });
  if (await logoutButton.isVisible().catch(() => false)) {
    await logoutButton.click();
    await page.waitForURL('**/');
  }
};

export const completePhoneVerificationIfNeeded = async (page: Page) => {
  const verifyButton = page.getByRole('button', { name: /Verify Phone Now/i });
  const visible = await verifyButton.isVisible().catch(() => false);
  if (!visible) {
    return;
  }

  await verifyButton.click();
  const modalTitle = page.getByRole('heading', { name: 'Verify your phone' });
  await expect(modalTitle).toBeVisible();
  await page.getByLabel('Phone number').fill(testEnv.phoneNumber);
  await page.getByRole('button', { name: /Send OTP/i }).click();
  await page.getByLabel('Enter OTP').fill(testEnv.phoneOtp);
  await page.getByRole('button', { name: /Verify & Link/i }).click();
  await expect(modalTitle).toBeHidden({ timeout: 7000 });
};
