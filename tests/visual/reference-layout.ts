import { expect, type Page } from '@playwright/test';

/** Portable numeric baseline for the explicitly styled reference HTML, not screenshot approval. */
export async function assertReferenceLayout(page: Page): Promise<void> {
  const viewport = page.viewportSize()!;
  const expectedWidth = Math.min(viewport.width, 900);
  for (const selector of ['header', 'main', 'footer']) {
    const box = await page.locator(selector).boundingBox();
    expect(box, `${selector} has rendered geometry`).not.toBeNull();
    expect(box!.width).toBeCloseTo(expectedWidth, 1);
    expect(box!.x).toBeCloseTo((viewport.width - expectedWidth) / 2, 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  const input = await page.locator('#name').boundingBox();
  expect(input!.width).toBeCloseTo(Math.min(expectedWidth - 40, 440), 1);
  const header = await page.locator('header').boundingBox();
  const main = await page.locator('main').boundingBox();
  const footer = await page.locator('footer').boundingBox();
  expect(main!.y).toBeCloseTo(header!.y + header!.height, 1);
  expect(footer!.y).toBeCloseTo(main!.y + main!.height, 1);
}
