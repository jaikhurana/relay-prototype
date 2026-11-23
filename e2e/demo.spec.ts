import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';

test('?demo=1&speed=4 plays to the Outro with zero console errors', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await page.goto('/?demo=1&speed=4');
  await expect(page.getByTestId('caption-bar')).toBeVisible();
  // Chapter 1 opens with a time card.
  await expect(page.getByTestId('time-card')).toContainText('4:00 pm', { timeout: 15_000 });
  await expect(page.getByTestId('time-card')).toContainText('Viewing as Sam');
  // Chapter 7: Jai answers the pinned questions in the room.
  await expect(page.locator('[data-demo="pin-answer-pin-luis"]')).toBeVisible({ timeout: 120_000 });
  await expect(page.locator('[data-demo="pin-answer-pin-sam"]')).toContainText("Ready for Sam's 9 am ✓");
  await expect(page.getByTestId('outro')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('outro')).toContainText('1 day lost + 90');
  await expect(page.getByTestId('outro')).toContainText('Jai offline by');
  expect(errors).toEqual([]);

  // Try it yourself: exits the demo and resets to a clean step 1, interactive.
  await page.getByTestId('try-it').click();
  await expect(page.getByTestId('outro')).toHaveCount(0);
  await expect(page.getByTestId('demo-overlay')).toHaveCount(0);
  await expect(page.getByTestId('step-1')).toHaveAttribute('aria-current', 'step');
  await expect(page.getByTestId('viewas-sam')).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[data-demo^="askcard-"]')).toHaveCount(0); // nothing sent yet
  await page.locator('[data-demo="composer-input"]').click();
  await expect(page.locator('[data-demo="strip"]')).toBeVisible();
  await expect(page.locator('[data-demo="strip-about"]')).toHaveValue('');
  expect(errors).toEqual([]);
});

test('demo controls: pause, next chapter, previous chapter, exit', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/?demo=1&speed=1.5');
  const caption = page.getByTestId('caption');
  await expect(caption).toContainText('Meet Jai in Bangalore');

  // Space pauses: the caption must not change for a while.
  await page.keyboard.press('Space');
  await expect(page.getByTestId('caption-bar')).toContainText('Paused');
  const before = await caption.textContent();
  await page.waitForTimeout(6000);
  expect(await caption.textContent()).toBe(before);

  // → jumps to chapter 1 (and resumes)
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('caption-bar')).toContainText('1 · Complete ask');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('caption-bar')).toContainText('2 · Morning queue');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('caption-bar')).toContainText('1 · Complete ask');

  // A click on the app (outside the controls) pauses.
  await page.mouse.click(400, 400);
  await expect(page.getByTestId('caption-bar')).toContainText('Paused');
  await page.getByTestId('demo-toggle').click();
  await expect(page.getByTestId('caption-bar')).not.toContainText('Paused');

  // Speed cycles 0.75× → 1× → 1.5×.
  await page.getByRole('button', { name: /^Speed/ }).click();
  await expect(page.getByRole('button', { name: /^Speed/ })).toHaveText('0.75×');
  await page.getByRole('button', { name: /^Speed/ }).click();
  await expect(page.getByRole('button', { name: /^Speed/ })).toHaveText('1×');

  // Esc exits.
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('caption-bar')).toHaveCount(0);
  await expect(page.getByTestId('demo-overlay')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('#demo also autoplays (artifact links drop query strings)', async ({ page }) => {
  await page.goto('/#demo');
  await expect(page.getByTestId('caption-bar')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('below 1100px the app is replaced by a laptop card, and the demo still plays', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('/');
  await expect(page.getByText('Relay is best viewed on a laptop.')).toBeVisible();
  await expect(page.getByTestId('app-window')).toHaveCount(0);
  await page.getByTestId('watch-demo').click();
  await expect(page.getByTestId('app-window')).toBeVisible();
  await expect(page.getByTestId('caption-bar')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Relay is best viewed on a laptop.')).toBeVisible();
});
