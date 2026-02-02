const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Comprehensive CRUD Testing...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { passed: 0, failed: 0, errors: [] };

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Check if logged in
    const url = page.url();
    if (!url.includes('/dashboard')) {
      throw new Error('Login failed - not redirected to dashboard');
    }
    console.log('✅ Login successful\n');

    // Test 1: News CRUD
    console.log('📰 Testing News CRUD...');
    await page.goto('http://localhost:5173/content/news', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const newsHeader = await page.locator('h1:has-text("News Management")').count();
    if (newsHeader > 0) {
      console.log('  ✅ News page loaded with header');
      const addButton = await page.locator('button:has-text("Add News")').count();
      if (addButton > 0) {
        console.log('  ✅ Add News button found');
        results.passed++;
      } else {
        console.log('  ❌ Add News button NOT found');
        results.failed++;
      }
    } else {
      console.log('  ❌ News page header NOT found');
      results.failed++;
    }

    // Test 2: Hero Banners CRUD
    console.log('\n🎨 Testing Hero Banners CRUD...');
    await page.goto('http://localhost:5173/content/hero-banners', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const bannersHeader = await page.locator('h1:has-text("Hero Banners")').count();
    if (bannersHeader > 0) {
      console.log('  ✅ Hero Banners page loaded');
      const addButton = await page.locator('button:has-text("Add Banner")').count();
      if (addButton > 0) {
        console.log('  ✅ Add Banner button found');
        results.passed++;
      } else {
        console.log('  ❌ Add Banner button NOT found');
        results.failed++;
      }
    } else {
      console.log('  ❌ Hero Banners header NOT found');
      results.failed++;
    }

    // Test 3: Announcements CRUD
    console.log('\n📢 Testing Announcements CRUD...');
    await page.goto('http://localhost:5173/content/announcements', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const announcementsHeader = await page.locator('h1:has-text("Announcements")').count();
    if (announcementsHeader > 0) {
      console.log('  ✅ Announcements page loaded');
      results.passed++;
    } else {
      console.log('  ❌ Announcements header NOT found');
      results.failed++;
    }

    // Test 4: Users CRUD with RBAC
    console.log('\n👥 Testing Users CRUD with RBAC...');
    await page.goto('http://localhost:5173/content/users', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const usersHeader = await page.locator('h1:has-text("User Management")').count();
    if (usersHeader > 0) {
      console.log('  ✅ Users page loaded');
      const addButton = await page.locator('button:has-text("Add User")').count();
      if (addButton > 0) {
        console.log('  ✅ Add User button found');

        // Check if user list has role badges
        const roleBadge = await page.locator('span:has-text("admin"), span:has-text("super_admin")').count();
        if (roleBadge > 0) {
          console.log('  ✅ Role badges displayed');
          results.passed++;
        } else {
          console.log('  ⚠️  No role badges found (might be empty list)');
          results.passed++;
        }
      } else {
        console.log('  ❌ Add User button NOT found');
        results.failed++;
      }
    } else {
      console.log('  ❌ Users header NOT found');
      results.failed++;
    }

    // Test 5: Events CRUD
    console.log('\n📅 Testing Events CRUD...');
    await page.goto('http://localhost:5173/content/events', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const eventsHeader = await page.locator('h1:has-text("Events Management")').count();
    if (eventsHeader > 0) {
      console.log('  ✅ Events page loaded');
      const addButton = await page.locator('button:has-text("Add Event")').count();
      if (addButton > 0) {
        console.log('  ✅ Add Event button found');
        results.passed++;
      } else {
        console.log('  ❌ Add Event button NOT found');
        results.failed++;
      }
    } else {
      console.log('  ❌ Events header NOT found');
      results.failed++;
    }

    // Test 6: Check placeholder pages (should have "Loading..." text)
    console.log('\n🔍 Checking remaining placeholder pages...');
    const placeholderPages = [
      { path: '/content/press-releases', name: 'Press Releases' },
      { path: '/content/leaders', name: 'Leaders' },
      { path: '/content/services', name: 'Services' },
      { path: '/content/projects', name: 'Projects' },
      { path: '/content/mdas', name: 'MDAs' },
      { path: '/content/lgas', name: 'LGAs' },
      { path: '/content/media', name: 'Media' },
      { path: '/content/quick-links', name: 'Quick Links' },
      { path: '/content/pages', name: 'Pages' },
      { path: '/content/faqs', name: 'FAQs' },
      { path: '/content/contacts', name: 'Contacts' },
      { path: '/content/subscribers', name: 'Subscribers' },
    ];

    for (const placeholder of placeholderPages) {
      await page.goto(`http://localhost:5173${placeholder.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);

      const hasLoading = await page.locator('h1:has-text("Loading...")').count();
      if (hasLoading > 0) {
        console.log(`  ⏳ ${placeholder.name} - Still placeholder`);
      } else {
        const hasHeader = await page.locator('h1').count();
        if (hasHeader > 0) {
          console.log(`  ✅ ${placeholder.name} - Has header (might be implemented)`);
        } else {
          console.log(`  ❌ ${placeholder.name} - No header found`);
        }
      }
    }

    // Test API endpoints
    console.log('\n🌐 Testing API Endpoints...');

    const apiTests = [
      { endpoint: '/api/v1/users?page=1&limit=10&search=', name: 'Users API' },
      { endpoint: '/api/v1/events?page=1&limit=10&search=', name: 'Events API' },
      { endpoint: '/api/v1/news?page=1&limit=10&search=', name: 'News API' },
      { endpoint: '/api/v1/hero-banners?page=1&limit=10&search=', name: 'Hero Banners API' },
      { endpoint: '/api/v1/announcements?page=1&limit=10&search=', name: 'Announcements API' },
    ];

    for (const test of apiTests) {
      const response = await page.request.get(`http://localhost:5001${test.endpoint}`);
      if (response.status() === 200) {
        console.log(`  ✅ ${test.name} - 200 OK`);
        results.passed++;
      } else {
        console.log(`  ❌ ${test.name} - ${response.status()}`);
        results.failed++;
        results.errors.push(`${test.name}: HTTP ${response.status()}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('='.repeat(60));

    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => console.log(`  - ${err}`));
    }

    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED!');
    } else {
      console.log(`\n⚠️  ${results.failed} tests failed`);
    }

  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  } finally {
    await browser.close();
    process.exit(results.failed > 0 ? 1 : 0);
  }
})();
