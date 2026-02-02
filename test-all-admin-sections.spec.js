import { test, expect } from '@playwright/test';

test.describe('Admin Panel - All Sections Accessibility Test', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Login and verify all 18 admin sections are accessible', async ({ page }) => {
    console.log('🔍 Testing all admin panel sections...');

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

    // Login
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
    await page.waitForTimeout(3000);

    // Define all admin sections
    const sections = [
      { name: 'Dashboard', url: '/dashboard', path: '/dashboard' },
      { name: 'News', url: '/content/news', path: '/content/news' },
      { name: 'Hero Banners', url: '/content/hero-banners', path: '/content/hero-banners' },
      { name: 'Announcements', url: '/content/announcements', path: '/content/announcements' },
      { name: 'Press Releases', url: '/content/press-releases', path: '/content/press-releases' },
      { name: 'Events', url: '/content/events', path: '/content/events' },
      { name: 'Leaders', url: '/content/leaders', path: '/content/leaders' },
      { name: 'Services', url: '/content/services', path: '/content/services' },
      { name: 'Projects', url: '/content/projects', path: '/content/projects' },
      { name: 'MDAs', url: '/content/mdas', path: '/content/mdas' },
      { name: 'LGAs', url: '/content/lgas', path: '/content/lgas' },
      { name: 'Media', url: '/content/media', path: '/content/media' },
      { name: 'Quick Links', url: '/content/quick-links', path: '/content/quick-links' },
      { name: 'Pages', url: '/content/pages', path: '/content/pages' },
      { name: 'FAQs', url: '/content/faqs', path: '/content/faqs' },
      { name: 'Contacts', url: '/content/contacts', path: '/content/contacts' },
      { name: 'Subscribers', url: '/content/subscribers', path: '/content/subscribers' },
      { name: 'Users', url: '/content/users', path: '/content/users' },
    ];

    console.log('\n📋 Testing all 18 admin sections:\n');
    console.log('═'.repeat(80));

    const results = [];

    for (const section of sections) {
      console.log(`\n🔍 Testing: ${section.name}`);

      try {
        // Navigate to section
        await page.goto(`http://localhost:5174${section.url}`);
        await page.waitForTimeout(3000);

        // Check if page loaded
        const bodyText = await page.textContent('body');
        const hasContent = bodyText.length > 100;

        // Check for loading spinners (indicates infinite loading)
        const hasLoadingSpinner = await page.locator('.animate-spin').count();

        // Check for error messages
        const hasErrorMessage = bodyText.toLowerCase().includes('error') &&
                               bodyText.toLowerCase().includes('failed');

        // Determine status
        let status = '✅ WORKING';
        let issue = null;

        if (hasLoadingSpinner > 0) {
          status = '⚠️  INFINITE LOADING';
          issue = 'Page shows loading spinner indefinitely';
        } else if (hasErrorMessage) {
          status = '❌ ERROR';
          issue = 'Page shows error message';
        } else if (!hasContent) {
          status = '⚠️  BLANK PAGE';
          issue = 'Page appears to be blank or has minimal content';
        }

        results.push({
          name: section.name,
          status,
          issue,
          contentLength: bodyText.length,
        });

        console.log(`   Status: ${status}`);
        if (issue) {
          console.log(`   Issue: ${issue}`);
        }
        console.log(`   Content Length: ${bodyText.length} characters`);

      } catch (error) {
        console.log(`   Status: ❌ NAVIGATION ERROR`);
        console.log(`   Error: ${error.message}`);
        results.push({
          name: section.name,
          status: '❌ NAVIGATION ERROR',
          issue: error.message,
          contentLength: 0,
        });
      }
    }

    console.log('\n═'.repeat(80));
    console.log('\n📊 SUMMARY OF ALL ADMIN SECTIONS:\n');

    const working = results.filter(r => r.status === '✅ WORKING');
    const loading = results.filter(r => r.status === '⚠️  INFINITE LOADING');
    const blank = results.filter(r => r.status === '⚠️  BLANK PAGE');
    const errorPages = results.filter(r => r.status.includes('ERROR'));

    console.log(`✅ Working: ${working.length}/18`);
    console.log(`⚠️  Infinite Loading: ${loading.length}/18`);
    console.log(`⚠️  Blank Page: ${blank.length}/18`);
    console.log(`❌ Errors: ${errorPages.length}/18`);

    if (loading.length > 0) {
      console.log('\n⚠️  Pages with Infinite Loading:');
      loading.forEach(r => console.log(`   - ${r.name}: ${r.issue}`));
    }

    if (blank.length > 0) {
      console.log('\n⚠️  Blank Pages:');
      blank.forEach(r => console.log(`   - ${r.name}: ${r.issue}`));
    }

    if (errorPages.length > 0) {
      console.log('\n❌ Pages with Errors:');
      errorPages.forEach(r => console.log(`   - ${r.name}: ${r.issue}`));
    }

    console.log('\n═'.repeat(80));
    console.log(`\n📊 Total Console Errors During Test: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Unique Errors Found:');
      const uniqueErrors = [...new Set(errors)];
      uniqueErrors.forEach((err, i) => {
        console.log(`\n${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    // Save detailed report
    const report = {
      testDate: new Date().toISOString(),
      totalSections: 18,
      results,
      summary: {
        working: working.length,
        infiniteLoading: loading.length,
        blankPages: blank.length,
        errors: errorPages.length,
      },
      consoleErrors: errors.length,
    };

    console.log('\n📝 Writing detailed report to /tmp/admin-sections-report.json');
    await page.evaluate((data) => {
      console.log(JSON.stringify(data, null, 2));
    }, report);
  });
});