const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Playwright diagnostic test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warning') {
      console.log(`⚠️  Console Warning: ${text}`);
    } else {
      console.log(`ℹ️  Console: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  });

  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`❌ Network Error: ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('📍 Step 1: Navigating to http://localhost:5173/...');
    await page.goto('http://localhost:5173/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Page loaded successfully\n');

    // Wait a bit to see what renders
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/admin-page.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/admin-page.png\n');

    // Check what's in the DOM
    const bodyContent = await page.evaluate(() => {
      return {
        hasRoot: !!document.getElementById('root'),
        rootContent: document.getElementById('root')?.innerHTML.substring(0, 200),
        bodyText: document.body.innerText.substring(0, 200),
        title: document.title,
        errors: window.console ? 'Console exists' : 'No console'
      };
    });

    console.log('📄 Page Content Analysis:');
    console.log('  - Title:', bodyContent.title);
    console.log('  - Has #root div:', bodyContent.hasRoot);
    console.log('  - Root content:', bodyContent.rootContent || '(empty)');
    console.log('  - Body text:', bodyContent.bodyText || '(empty)');
    console.log('');

    // Check if login form exists
    const hasLoginForm = await page.evaluate(() => {
      return !!document.querySelector('form') ||
             !!document.querySelector('input[type="email"]') ||
             !!document.querySelector('input[type="password"]');
    });

    if (hasLoginForm) {
      console.log('✅ Login form detected! Attempting login...\n');

      // Fill login form
      await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
      await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');

      console.log('📍 Step 2: Submitting login form...');
      await page.click('button[type="submit"]');

      // Wait for navigation or error
      await page.waitForTimeout(3000);

      // Check if we're logged in
      const currentUrl = page.url();
      console.log('  - Current URL:', currentUrl);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Login successful! Redirected to dashboard\n');

        await page.screenshot({ path: '/tmp/admin-dashboard.png', fullPage: true });
        console.log('📸 Dashboard screenshot saved to /tmp/admin-dashboard.png\n');

        // Test News CRUD
        console.log('📍 Step 3: Testing News CRUD...');
        await page.click('a[href="/content/news"]');
        await page.waitForTimeout(2000);

        await page.screenshot({ path: '/tmp/admin-news.png', fullPage: true });
        console.log('📸 News page screenshot saved to /tmp/admin-news.png\n');

        const newsPageContent = await page.evaluate(() => {
          return {
            hasTable: !!document.querySelector('table'),
            hasAddButton: !!document.querySelector('button:has-text("Add")'),
            pageText: document.body.innerText.substring(0, 300)
          };
        });

        console.log('  - News page has table:', newsPageContent.hasTable);
        console.log('  - News page has Add button:', newsPageContent.hasAddButton);
        console.log('  - Page content:', newsPageContent.pageText);

      } else {
        console.log('❌ Login failed or no redirect\n');
      }

    } else {
      console.log('❌ No login form found! Page might be blank or broken\n');

      // Get all visible text
      const allText = await page.evaluate(() => document.body.innerText);
      console.log('All visible text:', allText || '(completely blank)');
    }

    console.log('\n✅ Test completed! Browser will stay open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack:', error.stack);

    await page.screenshot({ path: '/tmp/admin-error.png', fullPage: true });
    console.log('📸 Error screenshot saved to /tmp/admin-error.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Test session ended');
  }
})();
