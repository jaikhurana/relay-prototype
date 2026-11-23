import type { DateTime } from 'luxon';
import type { Ask, Meeting, Person, PersonId } from '../data/scenario';
import { PEOPLE } from '../data/scenario';
import { availableFrom, isWorking, nextWorkStart, toDT, toISO, workEnd, type Instant } from './time';

export const NUDGE_CAP = 3;
export const NUDGE_LEAD_MIN = 60;

export interface NudgeItem {
  personId: PersonId;
  askIds: string[];
  /** When this person is next at work. */
  askerStart: DateTime;
}

export interface NudgeMeeting {
  meetingId: string;
  start: DateTime;
}

export interface NudgeBanner {
  at: string; // UTC ISO
  items: NudgeItem[];
  meetings: NudgeMeeting[];
  /** 1-based: "Nudge 1 of 3 today" */
  index: number;
  cap: number;
}

/**
 * The log-off nudge. Fires only at workEnd - 60 min (±1 min), inside working hours, max 3 a day.
 * One grouped banner with:
 *  - every open ask from someone who won't be at work when I log off, unless it can wait
 *    (due after my next workday starts);
 *  - every meeting I present that starts after I log off and before I'm back, not yet relayed.
 */
export function nudgeFor(
  me: Person,
  now: Instant,
  openAsks: Ask[],
  meetings: Meeting[],
  sentToday: number,
  people: Record<PersonId, Person> = PEOPLE,
): NudgeBanner | null {
  if (sentToday >= NUDGE_CAP) return null;
  const t = toDT(now);
  if (!isWorking(me, t)) return null;
  const end = workEnd(me, t);
  const fireAt = end.minus({ minutes: NUDGE_LEAD_MIN });
  if (Math.abs(t.diff(fireAt, 'minutes').minutes) > 1) return null;
  const myNext = nextWorkStart(me, end);

  const byPerson = new Map<PersonId, NudgeItem>();
  for (const a of openAsks) {
    if (a.to !== me.id || a.status !== 'open') continue;
    const asker = people[a.from];
    const askerAt = availableFrom(asker, end);
    if (askerAt <= end) continue; // they are around when I log off
    if (toDT(a.by) > myNext) continue; // can wait
    const item = byPerson.get(asker.id) ?? { personId: asker.id, askIds: [], askerStart: nextWorkStart(asker, end) };
    item.askIds.push(a.id);
    byPerson.set(asker.id, item);
  }

  const ms: NudgeMeeting[] = meetings
    .filter((m) => m.presenter === me.id && !m.relay && !m.keptLive)
    .filter((m) => toDT(m.start) >= end && toDT(m.start) < myNext)
    .map((m) => ({ meetingId: m.id, start: toDT(m.start) }));

  const items = [...byPerson.values()];
  if (items.length === 0 && ms.length === 0) return null;
  return { at: toISO(t), items, meetings: ms, index: sentToday + 1, cap: NUDGE_CAP };
}
