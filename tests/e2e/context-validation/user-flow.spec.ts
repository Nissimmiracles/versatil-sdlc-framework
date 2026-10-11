/** Browser-harness reference flows. These are not evidence of a deployed product UI. */
import { test, expect, type Page } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { installReferenceFixture } from '../../accessibility/reference-fixture.js';
import { assertReferenceLayout } from '../../visual/reference-layout.js';

function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  return errors;
}
async function scan(page: Page) {
  // Navigation replaces window; inject into the document actually being audited.
  await injectAxe(page);
  await checkA11y(page, undefined, { axeOptions: { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] } } });
}
test.beforeEach(async ({ page }) => { await installReferenceFixture(page); });

test.describe('Reference user flows', () => {
  test('homepage landmarks, geometry, accessibility and browser errors', async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    await page.goto('/');
    for (const landmark of ['header', 'nav', 'main', 'footer']) await expect(page.locator(landmark)).toBeVisible();
    await assertReferenceLayout(page);
    await scan(page);
    await testInfo.attach('reference-homepage', { body: await page.screenshot(), contentType: 'image/png' });
    const timing = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return { load: entry.loadEventEnd - entry.startTime, dom: entry.domContentLoadedEventEnd - entry.startTime };
    });
    expect(timing.load).toBeLessThan(3000);
    expect(timing.dom).toBeLessThan(1500);
    expect(errors).toEqual([]);
  });

  test('contact form submits valid values and announces success', async ({ page }, testInfo) => {
    const errors = captureErrors(page);
    await page.goto('/contact');
    await page.getByLabel('Name', { exact: true }).fill('Test User');
    await page.getByLabel('Email', { exact: true }).fill('test@example.com');
    await page.getByLabel('Message', { exact: true }).fill('Reference message');
    await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
    await assertReferenceLayout(page);
    await testInfo.attach('reference-form-filled', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.getByTestId('success-message')).toHaveText('Message received in reference fixture.');
    await expect(page.getByTestId('success-message')).toBeVisible();
    await scan(page);
    expect(errors).toEqual([]);
  });

  test('required form fields prevent premature success', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    await expect(page.locator('[data-testid="success-message"]')).not.toBeVisible();
    expect(await page.locator('#name').evaluate(el => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
  });

  for (const width of [375, 768, 1920]) {
    test(`responsive reference remains contained and accessible at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 1080 });
      await page.goto('/');
      await assertReferenceLayout(page);
      await scan(page);
      await testInfo.attach(`reference-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
    });
  }

  test('theme toggle changes actual colors and retains contrast', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 21, 21)');
    await expect(page.locator('body')).toHaveCSS('color', 'rgb(255, 255, 255)');
    await scan(page);
    await page.getByRole('button', { name: 'Toggle theme' }).click();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  });

  test('button and form components have labels and visible focus', async ({ page }) => {
    await page.goto('/components');
    for (const variant of ['primary', 'secondary', 'outline', 'ghost']) {
      const button = page.locator(`[data-variant="${variant}"]`);
      await expect(button).toBeVisible();
      await button.focus();
      await expect(button).toBeFocused();
      await expect(button).toHaveCSS('outline-width', '3px');
    }
    for (const type of ['text', 'email', 'password', 'number', 'tel']) {
      const input = page.locator(`input[type="${type}"]`).first();
      await expect(input).toBeVisible();
      const id = await input.getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
      expect(await input.getAttribute('aria-label')).toBeTruthy();
    }
    await scan(page);
  });

  test('reference acceptance story validates component, action and observable outcome', async ({ page }) => {
    // A deterministic local story replaces dynamic test registration inside a running test.
    await page.goto('/');
    await expect(page.locator('[data-component="contact-form"]')).toBeVisible();
    await page.locator('#activate').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#activation')).toHaveText('1');
    await scan(page);
  });
});
