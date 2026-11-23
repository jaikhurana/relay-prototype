import { describe, expect, it } from 'vitest';
import { MTG_DEMO, PEOPLE, Z } from '../../data/scenario';
import { needsRelay } from '../relay';
import { fmtDay, fmtTime } from '../time';

describe('needsRelay(mtg-demo)', () => {
  const r = needsRelay(MTG_DEMO, PEOPLE);
  it('is needed: Jai shares no working hours with Sam, Dana or Luis', () => {
    expect(r.needed).toBe(true);
  });
  it('record by Tue 18:30 IST', () => {
    expect(fmtTime(r.recordBy, Z.IST)).toBe('6:30 pm');
    expect(fmtDay(r.recordBy, Z.IST)).toBe('Tue');
  });
  it('is not needed when an attendee overlaps (Priya)', () => {
    expect(needsRelay({ ...MTG_DEMO, attendees: ['sam', 'priya'] }, PEOPLE).needed).toBe(false);
  });
  it('is not offered for calls', () => {
    expect(needsRelay({ ...MTG_DEMO, type: 'Call' }, PEOPLE).needed).toBe(false);
  });
});
