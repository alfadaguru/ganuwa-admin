import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.toString());
  });

  // Collect network errors
  const networkErrors = [];
  page.on('requestfailed', request => {
    networkErrors.push(`${request.url()} - ${request.failure().errorText}`);
  });

  // Monitor network responses
  const responses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          body: body.substring(0, 500)
        });
      } catch (e) {
        responses.push({
          url: response.url(),
          status: response.status(),
          body: 'Could not read body'
        });
      }
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 10000 });

    console.log('Filling login form...');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');

    console.log('Submitting form...');
    await page.click('button[type="submit"]');

    // Wait for either success (redirect) or error
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('\n=== CURRENT URL ===');
    console.log(currentUrl);

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== PAGE ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No page errors');
    }

    console.log('\n=== NETWORK ERRORS ===');
    if (networkErrors.length > 0) {
      networkErrors.forEach(err => console.log(err));
    } else {
      console.log('No network errors');
    }

    console.log('\n=== API RESPONSES ===');
    if (responses.length > 0) {
      responses.forEach(resp => {
        console.log(`\nURL: ${resp.url}`);
        console.log(`Status: ${resp.status}`);
        console.log(`Body: ${resp.body}`);
      });
    } else {
      console.log('No API calls detected');
    }

    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('\n=== LOCAL STORAGE ===');
    console.log('Token:', token ? 'Present' : 'Not found');

  } catch (error) {
    console.error('Test Error:', error.message);
  } finally {
    await browser.close();
  }
})();