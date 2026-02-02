import { test, expect } from '@playwright/test';

test.describe('Hero Banners Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Test Hero Banners page after login', async ({ page }) => {
    console.log('🔍 Testing Hero Banners page...');

    // Track errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });

    // Login first
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    const email = 'admin@kanostate.gov.ng';
    const password = 'Admin@2025!ChangeMe';

    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await loginButton.click();

    console.log('✅ Logged in');

    // Wait for redirect to dashboard
    await page.waitForTimeout(3000);

    // Navigate to Hero Banners
    console.log('🔍 Navigating to Hero Banners...');
    await page.goto('http://localhost:5174/hero-banners');
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: '/tmp/hero-banners-page.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/hero-banners-page.png');

    // Get page content
    const bodyText = await page.textContent('body');
    console.log(`📝 Body contains text: ${bodyText.length} characters`);

    // Extract visible text
    const allText = await page.evaluate(() => {
      return document.body.innerText;
    });

    console.log('📝 Visible text on Hero Banners page:');
    console.log('═'.repeat(70));
    console.log(allText.substring(0, 1000));
    console.log('═'.repeat(70));

    console.log(`📊 Total errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // Check if page is truly blank
    if (bodyText.length < 100) {
      console.log('⚠️  WARNING: Hero Banners page appears to be blank or nearly blank!');
    } else {
      console.log('✅ Hero Banners page has content');
    }
  });
});
