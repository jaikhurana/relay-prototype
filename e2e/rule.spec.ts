import { expect, test } from '@playwright/test';
import { d, gotoBeat, watchErrors } from './helpers';

test('opening a DM with Wei (online) shows the hint and no strip', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  // 9:30 am IST = 12:00 pm in Singapore: Wei is working. Sam is the viewer.
  await gotoBeat(page, 2);
  await page.getByTestId('viewas-sam').click();
  await d(page, 'dm-wei').click();
  await d(page, 'composer-input').click();
  await page.waitForTimeout(400);
  await expect(page.getByText('Wei is online. Prompts are off.')).toBeVisible();
  await expect(page.locator('[data-demo="strip"]')).toHaveCount(0);
  // Same for Jai's view.
  await page.getByTestId('viewas-jai').click();
  await d(page, 'dm-wei').click();
  await d(page, 'composer-input').click();
  await expect(page.getByText('Wei is online. Prompts are off.')).toBeVisible();
  await expect(page.locator('[data-demo="strip"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('the strip appears only for an offline receiver', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 1);
  await d(page, 'composer-input').click();
  await expect(d(page, 'strip')).toContainText('Jai is offline. Make it a complete ask so he can act without a round trip.');
  await d(page, 'dm-dana').click();
  await d(page, 'composer-input').click();
  await expect(page.getByText('Dana is online. Prompts are off.')).toBeVisible();
  await expect(page.locator('[data-demo="strip"]')).toHaveCount(0);
});

test('F1 copy and complete ask', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 1);
  const header = d(page, 'convo-header');
  await expect(header).toContainText('Jai');
  await expect(header).toContainText('Software engineer');
  await expect(header).toContainText('2:30 am in Bangalore');
  await expect(header).toContainText('Asleep · back 11:00 pm your time');
  await d(page, 'composer-input').click();
  await expect(d(page, 'strip-conversion')).toHaveText('= 7:30 pm Tue for Jai · he has his whole day');
  await expect(d(page, 'strip-expected')).toContainText(
    'Expected reply: before your 9:00 am start. Jai starts at 11:00 pm your time (9:30 am IST).',
  );
  await expect(d(page, 'strip-expected')).toContainText("Delivered quietly. No notification until Jai's morning.");
  await expect(page.locator('#ask-by option').first()).toHaveText('My 9 am start (Tue)');
  await d(page, 'strip-urgent').click();
  await expect(d(page, 'strip')).toContainText('2 of 2 urgent left this month · Visible to your team lead');
  await d(page, 'strip-urgent').click();
  await d(page, 'strip-about').fill('Checkout latency dashboard · build 4182');
  await d(page, 'strip-need-Explanation').click();
  await d(page, 'strip-send').click();
  const card = d(page, 'askcard-ask-sam-1');
  await expect(card).toContainText('Need: Explanation');
  await expect(card).toContainText('By: your 9:00 am');
  await expect(card).toContainText("Quiet until Jai's morning");
  await expect(d(page, 'askcard-ask-sam-2')).toBeVisible();
});

test('F2 queue order and why-lines', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 2);
  await expect(d(page, 'morning-toast')).toContainText('Good morning, Jai. 5 asks arrived overnight, sorted for you.');
  await d(page, 'morning-open').click();
  await expect(page.getByText('Ordered by: online now → starts soonest → can wait')).toBeVisible();
  await page.waitForTimeout(700);
  const rows = page.locator('[data-demo^="queue-row-"]');
  await expect(rows).toHaveCount(4);
  const ids = await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.demo));
  expect(ids).toEqual(['queue-row-wei', 'queue-row-priya', 'queue-row-sam', 'queue-row-alex']);
  await expect(rows.nth(0)).toContainText('Online now. A quick reply unblocks Wei today.');
  await expect(rows.nth(1)).toContainText('by 2:30 pm');
  await expect(rows.nth(1)).toContainText("Priya's day starts next, at 2:30 pm your time.");
  await expect(rows.nth(2)).toContainText('2 asks');
  await expect(rows.nth(2)).toContainText('by 6:30 pm');
  await expect(rows.nth(2)).toContainText("Sam starts at 7:30 pm, after you log off. Answer by 6:30 pm so it's ready for his 9 am.");
  await expect(rows.nth(3)).toContainText('Can wait');
  await expect(rows.nth(3)).toContainText('Due Friday. Fine for tomorrow.');
});

test('F3 nudge copy, answers and green pills', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 3);
  const n = d(page, 'nudge-toast');
  await expect(n).toContainText('1 hour left today');
  await expect(n).toContainText('Sam needs 2 answers before his 9 am start.');
  await expect(n).toContainText('Your 7:30 pm demo review is after you log off. Record it now.');
  await expect(n).toContainText('Nudge 1 of 3 today · only inside your working hours');
  await d(page, 'nudge-answer').click();
  await expect(n).toHaveCount(0);
  await d(page, 'reply-input-ask-sam-1').fill('The jump came from build 4182.');
  await d(page, 'reply-send-ask-sam-1').click();
  await d(page, 'decision-ask-sam-2-Yes, with risks').click();
  await d(page, 'reply-input-ask-sam-2').fill('Ready.');
  await d(page, 'reply-send-ask-sam-2').click();
  await expect(d(page, 'status-ask-sam-1')).toHaveText("Ready for Sam's 9 am ✓");
  await expect(d(page, 'status-ask-sam-2')).toHaveText("Ready for Sam's 9 am ✓");
});

test('F4a record before logging off, then offline at 6:30', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 4);
  await expect(d(page, 'relay-box-mtg-demo')).toContainText(
    'You end at 6:30 pm. The team starts at 7:30 pm. Relay it: record your demo by 6:30 pm. The team watches together at 9:00 am New York and pins questions for your morning.',
  );
  await expect(d(page, 'meeting-mtg-demo')).toContainText('Tue 7:30-8:00 pm');
  await expect(d(page, 'meeting-mtg-demo')).toContainText('Presenter: you · Organiser: Sam');
  await d(page, 'record-now').click();
  await expect(d(page, 'record-modal')).toBeVisible();
  await d(page, 'record-stop').click();
  await expect(d(page, 'record-done')).toHaveText('Relay ready · 7 min 12 s. The team will watch at 9:00 am New York.');
  await expect(d(page, 'my-presence')).toHaveText('Offline · back 9:30 am', { timeout: 6000 });
});

test('F4b team watches and pins questions', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 5);
  const room = d(page, 'meeting-room');
  await expect(room).toContainText('Checkout demo review · Relay');
  await expect(room).toContainText('Recorded by Jai at 6:04 pm IST');
  await expect(d(page, 'room-watchers')).toContainText('3 watching');
  await expect(d(page, 'room-banner')).toHaveText('Jai is offline. Questions go to his morning queue, answered by 11:00 pm your time.');
  await expect(d(page, 'pin-input')).toHaveAttribute('placeholder', 'Pin a question at 02:14');
  await d(page, 'pin-input').fill('Does the async fraud check change refund timing?');
  await d(page, 'pin-submit').click();
  await expect(d(page, 'room-pins')).toContainText('Dana:', { timeout: 5000 });
  await expect(d(page, 'room-pins')).toContainText('Luis:', { timeout: 5000 });
  await expect(d(page, 'room-pins')).toContainText('04:40');
  await expect(d(page, 'room-pins')).toContainText('06:05');
  await d(page, 'dm-jai').click();
  await expect(d(page, 'answers-banner')).toHaveText('Answers ready at your 9 am ✓');
});

test('F4c Fair Turn suggests Wed 7:30 am NY / 6:00 pm IST and keeps counts private', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 6);
  await d(page, 'new-meeting').click();
  await expect(page.getByText('Not a demo? Relay works best for presentations and demos.')).toBeVisible();
  await d(page, 'nm-title').fill('Launch go/no-go');
  await d(page, 'nm-live').click();
  const box = d(page, 'nm-relay-box');
  await expect(box).toContainText('No shared working hours with Jai. Someone joins outside their day.');
  await expect(box).toContainText('Wed 7:30-8:00 am your time');
  await expect(box).toContainText('6:00-6:30 pm for Jai, inside his day');
  await expect(d(page, 'nm-turn')).toHaveText('Your turn');
  await expect(d(page, 'nm-private')).toHaveText('Your off-hours call minutes this month: 60 → 90. Only you can see this.');
  await expect(box).not.toContainText('300');
  await d(page, 'nm-book').click();
  await d(page, 'tab-fairTurn').click();
  await expect(d(page, 'fair-own-count')).toContainText('90 min');
  await expect(d(page, 'fair-own-count')).toContainText('3 off-hours calls this month');
  const relay = page.locator('[data-demo="relay-panel"]');
  await expect(relay).not.toContainText('300');
  await expect(relay).not.toContainText('120');

  // Jai's view: his count only, and Sam's turn.
  await page.getByTestId('viewas-jai').click();
  await d(page, 'tab-fairTurn').click();
  await expect(d(page, 'fair-own-count')).toContainText('300 min');
  await expect(d(page, 'fair-own-count')).toContainText('10 off-hours calls this month');
  await expect(d(page, 'fair-invite')).toHaveText("Launch go/no-go · Wed 6:00 pm · inside your hours · Sam's turn");
  await expect(relay).not.toContainText('90 min');
});

test('next morning: questions top the queue and open the room at the timestamp', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 7);
  const bundle = d(page, 'bundle-row');
  await expect(bundle).toContainText('Checkout demo review · 3 questions');
  await expect(bundle).toContainText("From the team's 9 am");
  await expect(d(page, 'calendar-row')).toHaveText('Launch go/no-go · today 6:00 pm · inside your hours');
  await d(page, 'bundle-q-1').click();
  await expect(d(page, 'room-scrubber')).toHaveAttribute('aria-valuetext', '04:40');
  await expect(d(page, 'pin-answer-input')).toHaveAttribute('placeholder', 'Answer Dana');
});

test('every view-as shows times in its own zone', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 1);
  await page.getByTestId('viewas-priya').click();
  // Priya (London, 9:00 pm Mon) looks at Jai: back at 4:00 am her time.
  await expect(d(page, 'convo-header')).toContainText('2:30 am in Bangalore');
  await expect(d(page, 'convo-header')).toContainText('Asleep · back 4:00 am your time');
  await gotoBeat(page, 5);
  await page.getByTestId('viewas-priya').click();
  // 2:00 pm in London: Jai has logged off and is back at 4:00 am London time.
  await expect(d(page, 'convo-header')).toContainText('7:30 pm in Bangalore');
  await expect(d(page, 'convo-header')).toContainText('Asleep · back 4:00 am your time');
  await gotoBeat(page, 2);
  await page.getByTestId('viewas-sam').click();
  // 11:00 pm Monday in New York: Jai has just started his day.
  await expect(d(page, 'convo-header')).toContainText('9:30 am in Bangalore');
  await expect(d(page, 'convo-header')).toContainText('Active');
  await page.getByTestId('viewas-priya').click();
  await expect(d(page, 'convo-header')).toContainText('9:30 am in Bangalore');
  await expect(d(page, 'convo-header')).toContainText('Active');
});

test('Jai answers the pinned questions in the room, and they leave his queue', async ({ page }) => {
  await page.goto('/');
  await gotoBeat(page, 7);
  await expect(page.getByTestId('app-window').locator('nav[aria-label="App"]')).toContainText('2');
  await d(page, 'bundle-q-0').click();
  const input = d(page, 'pin-answer-input');
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('placeholder', 'Answer Sam');
  await expect(d(page, 'pin-input')).toHaveCount(0); // the presenter answers, he doesn't pin
  await input.fill("No. Refunds don't go through the fraud check, so their timing is unchanged.");
  await d(page, 'pin-answer-send').click();
  await expect(d(page, 'pin-answer-pin-sam')).toContainText("Ready for Sam's 9 am ✓");
  for (const id of ['pin-dana', 'pin-luis']) {
    await d(page, `pin-reply-${id}`).click();
    await d(page, 'pin-answer-input').fill('Answered.');
    await d(page, 'pin-answer-send').click();
  }
  await expect(d(page, 'pin-answer-pin-dana')).toContainText("Ready for Dana's 9 am ✓");
  await expect(d(page, 'pin-answer-pin-luis')).toContainText("Ready for Luis's 9 am ✓");
  // All three answered: only Alex's ask is left in the badge.
  await expect(page.getByTestId('app-window').locator('nav[aria-label="App"]')).toContainText('1');
  await expect(d(page, 'bundle-row').getByLabel('Answered')).toHaveCount(3);
});
