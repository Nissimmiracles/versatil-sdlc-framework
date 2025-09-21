import { test, expect } from '@playwright/test';

/**
 * VERSATIL SDLC Framework - Visual Regression Testing
 * Enhanced Maria-QA Visual Testing with Chrome MCP
 */

test.describe('Visual Regression Testing - Enhanced Maria-QA', () => {
  const viewports = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should maintain visual consistency on ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      // Wait for page to stabilize
      await page.waitForLoadState('networkidle');

      // Disable animations for consistent screenshots
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
          }
        `
      });

      // Take screenshot for comparison
      await expect(page).toHaveScreenshot(`homepage-${name}.png`, {
        fullPage: true,
        threshold: 0.1,
        maxDiffPixels: 100
      });
    });
  });

  test('should detect visual regressions in components', async ({ page }) => {
    await page.goto('/');

    // Test individual components
    const components = [
      { selector: 'header', name: 'header' },
      { selector: 'nav', name: 'navigation' },
      { selector: 'main', name: 'main-content' },
      { selector: 'footer', name: 'footer' }
    ];

    for (const component of components) {
      const element = page.locator(component.selector);
      if (await element.count() > 0) {
        await expect(element).toHaveScreenshot(`${component.name}.png`, {
          threshold: 0.05
        });
      }
    }
  });
});