import type { DateTime } from 'luxon';
import type { Ask, Person, PersonId } from '../data/scenario';
import { PEOPLE, URGENT_CAP, poss } from '../data/scenario';
import {
  availableFrom,
  fmtTime,
  fmtTimeShort,
  fmtWeekday,
  isWorking,
  lastWorkEnd,
  nextWorkStart,
  toDT,
  workEnd,
  type Instant,
} from './time';

export type QueueGroup = 'online' | 'next' | 'canWait';
export type PillTone = 'online' | 'magenta' | 'neutral' | 'grey';

export interface QueueRow {
  /** First ask in the row (rows group several asks from the same person). */
  ask: Ask;
  asks: Ask[];
  personId: PersonId;
  group: QueueGroup;
  effectiveDue: DateTime;
  /** When the asker is next at work (or now, if online). */
  askerStart: DateTime;
  reason: string;
  /** "Cache TTL for the APAC rollout" or "2 asks" */
  about: string;
  pill: { label: string; tone: PillTone };
}

const GROUP_ORDER: Record<QueueGroup, number> = { online: 0, next: 1, canWait: 2 };

/**
 * Morning queue ordering:
 *  1. online: the asker is working now. Sorted by ask.by.
 *  2. next: asker offline and the ask is due before my next workday. Sorted by the asker's next start.
 *     effectiveDue = min(ask.by, my workEnd today).
 *  3. canWait: due after my next workday start. Last.
 * Asks from the same person in the same group become one row ("2 asks").
 */
export function rankQueue(asks: Ask[], me: Person, now: Instant, people: Record<PersonId, Person> = PEOPLE): QueueRow[] {
  const t = toDT(now);
  // "Today" for me: if I'm off right now, the queue plans for my next working day.
  const myDay = availableFrom(me, t);
  const myEnd = workEnd(me, myDay);
  const myNext = nextWorkStart(me, myEnd);

  type Item = { ask: Ask; group: QueueGroup; due: DateTime; askerStart: DateTime };
  const items: Item[] = asks
    .filter((a) => a.to === me.id && a.status === 'open')
    .map((ask) => {
      const asker = people[ask.from];
      const by = toDT(ask.by);
      if (isWorking(asker, t)) return { ask, group: 'online' as const, due: by, askerStart: t };
      const askerStart = nextWorkStart(asker, t);
      if (by <= myNext) {
        const due = by < myEnd ? by : myEnd;
        return { ask, group: 'next' as const, due, askerStart };
      }
      return { ask, group: 'canWait' as const, due: by, askerStart };
    });

  // Group by (person, group)
  const rows = new Map<string, Item[]>();
  for (const it of items) {
    const key = `${it.ask.from}|${it.group}`;
    rows.set(key, [...(rows.get(key) ?? []), it]);
  }

  const out: QueueRow[] = [...rows.values()].map((list) => {
    list.sort((a, b) => a.due.toMillis() - b.due.toMillis() || a.ask.sentAt.localeCompare(b.ask.sentAt));
    const first = list[0];
    const asker = people[first.ask.from];
    const due = first.due;
    const group = first.group;
    let reason = '';
    let pill: QueueRow['pill'];
    if (group === 'online') {
      reason = `Online now. A quick reply unblocks ${asker.name} today.`;
      pill = { label: 'Online now', tone: 'online' };
    } else if (group === 'next') {
      const startsAfterMe = first.askerStart >= myEnd;
      if (startsAfterMe) {
        reason = `${asker.name} starts at ${fmtTime(first.askerStart, me.zone)}, after you log off. Answer by ${fmtTime(due, me.zone)} so it's ready for ${poss(asker.id)} ${fmtTimeShort(first.askerStart, asker.zone)}.`;
      } else {
        reason = `${asker.name}'s day starts next, at ${fmtTime(first.askerStart, me.zone)} your time.`;
      }
      pill = { label: `by ${fmtTime(due, me.zone)}`, tone: startsAfterMe ? 'magenta' : 'neutral' };
    } else {
      reason = `Due ${fmtWeekday(first.ask.by, asker.zone)}. Fine for tomorrow.`;
      pill = { label: 'Can wait', tone: 'grey' };
    }
    return {
      ask: first.ask,
      asks: list.map((l) => l.ask),
      personId: asker.id,
      group,
      effectiveDue: due,
      askerStart: first.askerStart,
      reason,
      about: list.length > 1 ? `${list.length} asks` : first.ask.about,
      pill,
    };
  });

  out.sort((a, b) => {
    const g = GROUP_ORDER[a.group] - GROUP_ORDER[b.group];
    if (g !== 0) return g;
    if (a.group === 'next') {
      return a.askerStart.toMillis() - b.askerStart.toMillis() || a.effectiveDue.toMillis() - b.effectiveDue.toMillis();
    }
    return a.effectiveDue.toMillis() - b.effectiveDue.toMillis();
  });
  return out;
}

/** Arrival order (oldest first), same row grouping as rankQueue. Used for the first-open animation. */
export function arrivalOrder(rows: QueueRow[]): QueueRow[] {
  const first = (r: QueueRow) => r.asks.reduce((m, a) => (a.sentAt < m ? a.sentAt : m), r.asks[0].sentAt);
  return [...rows].sort((a, b) => first(a).localeCompare(first(b)));
}

/** Asks that arrived since my last working day ended (for the morning toast). */
export function overnightCount(asks: Ask[], me: Person, now: Instant): number {
  const t = toDT(now);
  const since = lastWorkEnd(me, t);
  return asks.filter((a) => a.to === me.id && a.status === 'open' && toDT(a.sentAt) > since && toDT(a.sentAt) <= t).length;
}

// ---------------------------------------------------------------------------
// Urgent: needs a reason; max 2 per person per month; visible to the team lead.
// ---------------------------------------------------------------------------
export function urgentLeft(usedThisMonth: number): number {
  return Math.max(0, URGENT_CAP - usedThisMonth);
}

export function canSendUrgent(reason: string, usedThisMonth: number): boolean {
  return reason.trim().length > 0 && urgentLeft(usedThisMonth) > 0;
}

export function urgentLabel(usedThisMonth: number): string {
  return `${urgentLeft(usedThisMonth)} of ${URGENT_CAP} urgent left this month · Visible to your team lead`;
}
