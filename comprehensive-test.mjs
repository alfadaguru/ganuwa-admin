import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Collect all console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    console.log(`[CONSOLE ${msg.type()}] ${text}`);
  });

  // Collect all errors
  const errors = [];
  page.on('pageerror', error => {
    const errorText = error.toString();
    errors.push(errorText);
    console.log('[PAGE ERROR]', errorText);
  });

  // Collect failed requests
  const failedRequests = [];
  page.on('requestfailed', request => {
    const failure = `${request.url()} - ${request.failure().errorText}`;
    failedRequests.push(failure);
    console.log('[REQUEST FAILED]', failure);
  });

  // Monitor API responses
  const apiResponses = [];
  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      try {
        const body = await response.text();
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          body: body.substring(0, 1000)
        });
        console.log(`[API ${response.status()}] ${response.url()}`);
      } catch (e) {
        // Ignore if can't read body
      }
    }
  });

  try {
    console.log('\n==================== TEST START ====================\n');

    // Step 1: Navigate to login page
    console.log('STEP 1: Navigating to login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle', timeout: 15000 });
    await page.screenshot({ path: '/tmp/test-1-login-page.png', fullPage: true });
    console.log('✓ Login page loaded');

    const loginPageText = await page.evaluate(() => document.body.innerText);
    console.log(`Login page contains: ${loginPageText.substring(0, 200)}...`);

    // Step 2: Fill in credentials
    console.log('\nSTEP 2: Filling in credentials...');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    console.log('✓ Email filled');

    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    console.log('✓ Password filled');

    await page.screenshot({ path: '/tmp/test-2-credentials-filled.png' });

    // Step 3: Submit login
    console.log('\nSTEP 3: Submitting login...');
    await page.click('button[type="submit"]');
    console.log('✓ Login button clicked');

    // Wait for navigation or error
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/test-3-after-submit.png', fullPage: true });

    const currentUrl = page.url();
    console.log(`\nCurrent URL: ${currentUrl}`);

    // Check localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    console.log(`Token in localStorage: ${token ? 'YES (length: ' + token.length + ')' : 'NO'}`);
    console.log(`User in localStorage: ${user ? 'YES' : 'NO'}`);

    if (currentUrl.includes('/dashboard')) {
      console.log('\n✅ SUCCESSFULLY REDIRECTED TO DASHBOARD!\n');

      // Step 4: Check dashboard content
      console.log('STEP 4: Checking dashboard content...');
      await page.waitForTimeout(2000);

      const dashboardText = await page.evaluate(() => document.body.innerText);
      console.log(`\nDashboard content (first 500 chars):\n${dashboardText.substring(0, 500)}\n`);

      // Check for common dashboard elements
      const hasSidebar = await page.locator('nav, aside, [role="navigation"]').count() > 0;
      const hasHeader = await page.locator('header').count() > 0;

      console.log(`Has sidebar/nav: ${hasSidebar ? 'YES' : 'NO'}`);
      console.log(`Has header: ${hasHeader ? 'YES' : 'NO'}`);

      await page.screenshot({ path: '/tmp/test-4-dashboard.png', fullPage: true });

      // Step 5: Try clicking on News menu
      console.log('\nSTEP 5: Testing navigation to News...');
      try {
        // Try to find and click News link
        const newsLink = page.locator('text=/News/i').first();
        const newsExists = await newsLink.count() > 0;

        if (newsExists) {
          await newsLink.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/test-5-news-page.png', fullPage: true });
          console.log('✓ Navigated to News page');
          console.log(`URL: ${page.url()}`);
        } else {
          console.log('⚠️ News link not found in navigation');
        }
      } catch (e) {
        console.log('⚠️ Could not navigate to News:', e.message);
      }

      // Step 6: Try Hero Banners
      console.log('\nSTEP 6: Testing navigation to Hero Banners...');
      try {
        const heroLink = page.locator('text=/Hero.*Banner/i').first();
        const heroExists = await heroLink.count() > 0;

        if (heroExists) {
          await heroLink.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/test-6-hero-banners.png', fullPage: true });
          console.log('✓ Navigated to Hero Banners page');
          console.log(`URL: ${page.url()}`);
        } else {
          console.log('⚠️ Hero Banners link not found');
        }
      } catch (e) {
        console.log('⚠️ Could not navigate to Hero Banners:', e.message);
      }

      // Step 7: Test logout
      console.log('\nSTEP 7: Testing logout...');
      try {
        const logoutButton = page.locator('text=/logout/i, button:has-text("logout")').first();
        const logoutExists = await logoutButton.count() > 0;

        if (logoutExists) {
          await logoutButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: '/tmp/test-7-after-logout.png', fullPage: true });
          console.log('✓ Logout button clicked');
          console.log(`URL after logout: ${page.url()}`);
        } else {
          console.log('⚠️ Logout button not found');
        }
      } catch (e) {
        console.log('⚠️ Could not test logout:', e.message);
      }

    } else if (currentUrl.includes('/login')) {
      console.log('\n⚠️ STILL ON LOGIN PAGE - Login may have failed\n');

      const pageContent = await page.evaluate(() => document.body.innerText);
      console.log('Page content:', pageContent.substring(0, 500));
    } else {
      console.log(`\n⚠️ UNEXPECTED URL: ${currentUrl}\n`);
    }

    // Print summary
    console.log('\n==================== TEST SUMMARY ====================\n');

    console.log('API RESPONSES:');
    if (apiResponses.length > 0) {
      apiResponses.forEach(resp => {
        console.log(`  ${resp.status} - ${resp.url}`);
        if (resp.status !== 200) {
          console.log(`    Body: ${resp.body.substring(0, 200)}`);
        }
      });
    } else {
      console.log('  No API calls detected');
    }

    console.log('\nERRORS:');
    if (errors.length > 0) {
      errors.forEach(err => console.log(`  ${err}`));
    } else {
      console.log('  No errors detected');
    }

    console.log('\nFAILED REQUESTS:');
    if (failedRequests.length > 0) {
      failedRequests.forEach(req => console.log(`  ${req}`));
    } else {
      console.log('  No failed requests');
    }

    console.log('\n==================== SCREENSHOTS ====================');
    console.log('All screenshots saved to /tmp/test-*.png');
    console.log('View them with: open /tmp/test-*.png');

    console.log('\n==================== BROWSER WILL STAY OPEN FOR 15 SECONDS ====================\n');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: '/tmp/test-error.png', fullPage: true });
  } finally {
    await browser.close();
    console.log('\n✅ Test completed and browser closed\n');
  }
})();