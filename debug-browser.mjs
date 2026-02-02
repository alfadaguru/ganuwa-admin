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

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });

    // Wait a bit for any async rendering
    await page.waitForTimeout(2000);

    // Get page content
    const content = await page.content();
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log('\n=== PAGE TITLE ===');
    console.log(await page.title());

    console.log('\n=== BODY TEXT ===');
    console.log(bodyText);

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.forEach(msg => console.log(msg));

    console.log('\n=== ERRORS ===');
    if (errors.length > 0) {
      errors.forEach(err => console.log(err));
    } else {
      console.log('No errors found');
    }

    console.log('\n=== HTML SNIPPET (first 500 chars) ===');
    console.log(content.substring(0, 500));

    // Take a screenshot
    await page.screenshot({ path: '/tmp/admin-panel-screenshot.png', fullPage: true });
    console.log('\n=== Screenshot saved to /tmp/admin-panel-screenshot.png ===');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();