import type { Page } from '@playwright/test';

export const d = (page: Page, id: string) => page.locator(`[data-demo="${id}"]`).first();

/** Collect console errors and page errors. */
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

export async function gotoBeat(page: Page, beat: number) {
  await page.click(`[data-testid=step-${beat}]`);
  await page.mouse.move(2, 2);
  await page.waitForTimeout(700);
}

/** A stable description of what the app window shows: its text plus every visible data-demo id. */
export async function signature(page: Page) {
  return page.evaluate(() => {
    const root = document.getElementById('app-window')!;
    const ids = [...root.querySelectorAll<HTMLElement>('[data-demo]')]
      .filter((e) => e.getBoundingClientRect().width > 0)
      .map((e) => e.dataset.demo)
      .join(',');
    const panel = document.querySelector('[data-testid=whats-happening]')?.textContent ?? '';
    return `${root.innerText}\n--\n${ids}\n--\n${panel}`;
  });
}
