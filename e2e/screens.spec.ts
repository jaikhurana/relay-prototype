import { test } from '@playwright/test';
import { d, gotoBeat } from './helpers';

// Screenshots of every beat in every view-as, at 1440x900 and 1280x800, for visual review.
// Written to screenshots/ (git-ignored).
const SIZES = [
  { w: 1440, h: 900 },
  { w: 1280, h: 800 },
];
const VIEWERS = ['jai', 'sam', 'priya'] as const;

for (const { w, h } of SIZES) {
  test.describe(`${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h } });

    test('every beat × view-as', async ({ page }) => {
      await page.goto('/');
      for (const b of [1, 2, 3, 4, 5, 6, 7]) {
        for (const v of VIEWERS) {
          await gotoBeat(page, b);
          await page.getByTestId(`viewas-${v}`).click();
          await page.mouse.move(2, 2);
          await page.waitForTimeout(450);
          await page.screenshot({ path: `screenshots/${w}x${h}/beat${b}-${v}.png` });
        }
      }
    });

    test('feature states', async ({ page }) => {
      const shot = async (name: string) => {
        await page.mouse.move(2, 2);
        await page.waitForTimeout(450);
        await page.screenshot({ path: `screenshots/${w}x${h}/state-${name}.png` });
      };
      await page.goto('/');
      await gotoBeat(page, 1);
      await d(page, 'composer-input').click();
      await d(page, 'strip-about').fill('Checkout latency dashboard · build 4182');
      await d(page, 'strip-need-Explanation').click();
      await d(page, 'strip-context').fill('p95 went from 220 ms to 410 ms after build 4182. What changed?');
      await shot('f1-strip');
      await d(page, 'strip-send').click();
      await page.waitForTimeout(1800);
      await shot('f1-sent');
      await gotoBeat(page, 2);
      await d(page, 'morning-open').click();
      await page.waitForTimeout(600);
      await shot('f2-queue');
      await gotoBeat(page, 4);
      await d(page, 'record-now').click();
      await page.waitForTimeout(1200);
      await shot('f4a-recording');
      await gotoBeat(page, 6);
      await d(page, 'new-meeting').click();
      await d(page, 'nm-title').fill('Launch go/no-go');
      await d(page, 'nm-live').click();
      await page.waitForTimeout(300);
      await shot('f4c-fair-turn');
    });
  });
}
