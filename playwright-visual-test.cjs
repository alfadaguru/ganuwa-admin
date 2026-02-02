const { chromium } = require('playwright');

(async () => {
  console.log('📸 Visual Testing with Screenshots...\n');

  const browser = await chromium.launch({ headless: false }); // headless: false to see what's happening
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@kanostate.gov.ng');
    await page.fill('input[type="password"]', 'Admin@2025!ChangeMe');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✅ Logged in\n');

    // Test News page
    console.log('📰 Testing News page...');
    await page.goto('http://localhost:5173/content/news');
    await page.waitForTimeout(3000); // Wait longer

    const newsHeader = await page.locator('h1').textContent();
    console.log(`  Found header: "${newsHeader}"`);

    const hasTable = await page.locator('table').count();
    console.log(`  Has table: ${hasTable > 0}`);

    const hasAddButton = await page.locator('button:has-text("Add")').count();
    console.log(`  Has Add button: ${hasAddButton > 0}`);

    await page.screenshot({ path: '/tmp/news-page.png', fullPage: true });
    console.log('  📸 Screenshot saved: /tmp/news-page.png\n');

    // Test Users page
    console.log('👥 Testing Users page...');
    await page.goto('http://localhost:5173/content/users');
    await page.waitForTimeout(3000);

    const usersHeader = await page.locator('h1').textContent();
    console.log(`  Found header: "${usersHeader}"`);

    const hasUsersTable = await page.locator('table').count();
    console.log(`  Has table: ${hasUsersTable > 0}`);

    const hasRoleBadges = await page.locator('span:has-text("admin"), span:has-text("Admin")').count();
    console.log(`  Has role badges: ${hasRoleBadges > 0}`);

    await page.screenshot({ path: '/tmp/users-page.png', fullPage: true });
    console.log('  📸 Screenshot saved: /tmp/users-page.png\n');

    // Test Events page
    console.log('📅 Testing Events page...');
    await page.goto('http://localhost:5173/content/events');
    await page.waitForTimeout(3000);

    const eventsHeader = await page.locator('h1').textContent();
    console.log(`  Found header: "${eventsHeader}"`);

    const hasEventsTable = await page.locator('table').count();
    console.log(`  Has table: ${hasEventsTable > 0}`);

    await page.screenshot({ path: '/tmp/events-page.png', fullPage: true });
    console.log('  📸 Screenshot saved: /tmp/events-page.png\n');

    // Test clicking "Add User" button to see form
    console.log('🔍 Testing Add User Form...');
    await page.goto('http://localhost:5173/content/users');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Add User")');
    await page.waitForTimeout(1000);

    const modalVisible = await page.locator('div:has-text("Create User")').count();
    console.log(`  Modal opened: ${modalVisible > 0}`);

    const hasRoleDropdown = await page.locator('select, option:has-text("Viewer")').count();
    console.log(`  Has role dropdown: ${hasRoleDropdown > 0}`);

    await page.screenshot({ path: '/tmp/user-form.png', fullPage: true });
    console.log('  📸 Screenshot saved: /tmp/user-form.png\n');

    console.log('✅ Visual testing complete!');
    console.log('\n📁 Screenshots saved in /tmp/');
    console.log('  - /tmp/news-page.png');
    console.log('  - /tmp/users-page.png');
    console.log('  - /tmp/events-page.png');
    console.log('  - /tmp/user-form.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
