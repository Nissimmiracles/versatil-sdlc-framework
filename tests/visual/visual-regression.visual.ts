import { test, expect } from '@playwright/test';
import { installReferenceFixture } from '../accessibility/reference-fixture.js';
import { assertReferenceLayout } from './reference-layout.js';

test.beforeEach(async ({ page }) => { await installReferenceFixture(page); });

test.describe('Reference visual regression controls', () => {
  for (const [name,width,height] of [['desktop',1920,1080],['tablet',768,1024],['mobile',375,667]] as const) {
    test(`fixed layout baseline on ${name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width,height });
      await page.goto('/');
      await assertReferenceLayout(page);
      await testInfo.attach(`reference-${name}`, { body:await page.screenshot({ fullPage:true }),contentType:'image/png' });
    });
  }

  test('geometry checker rejects an injected component regression', async ({ page }) => {
    await page.goto('/');
    await assertReferenceLayout(page);
    const regression = await page.addStyleTag({ content:'main { max-width:700px!important }' });
    let rejected = false;
    try { await assertReferenceLayout(page); } catch { rejected = true; }
    expect(rejected, 'Geometry baseline must reject a 200px width regression').toBe(true);
    await regression.evaluate(el => el.remove());
    await assertReferenceLayout(page);
  });
});
