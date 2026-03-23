import { test, expect } from '@playwright/test';

test.describe('Performance Thresholds', () => {
  test('should meet basic performance metrics', async ({ page }) => {
    await page.goto('/');
    
    // Performance timing metrics
    const performanceTiming = await page.evaluate(() => {
      const { loadEventEnd, navigationStart } = window.performance.timing;
      return loadEventEnd - navigationStart;
    });
    
    // Ensure page loads in reasonable time (e.g., under 5 seconds for local build)
    expect(performanceTiming).toBeLessThan(5000);

    // Check for large cumulative layout shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            // @ts-ignore
            if (!entry.hadRecentInput) {
              // @ts-ignore
              clsValue += entry.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Wait a bit to capture shifts
        setTimeout(() => resolve(clsValue), 2000);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });

  test('bundle size sanity check', async ({ page }) => {
    const responses: any[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.endsWith('.js') || url.endsWith('.css')) {
        responses.push(response);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    for (const response of responses) {
      const size = (await response.body()).length;
      const url = response.url();
      
      // No single asset should be over 1MB (compressed usually, but we check raw body here)
      // This is a loose budget but helps catch accidental huge imports.
      if (!url.includes('node_modules')) {
         expect(size, `Asset ${url} is too large: ${size} bytes`).toBeLessThan(1024 * 1024);
      }
    }
  });
});
