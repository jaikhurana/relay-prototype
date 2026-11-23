import { describe, expect, it } from 'vitest';
import { ASKS, MTG_DEMO, PEOPLE, Z, localInstant } from '../../data/scenario';
import { nudgeFor } from '../nudge';

// Beat 3: Wei and Priya already done.
const asks = Object.values(ASKS).map((a) => (a.id === 'ask-wei' || a.id === 'ask-priya' ? { ...a, status: 'done' as const } : a));
const at = (hm: string) => localInstant(Z.IST, '2027-01-19', hm);

describe('nudgeFor(jai)', () => {
  it('fires at Tue 17:30 IST with one grouped banner', () => {
    const b = nudgeFor(PEOPLE.jai, at('17:30'), asks, [MTG_DEMO], 0);
    expect(b).not.toBeNull();
    expect(b!.items).toHaveLength(1);
    expect(b!.items[0].personId).toBe('sam');
    expect(b!.items[0].askIds).toEqual(['ask-sam-1', 'ask-sam-2']);
    expect(b!.meetings.map((m) => m.meetingId)).toEqual(['mtg-demo']);
    expect(b!.index).toBe(1);
  });

  it('allows a ±1 minute window', () => {
    expect(nudgeFor(PEOPLE.jai, at('17:31'), asks, [MTG_DEMO], 0)).not.toBeNull();
  });

  it('does not fire at 17:00 or 17:45', () => {
    expect(nudgeFor(PEOPLE.jai, at('17:00'), asks, [MTG_DEMO], 0)).toBeNull();
    expect(nudgeFor(PEOPLE.jai, at('17:45'), asks, [MTG_DEMO], 0)).toBeNull();
  });

  it('returns null when 3 nudges were already sent today', () => {
    expect(nudgeFor(PEOPLE.jai, at('17:30'), asks, [MTG_DEMO], 3)).toBeNull();
  });

  it('never fires outside working hours (weekend)', () => {
    const sat = localInstant(Z.IST, '2027-01-23', '17:30');
    expect(nudgeFor(PEOPLE.jai, sat, asks, [MTG_DEMO], 0)).toBeNull();
  });

  it('skips the meeting once it is relayed', () => {
    const b = nudgeFor(PEOPLE.jai, at('17:30'), asks, [{ ...MTG_DEMO, relay: { recordedAt: at('17:20'), durationSec: 432 } }], 0);
    expect(b!.meetings).toHaveLength(0);
  });
});
