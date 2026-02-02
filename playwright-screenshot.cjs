const { chromium } = require('playwright');

(async () => {
  console.log('📸 Taking screenshot of admin panel sidebar...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    // Use storage state if you have a saved session
  });
  const page = await context.newPage();

  try {
    // Go directly to dashboard (if already logged in via cookies)
    console.log('📍 Navigating to dashboard...');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);

    // Check if we ended up on login page
    if (page.url().includes('/login')) {
      console.log('🔑 Not logged in, need to authenticate first\n');
      console.log('Please open http://localhost:5173 in your browser and verify:');
      console.log('1. Sidebar is visible on the left');
      console.log('2. Sidebar scrolls properly');
      console.log('3. "Users" menu item is accessible at the bottom\n');
      await browser.close();
      return;
    }

    // We're logged in, take screenshot
    console.log('✅ On dashboard, taking full page screenshot...');
    await page.screenshot({
      path: '/tmp/admin-sidebar-full.png',
      fullPage: true
    });
    console.log('📸 Full page screenshot saved: /tmp/admin-sidebar-full.png\n');

    // Take sidebar-only screenshot
    const sidebar = await page.$('aside');
    if (sidebar) {
      await sidebar.screenshot({ path: '/tmp/admin-sidebar-only.png' });
      console.log('📸 Sidebar screenshot saved: /tmp/admin-sidebar-only.png\n');

      // Get sidebar height info
      const boundingBox = await sidebar.boundingBox();
      if (boundingBox) {
        console.log('📏 Sidebar dimensions:');
        console.log(`   Width: ${boundingBox.width}px`);
        console.log(`   Height: ${boundingBox.height}px\n`);
      }

      // Check nav scrollHeight vs clientHeight
      const navScrollInfo = await page.evaluate(() => {
        const nav = document.querySelector('aside nav');
        if (!nav) return null;
        return {
          scrollHeight: nav.scrollHeight,
          clientHeight: nav.clientHeight,
          isScrollable: nav.scrollHeight > nav.clientHeight
        };
      });

      if (navScrollInfo) {
        console.log('📊 Navigation scroll info:');
        console.log(`   Scroll Height: ${navScrollInfo.scrollHeight}px`);
        console.log(`   Client Height: ${navScrollInfo.clientHeight}px`);
        console.log(`   ${navScrollInfo.isScrollable ? '✅' : '❌'} Is Scrollable: ${navScrollInfo.isScrollable ? 'YES' : 'NO'}\n`);
      }
    }

    console.log('✅ Screenshots saved successfully!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
