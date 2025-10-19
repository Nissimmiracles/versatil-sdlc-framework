/**
 * Component Visual Regression Tests
 *
 * Percy visual regression testing for critical UI components
 * Tests component appearance, states, and responsive behavior
 *
 * Run: npx percy exec -- npx playwright test tests/visual/component-visual-regression.spec.ts
 */

import { test, expect } from '@playwright/test';
import { createPercyHelper, RESPONSIVE_WIDTHS, ComponentState } from '../utils/percy-helpers.js';

test.describe('Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to component showcase page
    // Replace with your actual component showcase URL
    await page.goto('http://localhost:3000/components');
    await page.waitForLoadState('networkidle');
  });

  test('Button Components - All States', async ({ page }) => {
    const percy = createPercyHelper(page);

    // Wait for components to be ready
    await percy.waitForSnapshotReady();

    // Primary button states
    const primaryButtonStates: ComponentState[] = ['default', 'hover', 'focus', 'active', 'disabled'];
    await percy.snapshotStates(
      'Primary Button',
      '[data-testid="button-primary"]',
      primaryButtonStates,
      { waitForTimeout: 100 }
    );

    // Secondary button states
    const secondaryButtonStates: ComponentState[] = ['default', 'hover', 'disabled'];
    await percy.snapshotStates(
      'Secondary Button',
      '[data-testid="button-secondary"]',
      secondaryButtonStates
    );

    // Icon button states
    await percy.snapshotStates(
      'Icon Button',
      '[data-testid="button-icon"]',
      ['default', 'hover', 'active']
    );
  });

  test('Button Components - Responsive Breakpoints', async ({ page }) => {
    const percy = createPercyHelper(page);

    // Test buttons at all responsive breakpoints
    await percy.snapshotResponsive('Button Components - Responsive', {
      waitForTimeout: 100
    });
  });

  test('Button Components - Theme Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    // Test buttons in light and dark themes
    await percy.snapshotThemes('Button Components - Themes', {
      waitForTimeout: 100
    });
  });

  test('Form Components - Input Fields', async ({ page }) => {
    const percy = createPercyHelper(page);

    await percy.waitForSnapshotReady();

    // Text input states
    const inputStates: ComponentState[] = ['default', 'focus', 'error', 'disabled'];
    await percy.snapshotStates(
      'Text Input',
      '[data-testid="input-text"]',
      inputStates
    );

    // Textarea states
    await percy.snapshotStates(
      'Textarea',
      '[data-testid="input-textarea"]',
      inputStates
    );

    // Select dropdown states
    await percy.snapshotStates(
      'Select Dropdown',
      '[data-testid="input-select"]',
      ['default', 'focus', 'disabled']
    );
  });

  test('Form Components - Checkboxes and Radio Buttons', async ({ page }) => {
    const percy = createPercyHelper(page);

    await percy.waitForSnapshotReady();

    // Checkbox states
    await page.goto('http://localhost:3000/components/checkbox');
    await percy.snapshot('Checkbox - Unchecked');

    // Check the checkbox
    await page.click('[data-testid="checkbox"]');
    await percy.snapshot('Checkbox - Checked');

    // Disabled checkbox
    await page.goto('http://localhost:3000/components/checkbox?disabled=true');
    await percy.snapshot('Checkbox - Disabled');

    // Radio button group
    await page.goto('http://localhost:3000/components/radio');
    await percy.snapshot('Radio Buttons - Group');
  });

  test('Card Component - Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/card');
    await percy.waitForSnapshotReady();

    // Default card
    await percy.snapshot('Card - Default');

    // Card with image
    await percy.snapshotComponent('Card - With Image', '[data-testid="card-image"]');

    // Card with actions
    await percy.snapshotComponent('Card - With Actions', '[data-testid="card-actions"]');

    // Card hover state
    await percy.setComponentState('[data-testid="card-default"]', 'hover');
    await percy.snapshot('Card - Hover State');
  });

  test('Modal Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/modal');
    await percy.waitForSnapshotReady();

    // Open modal
    await page.click('[data-testid="open-modal"]');
    await page.waitForSelector('[data-testid="modal"]', { state: 'visible' });

    // Freeze animations for consistent snapshot
    await percy.freezeAnimations();

    // Modal in light theme
    await percy.snapshot('Modal - Light Theme');

    // Modal in dark theme
    await percy.setTheme('dark');
    await percy.snapshot('Modal - Dark Theme');

    // Modal at different viewports
    await percy.setTheme('light');
    await percy.snapshotAtViewport('Modal - Mobile', 375, 667);
    await percy.snapshotAtViewport('Modal - Tablet', 768, 1024);
    await percy.snapshotAtViewport('Modal - Desktop', 1920, 1080);
  });

  test('Navigation Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/navigation');
    await percy.waitForSnapshotReady();

    // Navigation default state
    await percy.snapshot('Navigation - Default');

    // Navigation with active item
    await page.click('[data-testid="nav-item-1"]');
    await percy.snapshot('Navigation - Active Item');

    // Mobile navigation (hamburger menu)
    await percy.snapshotAtViewport('Navigation - Mobile', 375, 667);

    // Navigation dropdown open
    await page.hover('[data-testid="nav-dropdown"]');
    await page.waitForTimeout(200); // Wait for dropdown animation
    await percy.freezeAnimations();
    await percy.snapshot('Navigation - Dropdown Open');
  });

  test('Toast/Alert Component - Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/toast');
    await percy.waitForSnapshotReady();

    // Success toast
    await page.click('[data-testid="show-success-toast"]');
    await page.waitForSelector('[data-testid="toast-success"]', { state: 'visible' });
    await percy.freezeAnimations();
    await percy.snapshot('Toast - Success');

    // Error toast
    await page.click('[data-testid="show-error-toast"]');
    await page.waitForSelector('[data-testid="toast-error"]', { state: 'visible' });
    await percy.snapshot('Toast - Error');

    // Warning toast
    await page.click('[data-testid="show-warning-toast"]');
    await page.waitForSelector('[data-testid="toast-warning"]', { state: 'visible' });
    await percy.snapshot('Toast - Warning');

    // Info toast
    await page.click('[data-testid="show-info-toast"]');
    await page.waitForSelector('[data-testid="toast-info"]', { state: 'visible' });
    await percy.snapshot('Toast - Info');
  });

  test('Loading States - Spinners and Skeletons', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/loading');

    // Spinner loading state
    await percy.snapshot('Loading - Spinner');

    // Skeleton loading state
    await page.goto('http://localhost:3000/components/skeleton');
    await percy.freezeAnimations(); // Freeze skeleton shimmer animation
    await percy.snapshot('Loading - Skeleton');

    // Progress bar
    await page.goto('http://localhost:3000/components/progress');
    await percy.snapshot('Loading - Progress Bar');
  });

  test('Table Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/table');
    await percy.waitForSnapshotReady();

    // Default table
    await percy.snapshot('Table - Default');

    // Table with sorting
    await page.click('[data-testid="table-header-name"]');
    await percy.snapshot('Table - Sorted');

    // Table with selected row
    await page.click('[data-testid="table-row-1"]');
    await percy.snapshot('Table - Selected Row');

    // Table responsive (mobile)
    await percy.snapshotAtViewport('Table - Mobile', 375, 667);
  });

  test('Tooltip Component - Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/tooltip');
    await percy.waitForSnapshotReady();

    // Top tooltip
    await page.hover('[data-testid="tooltip-trigger-top"]');
    await page.waitForTimeout(200);
    await percy.snapshot('Tooltip - Top Position');

    // Bottom tooltip
    await page.hover('[data-testid="tooltip-trigger-bottom"]');
    await page.waitForTimeout(200);
    await percy.snapshot('Tooltip - Bottom Position');

    // Left tooltip
    await page.hover('[data-testid="tooltip-trigger-left"]');
    await page.waitForTimeout(200);
    await percy.snapshot('Tooltip - Left Position');

    // Right tooltip
    await page.hover('[data-testid="tooltip-trigger-right"]');
    await page.waitForTimeout(200);
    await percy.snapshot('Tooltip - Right Position');
  });

  test('Badge Component - Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/badge');
    await percy.waitForSnapshotReady();

    // All badge variants in one snapshot
    await percy.snapshot('Badges - All Variants');

    // Theme variations
    await percy.snapshotThemes('Badges - Theme Variants');
  });

  test('Pagination Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/pagination');
    await percy.waitForSnapshotReady();

    // First page
    await percy.snapshot('Pagination - First Page');

    // Middle page
    await page.click('[data-testid="pagination-page-5"]');
    await percy.snapshot('Pagination - Middle Page');

    // Last page
    await page.click('[data-testid="pagination-last"]');
    await percy.snapshot('Pagination - Last Page');

    // Mobile pagination
    await percy.snapshotAtViewport('Pagination - Mobile', 375, 667);
  });

  test('Avatar Component - Variants', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/avatar');
    await percy.waitForSnapshotReady();

    // Avatar with image
    await percy.snapshotComponent('Avatar - With Image', '[data-testid="avatar-image"]');

    // Avatar with initials
    await percy.snapshotComponent('Avatar - Initials', '[data-testid="avatar-initials"]');

    // Avatar sizes
    await percy.snapshot('Avatar - All Sizes');
  });

  test('Accordion Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/accordion');
    await percy.waitForSnapshotReady();

    // All collapsed
    await percy.snapshot('Accordion - All Collapsed');

    // First item expanded
    await page.click('[data-testid="accordion-header-1"]');
    await percy.freezeAnimations();
    await percy.snapshot('Accordion - First Item Expanded');

    // Multiple items expanded
    await page.click('[data-testid="accordion-header-2"]');
    await percy.snapshot('Accordion - Multiple Items Expanded');
  });

  test('Tabs Component - States', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/tabs');
    await percy.waitForSnapshotReady();

    // First tab active
    await percy.snapshot('Tabs - First Tab Active');

    // Second tab active
    await page.click('[data-testid="tab-2"]');
    await percy.snapshot('Tabs - Second Tab Active');

    // Tabs responsive
    await percy.snapshotResponsive('Tabs - Responsive');
  });

  test('Breadcrumb Component', async ({ page }) => {
    const percy = createPercyHelper(page);

    await page.goto('http://localhost:3000/components/breadcrumb');
    await percy.waitForSnapshotReady();

    // Default breadcrumb
    await percy.snapshot('Breadcrumb - Default');

    // Breadcrumb with icons
    await page.goto('http://localhost:3000/components/breadcrumb?icons=true');
    await percy.snapshot('Breadcrumb - With Icons');

    // Mobile breadcrumb
    await percy.snapshotAtViewport('Breadcrumb - Mobile', 375, 667);
  });
});
