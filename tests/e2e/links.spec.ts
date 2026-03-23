import { test, expect } from '@playwright/test';

test.describe('Link Integrity Crawler', () => {
  const visited = new Set<string>();

  test('should crawl all internal links and check for broken paths', async ({ page }) => {
    const startUrl = '/';
    const queue = [startUrl];

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      if (visited.has(currentPath)) continue;
      visited.add(currentPath);

      // Navigate to current path
      const response = await page.goto(currentPath);
      expect(response?.status(), `Link broken: ${currentPath}`).toBeLessThan(400);

      // Collect all internal links
      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map(a => a.getAttribute('href'))
          .filter(href => href && (href.startsWith('/') || href.startsWith(window.location.origin)))
          .map(href => {
            if (href?.startsWith(window.location.origin)) {
              return href.replace(window.location.origin, '');
            }
            return href;
          })
          .filter(href => !href?.includes('#') && !href?.includes(':') && !href?.includes('?'));
      });

      for (const link of links) {
        if (!visited.has(link as string) && !queue.includes(link as string)) {
          queue.push(link as string);
        }
      }
      
      // Stop crawling if we've visited a lot of pages (sanity limit)
      if (visited.size > 20) break;
    }
    
    expect(visited.size).toBeGreaterThan(1);
  });
});
