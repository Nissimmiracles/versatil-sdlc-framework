/** Reference visual harness checks: geometry/style/state baselines, no deployed component claims. */
import { test, expect } from '@playwright/test';
import { installReferenceFixture } from '../accessibility/reference-fixture.js';

test.beforeEach(async ({ page }) => {
  await installReferenceFixture(page);
  await page.goto('/components');
});

test.describe('Reference component visual contracts', () => {
  test('button focus changes rendered pixels while preserving geometry', async ({ page }, testInfo) => {
    const button = page.locator('#activate');
    const before = await button.boundingBox();
    const normal = await page.screenshot();
    await button.focus();
    await expect(button).toHaveCSS('outline-width', '3px');
    await expect(button).toHaveCSS('outline-color', 'rgb(0, 95, 204)');
    expect(await button.boundingBox()).toEqual(before);
    const focused = await page.screenshot();
    expect(focused.equals(normal)).toBe(false);
    await testInfo.attach('reference-button-focus', { body: focused, contentType: 'image/png' });
  });

  test('disabled controls retain readable styling and cannot activate', async ({ page }) => {
    const button = page.locator('#activate');
    await button.evaluate(el => { (el as HTMLButtonElement).disabled = true; });
    await expect(button).toBeDisabled();
    await expect(button).toHaveCSS('background-color', 'rgb(238, 238, 238)');
    await button.evaluate(el => (el as HTMLButtonElement).click());
    await expect(page.locator('#activation')).toHaveText('0');
  });

  test('theme variants change foreground, background and focus colors', async ({ page }) => {
    const button = page.locator('#activate');
    await expect(button).toHaveCSS('color', 'rgb(17, 17, 17)');
    await expect(button).toHaveCSS('background-color', 'rgb(238, 238, 238)');
    await page.locator('#theme').click();
    await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(button).toHaveCSS('background-color', 'rgb(51, 51, 51)');
    await button.focus();
    await expect(button).toHaveCSS('outline-color', 'rgb(158, 202, 255)');
  });

  test('labeled form fields share the explicit width and border baseline', async ({ page }) => {
    for (const id of ['name','email','password','number','tel','message']) {
      const field = page.locator(`#${id}`);
      await expect(field).toBeVisible();
      expect((await field.boundingBox())!.width).toBe(440);
      await expect(field).toHaveCSS('border-top-width', '2px');
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    }
  });

  test('native checkbox and radio states have observable selection controls', async ({ page }) => {
    await page.locator('main').evaluate(el => {
      el.insertAdjacentHTML('beforeend', '<label><input id="check" type="checkbox">Check</label><label><input id="radio" name="group" type="radio">Radio</label>');
    });
    for (const id of ['check','radio']) {
      const control = page.locator(`#${id}`);
      await expect(control).not.toBeChecked();
      await control.check();
      await expect(control).toBeChecked();
    }
  });

  test('modal visually overlays content and closes without changing layout', async ({ page }, testInfo) => {
    const original = await page.locator('main').boundingBox();
    await page.locator('#open-dialog').click();
    const dialog = page.locator('#dialog');
    await expect(dialog).toBeVisible();
    const box = (await dialog.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThan(0);
    expect(box.x + box.width).toBeLessThan(viewport.width);
    expect(await dialog.evaluate(el => el.matches(':modal'))).toBe(true);
    await testInfo.attach('reference-modal', { body: await page.screenshot(), contentType: 'image/png' });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(await page.locator('main').boundingBox()).toEqual(original);
  });

  test('dropdown and tooltip visibility are reflected in the rendered layout', async ({ page }) => {
    await expect(page.locator('#menu')).not.toBeVisible();
    await page.locator('#menu-trigger').click();
    await expect(page.locator('#menu')).toBeVisible();
    expect((await page.locator('#menu').boundingBox())!.height).toBeGreaterThan(30);
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu')).not.toBeVisible();
    await page.locator('#tooltip-trigger').hover();
    await expect(page.locator('#tooltip')).toBeVisible();
    await expect(page.locator('#tooltip')).toHaveCSS('border-top-width', '1px');
    await page.keyboard.press('Escape');
    await expect(page.locator('#tooltip')).not.toBeVisible();
  });

  test('table, progress and disclosure reference states render with fixed geometry', async ({ page }) => {
    await page.locator('main').evaluate(el => {
      el.insertAdjacentHTML('beforeend', '<table style="width:400px;table-layout:fixed"><caption>Reference data</caption><tr><th>Name</th><th>Status</th></tr><tr><td>A</td><td>Ready</td></tr></table><progress aria-label="Completion" value="50" max="100" style="width:200px"></progress><details><summary>Details</summary><p>Expanded content</p></details>');
    });
    expect((await page.locator('table').boundingBox())!.width).toBe(400);
    expect((await page.locator('progress').boundingBox())!.width).toBe(200);
    await expect(page.locator('details p')).not.toBeVisible();
    await page.locator('summary').click();
    await expect(page.locator('details p')).toBeVisible();
  });
});
