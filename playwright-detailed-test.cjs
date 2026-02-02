const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting detailed network diagnostic...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Track all network requests
  const failedRequests = [];

  page.on('requestfailed', request => {
    const failure = {
      url: request.url(),
      method: request.method(),
      error: request.failure().errorText
    };
    failedRequests.push(failure);
    console.log(`❌ Request Failed: ${request.method()} ${request.url()}`);
    console.log(`   Error: ${request.failure().errorText}\n`);
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}\n`);
    }
  });

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    }
  });

  try {
    console.log('📍 Step 1: Loading login page...');
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    console.log('\n📍 Step 2: Logging in...');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`✅ Current URL: ${currentUrl}\n`);

    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Login successful!\n');

      console.log('📍 Step 3: Clicking on News menu...');
      await page.click('a[href="/content/news"]');

      await page.waitForTimeout(3000);

      console.log('\n📊 Failed Requests Summary:');
      if (failedRequests.length === 0) {
        console.log('✅ No failed requests!\n');
      } else {
        failedRequests.forEach((req, index) => {
          console.log(`\n${index + 1}. ${req.method} ${req.url}`);
          console.log(`   Error: ${req.error}`);
        });
      }

      await page.screenshot({ path: '/tmp/admin-final.png', fullPage: true });
      console.log('\n📸 Screenshot saved to /tmp/admin-final.png');
    }

    console.log('\n✅ Keeping browser open for 15 seconds for inspection...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: '/tmp/admin-test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');
  }
})();