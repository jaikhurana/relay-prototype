import { expect, test } from '@playwright/test';
import { d, gotoBeat, watchErrors } from './helpers';

test('channels feel lived-in: unread counts, ambient messages, reactions, no prompts', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await gotoBeat(page, 2);
  // Jai wakes up to unread channel activity from his night.
  await expect(d(page, 'channel-checkout-launch')).toContainText('4');
  await d(page, 'channel-checkout-launch').click();
  await expect(d(page, 'convo-header')).toContainText('checkout-launch');
  await expect(d(page, 'convo-header')).toContainText('6 members');
  await expect(d(page, 'message-list')).toContainText('Heads up: checkout p95 jumped after build 4182. Watching it.');
  // Messages from later in the day are not visible yet at 9:30 am IST.
  await expect(d(page, 'message-list')).not.toContainText("Jai's answer is in");
  // Opening the channel clears its unread count.
  await expect(d(page, 'channel-checkout-launch')).not.toContainText('4');
  // Channels never show the complete-ask strip or the online hint.
  await d(page, 'composer-input').click();
  await expect(page.locator('[data-demo="strip"]')).toHaveCount(0);
  await expect(page.locator('[data-demo="online-hint"]')).toHaveCount(0);
  // Reactions toggle.
  const eyes = page.getByRole('button', { name: /^👀 2/ });
  await eyes.click();
  await expect(page.getByRole('button', { name: /^👀 3/ })).toHaveAttribute('aria-pressed', 'true');
  // Plain messages post to the channel.
  await d(page, 'composer-input').fill('On it.');
  await d(page, 'composer-input').press('Enter');
  await expect(d(page, 'message-list')).toContainText('On it.');
  // Search filters the sidebar.
  await page.getByLabel('Search Northwind Payments').fill('pri');
  await expect(d(page, 'dm-priya')).toBeVisible();
  await expect(page.locator('[data-demo="dm-sam"]')).toHaveCount(0);
  await expect(page.locator('[data-demo="channel-checkout-launch"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('later in the story the channel shows the follow-up', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 6);
  await d(page, 'channel-checkout-launch').click();
  await expect(d(page, 'message-list')).toContainText("Jai's answer is in: build 4190 brings p95 back down. Thanks Jai 🙌");
});
