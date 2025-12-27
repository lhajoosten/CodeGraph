/**
 * Global Setup for E2E Tests
 *
 * Runs once before all tests to ensure the environment is ready.
 */

import { chromium, type FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  const { baseURL } = config.projects[0].use;

  if (!baseURL) {
    throw new Error('baseURL is not configured');
  }

  // Wait for the frontend dev server to be ready
  console.log(`Waiting for frontend server at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const maxRetries = 30;
  const retryInterval = 1000;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await page.goto(baseURL, { timeout: 5000 });
      if (response && response.ok()) {
        console.log('Frontend server is ready!');
        await browser.close();
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        await browser.close();
        throw new Error(
          `Frontend server at ${baseURL} is not responding after ${maxRetries} attempts`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
    }
  }

  await browser.close();
}

export default globalSetup;
