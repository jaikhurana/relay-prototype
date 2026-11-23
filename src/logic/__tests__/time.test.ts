import { describe, expect, it } from 'vitest';
import { PEOPLE, Z, localInstant } from '../../data/scenario';
import { fmtDay, fmtRange, fmtTime, fmtTimeShort, isWorking, nextWorkStart, presence, workEnd, zoneAbbr } from '../time';

const { jai, sam, priya } = PEOPLE;

describe('isWorking / nextWorkStart', () => {
  const t = localInstant(Z.IST, '2027-01-19', '02:30'); // Tue 02:30 IST = Mon 4:00 pm NY

  it('Jai is not working at Tue 02:30 IST', () => {
    expect(isWorking(jai, t)).toBe(false);
  });

  it("Jai's next start, shown to Sam, is 11:00 pm Monday New York time", () => {
    const next = nextWorkStart(jai, t);
    expect(fmtTime(next, sam.zone)).toBe('11:00 pm');
    expect(fmtDay(next, sam.zone)).toBe('Mon');
    expect(fmtTime(next, jai.zone)).toBe('9:30 am');
  });

  it('start is inclusive and end is exclusive', () => {
    expect(isWorking(jai, localInstant(Z.IST, '2027-01-19', '09:30'))).toBe(true);
    expect(isWorking(jai, localInstant(Z.IST, '2027-01-19', '18:29'))).toBe(true);
    expect(isWorking(jai, localInstant(Z.IST, '2027-01-19', '18:30'))).toBe(false);
  });

  it('skips weekends', () => {
    const fri = localInstant(Z.IST, '2027-01-22', '19:00');
    expect(fmtDay(nextWorkStart(jai, fri), jai.zone)).toBe('Mon');
    expect(isWorking(jai, localInstant(Z.IST, '2027-01-23', '11:00'))).toBe(false);
  });

  it("workEnd is today's local end", () => {
    expect(fmtTime(workEnd(jai, localInstant(Z.IST, '2027-01-19', '10:00')), jai.zone)).toBe('6:30 pm');
  });
});

describe('DST: Sat 20 Mar 2027 (US on summer time, UK not yet)', () => {
  it("Sam's 09:00 New York = 18:30 IST", () => {
    const t = localInstant(Z.NY, '2027-03-20', '09:00');
    expect(fmtTime(t, Z.IST)).toBe('6:30 pm');
    expect(zoneAbbr(Z.NY, t)).toBe('EDT');
  });
  it("Priya's 09:00 London = 14:30 IST", () => {
    const t = localInstant(Z.LON, '2027-03-20', '09:00');
    expect(fmtTime(t, Z.IST)).toBe('2:30 pm');
    expect(zoneAbbr(Z.LON, t)).toBe('GMT');
  });
  it('in January, Sam 09:00 NY = 7:30 pm IST (winter)', () => {
    expect(fmtTime(localInstant(Z.NY, '2027-01-19', '09:00'), Z.IST)).toBe('7:30 pm');
    expect(zoneAbbr(Z.NY, localInstant(Z.NY, '2027-01-19', '09:00'))).toBe('EST');
  });
});

describe('IST half-hour offset formats correctly', () => {
  it('formats :30 minutes, never rounds to the hour', () => {
    const cases: [string, string][] = [
      [localInstant(Z.NY, '2027-01-18', '16:00'), '2:30 am'],
      [localInstant(Z.NY, '2027-01-18', '23:00'), '9:30 am'],
      [localInstant(Z.LON, '2027-01-19', '09:00'), '2:30 pm'],
      [localInstant(Z.SG, '2027-01-19', '15:00'), '12:30 pm'],
      [localInstant(Z.NY, '2027-01-20', '07:30'), '6:00 pm'],
    ];
    for (const [t, want] of cases) {
      const got = fmtTime(t, Z.IST);
      expect(got).toBe(want);
      expect(got).not.toMatch(/^(2|3):00/);
    }
  });
  it('short format keeps half hours', () => {
    expect(fmtTimeShort(localInstant(Z.IST, '2027-01-19', '14:30'), Z.IST)).toBe('2:30 pm');
    expect(fmtTimeShort(localInstant(Z.NY, '2027-01-19', '09:00'), Z.NY)).toBe('9 am');
  });
  it('ranges', () => {
    const s = localInstant(Z.NY, '2027-01-19', '09:00');
    const e = localInstant(Z.NY, '2027-01-19', '09:30');
    expect(fmtRange(s, e, Z.IST)).toBe('7:30-8:00 pm');
    expect(fmtRange(s, e, Z.NY)).toBe('9:00-9:30 am');
  });
});

describe('presence', () => {
  it("Sam sees Jai asleep, back 11:00 pm his time", () => {
    const t = localInstant(Z.NY, '2027-01-18', '16:00');
    expect(presence(jai, sam, t).label).toBe('Asleep · back 11:00 pm your time');
  });
  it("Jai sees himself offline at 6:30 pm, back 9:30 am", () => {
    const t = localInstant(Z.IST, '2027-01-19', '18:30');
    expect(presence(jai, jai, t).label).toBe('Offline · back 9:30 am');
  });
  it('working shows Active', () => {
    expect(presence(priya, jai, localInstant(Z.LON, '2027-01-19', '12:00')).label).toBe('Active');
  });
});
