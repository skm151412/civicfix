import { test, expect } from '@playwright/test';
import { hasCitizenCredentials, testEnv } from './utils/testEnv';
import { loginAs, logoutIfPossible } from './utils/session';

const missingCreds = !hasCitizenCredentials;

const citizenNav = [
  { label: 'Dashboard', path: '/citizen/dashboard' },
  { label: 'Report Issue', path: '/citizen/report' },
  { label: 'My Issues', path: '/citizen/issues' },
  { label: 'Map View', path: '/citizen/map' },
  { label: 'Leaderboard', path: '/leaderboard' },
];

test.describe('Citizen navigation links', () => {
  test.skip(missingCreds, 'Set E2E_CITIZEN_EMAIL and E2E_CITIZEN_PASSWORD to run navigation tests.');

  test('navigates through sidebar links without errors', async ({ page }) => {
    await loginAs(page, testEnv.citizen.email!, testEnv.citizen.password!, { role: 'citizen' });

    for (const nav of citizenNav) {
      await page.getByRole('link', { name: nav.label, exact: true }).click();
      await page.waitForURL(`**${nav.path}`, { timeout: 15000 });
      await expect(page.locator('main')).toBeVisible();
    }

    await logoutIfPossible(page);
  });
});
