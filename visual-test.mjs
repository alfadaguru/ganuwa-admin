import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({
    headless: false,  // Show the browser
    slowMo: 1000      // Slow down actions so you can see them
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Collect console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
  });

  // Collect errors
  page.on('pageerror', error => {
    console.log('[BROWSER ERROR]', error.toString());
  });

  try {
    console.log('Opening login page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: '/tmp/step1-login-page.png' });
    console.log('Screenshot saved: /tmp/step1-login-page.png');

    console.log('\nFilling email...');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.screenshot({ path: '/tmp/step2-email-filled.png' });
    console.log('Screenshot saved: /tmp/step2-email-filled.png');

    console.log('\nFilling password...');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.screenshot({ path: '/tmp/step3-password-filled.png' });
    console.log('Screenshot saved: /tmp/step3-password-filled.png');

    console.log('\nClicking Sign In button...');
    await page.click('button[type="submit"]');

    console.log('\nWaiting for navigation or toast...');
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`\n✅ Current URL: ${currentUrl}`);

    await page.screenshot({ path: '/tmp/step4-after-login.png', fullPage: true });
    console.log('Screenshot saved: /tmp/step4-after-login.png');

    if (currentUrl.includes('/dashboard')) {
      console.log('\n🎉 SUCCESS! Redirected to dashboard!');

      // Get page title
      const title = await page.title();
      console.log(`Page Title: ${title}`);

      // Get some text from the page
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log(`\nPage Content (first 300 chars):\n${bodyText.substring(0, 300)}`);

      // Wait a bit so you can see the dashboard
      console.log('\nKeeping browser open for 10 seconds so you can see the dashboard...');
      await page.waitForTimeout(10000);
    } else {
      console.log('\n⚠️ Still on login page - check screenshots');
      console.log('Keeping browser open for 10 seconds...');
      await page.waitForTimeout(10000);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    console.log('Error screenshot saved: /tmp/error-screenshot.png');
  } finally {
    await browser.close();
    console.log('\n✅ Test completed. Check screenshots in /tmp/');
  }
})();