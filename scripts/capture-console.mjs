import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const targetUrl = process.env.CIVICFIX_DEV_URL ?? 'http://localhost:3000';
const waitMs = Number(process.env.CIVICFIX_CONSOLE_WAIT ?? 5000);

const outputPath = path.resolve('audit/console-errors.raw.json');

const pushedErrors = [];

const pushError = (entry) => {
  const enriched = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  pushedErrors.push(enriched);
};

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('console', (message) => {
    if (message.type() === 'error') {
      pushError({
        source: 'console',
        message: message.text(),
        location: message.location(),
      });
    }
  });

  page.on('pageerror', (error) => {
    pushError({
      source: 'pageerror',
      message: error.message,
      stack: error.stack,
    });
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 60_000 });
    await page.waitForTimeout(waitMs);
  } catch (error) {
    pushError({
      source: 'navigation',
      message: error.message,
      stack: error.stack,
    });
  } finally {
    await page.close();
    await browser.close();
  }

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        targetUrl,
        errors: pushedErrors,
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log(`Captured ${pushedErrors.length} console error(s). Output: ${outputPath}`);
  if (pushedErrors.length) {
    console.log(JSON.stringify(pushedErrors, null, 2));
  }
};

run().catch((error) => {
  console.error('capture-console failed', error);
  process.exitCode = 1;
});
