import type { DateTime } from 'luxon';
import { DateTime as DT, Interval } from 'luxon';
import type { Person, PersonId } from '../data/scenario';
import { minutesOutside, toDT, workIntervals, type Instant } from './time';

export interface Slot {
  start: DateTime;
  end: DateTime;
}

export interface FairTurnResult {
  slot: Slot;
  /** null when a slot inside everyone's hours exists. */
  whoseTurn: PersonId | null;
  /** Minutes of the slot outside the turn-taker's hours. */
  offHoursMinutes: number;
}

const GRID_MIN = 15;

/** The search window: the next 2 working days from `from` (weekends skipped). */
function windowEnd(from: DateTime): DateTime {
  let end = from;
  let workdays = 0;
  let cursor = from.startOf('day');
  while (workdays < 2) {
    if (cursor.weekday <= 5) workdays++;
    cursor = cursor.plus({ days: 1 });
    end = cursor;
  }
  return end;
}

function gridSlots(from: DateTime, to: DateTime, durationMin: number): Slot[] {
  const startMin = Math.ceil(from.toMillis() / 60000 / GRID_MIN) * GRID_MIN;
  let s = DT.fromMillis(startMin * 60000, { zone: 'utc' });
  const out: Slot[] = [];
  while (s.plus({ minutes: durationMin }) <= to) {
    out.push({ start: s, end: s.plus({ minutes: durationMin }) });
    s = s.plus({ minutes: GRID_MIN });
  }
  return out;
}

function fullyInside(p: Person, slot: Slot): boolean {
  return workIntervals(p, slot.start, slot.end).some((iv) => iv.engulfs(Interval.fromDateTimes(slot.start, slot.end)));
}

function distanceToHours(p: Person, slot: Slot): number {
  const ivs = workIntervals(p, slot.start.minus({ days: 3 }), slot.end.plus({ days: 3 }));
  let best = Infinity;
  for (const iv of ivs) {
    if (iv.start! < slot.end && iv.end! > slot.start) return 0;
    const d = iv.end! <= slot.start ? slot.start.diff(iv.end!, 'minutes').minutes : iv.start!.diff(slot.end, 'minutes').minutes;
    best = Math.min(best, d);
  }
  return best;
}

/** The participant with the fewest counted minutes (ties: first in the list). */
export function turnTaker(participants: Person[], counts: Partial<Record<PersonId, { minutes: number }>>): Person {
  return participants.reduce((best, p) => ((counts[p.id]?.minutes ?? 0) < (counts[best.id]?.minutes ?? 0) ? p : best));
}

/**
 * All candidate slots for the turn-taker, best first:
 * fully inside every other participant's hours, closest to the turn-taker's own hours.
 */
export function fairTurnOptions(
  participants: Person[],
  durationMin: number,
  counts: Partial<Record<PersonId, { minutes: number }>>,
  fromInstant: Instant,
): { whoseTurn: PersonId; options: (Slot & { offHoursMinutes: number })[] } {
  const from = toDT(fromInstant);
  const slots = gridSlots(from, windowEnd(from), durationMin);
  const taker = turnTaker(participants, counts);
  const others = participants.filter((p) => p.id !== taker.id);
  const options = slots
    .filter((s) => others.every((o) => fullyInside(o, s)))
    .map((s) => ({ ...s, offHoursMinutes: minutesOutside(taker, s.start, s.end), dist: distanceToHours(taker, s) }))
    .sort((a, b) => a.dist - b.dist || a.offHoursMinutes - b.offHoursMinutes || a.start.toMillis() - b.start.toMillis())
    .map(({ dist: _dist, ...rest }) => rest);
  return { whoseTurn: taker.id, options };
}

/**
 * Fair Turn. Search the next 2 working days on a 15-min grid.
 * - A slot inside everyone's hours: return the earliest, whoseTurn = null.
 * - Otherwise the participant with the fewest off-hours minutes this month takes the turn:
 *   the slot fully inside every other participant's hours, closest to the turn-taker's hours.
 * Never returns anyone's counts.
 */
export function fairTurn(
  participants: Person[],
  durationMin: number,
  counts: Partial<Record<PersonId, { minutes: number }>>,
  fromInstant: Instant,
): FairTurnResult | null {
  const from = toDT(fromInstant);
  const slots = gridSlots(from, windowEnd(from), durationMin);
  const shared = slots.find((s) => participants.every((p) => fullyInside(p, s)));
  if (shared) return { slot: shared, whoseTurn: null, offHoursMinutes: 0 };
  const { whoseTurn, options } = fairTurnOptions(participants, durationMin, counts, from);
  const best = options[0];
  if (!best) return null;
  return { slot: { start: best.start, end: best.end }, whoseTurn, offHoursMinutes: best.offHoursMinutes };
}
