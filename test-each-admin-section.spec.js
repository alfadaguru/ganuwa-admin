import { test, expect } from '@playwright/test';

const sections = [
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'News', url: '/content/news' },
  { name: 'Hero Banners', url: '/content/hero-banners' },
  { name: 'Announcements', url: '/content/announcements' },
  { name: 'Press Releases', url: '/content/press-releases' },
  { name: 'Events', url: '/content/events' },
  { name: 'Leaders', url: '/content/leaders' },
  { name: 'Services', url: '/content/services' },
  { name: 'Projects', url: '/content/projects' },
  { name: 'MDAs', url: '/content/mdas' },
  { name: 'LGAs', url: '/content/lgas' },
  { name: 'Media', url: '/content/media' },
  { name: 'Quick Links', url: '/content/quick-links' },
  { name: 'Pages', url: '/content/pages' },
  { name: 'FAQs', url: '/content/faqs' },
  { name: 'Contacts', url: '/content/contacts' },
  { name: 'Subscribers', url: '/content/subscribers' },
  { name: 'Users', url: '/content/users' },
];

test.describe('Admin Panel - Individual Section Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for data-heavy pages
    page.setDefaultTimeout(60000);

    // Login once before each test
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

    // Wait for login to complete
    await page.waitForTimeout(3000);
  });

  for (const section of sections) {
    test(`${section.name} - should load without errors`, async ({ page }) => {
      console.log(`\n🔍 Testing: ${section.name}`);

      // Track errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      // Navigate to section
      await page.goto(`http://localhost:5174${section.url}`);

      // Wait for content to load (increased timeout)
      await page.waitForTimeout(5000);

      // Check if page loaded
      const bodyText = await page.textContent('body');
      const hasContent = bodyText.length > 100;

      // Check for loading spinners
      const loadingSpinners = await page.locator('.animate-spin').count();

      // Check for error messages
      const hasErrorMessage = bodyText.toLowerCase().includes('error') &&
                             bodyText.toLowerCase().includes('failed');

      // Log results
      console.log(`   Content Length: ${bodyText.length} characters`);
      console.log(`   Loading Spinners: ${loadingSpinners}`);
      console.log(`   Console Errors: ${errors.length}`);

      if (errors.length > 0) {
        console.log(`   ❌ Errors found:`);
        errors.slice(0, 3).forEach((err, i) => {
          console.log(`      ${i + 1}. ${err.substring(0, 100)}`);
        });
      }

      // Assertions
      expect(hasContent, `${section.name} page should have content`).toBeTruthy();
      expect(loadingSpinners, `${section.name} should not have infinite loading spinners`).toBe(0);
      expect(errors.length, `${section.name} should not have console errors`).toBe(0);
      expect(hasErrorMessage, `${section.name} should not show error messages`).toBeFalsy();

      console.log(`   ✅ ${section.name} passed all checks`);
    });
  }
});
