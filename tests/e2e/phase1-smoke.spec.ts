import { test, expect } from '@playwright/test';

// Smoke coverage for the Phase 1 meta / i18n / PWA changes. The music-player i18n
// has no unit test (legacy non-React class), so this is its behavioural check.
test.describe('Phase 1 — meta, i18n, PWA polish', () => {
  test('noscript fallback is present in the served HTML', async ({ page }) => {
    const res = await page.goto('/');
    const html = (await res?.text()) ?? '';
    expect(html).toContain('<noscript>');
    expect(html).toContain('Enzo Morello');
  });

  test('theme-color meta is a real color (dynamic, set from mood)', async ({ page }) => {
    await page.goto('/');
    const theme = await page.locator('meta[name="theme-color"]').getAttribute('content');
    // MoodContext updates it on mount; should be a hex color, not empty / a raw token.
    expect(theme).toMatch(/^#[0-9a-fA-F]{3,8}$/);
  });

  test('music player renders with translated aria-labels (no raw i18n keys)', async ({ page }) => {
    await page.goto('/');
    const playBtn = page.locator('#play-pause-btn');
    await expect(playBtn).toBeVisible({ timeout: 20000 });
    const labels = await Promise.all(
      ['#play-pause-btn', '#next-btn', '#mute-btn', '#queue-btn'].map((sel) =>
        page.locator(sel).getAttribute('aria-label')
      )
    );
    for (const label of labels) {
      expect(label, 'aria-label should be set').toBeTruthy();
      expect(label, 'aria-label should not be a raw i18n key').not.toContain('musicPlayer.');
    }
    await page.screenshot({ path: 'test-results/phase1-home.png', fullPage: false });
  });

  test('back-to-top button exposes a translated aria-label', async ({ page }) => {
    await page.goto('/');
    const aria = await page.locator('#back-to-top').getAttribute('aria-label');
    expect(aria).toBeTruthy();
    expect(aria).not.toContain('backToTop.');
  });
});
