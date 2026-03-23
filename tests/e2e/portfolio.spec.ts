import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Portfolio E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage and display correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Enzo Morello/i);
  });

  test('should navigate to projects page and filter projects', async ({ page }) => {
    // Open menu if on mobile
    const menuBtn = page.getByRole('button', { name: /menu/i });
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
    }

    const projectsLink = page.locator('nav a[href="/projets"]').first();
    await projectsLink.click();
    await expect(page).toHaveURL(/.*\/projets/);

    // Check if project cards are visible
    const projectCards = page.locator('.project-card');
    await expect(projectCards.first()).toBeVisible();

    // Try a filter if it exists
    const reactFilter = page.getByRole('button', { name: /react/i }).first();
    if (await reactFilter.isVisible()) {
      await reactFilter.click();
      // Ensure only filtered projects are shown (this depends on your implementation)
      // For now, just ensure it doesn't crash
      await expect(projectCards.first()).toBeVisible();
    }
  });

  test('contact form submission journey', async ({ page }) => {
    // Go to home (where contact form usually is)
    await page.goto('/');
    
    // Scroll to contact section
    const contactSection = page.locator('#contact');
    if (await contactSection.count() > 0) {
      await contactSection.scrollIntoViewIfNeeded();
    }

    // Fill the form
    // Note: labels might be in French or English depending on detected locale, 
    // so we use placeholder or name attribute if available
    await page.locator('input[name="name"]').fill('E2E Tester');
    await page.locator('input[name="email"]').fill('e2e@test.com');
    await page.locator('textarea[name="message"]').fill('This is a message from the automated E2E test suite.');

    // We don't actually click submit in E2E to avoid spamming the real endpoint, 
    // unless we mock the API response.
    // Let's at least check the button is there.
    const submitBtn = page.getByRole('button', { name: /envoyer|send/i });
    await expect(submitBtn).toBeEnabled();
  });

  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    // Check multiple pages for a11y
    const pages = ['/', '/projets', '/about'];
    for (const path of pages) {
      await page.goto(path);
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('visual regression test of the homepage', async ({ page }) => {
    // Wait for animations to settle
    await page.waitForTimeout(2000);
    await expect(page).toHaveScreenshot('homepage.png', { maxDiffPixelRatio: 0.1 });
  });
});
