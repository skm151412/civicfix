import { expect, Page } from '@playwright/test';
import { completePhoneVerificationIfNeeded } from './session';
import { createTempImage } from './testFiles';
import { randomTitle, testEnv } from './testEnv';

export const createIssueViaUi = async (page: Page, title = randomTitle()) => {
  await page.goto('/citizen/report');
  await completePhoneVerificationIfNeeded(page);

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
  await page.getByTestId('report-description').fill('Automated test submission to verify report flow.');

  await page.context().setGeolocation({ latitude: 12.9716 + Math.random() * 0.01, longitude: 77.5946 + Math.random() * 0.01 });
  await page.context().grantPermissions(['geolocation']);
  await page.getByRole('button', { name: /Get Location/i }).click();
  await expect(page.getByTestId('location-summary')).toContainText('GPS locked');

  const imagePath = await createTempImage();
  await page.setInputFiles('[data-testid="report-file-input"]', imagePath);

  await page.getByRole('button', { name: /Submit Issue/i }).click();
  await page.waitForURL('**/citizen/issues', { timeout: 20000 });
  const latestRow = page.locator('[data-testid="issue-row"]').first();
  await expect(latestRow).toContainText(title);
  const issueId = await latestRow.getAttribute('data-issue-id');
  if (!issueId) {
    throw new Error('Unable to read issue id after submission');
  }
  return { issueId, title };
};
