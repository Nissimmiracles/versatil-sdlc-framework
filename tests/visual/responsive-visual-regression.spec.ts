/** Portable reference responsive geometry checks; screenshots are evidence attachments, not baselines. */
import { test, expect } from '@playwright/test';
import { installReferenceFixture } from '../accessibility/reference-fixture.js';
import { assertReferenceLayout } from './reference-layout.js';

test.beforeEach(async ({ page }) => { await installReferenceFixture(page); });

test.describe('Reference responsive visual contracts', () => {
  for (const [width, height] of [[320,667],[375,667],[768,1024],[1024,768],[1920,1080],[667,375]]) {
    test(`landmarks, form and navigation fit ${width}x${height}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');
      await assertReferenceLayout(page);
      const nav = (await page.locator('nav').boundingBox())!;
      for (const child of await page.locator('nav > *').all()) {
        const box = (await child.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(nav.x);
        expect(box.x + box.width).toBeLessThanOrEqual(nav.x + nav.width + 0.1);
      }
      await testInfo.attach(`reference-${width}x${height}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    });
  }

  test('responsive grid follows explicit four, three, two and one column breakpoints', async ({ page }) => {
    await page.goto('/grid');
    await page.addStyleTag({ content: '.reference-grid{display:grid;gap:16px;grid-template-columns:repeat(4,1fr)}.reference-grid>div{height:80px;background:#eee}@media(max-width:1200px){.reference-grid{grid-template-columns:repeat(3,1fr)}}@media(max-width:900px){.reference-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.reference-grid{grid-template-columns:1fr}}' });
    await page.locator('main').evaluate(el => el.insertAdjacentHTML('beforeend','<div class="reference-grid"><div>One</div><div>Two</div><div>Three</div><div>Four</div></div>'));
    for (const [width, columns] of [[1920,4],[1024,3],[768,2],[375,1]]) {
      await page.setViewportSize({ width, height:1080 });
      const grid = (await page.locator('.reference-grid').boundingBox())!;
      const cells = await page.locator('.reference-grid > div').all();
      const boxes = await Promise.all(cells.map(cell => cell.boundingBox()));
      const topRow = boxes.filter(box => box!.y === boxes[0]!.y);
      expect(topRow).toHaveLength(columns);
      expect(boxes[0]!.width).toBeCloseTo((grid.width - 16*(columns-1))/columns,1);
    }
  });

  test('theme changes preserve landmark geometry at every breakpoint', async ({ page }) => {
    await page.goto('/');
    for (const width of [375,768,1920]) {
      await page.setViewportSize({ width, height:1080 });
      const before = await page.locator('main').boundingBox();
      await page.locator('#theme').click();
      await expect(page.locator('body')).toHaveCSS('background-color','rgb(21, 21, 21)');
      await assertReferenceLayout(page);
      expect(await page.locator('main').boundingBox()).toEqual(before);
      await page.locator('#theme').click();
    }
  });
});
