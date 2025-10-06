import { test, expect } from '@playwright/test';

/**
 * VERSATIL SDLC Framework - Performance Monitoring
 * Enhanced Maria-QA Performance Testing with Chrome MCP
 */

test.describe('Performance Monitoring - Enhanced Maria-QA', () => {
  test('should meet Core Web Vitals standards', async ({ page }) => {
    // Navigate to page with performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });

    // Capture performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const navigation = entries.find(entry => entry.entryType === 'navigation') as PerformanceNavigationTiming;
          const paint = entries.filter(entry => entry.entryType === 'paint');

          resolve({
            // Navigation timing
            domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
            loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,

            // Paint timing
            firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
            firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
          });
        }).observe({ entryTypes: ['navigation', 'paint'] });

        // Fallback timeout
        setTimeout(() => resolve(null), 5000);
      });
    });

    if (performanceMetrics) {
      // OPERA performance standards
      expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1800); // < 1.8s
      expect(performanceMetrics.domContentLoaded).toBeLessThan(2000); // < 2s
    }
  });

  test('should monitor resource loading performance', async ({ page }) => {
    await page.goto('/');

    // Monitor resource loading
    const resourceMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return resources.reduce((acc, resource) => {
        const type = resource.initiatorType;
        acc[type] = acc[type] || { count: 0, totalSize: 0, avgDuration: 0 };
        acc[type].count++;
        acc[type].totalSize += resource.transferSize || 0;
        acc[type].avgDuration += resource.duration;
        return acc;
      }, {} as Record<string, { count: number; totalSize: number; avgDuration: number }>);
    });

    // Validate resource performance budgets
    if (resourceMetrics.script) {
      expect(resourceMetrics.script.totalSize).toBeLessThan(500 * 1024); // < 500KB JS
    }

    if (resourceMetrics.css) {
      expect(resourceMetrics.css.totalSize).toBeLessThan(150 * 1024); // < 150KB CSS
    }
  });

  test('should validate memory usage patterns', async ({ page }) => {
    await page.goto('/');

    // Monitor memory usage
    const memoryInfo = await page.evaluate(() => {
      // @ts-ignore - performance.memory is Chrome-specific
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null;
    });

    if (memoryInfo) {
      // Memory usage should be reasonable
      const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      expect(memoryUsageMB).toBeLessThan(50); // < 50MB for basic pages
    }
  });
});