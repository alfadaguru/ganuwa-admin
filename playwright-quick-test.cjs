const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Quick Admin Panel Verification...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { passed: 0, failed: 0, errors: [] };

  try {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Test all paths
    const paths = [
      '/dashboard',
      '/content/news',
      '/content/hero-banners',
      '/content/announcements',
      '/content/press-releases',
      '/content/events',
      '/content/leaders',
      '/content/services',
      '/content/projects',
      '/content/mdas',
      '/content/lgas',
      '/content/media',
      '/content/quick-links',
      '/content/pages',
      '/content/faqs',
      '/content/contacts',
      '/content/subscribers',
      '/content/users'
    ];

    for (const path of paths) {
      try {
        await page.goto(`http://localhost:5173${path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(500);

        const hasHeader = await page.locator('h1').count() > 0;
        if (hasHeader) {
          console.log(`✅ ${path}`);
          results.passed++;
        } else {
          console.log(`⚠️  ${path} - No header`);
          results.failed++;
        }
      } catch (error) {
        console.log(`❌ ${path} - ${error.message.substring(0, 50)}`);
        results.failed++;
        results.errors.push(`${path}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Passed: ${results.passed}/${paths.length}`);
    console.log(`❌ Failed: ${results.failed}/${paths.length}`);
    console.log('='.repeat(50));

    if (results.failed === 0) {
      console.log('\n🎉 ALL PAGES LOADED SUCCESSFULLY!');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
    process.exit(results.failed > 0 ? 1 : 0);
  }
})();
