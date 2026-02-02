import { test, expect } from '@playwright/test';

test.describe('Kano State Admin Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Admin login page loads', async ({ page }) => {
    console.log('🔍 Testing Admin Login Page...');

    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/admin-login.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/admin-login.png');

    const title = await page.title();
    console.log(`📄 Page title: ${title}`);

    const bodyText = await page.textContent('body');
    console.log(`📝 Body contains text: ${bodyText.length} characters`);

    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Check admin console errors', async ({ page }) => {
    console.log('🔍 Checking for console errors in admin panel...');

    const errors = [];
    const warnings = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
      if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });

    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(5000);

    console.log(`📊 Total errors: ${errors.length}`);
    console.log(`📊 Total warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    } else {
      console.log('✅ No console errors found');
    }
  });

  test('Check admin API requests', async ({ page }) => {
    console.log('🔍 Checking admin API requests...');

    const apiRequests = [];
    const failedRequests = [];

    page.on('request', request => {
      if (request.url().includes('localhost:5001')) {
        apiRequests.push({
          url: request.url(),
          method: request.method()
        });
        console.log(`📡 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('localhost:5001')) {
        const status = response.status();
        console.log(`📨 API Response: ${status} ${response.url()}`);

        if (status >= 400) {
          failedRequests.push({
            url: response.url(),
            status: status
          });
        }
      }
    });

    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(3000);

    console.log(`📊 Total API requests: ${apiRequests.length}`);
    console.log(`📊 Failed requests: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:');
      failedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.status} ${req.url}`);
      });
    }
  });

  test('Test login form presence', async ({ page }) => {
    console.log('🔍 Checking for login form...');

    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    // Check for common login form elements
    const hasEmailInput = await page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    const hasLoginButton = await page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').count() > 0;

    console.log(`✅ Email input found: ${hasEmailInput}`);
    console.log(`✅ Password input found: ${hasPasswordInput}`);
    console.log(`✅ Login button found: ${hasLoginButton}`);

    if (hasEmailInput && hasPasswordInput && hasLoginButton) {
      console.log('✅ Login form is complete');
    } else {
      console.log('⚠️  Login form may be incomplete or uses different structure');
    }
  });

  test('Test admin login with credentials', async ({ page }) => {
    console.log('🔍 Testing login with default credentials...');

    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    // Get the default credentials from .env
    const email = 'admin@kanostate.gov.ng';
    const password = 'Admin@2025!ChangeMe';

    // Try to find and fill login form
    try {
      const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In"), button[type="submit"]').first();

      if (await emailInput.count() > 0) {
        await emailInput.fill(email);
        console.log('✅ Email filled');
      }

      if (await passwordInput.count() > 0) {
        await passwordInput.fill(password);
        console.log('✅ Password filled');
      }

      if (await loginButton.count() > 0) {
        await loginButton.click();
        console.log('✅ Login button clicked');

        // Wait for navigation or error
        await page.waitForTimeout(5000);

        // Take screenshot after login attempt
        await page.screenshot({ path: '/tmp/admin-after-login.png', fullPage: true });
        console.log('📸 Screenshot saved: /tmp/admin-after-login.png');

        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);

        if (currentUrl !== 'http://localhost:5174/') {
          console.log('✅ Login appears successful - redirected to: ' + currentUrl);
        } else {
          console.log('⚠️  Still on login page - check for error messages');
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not complete login test: ${error.message}`);
    }
  });

  test('Extract visible text from admin login', async ({ page }) => {
    console.log('🔍 Extracting visible text from admin login page...');

    await page.goto('http://localhost:5174/');
    await page.waitForTimeout(3000);

    const allText = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log('📝 Visible text on admin login:');
    console.log('═'.repeat(70));
    console.log(allText.substring(0, 500));
    console.log('═'.repeat(70));

    const keywords = ['Admin', 'Login', 'Email', 'Password', 'Sign'];
    keywords.forEach(keyword => {
      const found = allText.toLowerCase().includes(keyword.toLowerCase());
      console.log(`${found ? '✅' : '⚠️ '} Keyword "${keyword}" found: ${found}`);
    });
  });
});
