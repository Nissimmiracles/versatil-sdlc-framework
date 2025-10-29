/**
 * Context-Aware User Flow Validation Tests
 *
 * Validates that frontend components fit user story context needs:
 * - Visual design matches mockups
 * - Interactions work as expected
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Performance meets standards
 *
 * @version 1.0.0
 * @since v7.14.0
 */

import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuration
const CONTEXT_DIR = path.join(process.cwd(), '.versatil', 'context');
const USER_STORIES_PATH = path.join(CONTEXT_DIR, 'user-stories.json');
const VISUAL_BASELINES_DIR = path.join(process.cwd(), 'tests', 'visual-baselines');

interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  components: string[];
  route?: string;
  mockupUrl?: string;
}

/**
 * Load user stories from context
 */
async function loadUserStories(): Promise<UserStory[]> {
  try {
    const content = await fs.readFile(USER_STORIES_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.warn('No user stories found, using default test flows');
    return [];
  }
}

/**
 * Capture console and network errors for debugging
 */
function capturePageErrors(page: Page): {
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
} {
  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number }[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  return { consoleErrors, networkErrors };
}

test.describe('Context-Aware User Flow Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Inject axe for accessibility testing
    await injectAxe(page);
  });

  test('should validate homepage user flow', async ({ page }) => {
    const errors = capturePageErrors(page);

    // Navigate to homepage
    await page.goto('/');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Visual validation: Take screenshot for comparison
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });

    // Interaction validation: Check critical UI elements exist
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Accessibility validation
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true
      }
    });

    // Performance validation: Check Core Web Vitals
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0
      };
    });

    expect(performanceMetrics.loadTime).toBeLessThan(3000); // < 3s load time
    expect(performanceMetrics.domContentLoaded).toBeLessThan(1500); // < 1.5s DOMContentLoaded

    // Error validation: Should have no console/network errors
    expect(errors.consoleErrors).toHaveLength(0);
    expect(errors.networkErrors).toHaveLength(0);
  });

  test('should validate form submission flow', async ({ page }) => {
    const errors = capturePageErrors(page);

    await page.goto('/contact');

    // Fill form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a test message');

    // Visual validation: Form filled state
    await expect(page).toHaveScreenshot('contact-form-filled.png');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for submission (success message or redirect)
    await page.waitForSelector('[data-testid="success-message"], [data-testid="form-success"]', {
      timeout: 5000
    });

    // Validate success state
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible();

    // Accessibility check on success state
    await checkA11y(page);

    // Validate no errors occurred during submission
    expect(errors.consoleErrors).toHaveLength(0);
    expect(errors.networkErrors.filter(e => e.status >= 500)).toHaveLength(0);
  });

  test('should validate responsive design', async ({ page }) => {
    // Test multiple viewport sizes
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Visual snapshot for each viewport
      await expect(page).toHaveScreenshot(`homepage-${viewport.name}.png`);

      // Check critical elements are visible
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('main')).toBeVisible();

      // Accessibility check for each viewport
      await checkA11y(page);
    }
  });

  test('should validate keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Start from top of page
    await page.keyboard.press('Tab');

    // Check focus is visible
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).not.toBeNull();

    // Tab through interactive elements
    const tabCount = 10;
    for (let i = 0; i < tabCount; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    // Check focus indicator is visible (via CSS)
    const hasFocusIndicator = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;

      const styles = window.getComputedStyle(activeElement);
      return styles.outline !== 'none' || styles.boxShadow !== 'none';
    });

    expect(hasFocusIndicator).toBe(true);
  });

  test('should validate dark mode toggle', async ({ page }) => {
    await page.goto('/');

    // Check for theme toggle button
    const themeToggle = page.locator('[data-testid="theme-toggle"], [aria-label*="theme"]');
    await expect(themeToggle).toBeVisible();

    // Take screenshot of light mode
    await expect(page).toHaveScreenshot('theme-light.png');

    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(500); // Wait for theme transition

    // Take screenshot of dark mode
    await expect(page).toHaveScreenshot('theme-dark.png');

    // Check contrast ratio in dark mode (accessibility)
    await checkA11y(page, undefined, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });

    // Toggle back to light mode
    await themeToggle.click();
    await page.waitForTimeout(500);
  });
});

test.describe('Context-Aware Component Validation', () => {
  test('should validate Button component', async ({ page }) => {
    await page.goto('/components/button');

    // Variants testing
    const variants = ['primary', 'secondary', 'outline', 'ghost'];

    for (const variant of variants) {
      const button = page.locator(`[data-variant="${variant}"]`);
      await expect(button).toBeVisible();

      // Hover state
      await button.hover();
      await page.waitForTimeout(100);

      // Focus state
      await button.focus();
      await page.waitForTimeout(100);

      // Visual snapshot
      await expect(button).toHaveScreenshot(`button-${variant}.png`);
    }

    // Accessibility check
    await checkA11y(page);
  });

  test('should validate Form components', async ({ page }) => {
    await page.goto('/components/form');

    // Test input fields
    const inputs = ['text', 'email', 'password', 'number', 'tel'];

    for (const type of inputs) {
      const input = page.locator(`input[type="${type}"]`).first();
      await expect(input).toBeVisible();

      // Check label association
      const inputId = await input.getAttribute('id');
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }

      // Check ARIA attributes
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
    }

    // Accessibility check
    await checkA11y(page);
  });
});

test.describe('Dynamic User Story Validation', () => {
  test('should validate user stories from context', async ({ page }) => {
    const userStories = await loadUserStories();

    if (userStories.length === 0) {
      test.skip();
    }

    for (const story of userStories) {
      test(`User Story: ${story.title}`, async () => {
        const errors = capturePageErrors(page);

        // Navigate to story route
        if (story.route) {
          await page.goto(story.route);
          await page.waitForLoadState('networkidle');
        }

        // Validate components exist
        for (const component of story.components) {
          const element = page.locator(`[data-component="${component}"], [data-testid="${component}"]`);
          await expect(element).toBeVisible();
        }

        // Visual comparison with mockup
        if (story.mockupUrl) {
          await expect(page).toHaveScreenshot(`user-story-${story.id}.png`);
        }

        // Accessibility validation
        await checkA11y(page);

        // Validate acceptance criteria (if automated)
        for (const criterion of story.acceptanceCriteria) {
          // Check if criterion is testable
          if (criterion.includes('click') || criterion.includes('button')) {
            const button = page.locator('button').first();
            await expect(button).toBeVisible();
          }
        }

        // No errors should occur
        expect(errors.consoleErrors).toHaveLength(0);
      });
    }
  });
});
