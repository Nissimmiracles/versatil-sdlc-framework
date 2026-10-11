import { test, expect } from '@playwright/test';
import { installReferenceFixture } from './reference-fixture.js';

// These checks validate the local reference fixture, not application-wide WCAG conformance.
test.beforeEach(async ({ page }) => {
  await installReferenceFixture(page);
  await page.goto('/');
});

test.describe('Reference fixture keyboard navigation', () => {
  test('Tab visits every visible interactive element in document order with visible focus', async ({ page }) => {
    const expected = await page.locator('a[href],button,input,select,textarea,[tabindex="0"]').evaluateAll(elements =>
      elements.filter(el => (el as HTMLElement).offsetParent !== null).map(el => el.outerHTML));
    expect(expected.length).toBeGreaterThan(5);
    const visited: string[] = [];
    for (const html of expected) {
      await page.keyboard.press('Tab');
      const current = await page.locator(':focus').evaluate(el => {
        const css = getComputedStyle(el);
        return { html: el.outerHTML, width: parseFloat(css.outlineWidth), style: css.outlineStyle };
      });
      expect(current.html).toBe(html);
      expect(current.width).toBeGreaterThanOrEqual(3);
      expect(current.style).toBe('solid');
      visited.push(current.html);
    }
    expect(visited).toEqual(expected);
  });

  test('Shift+Tab reverses focus order', async ({ page }) => {
    await page.locator('#activate').focus();
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('#contact-link')).toBeFocused();
  });

  test('zero tabindex participates in order and negative tabindex is excluded', async ({ page }) => {
    await page.locator('#menu-trigger').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#option-one')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#tooltip-trigger')).toBeFocused();
    await expect(page.locator('#option-two')).not.toBeFocused();
  });

  test('all visible controls permit focus to leave with Tab', async ({ page }) => {
    const controls = page.locator('a[href],button,input,select,textarea,[tabindex="0"]').filter({ visible: true });
    expect(await controls.count()).toBeGreaterThan(0);
    for (const control of await controls.all()) {
      await control.focus();
      await expect(control).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(control).not.toBeFocused();
    }
  });

  for (const key of ['Enter', 'Space']) {
    test(`${key} activates a button`, async ({ page }) => {
      await page.locator('#activate').focus();
      await page.keyboard.press(key);
      await expect(page.locator('#activation')).toHaveText('1');
    });
  }

  test('Enter activates a link and navigates', async ({ page }) => {
    await page.locator('#contact-link').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('Arrow keys navigate menu items', async ({ page }) => {
    await page.locator('#menu-trigger').click();
    await expect(page.locator('#menu-one')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#menu-two')).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(page.locator('#menu-one')).toBeFocused();
  });

  test('ArrowDown navigates listbox options and updates selection', async ({ page }) => {
    await page.locator('#option-one').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#option-two')).toBeFocused();
    await expect(page.locator('#option-two')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#option-one')).toHaveAttribute('aria-selected', 'false');
  });

  test('ArrowDown changes a native select value', async ({ page }) => {
    await page.locator('#choice').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#choice')).toHaveValue('two');
  });

  test('Escape closes an open modal and restores its trigger focus', async ({ page }) => {
    await page.locator('#open-dialog').click();
    await expect(page.locator('#dialog')).toBeVisible();
    await expect(page.locator('#dialog-input')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog')).not.toBeVisible();
    await expect(page.locator('#open-dialog')).toBeFocused();
  });

  test('Tab stays inside an open modal until Escape', async ({ page }) => {
    await page.locator('#open-dialog').click();
    await page.keyboard.press('Tab');
    await expect(page.locator('#close-dialog')).toBeFocused();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await page.locator(':focus').evaluate(el => Boolean(el.closest('dialog')))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('#open-dialog')).toBeFocused();
  });

  test('Escape closes menus and restores focus', async ({ page }) => {
    await page.locator('#menu-trigger').click();
    await expect(page.locator('#menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu')).not.toBeVisible();
    await expect(page.locator('#menu-trigger')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#menu-trigger')).toBeFocused();
  });

  test('Escape dismisses a visible tooltip', async ({ page }) => {
    await page.locator('#tooltip-trigger').hover();
    await expect(page.locator('#tooltip')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#tooltip')).not.toBeVisible();
  });

  test('focus alone never navigates or opens a dialog', async ({ page }) => {
    const initial = page.url();
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await expect(page).toHaveURL(initial);
      await expect(page.locator('#dialog')).not.toBeVisible();
    }
  });
});
