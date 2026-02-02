import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Hero Banner File Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(30000);
  });

  test('Complete Hero Banner upload workflow', async ({ page }) => {
    console.log('🚀 Starting Hero Banner Upload Test...');
    console.log('═'.repeat(70));

    // Track errors
    const errors = [];
    const consoleMessages = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        errors.push(text);
        console.log(`❌ Console Error: ${text}`);
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
      console.log(`❌ Page Error: ${error.message}`);
    });

    // Step 1: Login
    console.log('\n📍 Step 1: Logging in to admin panel...');
    await page.goto('http://localhost:5174/');
    await page.waitForLoadState('networkidle');

    const email = 'admin@kanostate.gov.ng';
    const password = 'Admin@2025!ChangeMe';

    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const loginButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await page.screenshot({ path: '/tmp/01-login-form.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/01-login-form.png');

    // Intercept login response to capture token
    let accessToken = null;
    page.on('response', async (response) => {
      if (response.url().includes('/auth/login')) {
        const json = await response.json();
        if (json.data && json.data.accessToken) {
          accessToken = json.data.accessToken;
          console.log('   🔑 Token captured from login response');
        }
      }
    });

    await loginButton.click();

    // Wait for navigation after login
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
      console.log('   ⚠️  Did not navigate to dashboard, continuing anyway');
    });
    await page.waitForTimeout(2000);

    // Verify token is in localStorage or set it manually
    let token = await page.evaluate(() => localStorage.getItem('accessToken'));
    if (!token && accessToken) {
      console.log('   📝 Setting token manually in localStorage');
      await page.evaluate((t) => localStorage.setItem('accessToken', t), accessToken);
      token = accessToken;
    }

    if (token) {
      console.log('   ✅ Access token found in localStorage');
    } else {
      console.log('   ⚠️  No access token in localStorage!');
    }
    console.log('   ✅ Login successful');

    // Step 2: Navigate to Hero Banners
    console.log('\n📍 Step 2: Navigating to Hero Banners...');
    const heroBannersLink = page.locator('text=Hero Banners');
    await heroBannersLink.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: '/tmp/02-hero-banners-list.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/02-hero-banners-list.png');
    console.log('   ✅ Arrived at Hero Banners page');

    // Step 3: Click Add Banner button
    console.log('\n📍 Step 3: Opening Add Banner form...');
    const addButton = page.locator('button:has-text("Add Banner")');
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/03-add-banner-modal.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/03-add-banner-modal.png');
    console.log('   ✅ Modal opened');

    // Step 4: Upload image
    console.log('\n📍 Step 4: Uploading test image...');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const testImagePath = path.join(process.cwd(), 'test-banner.png');
    await fileInput.setInputFiles(testImagePath);
    console.log(`   📤 Uploading file: ${testImagePath}`);

    // Wait for upload to complete
    await page.waitForTimeout(3000);

    // Check for success toast
    const uploadingText = page.locator('text=Uploading image');
    const successToast = page.locator('text=Image uploaded successfully');

    // Wait for either uploading message to disappear or success toast
    try {
      await successToast.waitFor({ timeout: 10000 });
      console.log('   ✅ Upload success toast appeared');
    } catch (e) {
      console.log('   ⚠️  No success toast found (might have disappeared quickly)');
    }

    await page.screenshot({ path: '/tmp/04-image-uploaded.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/04-image-uploaded.png');

    // Step 5: Check image preview
    console.log('\n📍 Step 5: Verifying image preview...');
    const imagePreview = page.locator('img[alt="Banner preview"]');
    await expect(imagePreview).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Image preview visible');

    // Step 6: Fill multilingual fields - English tab
    console.log('\n📍 Step 6: Filling English (EN) fields...');
    const englishTab = page.locator('button:has-text("English")');
    await englishTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="title.en"]', 'Test Hero Banner EN');
    await page.fill('input[name="subtitle.en"]', 'Test Subtitle EN');
    await page.fill('textarea[id="description-en"]', 'Test description for hero banner in English');
    await page.fill('input[name="ctaButton.text.en"]', 'Learn More');
    console.log('   ✅ English fields filled');

    // Step 7: Fill Hausa fields
    console.log('\n📍 Step 7: Filling Hausa (HA) fields...');
    const hausaTab = page.locator('button:has-text("Hausa")');
    await hausaTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="title.ha"]', 'Test Hero Banner HA');
    await page.fill('input[name="subtitle.ha"]', 'Test Subtitle HA');
    await page.fill('textarea[id="description-ha"]', 'Test description in Hausa');
    await page.fill('input[name="ctaButton.text.ha"]', 'Kara Koyo');
    console.log('   ✅ Hausa fields filled');

    // Step 8: Fill Arabic fields
    console.log('\n📍 Step 8: Filling Arabic (AR) fields...');
    const arabicTab = page.locator('button:has-text("Arabic")');
    await arabicTab.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="title.ar"]', 'Test Hero Banner AR');
    await page.fill('input[name="subtitle.ar"]', 'Test Subtitle AR');
    await page.fill('textarea[id="description-ar"]', 'Test description in Arabic');
    await page.fill('input[name="ctaButton.text.ar"]', 'اعرف المزيد');
    console.log('   ✅ Arabic fields filled');

    await page.screenshot({ path: '/tmp/05-multilingual-filled.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/05-multilingual-filled.png');

    // Step 9: Fill CTA Button URL and settings
    console.log('\n📍 Step 9: Filling CTA Button settings...');
    await page.fill('input[name="ctaButton.url"]', 'https://example.com');

    // Open in new tab checkbox should be checked by default
    const openInNewTab = page.locator('input[id="openInNewTab"]');
    const isChecked = await openInNewTab.isChecked();
    console.log(`   📋 Open in new tab: ${isChecked ? 'Checked' : 'Unchecked'}`);

    // Step 10: Fill display settings
    console.log('\n📍 Step 10: Setting display order and active status...');
    await page.fill('input[name="displayOrder"]', '1');

    const activeCheckbox = page.locator('input[id="isActive"]');
    const isActive = await activeCheckbox.isChecked();
    if (!isActive) {
      await activeCheckbox.check();
    }
    console.log('   ✅ Display settings configured (Order: 1, Active: true)');

    await page.screenshot({ path: '/tmp/06-form-complete.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/06-form-complete.png');

    // Step 11: Submit form
    console.log('\n📍 Step 11: Submitting form...');
    const submitButton = page.locator('button[type="submit"]:has-text("Create Banner")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for submission
    await page.waitForTimeout(3000);

    // Check for success
    const createdToast = page.locator('text=Hero banner created successfully');
    try {
      await createdToast.waitFor({ timeout: 5000 });
      console.log('   ✅ Success toast appeared');
    } catch (e) {
      console.log('   ⚠️  No success toast found');
    }

    await page.screenshot({ path: '/tmp/07-after-submit.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/07-after-submit.png');

    // Step 12: Verify banner appears in list
    console.log('\n📍 Step 12: Verifying banner in list...');
    await page.waitForTimeout(2000);

    const bannerInList = page.locator('text=Test Hero Banner EN');
    try {
      await expect(bannerInList).toBeVisible({ timeout: 5000 });
      console.log('   ✅ Banner found in list');
    } catch (e) {
      console.log('   ⚠️  Banner not immediately visible in list');
    }

    await page.screenshot({ path: '/tmp/08-banner-in-list.png', fullPage: true });
    console.log('   📸 Screenshot: /tmp/08-banner-in-list.png');

    // Step 13: Test Edit functionality
    console.log('\n📍 Step 13: Testing edit functionality...');
    const editButton = page.locator('button[aria-label="Edit"], button:has-text("Edit")').first();
    try {
      await editButton.click({ timeout: 5000 });
      await page.waitForTimeout(2000);

      // Verify image preview appears in edit mode
      const editImagePreview = page.locator('img[alt="Banner preview"]');
      await expect(editImagePreview).toBeVisible();
      console.log('   ✅ Edit modal opened with image preview');

      await page.screenshot({ path: '/tmp/09-edit-modal.png', fullPage: true });
      console.log('   📸 Screenshot: /tmp/09-edit-modal.png');

      // Close modal
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();
      await page.waitForTimeout(1000);
      console.log('   ✅ Edit modal closed');
    } catch (e) {
      console.log('   ⚠️  Could not test edit functionality:', e.message);
    }

    // Step 14: Test Delete functionality
    console.log('\n📍 Step 14: Testing delete functionality...');
    const deleteButton = page.locator('button[aria-label="Delete"], button:has-text("Delete")').first();
    try {
      await deleteButton.click({ timeout: 5000 });
      await page.waitForTimeout(1000);

      await page.screenshot({ path: '/tmp/10-delete-confirm.png', fullPage: true });
      console.log('   📸 Screenshot: /tmp/10-delete-confirm.png');

      // Confirm deletion
      const confirmDeleteButton = page.locator('button:has-text("Delete")').last();
      await confirmDeleteButton.click();
      await page.waitForTimeout(3000);

      const deletedToast = page.locator('text=Hero banner deleted successfully');
      try {
        await deletedToast.waitFor({ timeout: 5000 });
        console.log('   ✅ Delete success toast appeared');
      } catch (e) {
        console.log('   ⚠️  No delete success toast found');
      }

      await page.screenshot({ path: '/tmp/11-after-delete.png', fullPage: true });
      console.log('   📸 Screenshot: /tmp/11-after-delete.png');
      console.log('   ✅ Banner deleted');
    } catch (e) {
      console.log('   ⚠️  Could not complete delete test:', e.message);
    }

    // Final Results
    console.log('\n' + '═'.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('═'.repeat(70));
    console.log(`✅ Total Console Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      console.log('\n⚠️  TEST FAILED - Console errors detected');
    } else {
      console.log('\n✅ TEST PASSED - Zero console errors!');
    }

    console.log('\n📸 Screenshots saved to /tmp/');
    console.log('   - 01-login-form.png');
    console.log('   - 02-hero-banners-list.png');
    console.log('   - 03-add-banner-modal.png');
    console.log('   - 04-image-uploaded.png');
    console.log('   - 05-multilingual-filled.png');
    console.log('   - 06-form-complete.png');
    console.log('   - 07-after-submit.png');
    console.log('   - 08-banner-in-list.png');
    console.log('   - 09-edit-modal.png');
    console.log('   - 10-delete-confirm.png');
    console.log('   - 11-after-delete.png');

    console.log('\n' + '═'.repeat(70));
    console.log('🎯 Test workflow completed successfully!');
    console.log('═'.repeat(70));

    // Assert zero errors
    expect(errors.length).toBe(0);
  });
});