/**
 * Percy Visual Regression Testing Helpers
 *
 * Utilities for Percy integration with Playwright tests
 * Supports component snapshots, responsive testing, and theme variations
 */

import { Page } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Percy snapshot configuration
 */
export interface PercySnapshotOptions {
  /**
   * Custom widths for responsive testing
   * Overrides default widths from .percy.yml
   */
  widths?: number[];

  /**
   * Minimum height for snapshot
   */
  minHeight?: number;

  /**
   * Enable JavaScript execution
   */
  enableJavaScript?: boolean;

  /**
   * Percy CSS to inject
   */
  percyCSS?: string;

  /**
   * Scope snapshot to specific element
   */
  scope?: string;

  /**
   * Wait for network idle before snapshot
   */
  waitForTimeout?: number;

  /**
   * Wait for specific selector before snapshot
   */
  waitForSelector?: string;
}

/**
 * Default responsive breakpoints
 */
export const RESPONSIVE_WIDTHS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  desktopLarge: 1920
};

/**
 * Theme variants for testing
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Component states for visual testing
 */
export type ComponentState = 'default' | 'hover' | 'focus' | 'active' | 'disabled' | 'error' | 'loading';

/**
 * Percy helper class for visual regression testing
 */
export class PercyHelper {
  constructor(private page: Page) {}

  /**
   * Take a Percy snapshot with default configuration
   */
  async snapshot(name: string, options?: PercySnapshotOptions): Promise<void> {
    // Wait for any animations to complete
    await this.page.waitForTimeout(100);

    // Wait for network idle
    if (options?.waitForTimeout) {
      await this.page.waitForTimeout(options.waitForTimeout);
    }

    // Wait for specific selector if provided
    if (options?.waitForSelector) {
      await this.page.waitForSelector(options.waitForSelector, { state: 'visible' });
    }

    // Take snapshot
    await percySnapshot(this.page, name, {
      widths: options?.widths,
      minHeight: options?.minHeight,
      enableJavaScript: options?.enableJavaScript,
      percyCSS: options?.percyCSS,
      scope: options?.scope
    });
  }

  /**
   * Take snapshots at all responsive breakpoints
   */
  async snapshotResponsive(name: string, options?: Omit<PercySnapshotOptions, 'widths'>): Promise<void> {
    await this.snapshot(name, {
      ...options,
      widths: Object.values(RESPONSIVE_WIDTHS)
    });
  }

  /**
   * Take snapshots in both light and dark themes
   */
  async snapshotThemes(name: string, options?: PercySnapshotOptions): Promise<void> {
    // Light theme
    await this.setTheme('light');
    await this.snapshot(`${name} - Light`, options);

    // Dark theme
    await this.setTheme('dark');
    await this.snapshot(`${name} - Dark`, options);

    // Reset to light theme
    await this.setTheme('light');
  }

  /**
   * Take snapshots of component in different states
   */
  async snapshotStates(
    name: string,
    selector: string,
    states: ComponentState[],
    options?: PercySnapshotOptions
  ): Promise<void> {
    for (const state of states) {
      await this.setComponentState(selector, state);
      await this.snapshot(`${name} - ${state}`, options);
    }

    // Reset to default state
    await this.setComponentState(selector, 'default');
  }

  /**
   * Take snapshot with specific viewport size
   */
  async snapshotAtViewport(
    name: string,
    width: number,
    height: number,
    options?: Omit<PercySnapshotOptions, 'widths'>
  ): Promise<void> {
    await this.page.setViewportSize({ width, height });
    await this.page.waitForTimeout(100); // Allow reflow
    await this.snapshot(name, { ...options, widths: [width] });
  }

  /**
   * Take snapshot of specific component
   */
  async snapshotComponent(
    name: string,
    selector: string,
    options?: Omit<PercySnapshotOptions, 'scope'>
  ): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible' });
    await this.snapshot(name, { ...options, scope: selector });
  }

  /**
   * Set theme mode (light/dark)
   */
  async setTheme(mode: ThemeMode): Promise<void> {
    await this.page.emulateMedia({ colorScheme: mode });
    await this.page.waitForTimeout(100); // Allow theme transition
  }

  /**
   * Set component state for testing
   */
  async setComponentState(selector: string, state: ComponentState): Promise<void> {
    const element = await this.page.locator(selector);

    switch (state) {
      case 'default':
        // Remove all state classes/attributes
        await element.evaluate((el) => {
          el.classList.remove('hover', 'focus', 'active', 'disabled', 'error', 'loading');
          el.removeAttribute('disabled');
          el.removeAttribute('aria-disabled');
        });
        break;

      case 'hover':
        await element.hover();
        break;

      case 'focus':
        await element.focus();
        break;

      case 'active':
        await element.evaluate((el) => {
          el.classList.add('active');
        });
        break;

      case 'disabled':
        await element.evaluate((el) => {
          el.setAttribute('disabled', 'true');
          el.setAttribute('aria-disabled', 'true');
        });
        break;

      case 'error':
        await element.evaluate((el) => {
          el.classList.add('error');
          el.setAttribute('aria-invalid', 'true');
        });
        break;

      case 'loading':
        await element.evaluate((el) => {
          el.classList.add('loading');
          el.setAttribute('aria-busy', 'true');
        });
        break;
    }

    await this.page.waitForTimeout(100); // Allow state change to render
  }

  /**
   * Hide elements before snapshot (for dynamic content)
   */
  async hideElements(selectors: string[]): Promise<void> {
    await this.page.evaluate((sels) => {
      sels.forEach((sel) => {
        const elements = document.querySelectorAll(sel);
        elements.forEach((el) => {
          (el as HTMLElement).style.visibility = 'hidden';
        });
      });
    }, selectors);
  }

  /**
   * Freeze animations before snapshot
   */
  async freezeAnimations(): Promise<void> {
    await this.page.evaluate(() => {
      const style = document.createElement('style');
      style.innerHTML = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `;
      document.head.appendChild(style);
    });
  }

  /**
   * Wait for all images to load
   */
  async waitForImages(): Promise<void> {
    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          }))
      );
    });
  }

  /**
   * Wait for fonts to load
   */
  async waitForFonts(): Promise<void> {
    await this.page.evaluate(() => {
      return document.fonts.ready;
    });
  }

  /**
   * Comprehensive wait for page to be snapshot-ready
   */
  async waitForSnapshotReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.waitForImages();
    await this.waitForFonts();
    await this.page.waitForTimeout(100); // Final buffer
  }
}

/**
 * Create Percy helper instance
 */
export function createPercyHelper(page: Page): PercyHelper {
  return new PercyHelper(page);
}

/**
 * Quick snapshot helper (no class instantiation needed)
 */
export async function quickSnapshot(
  page: Page,
  name: string,
  options?: PercySnapshotOptions
): Promise<void> {
  const helper = createPercyHelper(page);
  await helper.snapshot(name, options);
}

/**
 * Quick responsive snapshot helper
 */
export async function quickResponsiveSnapshot(
  page: Page,
  name: string,
  options?: Omit<PercySnapshotOptions, 'widths'>
): Promise<void> {
  const helper = createPercyHelper(page);
  await helper.snapshotResponsive(name, options);
}

/**
 * Quick theme snapshot helper
 */
export async function quickThemeSnapshot(
  page: Page,
  name: string,
  options?: PercySnapshotOptions
): Promise<void> {
  const helper = createPercyHelper(page);
  await helper.snapshotThemes(name, options);
}
