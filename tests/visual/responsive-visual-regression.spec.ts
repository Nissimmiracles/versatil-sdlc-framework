/**
 * Responsive Visual Regression Tests
 *
 * Percy visual regression testing for responsive layouts
 * Tests page layouts at different breakpoints and orientations
 *
 * Run: npx percy exec -- npx playwright test tests/visual/responsive-visual-regression.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createPercyHelper, RESPONSIVE_WIDTHS } from '../utils/percy-helpers.js';

test.describe('Responsive Visual Regression Tests', () => {
  test('Homepage - All Breakpoints', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // Test homepage at all responsive breakpoints
    await percy.snapshotResponsive('Homepage');
  });

  test('Homepage - Light and Dark Themes at Breakpoints', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // Light theme at all breakpoints
    await percy.setTheme('light');
    for (const [name, width] of Object.entries(RESPONSIVE_WIDTHS)) {
      await percy.snapshotAtViewport(`Homepage - Light - ${name}`, width, 1024);
    }

    // Dark theme at all breakpoints
    await percy.setTheme('dark');
    for (const [name, width] of Object.entries(RESPONSIVE_WIDTHS)) {
      await percy.snapshotAtViewport(`Homepage - Dark - ${name}`, width, 1024);
    }
  });

  test('Dashboard - Responsive Layout', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/dashboard');
    await percy.waitForSnapshotReady();

    // Desktop view (full sidebar)
    await percy.snapshotAtViewport('Dashboard - Desktop', 1920, 1080);

    // Tablet view (collapsed sidebar)
    await percy.snapshotAtViewport('Dashboard - Tablet', 768, 1024);

    // Mobile view (hamburger menu)
    await percy.snapshotAtViewport('Dashboard - Mobile', 375, 667);
  });

  test('Dashboard - Sidebar States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/dashboard');
    await percy.waitForSnapshotReady();

    // Sidebar expanded
    await percy.snapshot('Dashboard - Sidebar Expanded');

    // Sidebar collapsed
    await page.click('[data-testid="sidebar-toggle"]');
    await page.waitForTimeout(300); // Wait for animation
    await percy.freezeAnimations();
    await percy.snapshot('Dashboard - Sidebar Collapsed');

    // Mobile menu open
    await percy.snapshotAtViewport('Dashboard - Mobile Menu', 375, 667);
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForTimeout(300);
    await percy.freezeAnimations();
    await percy.snapshot('Dashboard - Mobile Menu Open');
  });

  test('Grid Layout - Responsive Columns', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/grid');
    await percy.waitForSnapshotReady();

    // 4 columns (desktop large)
    await percy.snapshotAtViewport('Grid - 4 Columns', 1920, 1080);

    // 3 columns (desktop)
    await percy.snapshotAtViewport('Grid - 3 Columns', 1024, 768);

    // 2 columns (tablet)
    await percy.snapshotAtViewport('Grid - 2 Columns', 768, 1024);

    // 1 column (mobile)
    await percy.snapshotAtViewport('Grid - 1 Column', 375, 667);
  });

  test('Form Layout - Responsive Stacking', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/forms/contact');
    await percy.waitForSnapshotReady();

    // Desktop: side-by-side fields
    await percy.snapshotAtViewport('Contact Form - Desktop', 1024, 768);

    // Tablet: stacked fields
    await percy.snapshotAtViewport('Contact Form - Tablet', 768, 1024);

    // Mobile: full-width fields
    await percy.snapshotAtViewport('Contact Form - Mobile', 375, 667);
  });

  test('Navigation - Responsive Behavior', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // Desktop: full navigation
    await percy.snapshotAtViewport('Navigation - Desktop', 1920, 1080);

    // Tablet: condensed navigation
    await percy.snapshotAtViewport('Navigation - Tablet', 768, 1024);

    // Mobile: hamburger menu closed
    await percy.snapshotAtViewport('Navigation - Mobile Closed', 375, 667);

    // Mobile: hamburger menu open
    await page.setViewportSize({ width: 375, height: 667 });
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.waitForTimeout(300);
    await percy.freezeAnimations();
    await percy.snapshot('Navigation - Mobile Open', { widths: [375] });
  });

  test('Data Table - Responsive Modes', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/tables/data');
    await percy.waitForSnapshotReady();

    // Desktop: full table
    await percy.snapshotAtViewport('Data Table - Desktop', 1920, 1080);

    // Tablet: horizontal scroll
    await percy.snapshotAtViewport('Data Table - Tablet', 768, 1024);

    // Mobile: card layout
    await percy.snapshotAtViewport('Data Table - Mobile', 375, 667);
  });

  test('Product Card Grid - Responsive', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/products');
    await percy.waitForSnapshotReady();

    // 4 cards per row (desktop)
    await percy.snapshotAtViewport('Product Grid - 4 Cards', 1920, 1080);

    // 3 cards per row (desktop small)
    await percy.snapshotAtViewport('Product Grid - 3 Cards', 1024, 768);

    // 2 cards per row (tablet)
    await percy.snapshotAtViewport('Product Grid - 2 Cards', 768, 1024);

    // 1 card per row (mobile)
    await percy.snapshotAtViewport('Product Grid - 1 Card', 375, 667);
  });

  test('Footer - Responsive Layout', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await percy.waitForSnapshotReady();

    // Desktop: multi-column footer
    await percy.snapshotComponent('Footer - Desktop', 'footer', {
      widths: [1920]
    });

    // Tablet: 2-column footer
    await percy.snapshotComponent('Footer - Tablet', 'footer', {
      widths: [768]
    });

    // Mobile: stacked footer
    await percy.snapshotComponent('Footer - Mobile', 'footer', {
      widths: [375]
    });
  });

  test('Hero Section - Responsive Images', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // Test hero section at different breakpoints
    await percy.snapshotComponent('Hero Section', '[data-testid="hero-section"]', {
      widths: Object.values(RESPONSIVE_WIDTHS)
    });
  });

  test('Pricing Page - Responsive Cards', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/pricing');
    await percy.waitForSnapshotReady();

    // Desktop: 3 pricing tiers side-by-side
    await percy.snapshotAtViewport('Pricing - Desktop', 1920, 1080);

    // Tablet: 3 pricing tiers (smaller)
    await percy.snapshotAtViewport('Pricing - Tablet', 768, 1024);

    // Mobile: stacked pricing tiers
    await percy.snapshotAtViewport('Pricing - Mobile', 375, 667);
  });

  test('Search Results - Responsive Grid', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/search?q=test');
    await percy.waitForSnapshotReady();

    // Test search results at all breakpoints
    await percy.snapshotResponsive('Search Results');
  });

  test('Profile Page - Responsive Layout', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/profile');
    await percy.waitForSnapshotReady();

    // Desktop: sidebar + content
    await percy.snapshotAtViewport('Profile - Desktop', 1920, 1080);

    // Tablet: stacked layout
    await percy.snapshotAtViewport('Profile - Tablet', 768, 1024);

    // Mobile: full-width content
    await percy.snapshotAtViewport('Profile - Mobile', 375, 667);
  });

  test('Settings Page - Responsive Forms', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/settings');
    await percy.waitForSnapshotReady();

    // Desktop: two-column settings
    await percy.snapshotAtViewport('Settings - Desktop', 1920, 1080);

    // Tablet: single-column settings
    await percy.snapshotAtViewport('Settings - Tablet', 768, 1024);

    // Mobile: compact settings
    await percy.snapshotAtViewport('Settings - Mobile', 375, 667);
  });

  test('Image Gallery - Responsive Grid', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/gallery');
    await percy.waitForSnapshotReady();

    // 4 images per row (desktop)
    await percy.snapshotAtViewport('Gallery - 4 Images', 1920, 1080);

    // 3 images per row (tablet)
    await percy.snapshotAtViewport('Gallery - 3 Images', 1024, 768);

    // 2 images per row (tablet small)
    await percy.snapshotAtViewport('Gallery - 2 Images', 768, 1024);

    // 1 image per row (mobile)
    await percy.snapshotAtViewport('Gallery - 1 Image', 375, 667);
  });

  test('Blog Post - Responsive Typography', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/blog/sample-post');
    await percy.waitForSnapshotReady();

    // Test blog post typography at different breakpoints
    await percy.snapshotResponsive('Blog Post');
  });

  test('404 Page - Responsive', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/404');
    await percy.waitForSnapshotReady();

    // Test 404 page at all breakpoints
    await percy.snapshotResponsive('404 Page');
  });

  test('Loading States - Responsive', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/loading');
    await percy.freezeAnimations();

    // Test loading states at different breakpoints
    await percy.snapshotResponsive('Loading State');
  });

  test('Empty States - Responsive', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/empty');
    await percy.waitForSnapshotReady();

    // Test empty states at different breakpoints
    await percy.snapshotResponsive('Empty State');
  });

  test('Landscape Orientation - Tablet', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // iPad landscape
    await percy.snapshotAtViewport('Homepage - iPad Landscape', 1024, 768);

    // iPad portrait
    await percy.snapshotAtViewport('Homepage - iPad Portrait', 768, 1024);
  });

  test('Landscape Orientation - Mobile', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000');
    await percy.waitForSnapshotReady();

    // iPhone landscape
    await percy.snapshotAtViewport('Homepage - iPhone Landscape', 667, 375);

    // iPhone portrait
    await percy.snapshotAtViewport('Homepage - iPhone Portrait', 375, 667);
  });
});
