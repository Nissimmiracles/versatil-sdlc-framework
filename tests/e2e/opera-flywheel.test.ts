/**
 * VERSATIL SDLC Framework - OPERA UI/UX Testing Flywheel E2E Test
 * Validates the operational UI/UX testing flywheel implementation
 */

import { test, expect } from '@playwright/test';

test.describe('OPERA UI/UX Testing Flywheel', () => {
  test('should demonstrate operational testing flywheel capabilities', async ({ page }) => {
    await page.goto('/');

    // Verify the framework is running with operational flywheel
    await expect(page.locator('text=Framework Quality Dashboard')).toBeVisible();
    await expect(page.locator('text=OPERA Methodology Status')).toBeVisible();
    await expect(page.locator('text=Agent Specialization: Working')).toBeVisible();
    await expect(page.locator('text=Real-time Testing: Active')).toBeVisible();
  });

  test('should display comprehensive framework status', async ({ page }) => {
    const response = await page.request.get('/api/framework/status');
    expect(response.ok()).toBeTruthy();

    const statusData = await response.json();
    expect(statusData.realityScore).toBe(70);
    expect(statusData.capabilities.agentActivation.status).toBe('working');
    expect(statusData.capabilities.mcpIntegration.status).toBe('working');
  });

  test('should show operational agent system', async ({ page }) => {
    await page.goto('/');

    // Verify all Enhanced OPERA agents are operational
    await expect(page.locator('text=Enhanced Maria-QA: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced James: Active')).toBeVisible();
    await expect(page.locator('text=Enhanced Marcus: Active')).toBeVisible();

    // Verify MCP integration is working
    await expect(page.locator('text=Chrome MCP: Connected')).toBeVisible();
  });

  test('should validate OPERA context for testing flywheel', async ({ page }) => {
    await page.goto('/');

    // Verify OPERA context includes quality gates
    const operaContext = await page.evaluate(() => (window as any).operaContext);
    expect(operaContext.framework).toBe('VERSATIL SDLC');
    expect(operaContext.qualityGates.performance).toBe(true);
    expect(operaContext.qualityGates.accessibility).toBe(true);
    expect(operaContext.qualityGates.security).toBe(true);
    expect(operaContext.qualityGates.visual).toBe(true);
  });

  test('should demonstrate honest framework assessment', async ({ page }) => {
    await page.goto('/');

    // Framework provides honest assessment
    await expect(page.locator('text=70/100')).toBeVisible();
    await expect(page.locator('text=Honest Assessment')).toBeVisible();
    await expect(page.locator('text=CLI Operations: 40% functional')).toBeVisible();
    await expect(page.locator('text=Agent System: 85% functional')).toBeVisible();
    await expect(page.locator('text=MCP Integration: 90% functional')).toBeVisible();
  });
});