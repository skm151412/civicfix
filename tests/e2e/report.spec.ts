import { test, expect } from '@playwright/test';
import { hasCitizenCredentials, randomTitle, testEnv } from './utils/testEnv';
import { completePhoneVerificationIfNeeded, loginAs, logoutIfPossible } from './utils/session';
import { createTempImage } from './utils/testFiles';

const missingCreds = !hasCitizenCredentials;

test.describe('Citizen issue reporting', () => {
  test.skip(missingCreds, 'Set E2E_CITIZEN_EMAIL and E2E_CITIZEN_PASSWORD to run reporting smoke tests.');

  test('submits an issue with geolocation and attachment', async ({ page, context }) => {
    await loginAs(page, testEnv.citizen.email!, testEnv.citizen.password!, { role: 'citizen' });
    await page.goto('/citizen/report');
    await completePhoneVerificationIfNeeded(page);

    const title = randomTitle('Playwright Smoke');
    await page.getByTestId('report-title').fill(title);
    await page.getByTestId('report-category').selectOption(testEnv.category);
    const addressValue = `${testEnv.locationText} ${Date.now()}`;
    await page.getByTestId('report-full-address').fill(addressValue);
    await page.getByTestId('report-street').fill('Automation Street');
    await page.getByTestId('report-locality').fill('Automation District');
    await page.getByTestId('report-landmark').fill('Near CivicFix Test Hub');
    await page.getByTestId('report-city').fill('Bengaluru');
    await page.getByTestId('report-state').fill('Karnataka');
    await page.getByTestId('report-pincode').fill('560001');
    await page.getByTestId('report-country').fill('India');
    await page.getByTestId('report-description').fill('Playwright automated submission to verify issue reporting.');

    await context.setGeolocation({ latitude: 12.9716 + Math.random() * 0.01, longitude: 77.5946 + Math.random() * 0.01 });
    await context.grantPermissions(['geolocation']);
    await page.getByRole('button', { name: /Get Location/i }).click();
    await expect(page.getByTestId('location-summary')).toContainText('GPS locked');

    const filePath = await createTempImage();
    await page.setInputFiles('[data-testid="report-file-input"]', filePath);

    await page.getByRole('button', { name: /Submit Issue/i }).click();
    await expect(page.getByText('Issue submitted successfully!')).toBeVisible({ timeout: 15000 });
    await page.waitForURL('**/citizen/issues', { timeout: 20000 });

    const latestRow = page.locator('[data-testid="issue-row"]').first();
    await expect(latestRow).toContainText(title);
    await logoutIfPossible(page);
  });
});
