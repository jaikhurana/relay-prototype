import { expect, test } from '@playwright/test';
import { gotoBeat, signature, watchErrors } from './helpers';

test('stepper 1→7 in random order gives the same screens as in order', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  const inOrder: Record<number, string> = {};
  for (const b of [1, 2, 3, 4, 5, 6, 7]) {
    await gotoBeat(page, b);
    inOrder[b] = await signature(page);
  }
  for (const order of [
    [5, 2, 7, 1, 4, 6, 3],
    [7, 6, 5, 4, 3, 2, 1],
    [3, 1, 6, 2, 7, 5, 4],
  ]) {
    for (const b of order) {
      await gotoBeat(page, b);
      expect(await signature(page), `beat ${b} after ${order.join(',')}`).toBe(inOrder[b]);
    }
  }
  // Interactions don't leak into the next load: answer in beat 3, then reload beat 2.
  await gotoBeat(page, 3);
  await page.locator('[data-demo="nudge-answer"]').click();
  await page.locator('[data-demo="reply-input-ask-sam-1"]').fill('Done.');
  await page.locator('[data-demo="reply-send-ask-sam-1"]').click();
  await gotoBeat(page, 2);
  expect(await signature(page)).toBe(inOrder[2]);
  expect(errors).toEqual([]);
});
