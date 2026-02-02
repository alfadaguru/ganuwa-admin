const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Starting Complete Admin Panel Test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Track errors
  const errors = [];
  const warnings = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page Error: ${error.message}`);
  });

  const testResults = {
    passed: [],
    failed: [],
    skipped: []
  };

  try {
    // Login
    console.log('📍 Step 1: Logging in...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    if (page.url().includes('/dashboard')) {
      console.log('✅ Login successful\n');
      testResults.passed.push('Login');
    } else {
      console.log('❌ Login failed\n');
      testResults.failed.push('Login');
    }

    // Test all menu items
    const menuItems = [
      { name: 'Dashboard', path: '/dashboard' },
      { name: 'News', path: '/content/news' },
      { name: 'Hero Banners', path: '/content/hero-banners' },
      { name: 'Announcements', path: '/content/announcements' },
      { name: 'Press Releases', path: '/content/press-releases' },
      { name: 'Events', path: '/content/events' },
      { name: 'Leaders', path: '/content/leaders' },
      { name: 'Services', path: '/content/services' },
      { name: 'Projects', path: '/content/projects' },
      { name: 'MDAs', path: '/content/mdas' },
      { name: 'LGAs', path: '/content/lgas' },
      { name: 'Media', path: '/content/media' },
      { name: 'Quick Links', path: '/content/quick-links' },
      { name: 'Pages', path: '/content/pages' },
      { name: 'FAQs', path: '/content/faqs' },
      { name: 'Contacts', path: '/content/contacts' },
      { name: 'Subscribers', path: '/content/subscribers' },
      { name: 'Users', path: '/content/users' }
    ];

    for (const item of menuItems) {
      console.log(`📍 Testing: ${item.name}...`);

      try {
        // Click menu item
        await page.click(`a[href="${item.path}"]`);
        await page.waitForTimeout(1500);

        // Check if page loaded
        const currentUrl = page.url();
        if (currentUrl.includes(item.path)) {
          // Check for common elements
          const hasHeader = await page.locator('h1').count() > 0;
          const hasContent = await page.locator('div').count() > 0;

          if (hasHeader && hasContent) {
            console.log(`  ✅ ${item.name} - Page loaded successfully`);
            testResults.passed.push(item.name);
          } else {
            console.log(`  ⚠️  ${item.name} - Page loaded but content missing`);
            testResults.failed.push(item.name + ' (No content)');
          }
        } else {
          console.log(`  ❌ ${item.name} - Navigation failed`);
          testResults.failed.push(item.name + ' (Nav failed)');
        }

        // Check for React errors on this page
        const pageErrors = errors.filter(e => !e.includes('DevTools'));
        if (pageErrors.length > 0) {
          console.log(`  ⚠️  ${item.name} - Has ${pageErrors.length} error(s)`);
        }

      } catch (error) {
        console.log(`  ❌ ${item.name} - Error: ${error.message}`);
        testResults.failed.push(item.name + ' (Exception)');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed.length}`);
    console.log(`❌ Failed: ${testResults.failed.length}`);
    console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
    console.log('='.repeat(60));

    if (testResults.failed.length > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.failed.forEach(test => console.log(`  - ${test}`));
    }

    // Check for JavaScript errors
    const criticalErrors = errors.filter(e =>
      !e.includes('DevTools') &&
      !e.includes('autocomplete') &&
      !e.includes('Failed to load resource')
    );

    if (criticalErrors.length > 0) {
      console.log('\n⚠️  JavaScript Errors Found:');
      criticalErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}...`);
      });
    } else {
      console.log('\n✅ No critical JavaScript errors');
    }

    // Final screenshot
    await page.screenshot({ path: '/tmp/admin-complete-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved to /tmp/admin-complete-test.png');

    console.log('\n✅ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Test completed');

    // Exit with appropriate code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
  }
})();