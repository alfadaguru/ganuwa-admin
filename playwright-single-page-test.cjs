const { chromium } = require('playwright');

(async () => {
  const pagePath = process.argv[2] || '/content/press-releases';
  const pageName = process.argv[3] || 'Press Releases';

  console.log(`🧪 Testing ${pageName} page...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`❌ [ERROR]: ${msg.text()}`);
  });
  page.on('pageerror', error => console.log(`💥 [PAGE ERROR]: ${error.message}`));

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Go to page
    await page.goto(`http://localhost:5173${pagePath}`);
    await page.waitForTimeout(3000);

    // Check for h1
    const h1Count = await page.locator('h1').count();
    if (h1Count === 0) {
      console.log(`❌ No H1 found`);
      process.exit(1);
    }

    const h1Text = await page.locator('h1').first().textContent();
    console.log(`✅ H1 found: "${h1Text}"`);

    // Check for table or content
    const tableCount = await page.locator('table').count();
    console.log(`${tableCount > 0 ? '✅' : '⚠️ '} Table: ${tableCount > 0 ? 'Yes' : 'No'}`);

    // Check for Add button
    const addButtonCount = await page.locator('button:has-text("Add")').count();
    console.log(`${addButtonCount > 0 ? '✅' : '⚠️ '} Add button: ${addButtonCount > 0 ? 'Yes' : 'No'}`);

    console.log(`\n✅ ${pageName} page passed!`);

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
