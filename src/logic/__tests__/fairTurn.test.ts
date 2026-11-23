import { describe, expect, it } from 'vitest';
import { MONTH_COUNTS, PEOPLE, Z, localInstant } from '../../data/scenario';
import { fairTurn } from '../fairTurn';
import { fmtDay, fmtRange } from '../time';

describe('fairTurn([jai, sam], 30) from Tue 09:20 NY', () => {
  const r = fairTurn([PEOPLE.jai, PEOPLE.sam], 30, MONTH_COUNTS, localInstant(Z.NY, '2027-01-19', '09:20'))!;

  it('suggests Wed 20 Jan 07:30-08:00 New York', () => {
    expect(fmtDay(r.slot.start, Z.NY)).toBe('Wed');
    expect(r.slot.start.setZone(Z.NY).toISODate()).toBe('2027-01-20');
    expect(fmtRange(r.slot.start, r.slot.end, Z.NY)).toBe('7:30-8:00 am');
  });
  it('= 18:00-18:30 IST, inside Jai’s day', () => {
    expect(fmtRange(r.slot.start, r.slot.end, Z.IST)).toBe('6:00-6:30 pm');
  });
  it("is Sam's turn, 30 off-hours minutes", () => {
    expect(r.whoseTurn).toBe('sam');
    expect(r.offHoursMinutes).toBe(30);
  });
  it('never returns counts', () => {
    expect(Object.keys(r).sort()).toEqual(['offHoursMinutes', 'slot', 'whoseTurn']);
    expect(JSON.stringify(r)).not.toMatch(/300|"minutes"/);
  });
  it('returns a shared slot with no turn when hours overlap', () => {
    const s = fairTurn([PEOPLE.jai, PEOPLE.priya], 30, MONTH_COUNTS, localInstant(Z.IST, '2027-01-19', '09:30'))!;
    expect(s.whoseTurn).toBeNull();
    expect(s.offHoursMinutes).toBe(0);
    expect(fmtRange(s.slot.start, s.slot.end, Z.IST)).toBe('2:30-3:00 pm');
  });
});
