const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Visual Test: Sidebar Scrolling Functionality\n');

  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  try {
    // Navigate to admin panel
    console.log('📍 Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}\n`);

    // Check if we're on login page or dashboard
    if (currentUrl.includes('/login')) {
      console.log('🔑 On login page, attempting to log in...');

      // Wait for login form
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });

      // Fill in credentials
      await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
      await page.fill('input[type="password"]', 'Admin@123');

      console.log('✅ Credentials entered');
      console.log('🖱️  Clicking submit button...');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);

      const afterLoginUrl = page.url();
      console.log(`📍 After login URL: ${afterLoginUrl}\n`);
    }

    // Now we should be on dashboard - check for sidebar
    console.log('🔍 Looking for sidebar...');

    const sidebar = await page.$('aside');
    if (!sidebar) {
      console.log('❌ Sidebar not found!');
      return;
    }

    console.log('✅ Sidebar found\n');

    // Check sidebar classes
    const sidebarClasses = await sidebar.getAttribute('class');
    console.log('📋 Sidebar classes:');
    console.log(sidebarClasses);
    console.log('');

    // Check if sidebar has flex flex-col
    if (sidebarClasses.includes('flex') && sidebarClasses.includes('flex-col')) {
      console.log('✅ Sidebar has flex flex-col layout\n');
    } else {
      console.log('❌ Sidebar missing flex flex-col layout\n');
    }

    // Get navigation
    const nav = await page.$('aside nav');
    if (!nav) {
      console.log('❌ Navigation not found!');
      return;
    }

    console.log('✅ Navigation found\n');

    // Check nav classes
    const navClasses = await nav.getAttribute('class');
    console.log('📋 Navigation classes:');
    console.log(navClasses);
    console.log('');

    // Check if nav has overflow-y-auto
    if (navClasses.includes('overflow-y-auto')) {
      console.log('✅ Navigation has overflow-y-auto\n');
    } else {
      console.log('❌ Navigation missing overflow-y-auto\n');
    }

    // Count nav items
    const navLinks = await page.$$('aside nav a');
    console.log(`📊 Total navigation items: ${navLinks.length}\n`);

    // List all nav items
    console.log('📋 Navigation items:');
    for (let i = 0; i < navLinks.length; i++) {
      const text = await navLinks[i].textContent();
      const href = await navLinks[i].getAttribute('href');
      console.log(`   ${i + 1}. ${text.trim()} → ${href}`);
    }
    console.log('');

    // Find Users link
    const usersLink = await page.$('aside nav a[href="/content/users"]');

    if (!usersLink) {
      console.log('❌ Users link not found in sidebar!\n');
      return;
    }

    console.log('✅ Users link found at /content/users\n');

    // Check initial visibility
    console.log('🔍 Checking initial visibility of Users link...');
    const boundingBox = await usersLink.boundingBox();

    if (boundingBox) {
      const viewportHeight = page.viewportSize().height;
      const isInViewport = boundingBox.y >= 0 && boundingBox.y + boundingBox.height <= viewportHeight;

      console.log(`   📐 Users link Y position: ${Math.round(boundingBox.y)}px`);
      console.log(`   📏 Viewport height: ${viewportHeight}px`);
      console.log(`   ${isInViewport ? '✅' : '⚠️ '} In viewport: ${isInViewport ? 'YES' : 'NO (requires scrolling)'}\n`);

      if (!isInViewport) {
        console.log('🔄 Scrolling sidebar to make Users link visible...');
        await usersLink.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        const boundingBoxAfter = await usersLink.boundingBox();
        if (boundingBoxAfter) {
          const isInViewportAfter = boundingBoxAfter.y >= 0 && boundingBoxAfter.y + boundingBoxAfter.height <= viewportHeight;
          console.log(`   📐 Users link Y position after scroll: ${Math.round(boundingBoxAfter.y)}px`);
          console.log(`   ${isInViewportAfter ? '✅' : '❌'} In viewport after scroll: ${isInViewportAfter ? 'YES' : 'NO'}\n`);

          if (isInViewportAfter) {
            console.log('✅ SIDEBAR SCROLLING WORKS!\n');
          } else {
            console.log('❌ SIDEBAR SCROLLING FAILED!\n');
          }
        }
      } else {
        console.log('✅ Users link already visible (no scrolling needed)\n');
      }
    }

    // Try to click Users link
    console.log('🖱️  Attempting to click Users link...');
    await usersLink.click();
    await page.waitForTimeout(2000);

    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}\n`);

    if (finalUrl.includes('/content/users')) {
      console.log('✅ Successfully navigated to Users page!\n');

      // Check page content
      const pageTitle = await page.textContent('h1').catch(() => null);
      if (pageTitle) {
        console.log(`📄 Page title: "${pageTitle}"\n`);
      }

      // Take screenshot
      await page.screenshot({ path: '/tmp/users-page-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/users-page-screenshot.png\n');
    } else {
      console.log('❌ Failed to navigate to Users page\n');
    }

    // Final summary
    console.log('=' .repeat(70));
    console.log('SIDEBAR SCROLLING TEST RESULTS');
    console.log('=' .repeat(70));
    console.log(`✅ Sidebar has flex flex-col: ${sidebarClasses.includes('flex') && sidebarClasses.includes('flex-col') ? 'YES' : 'NO'}`);
    console.log(`✅ Navigation has overflow-y-auto: ${navClasses.includes('overflow-y-auto') ? 'YES' : 'NO'}`);
    console.log(`✅ Users link found: YES`);
    console.log(`✅ Users link accessible: ${finalUrl.includes('/content/users') ? 'YES' : 'NO'}`);
    console.log(`✅ Navigation to Users page works: ${finalUrl.includes('/content/users') ? 'YES' : 'NO'}`);
    console.log('=' .repeat(70));

    if (finalUrl.includes('/content/users')) {
      console.log('\n🎉 SUCCESS! Sidebar scrolling fix is working perfectly!\n');
    } else {
      console.log('\n⚠️  WARNING: Could not verify navigation to Users page\n');
    }

    // Keep browser open for 5 seconds so you can see the result
    console.log('⏳ Keeping browser open for 5 seconds...\n');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('✅ Browser closed\n');
  }
})();
