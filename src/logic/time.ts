import { DateTime, Interval } from 'luxon';

/** Anything with working hours in an IANA zone. `Person` satisfies this. */
export interface WorkHours {
  zone: string;
  start: string; // 'HH:mm' local
  end: string; // 'HH:mm' local
}

export type Instant = string | DateTime;

/** Parse an instant into a UTC DateTime. Strings are ISO (UTC or with offset). */
export function toDT(i: Instant): DateTime {
  return typeof i === 'string' ? DateTime.fromISO(i, { zone: 'utc' }) : i.toUTC();
}

export function toISO(i: Instant): string {
  return toDT(i).toISO({ suppressMilliseconds: true }) as string;
}

function hm(s: string): { hour: number; minute: number } {
  const [hour, minute] = s.split(':').map(Number);
  return { hour, minute };
}

function atLocal(localDay: DateTime, s: string): DateTime {
  return localDay.set({ ...hm(s), second: 0, millisecond: 0 });
}

/** Mon-Fri are working days. */
export function isWorkday(local: DateTime): boolean {
  return local.weekday >= 1 && local.weekday <= 5;
}

/** Mon-Fri and within local hours (start inclusive, end exclusive). */
export function isWorking(p: WorkHours, instant: Instant): boolean {
  const local = toDT(instant).setZone(p.zone);
  if (!isWorkday(local)) return false;
  return local >= atLocal(local, p.start) && local < atLocal(local, p.end);
}

/** Today's local start (for the local date of `instant`), as UTC. */
export function workStart(p: WorkHours, instant: Instant): DateTime {
  return atLocal(toDT(instant).setZone(p.zone), p.start).toUTC();
}

/** Today's local end (for the local date of `instant`), as UTC. */
export function workEnd(p: WorkHours, instant: Instant): DateTime {
  return atLocal(toDT(instant).setZone(p.zone), p.end).toUTC();
}

/** The next local start strictly after `instant`, skipping weekends. */
export function nextWorkStart(p: WorkHours, instant: Instant): DateTime {
  const t = toDT(instant);
  const local = t.setZone(p.zone).startOf('day');
  for (let i = 0; i < 8; i++) {
    const day = local.plus({ days: i });
    if (!isWorkday(day)) continue;
    const s = atLocal(day, p.start);
    if (s > t) return s.toUTC();
  }
  throw new Error('No working day found within a week');
}

/** End of the previous working day (before the local date of `instant`). */
export function lastWorkEnd(p: WorkHours, instant: Instant): DateTime {
  let d = toDT(instant).setZone(p.zone).startOf('day').minus({ days: 1 });
  while (!isWorkday(d)) d = d.minus({ days: 1 });
  return atLocal(d, p.end).toUTC();
}

/** `instant` if the person is working now, otherwise their next start. */
export function availableFrom(p: WorkHours, instant: Instant): DateTime {
  return isWorking(p, instant) ? toDT(instant) : nextWorkStart(p, instant);
}

/** All working intervals that overlap [from, to]. */
export function workIntervals(p: WorkHours, from: Instant, to: Instant): Interval[] {
  const a = toDT(from);
  const b = toDT(to);
  const out: Interval[] = [];
  let day = a.setZone(p.zone).startOf('day').minus({ days: 1 });
  const lastDay = b.setZone(p.zone).startOf('day').plus({ days: 1 });
  while (day <= lastDay) {
    if (isWorkday(day)) {
      const iv = Interval.fromDateTimes(atLocal(day, p.start).toUTC(), atLocal(day, p.end).toUTC());
      if (iv.end! > a && iv.start! < b) out.push(iv);
    }
    day = day.plus({ days: 1 });
  }
  return out;
}

/** Minutes of [start, end) that fall outside the person's working hours. */
export function minutesOutside(p: WorkHours, start: Instant, end: Instant): number {
  const s = toDT(start);
  const e = toDT(end);
  const total = e.diff(s, 'minutes').minutes;
  const inside = workIntervals(p, s, e).reduce((acc, iv) => {
    const o = iv.intersection(Interval.fromDateTimes(s, e));
    return acc + (o ? o.length('minutes') : 0);
  }, 0);
  return Math.round(total - inside);
}

// ---------------------------------------------------------------------------
// Formatting. All output is lower-case am/pm, e.g. "2:30 am".
// ---------------------------------------------------------------------------
function local(i: Instant, zone: string): DateTime {
  return toDT(i).setZone(zone).setLocale('en-US');
}

/** "2:30 am" */
export function fmtTime(i: Instant, zone: string): string {
  return local(i, zone).toFormat('h:mm a').toLowerCase();
}

/** "9 am", "2:30 pm" (drops ":00") */
export function fmtTimeShort(i: Instant, zone: string): string {
  const d = local(i, zone);
  return (d.minute === 0 ? d.toFormat('h a') : d.toFormat('h:mm a')).toLowerCase();
}

/** "Tue" */
export function fmtDay(i: Instant, zone: string): string {
  return local(i, zone).toFormat('ccc');
}

/** "Tuesday" */
export function fmtWeekday(i: Instant, zone: string): string {
  return local(i, zone).toFormat('cccc');
}

/** "7:30-8:00 pm" or "11:30 am-12:00 pm" */
export function fmtRange(start: Instant, end: Instant, zone: string): string {
  const a = local(start, zone);
  const b = local(end, zone);
  if (a.toFormat('a') === b.toFormat('a')) {
    return `${a.toFormat('h:mm')}-${b.toFormat('h:mm a').toLowerCase()}`;
  }
  return `${a.toFormat('h:mm a').toLowerCase()}-${b.toFormat('h:mm a').toLowerCase()}`;
}

/** "07:12" from seconds */
export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Same local calendar day in `zone`? */
export function sameLocalDay(a: Instant, b: Instant, zone: string): boolean {
  return local(a, zone).hasSame(local(b, zone), 'day');
}

/** Whole local days from a to b in `zone` (calendar days, not 24h blocks). */
export function localDayDiff(a: Instant, b: Instant, zone: string): number {
  return Math.round(local(b, zone).startOf('day').diff(local(a, zone).startOf('day'), 'days').days);
}

const ABBR: Record<string, [string, string]> = {
  // [standard, summer]
  'Asia/Kolkata': ['IST', 'IST'],
  'Europe/London': ['GMT', 'BST'],
  'America/New_York': ['EST', 'EDT'],
  'America/Los_Angeles': ['PST', 'PDT'],
  'Asia/Singapore': ['SGT', 'SGT'],
};

/** "IST", "EST", "BST"… (luxon gives "GMT+5:30" for India, so we map common zones). */
export function zoneAbbr(zone: string, at: Instant): string {
  const d = toDT(at).setZone(zone);
  const pair = ABBR[zone];
  if (pair) return d.isInDST ? pair[1] : pair[0];
  return d.offsetNameShort ?? zone;
}

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------
export type PresenceKind = 'working' | 'asleep' | 'offline';

export interface PresenceInfo {
  kind: PresenceKind;
  label: string;
  backAt?: DateTime;
}

/**
 * Presence of `p` as seen by `viewer` at `now`. Times are in the viewer's zone.
 * - working: "Active"
 * - someone else, off: "Asleep · back 11:00 pm your time"
 * - yourself, off: "Offline · back 9:30 am"
 */
export function presence(p: WorkHours & { id?: string }, viewer: WorkHours & { id?: string }, now: Instant): PresenceInfo {
  if (isWorking(p, now)) return { kind: 'working', label: 'Active' };
  const back = nextWorkStart(p, now);
  const dayGap = localDayDiff(now, back, viewer.zone);
  const when = dayGap > 1 ? `${fmtDay(back, viewer.zone)} ${fmtTime(back, viewer.zone)}` : fmtTime(back, viewer.zone);
  const self = p.id !== undefined && p.id === viewer.id;
  if (self) return { kind: 'offline', label: `Offline · back ${when}`, backAt: back };
  return { kind: 'asleep', label: `Asleep · back ${when} your time`, backAt: back };
}
