import { describe, expect, it } from 'vitest';
import { ASKS, PEOPLE, Z, localInstant } from '../../data/scenario';
import { arrivalOrder, canSendUrgent, overnightCount, rankQueue, urgentLabel } from '../queue';
import { fmtTime } from '../time';

const allAsks = Object.values(ASKS);
const now = localInstant(Z.IST, '2027-01-19', '09:30');

describe('rankQueue at Tue 09:30 IST', () => {
  const rows = rankQueue(allAsks, PEOPLE.jai, now);

  it('orders wei, priya, sam, alex', () => {
    expect(rows.map((r) => r.personId)).toEqual(['wei', 'priya', 'sam', 'alex']);
    expect(rows.map((r) => r.group)).toEqual(['online', 'next', 'next', 'canWait']);
  });

  it('due times in IST', () => {
    expect(fmtTime(rows[0].effectiveDue, Z.IST)).toBe('12:30 pm');
    expect(fmtTime(rows[1].effectiveDue, Z.IST)).toBe('2:30 pm');
    expect(fmtTime(rows[2].effectiveDue, Z.IST)).toBe('6:30 pm');
  });

  it("groups Sam's two asks into one row", () => {
    expect(rows[2].asks.map((a) => a.id)).toEqual(['ask-sam-1', 'ask-sam-2']);
    expect(rows[2].about).toBe('2 asks');
  });

  it('pills and why-lines match the spec', () => {
    expect(rows.map((r) => r.pill.label)).toEqual(['Online now', 'by 2:30 pm', 'by 6:30 pm', 'Can wait']);
    expect(rows[2].pill.tone).toBe('magenta');
    expect(rows[0].reason).toBe('Online now. A quick reply unblocks Wei today.');
    expect(rows[1].reason).toBe("Priya's day starts next, at 2:30 pm your time.");
    expect(rows[2].reason).toBe("Sam starts at 7:30 pm, after you log off. Answer by 6:30 pm so it's ready for his 9 am.");
    expect(rows[3].reason).toBe('Due Friday. Fine for tomorrow.');
  });

  it('arrival order differs (for the reorder animation)', () => {
    expect(arrivalOrder(rows).map((r) => r.personId)).toEqual(['priya', 'alex', 'sam', 'wei']);
  });

  it('5 asks arrived overnight', () => {
    expect(overnightCount(allAsks, PEOPLE.jai, now)).toBe(5);
  });

  it('done asks leave the queue', () => {
    const r = rankQueue(allAsks.map((a) => (a.id === 'ask-wei' ? { ...a, status: 'done' as const } : a)), PEOPLE.jai, now);
    expect(r.map((x) => x.personId)).toEqual(['priya', 'sam', 'alex']);
  });
});

describe('urgent', () => {
  it('needs a reason and respects the cap of 2 a month', () => {
    expect(canSendUrgent('', 0)).toBe(false);
    expect(canSendUrgent('Prod is down', 0)).toBe(true);
    expect(canSendUrgent('Prod is down', 2)).toBe(false);
    expect(urgentLabel(0)).toBe('2 of 2 urgent left this month · Visible to your team lead');
  });
});
