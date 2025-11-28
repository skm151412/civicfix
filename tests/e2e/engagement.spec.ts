import { test, expect } from '@playwright/test';
import { hasCitizenCredentials, testEnv } from './utils/testEnv';
import { loginAs, logoutIfPossible } from './utils/session';
import { createIssueViaUi } from './utils/actions';

const missingCreds = !hasCitizenCredentials;

test.describe('Issue engagement', () => {
  test.skip(missingCreds, 'Set E2E_CITIZEN_EMAIL and E2E_CITIZEN_PASSWORD to run engagement tests.');

  test('allows upvoting and chatting on an issue', async ({ page }) => {
    await loginAs(page, testEnv.citizen.email!, testEnv.citizen.password!, { role: 'citizen' });
    const { issueId, title } = await createIssueViaUi(page);

    const targetRow = page.locator(`[data-testid="issue-row"][data-issue-id="${issueId}"]`);
    await expect(targetRow).toContainText(title);
    await targetRow.getByTestId('issue-open-link').click();
    await page.waitForURL(`**/issues/${issueId}`);

    const upvoteButton = page.getByRole('button', { name: /Upvote/ });
    const initialText = await upvoteButton.innerText();
    await upvoteButton.click();
    await expect(upvoteButton).not.toHaveText(initialText);

    const message = `Automated update ${new Date().toISOString()}`;
    await page.getByPlaceholder('Type your update…').fill(message);
    await page.locator('form').getByRole('button', { name: /^Send$/i }).click();
    await expect(page.getByText(message)).toBeVisible({ timeout: 10000 });

    await logoutIfPossible(page);
  });
});
