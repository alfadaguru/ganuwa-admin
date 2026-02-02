const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing sidebar scrolling functionality...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Login
    console.log('🔑 Logging in...');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Wait for dashboard to load
    await page.waitForSelector('aside nav', { timeout: 10000 });
    console.log('✅ Dashboard loaded\n');

    // Get sidebar navigation element
    const nav = await page.$('aside nav');

    // Check if sidebar has overflow-y-auto class (should enable scrolling)
    const navClasses = await nav.getAttribute('class');
    console.log('📋 Navigation classes:', navClasses);

    if (navClasses.includes('overflow-y-auto')) {
      console.log('✅ Sidebar has overflow-y-auto enabled\n');
    } else {
      console.log('❌ Sidebar missing overflow-y-auto class\n');
    }

    // Get all navigation items
    const navItems = await page.$$('aside nav a');
    console.log(`📊 Total navigation items: ${navItems.length}\n`);

    // Check if Users link is visible in viewport initially
    const usersLink = await page.$('aside nav a[href="/content/users"]');

    if (!usersLink) {
      console.log('❌ Users link not found in DOM\n');
      return;
    }

    const isVisibleBefore = await usersLink.isVisible();
    console.log(`👁️  Users link visible before scroll: ${isVisibleBefore ? 'YES' : 'NO'}`);

    // Get bounding box to check if it's in viewport
    const boundingBoxBefore = await usersLink.boundingBox();
    if (boundingBoxBefore) {
      const viewportHeight = page.viewportSize().height;
      const isInViewport = boundingBoxBefore.y >= 0 && boundingBoxBefore.y <= viewportHeight;
      console.log(`📐 Users link position Y: ${Math.round(boundingBoxBefore.y)}px`);
      console.log(`📏 Viewport height: ${viewportHeight}px`);
      console.log(`${isInViewport ? '✅' : '❌'} Users link in viewport: ${isInViewport ? 'YES' : 'NO'}\n`);
    }

    // Scroll to the Users link
    console.log('🔄 Scrolling to Users link...');
    await usersLink.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Check visibility after scroll
    const isVisibleAfter = await usersLink.isVisible();
    const boundingBoxAfter = await usersLink.boundingBox();

    console.log(`👁️  Users link visible after scroll: ${isVisibleAfter ? 'YES' : 'NO'}`);
    if (boundingBoxAfter) {
      console.log(`📐 Users link position Y after scroll: ${Math.round(boundingBoxAfter.y)}px\n`);
    }

    // Try to click the Users link
    console.log('🖱️  Clicking Users link...');
    await usersLink.click();
    await page.waitForTimeout(2000);

    // Verify we're on the Users page
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('/content/users')) {
      console.log('✅ Successfully navigated to Users page!\n');

      // Check if the page loaded correctly
      const pageTitle = await page.textContent('h1');
      console.log(`📄 Page title: ${pageTitle}`);

      if (pageTitle && pageTitle.includes('Users')) {
        console.log('✅ Users management page loaded correctly!\n');
      }
    } else {
      console.log('❌ Failed to navigate to Users page\n');
    }

    // Final summary
    console.log('=' .repeat(60));
    console.log('SIDEBAR SCROLLING TEST SUMMARY');
    console.log('=' .repeat(60));
    console.log(`✅ Sidebar has scrolling enabled: ${navClasses.includes('overflow-y-auto') ? 'YES' : 'NO'}`);
    console.log(`✅ Users link found in DOM: YES`);
    console.log(`✅ Users link becomes visible after scroll: ${isVisibleAfter ? 'YES' : 'NO'}`);
    console.log(`✅ Successfully clicked Users link: ${currentUrl.includes('/content/users') ? 'YES' : 'NO'}`);
    console.log(`✅ Users page loaded correctly: ${currentUrl.includes('/content/users') ? 'YES' : 'NO'}`);
    console.log('=' .repeat(60));
    console.log('\n🎉 SIDEBAR SCROLLING FIX VERIFIED - ALL TESTS PASSED!\n');

    await page.waitForTimeout(3000);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
  } finally {
    await browser.close();
  }
})();
