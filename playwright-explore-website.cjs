const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Exploring kano-state-website structure...\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to http://localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('✅ Website loaded\n');

    // Get page title
    const title = await page.title();
    console.log(`📄 Page Title: ${title}\n`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/website-homepage.png', fullPage: true });
    console.log('📸 Homepage screenshot: /tmp/website-homepage.png\n');

    // Find all navigation links
    console.log('🔗 Navigation Links:');
    const navLinks = await page.$$eval('nav a, header a', links =>
      links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href')
      })).filter(link => link.text && link.href)
    );

    navLinks.forEach((link, i) => {
      console.log(`   ${i + 1}. ${link.text} → ${link.href}`);
    });

    console.log('\n');

    // Check for news section
    console.log('📰 Looking for News section...');
    const newsLinks = await page.$$eval('a[href*="news"], a[href*="blog"]', links =>
      links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    if (newsLinks.length > 0) {
      console.log('   Found news links:', newsLinks);
    } else {
      console.log('   No news links found');
    }

    // Check for events section
    console.log('\n📅 Looking for Events section...');
    const eventLinks = await page.$$eval('a[href*="event"]', links =>
      links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    if (eventLinks.length > 0) {
      console.log('   Found event links:', eventLinks);
    } else {
      console.log('   No event links found');
    }

    // Check for MDAs section
    console.log('\n🏛️  Looking for MDAs section...');
    const mdaLinks = await page.$$eval('a[href*="mda"], a[href*="ministries"], a[href*="agencies"]', links =>
      links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    if (mdaLinks.length > 0) {
      console.log('   Found MDA links:', mdaLinks);
    } else {
      console.log('   No MDA links found');
    }

    // Check for services section
    console.log('\n⚙️  Looking for Services section...');
    const serviceLinks = await page.$$eval('a[href*="service"]', links =>
      links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    if (serviceLinks.length > 0) {
      console.log('   Found service links:', serviceLinks);
    } else {
      console.log('   No service links found');
    }

    // Check for leaders/government section
    console.log('\n👥 Looking for Leaders/Government section...');
    const leaderLinks = await page.$$eval('a[href*="leader"], a[href*="government"], a[href*="governor"], a[href*="officials"]', links =>
      links.map(l => ({ text: l.textContent.trim(), href: l.getAttribute('href') }))
    );
    if (leaderLinks.length > 0) {
      console.log('   Found leader links:', leaderLinks);
    } else {
      console.log('   No leader links found');
    }

    // Get all unique routes from the page
    console.log('\n🗺️  All Unique Routes:');
    const allLinks = await page.$$eval('a', links =>
      [...new Set(links.map(l => l.getAttribute('href')).filter(h => h && h.startsWith('/')))]
    );
    allLinks.forEach((route, i) => {
      console.log(`   ${i + 1}. ${route}`);
    });

    console.log('\n⏳ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
})();