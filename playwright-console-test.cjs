const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ [BROWSER ERROR]: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  [BROWSER WARNING]: ${text}`);
    }
  });

  // Listen to page errors
  page.on('pageerror', error => {
    console.log(`💥 [PAGE ERROR]: ${error.message}`);
  });

  try {
    console.log('🔍 Checking News page for errors...\n');

    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go to News page and wait for errors
    console.log('📰 Loading News page...');
    await page.goto('http://localhost:5173/content/news');
    await page.waitForTimeout(5000);

    // Check what's actually on the page
    const bodyText = await page.locator('body').textContent();
    console.log(`\n📄 Page content length: ${bodyText.length} characters`);
    console.log(`First 500 chars: ${bodyText.substring(0, 500)}`);

    // Check for loading state
    const hasLoading = await page.locator('text=Loading').count();
    console.log(`\n⏳ Has "Loading" text: ${hasLoading > 0}`);

    // Check for any h1
    const h1Count = await page.locator('h1').count();
    console.log(`📌 H1 count: ${h1Count}`);

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log(`📌 H1 text: "${h1Text}"`);
    }

    // Check for table
    const tableCount = await page.locator('table').count();
    console.log(`📊 Table count: ${tableCount}`);

  } catch (error) {
    console.error(`\n💥 Test error: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
