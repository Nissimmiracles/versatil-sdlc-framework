/**
 * VERSATIL SDLC Framework - E2E Test Suite
 * Enhanced Maria-QA Chrome MCP Integration
 */

import { test, expect } from '@playwright/test';

test.describe('VERSATIL SDLC Framework - Core Functionality', () => {
  test('should load framework dashboard successfully', async ({ page }) => {
    await page.goto('/');

    // Verify framework title and branding
    await expect(page).toHaveTitle(/VERSATIL SDLC Framework/);
    await expect(page.locator('nav h1')).toContainText('VERSATIL SDLC Framework');
    await expect(page.locator('nav p')).toContainText('Enhanced BMAD Testing Environment');
  });

  test('should display agent system status correctly', async ({ page }) => {
    await page.goto('/');

    // Verify all agents are active
    await expect(page.locator('text=Enhanced Maria-QA: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced James: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced Marcus: Active')).toBeVisible();
    await expect(page.locator('text=SimulationQA: Active')).toBeVisible();
  });

  test('should display MCP integration status', async ({ page }) => {
    await page.goto('/');

    // Verify MCP integration is working
    await expect(page.locator('text=Server: Running')).toBeVisible();
    await expect(page.locator('text=Chrome MCP: Connected')).toBeVisible();
    await expect(page.locator('text=Agent Detection: Working')).toBeVisible();
  });

  test('should show realistic framework score', async ({ page }) => {
    await page.goto('/');

    // Verify honest reality score
    await expect(page.locator('text=70/100')).toBeVisible();
    await expect(page.locator('text=Honest Assessment')).toBeVisible();
  });

  test('should have working API health endpoint', async ({ page }) => {
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();

    const healthData = await response.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.framework).toBe('VERSATIL SDLC');
    expect(healthData.version).toBe('1.1.0');
  });

  test('should provide framework status API', async ({ page }) => {
    const response = await page.request.get('/api/framework/status');
    expect(response.ok()).toBeTruthy();

    const statusData = await response.json();
    expect(statusData.realityScore).toBe(70);
    expect(statusData.capabilities).toBeDefined();
    expect(statusData.recommendations).toBeInstanceOf(Array);
  });

  test('should initialize BMAD context for testing', async ({ page }) => {
    await page.goto('/');

    // Verify BMAD context is available in browser
    const bmadContext = await page.evaluate(() => (window as any).bmadContext);
    expect(bmadContext).toBeDefined();
    expect(bmadContext.framework).toBe('VERSATIL SDLC');
    expect(bmadContext.agents).toContain('Enhanced-Maria');
    expect(bmadContext.agents).toContain('Enhanced-James');
  });

  test('should monitor performance metrics', async ({ page }) => {
    await page.goto('/');

    // Wait for performance observer to collect data
    await page.waitForTimeout(1000);

    // Check that performance monitoring is active
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation').length > 0;
    });
    expect(performanceEntries).toBeTruthy();
  });
});

test.describe('BMAD Methodology Validation', () => {
  test('should display BMAD methodology status', async ({ page }) => {
    await page.goto('/');

    // Verify BMAD components are listed
    await expect(page.locator('text=Agent Specialization: Working')).toBeVisible();
    await expect(page.locator('text=Quality Gates: Configured')).toBeVisible();
    await expect(page.locator('text=Real-time Testing: Active')).toBeVisible();
  });

  test('should validate quality gates configuration', async ({ page }) => {
    await page.goto('/');

    const bmadContext = await page.evaluate(() => (window as any).bmadContext);
    expect(bmadContext.qualityGates.performance).toBe(true);
    expect(bmadContext.qualityGates.accessibility).toBe(true);
    expect(bmadContext.qualityGates.security).toBe(true);
    expect(bmadContext.qualityGates.visual).toBe(true);
  });
});