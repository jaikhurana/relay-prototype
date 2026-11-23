import { DateTime } from 'luxon';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type PersonId = 'jai' | 'priya' | 'sam' | 'wei' | 'alex' | 'dana' | 'luis';
export type ViewerId = 'jai' | 'sam' | 'priya';
export type Need = 'Explanation' | 'Decision' | 'Review' | 'File' | 'Answer';
export type Decision = 'Yes' | 'No' | 'Yes, with risks';

export interface Person {
  id: PersonId;
  name: string;
  role: string;
  city: string;
  zone: string; // IANA
  start: string; // local 'HH:mm'
  end: string; // local 'HH:mm'
  avatar?: string;
  initials: string;
  initialsBg: string;
  /** Only the pronouns used in the brief's own copy. Anything else falls back to the name. */
  pronouns?: { subj?: string; poss?: string };
}

export interface Ask {
  id: string;
  from: PersonId;
  to: PersonId;
  sentAt: string; // UTC ISO
  about: string;
  need: Need;
  by: string; // UTC ISO
  /** Which "By when?" option the sender used, so the card can say "By: your 9:00 am". */
  byKind?: 'start' | 'end' | 'pick';
  context: string;
  urgentReason?: string;
  status: 'open' | 'done';
  doneAt?: string;
  reply?: { text: string; decision?: Decision };
}

export interface Meeting {
  id: string;
  title: string;
  /** Short name used inside sentences ("Your 7:30 pm demo review…"). */
  short?: string;
  start: string; // UTC ISO
  end: string; // UTC ISO
  organiser: PersonId;
  presenter?: PersonId;
  attendees: PersonId[];
  type: 'Demo' | 'Presentation' | 'Call';
  mustBeLive: boolean;
  relay?: { recordedAt: string; durationSec: number };
  keptLive?: boolean;
  fairTurn?: { whoseTurn: PersonId | null };
}

export interface Pin {
  id: string;
  meetingId: string;
  by: PersonId;
  atSec: number;
  text: string;
  /** The presenter's answer, written in their next morning. */
  reply?: { text: string; at: string };
}

export interface MonthCount {
  minutes: number;
  calls: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** A wall-clock time in a zone, as a UTC ISO string. luxon does the offset maths. */
export function localInstant(zone: string, date: string, hm: string): string {
  const [hour, minute] = hm.split(':').map(Number);
  const dt = DateTime.fromISO(date, { zone }).set({ hour, minute, second: 0, millisecond: 0 });
  return dt.toUTC().toISO({ suppressMilliseconds: true }) as string;
}

export const Z = {
  IST: 'Asia/Kolkata',
  LON: 'Europe/London',
  NY: 'America/New_York',
  SG: 'Asia/Singapore',
  LA: 'America/Los_Angeles',
} as const;

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------
export const WORKSPACE = 'Northwind Payments';
export const HOST_APP = 'Workspace';

const hasAvatar = (id: string) =>
  typeof __AVATARS__ !== 'undefined' && __AVATARS__.includes(id) ? `/avatars/${id}.svg` : undefined;

export const PEOPLE: Record<PersonId, Person> = {
  jai: {
    id: 'jai', name: 'Jai', role: 'Software engineer', city: 'Bangalore', zone: Z.IST,
    start: '09:30', end: '18:30', avatar: hasAvatar('jai'), initials: 'J', initialsBg: '#3E6A8A',
    pronouns: { subj: 'he', poss: 'his' },
  },
  priya: {
    id: 'priya', name: 'Priya', role: 'Product designer', city: 'London', zone: Z.LON,
    start: '09:00', end: '17:30', avatar: hasAvatar('priya'), initials: 'P', initialsBg: '#6A5A8C',
  },
  sam: {
    id: 'sam', name: 'Sam', role: 'Engineering manager', city: 'New York', zone: Z.NY,
    start: '09:00', end: '17:30', avatar: hasAvatar('sam'), initials: 'S', initialsBg: '#4C7A5C',
    pronouns: { poss: 'his' },
  },
  wei: {
    id: 'wei', name: 'Wei', role: 'QA lead', city: 'Singapore', zone: Z.SG,
    start: '09:00', end: '18:00', initials: 'W', initialsBg: '#2A7F62',
  },
  alex: {
    id: 'alex', name: 'Alex', role: 'Data engineer', city: 'San Francisco', zone: Z.LA,
    start: '09:00', end: '17:30', initials: 'A', initialsBg: '#77777F',
  },
  dana: {
    id: 'dana', name: 'Dana', role: 'Product manager', city: 'New York', zone: Z.NY,
    start: '09:00', end: '17:30', initials: 'D', initialsBg: '#5B6B8C',
  },
  luis: {
    id: 'luis', name: 'Luis', role: 'SRE', city: 'New York', zone: Z.NY,
    start: '09:00', end: '17:30', initials: 'L', initialsBg: '#8C5B3F',
  },
};

export const VIEWERS: ViewerId[] = ['jai', 'sam', 'priya'];

/** DM list order per viewer (everyone else in the workspace). */
export const DM_ORDER: Record<ViewerId, PersonId[]> = {
  jai: ['sam', 'priya', 'wei', 'alex', 'dana', 'luis'],
  sam: ['jai', 'dana', 'luis', 'priya', 'wei', 'alex'],
  priya: ['jai', 'sam', 'wei', 'alex', 'dana', 'luis'],
};

/** "he" / "his" where the brief uses them; otherwise the person's name. */
export function subj(id: PersonId): string {
  return PEOPLE[id].pronouns?.subj ?? PEOPLE[id].name;
}
export function poss(id: PersonId): string {
  return PEOPLE[id].pronouns?.poss ?? `${PEOPLE[id].name}'s`;
}

// ---------------------------------------------------------------------------
// Channels and ambient activity (so the host app feels lived-in)
// ---------------------------------------------------------------------------
export interface Channel {
  id: string;
  members: PersonId[];
}

export const CHANNELS: Channel[] = [
  { id: 'checkout-launch', members: ['sam', 'dana', 'luis', 'jai', 'priya', 'wei'] },
  { id: 'payments-api', members: ['jai', 'luis', 'alex', 'sam'] },
  { id: 'design-review', members: ['priya', 'dana', 'jai'] },
];

export interface ChannelMessage {
  id: string;
  channel: string;
  from: PersonId;
  at: string; // UTC ISO
  text: string;
}

export const CHANNEL_MESSAGES: ChannelMessage[] = [
  { id: 'cm-1', channel: 'checkout-launch', from: 'dana', at: localInstant(Z.NY, '2027-01-18', '10:15'), text: 'Launch checklist is up to date. Go/no-go is Thursday.' },
  { id: 'cm-2', channel: 'checkout-launch', from: 'luis', at: localInstant(Z.NY, '2027-01-18', '15:40'), text: 'Heads up: checkout p95 jumped after build 4182. Watching it.' },
  { id: 'cm-3', channel: 'checkout-launch', from: 'sam', at: localInstant(Z.NY, '2027-01-18', '16:05'), text: 'Asked Jai what changed in 4182. Answer due by my 9 am.' },
  { id: 'cm-4', channel: 'checkout-launch', from: 'wei', at: localInstant(Z.SG, '2027-01-19', '10:05'), text: 'APAC QA run is green, apart from the cache TTL question.' },
  { id: 'cm-5', channel: 'checkout-launch', from: 'sam', at: localInstant(Z.NY, '2027-01-19', '09:12'), text: "Jai's answer is in: build 4190 brings p95 back down. Thanks Jai 🙌" },
  { id: 'cm-6', channel: 'payments-api', from: 'luis', at: localInstant(Z.NY, '2027-01-18', '14:20'), text: 'v2 is on staging. Refunds endpoint is behind a flag for now.' },
  { id: 'cm-7', channel: 'payments-api', from: 'alex', at: localInstant(Z.LA, '2027-01-18', '11:25'), text: "Starting next sprint's capacity plan. I'll need the load-test script." },
  { id: 'cm-8', channel: 'design-review', from: 'priya', at: localInstant(Z.LON, '2027-01-18', '16:50'), text: 'Empty states v3 are up, with two copy options: A and B.' },
  { id: 'cm-9', channel: 'design-review', from: 'dana', at: localInstant(Z.NY, '2027-01-18', '12:20'), text: "I lean B. Jai, your call for tonight's build." },
];

export const QUICK_REACTIONS = ['👍', '👀', '✅', '🙌'];

/** Reactions already on messages when each beat loads. */
export const SEED_REACTIONS: Record<string, Record<string, PersonId[]>> = {
  'cm-1': { '✅': ['sam', 'luis'] },
  'cm-2': { '👀': ['sam', 'dana'] },
  'cm-4': { '👍': ['dana'] },
  'cm-5': { '🙌': ['dana', 'luis'] },
  'cm-8': { '👍': ['dana'] },
};

// ---------------------------------------------------------------------------
// Asks (all to Jai)
// ---------------------------------------------------------------------------
export const SAM1_ABOUT = 'Checkout latency dashboard · build 4182';
export const SAM1_CONTEXT = 'p95 went from 220 ms to 410 ms after build 4182. What changed?';
export const SAM1_REPLY =
  "The jump came from build 4182's new fraud check, which ran synchronously. Build 4190 makes it async; p95 is back to 230 ms in staging.";
export const SAM2_DECISION: Decision = 'Yes, with risks';
export const SAM2_NOTE = 'Ready. One risk: the refunds endpoint stays behind a flag until Friday.';

export const ASKS: Record<string, Ask> = {
  'ask-sam-1': {
    id: 'ask-sam-1', from: 'sam', to: 'jai',
    sentAt: localInstant(Z.NY, '2027-01-18', '16:00'),
    about: SAM1_ABOUT, need: 'Explanation',
    by: localInstant(Z.NY, '2027-01-19', '09:00'), byKind: 'start',
    context: SAM1_CONTEXT, status: 'open',
  },
  'ask-sam-2': {
    id: 'ask-sam-2', from: 'sam', to: 'jai',
    sentAt: localInstant(Z.NY, '2027-01-18', '16:02'),
    about: 'Payments API v2 · Thursday launch', need: 'Decision',
    by: localInstant(Z.NY, '2027-01-19', '09:00'), byKind: 'start',
    context: 'Go/no-go is Thursday. I need your call by my morning.', status: 'open',
  },
  'ask-wei': {
    id: 'ask-wei', from: 'wei', to: 'jai',
    sentAt: localInstant(Z.SG, '2027-01-19', '09:40'),
    about: 'Cache TTL for the APAC rollout', need: 'Answer',
    by: localInstant(Z.SG, '2027-01-19', '15:00'), byKind: 'pick',
    context: 'QA sign-off is blocked on this.', status: 'open',
  },
  'ask-priya': {
    id: 'ask-priya', from: 'priya', to: 'jai',
    sentAt: localInstant(Z.LON, '2027-01-18', '17:05'),
    about: 'Checkout empty states, v3', need: 'Decision',
    by: localInstant(Z.LON, '2027-01-19', '09:00'), byKind: 'start',
    context: "Which empty-state copy goes into tonight's build, A or B?", status: 'open',
  },
  'ask-alex': {
    id: 'ask-alex', from: 'alex', to: 'jai',
    sentAt: localInstant(Z.LA, '2027-01-18', '11:20'),
    about: 'Load-test script', need: 'File',
    by: localInstant(Z.LA, '2027-01-22', '17:30'), byKind: 'pick',
    context: "For next sprint's capacity plan.", status: 'open',
  },
};

export const NEEDS: Need[] = ['Explanation', 'Decision', 'Review', 'File', 'Answer'];
export const DECISIONS: Decision[] = ['Yes', 'No', 'Yes, with risks'];

// ---------------------------------------------------------------------------
// Meetings
// ---------------------------------------------------------------------------
export const MTG_DEMO: Meeting = {
  id: 'mtg-demo',
  title: 'Checkout demo review',
  short: 'demo review',
  start: localInstant(Z.NY, '2027-01-19', '09:00'),
  end: localInstant(Z.NY, '2027-01-19', '09:30'),
  organiser: 'sam',
  presenter: 'jai',
  attendees: ['sam', 'dana', 'luis'],
  type: 'Demo',
  mustBeLive: false,
};

export const GONOGO_TITLE = 'Launch go/no-go';
export const GONOGO_DURATION = 30;

export const RELAY_RECORDING = {
  recordedAt: localInstant(Z.IST, '2027-01-19', '18:04'),
  durationSec: 7 * 60 + 12,
};

// ---------------------------------------------------------------------------
// Pinned questions (team watch, Tue 9:00 am New York)
// ---------------------------------------------------------------------------
export const PINS: Pin[] = [
  { id: 'pin-sam', meetingId: 'mtg-demo', by: 'sam', atSec: 2 * 60 + 14, text: 'Does the async fraud check change refund timing?' },
  { id: 'pin-dana', meetingId: 'mtg-demo', by: 'dana', atSec: 4 * 60 + 40, text: 'Can we see p99 too, not just p95?' },
  { id: 'pin-luis', meetingId: 'mtg-demo', by: 'luis', atSec: 6 * 60 + 5, text: "What's the rollback plan if 4190 regresses?" },
];

/** Jai's answers to the pinned questions (next morning, in the demo). */
export const PIN_ANSWERS: Record<string, string> = {
  'pin-sam': "No. Refunds don't go through the fraud check, so their timing is unchanged.",
  'pin-dana': 'Yes, p99 is on the dashboard now, next to p95.',
  'pin-luis': 'Turn off the async flag and checkout falls back to the old check.',
};

// ---------------------------------------------------------------------------
// Fair Turn: January 2027 off-hours call minutes
// ---------------------------------------------------------------------------
export const MONTH_COUNTS: Record<ViewerId, MonthCount> = {
  jai: { minutes: 300, calls: 10 },
  sam: { minutes: 60, calls: 2 },
  priya: { minutes: 120, calls: 4 },
};

export const URGENT_CAP = 2;

// ---------------------------------------------------------------------------
// Beats (the story, in IST labels)
// ---------------------------------------------------------------------------
export type BeatId = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type FeatureId = 'F1' | 'F2' | 'F3' | 'F4';

export interface BeatInfo {
  id: BeatId;
  time: string; // UTC ISO
  viewAs: ViewerId;
  label: string;
  title: string;
  lines: [string, string];
  rule: string;
  feature: FeatureId;
}

export const BEATS: BeatInfo[] = [
  {
    id: 1, time: localInstant(Z.NY, '2027-01-18', '16:00'), viewAs: 'sam',
    label: '2:30 am · Sam asks a sleeping Jai', title: 'Sam asks a sleeping Jai',
    lines: [
      "4:00 pm in New York. Sam needs Jai, but it's 2:30 am in Bangalore.",
      "Jai is asleep, so the composer asks for four things he'll need.",
    ],
    rule: 'The prompts appear only when the receiver is offline.',
    feature: 'F1',
  },
  {
    id: 2, time: localInstant(Z.IST, '2027-01-19', '09:30'), viewAs: 'jai',
    label: "9:30 am · Jai's morning queue", title: "Jai's morning queue",
    lines: [
      '9:30 am in Bangalore. One notification, once a morning.',
      "Online now first, then whoever's day starts soonest.",
    ],
    rule: 'Asks due after your next workday are marked "can wait" and go last.',
    feature: 'F2',
  },
  {
    id: 3, time: localInstant(Z.IST, '2027-01-19', '17:30'), viewAs: 'jai',
    label: '5:30 pm · Log-off nudge', title: 'Log-off nudge',
    lines: [
      '5:30 pm: an hour before Jai logs off. One grouped nudge, max 3 a day.',
      "Jai answers Sam's two asks. Both ready before Sam's 9 am.",
    ],
    rule: 'Max 3 nudges a day, only inside working hours.',
    feature: 'F3',
  },
  {
    id: 4, time: localInstant(Z.IST, '2027-01-19', '18:00'), viewAs: 'jai',
    label: '6:00 pm · Jai records his demo', title: 'Jai records his demo',
    lines: [
      'The demo review is at 7:30 pm, after Jai logs off. No shared hours.',
      'So Jai records his demo before he leaves.',
    ],
    rule: 'If presenter and audience share no working hours, the presenter records before logging off.',
    feature: 'F4',
  },
  {
    id: 5, time: localInstant(Z.NY, '2027-01-19', '09:00'), viewAs: 'sam',
    label: "7:30 pm · Sam's team watches", title: "Sam's team watches",
    lines: [
      "9:00 am in New York. Sam's team watches Jai's demo together.",
      "Questions go to Jai's morning queue. No 8 pm call for Jai.",
    ],
    rule: "Pinned questions land in the presenter's next morning queue.",
    feature: 'F4',
  },
  {
    id: 6, time: localInstant(Z.NY, '2027-01-19', '09:20'), viewAs: 'sam',
    label: '7:50 pm · Fair Turn books a live call', title: 'Fair Turn books a live call',
    lines: [
      'Some calls must be live, like the launch go/no-go.',
      'Fair Turn picks Sam: fewest off-hours minutes this month.',
    ],
    rule: 'Each person sees only their own count; the organiser sees only the suggested time and whose turn it is.',
    feature: 'F4',
  },
  {
    id: 7, time: localInstant(Z.IST, '2027-01-20', '09:30'), viewAs: 'jai',
    label: 'Wed 9:30 am · Questions arrive', title: 'Questions arrive',
    lines: [
      "Next morning, the team's questions top Jai's queue.",
      'Jai answers each one at that moment in the demo.',
    ],
    rule: 'Nobody is notified at night. One notification per morning.',
    feature: 'F4',
  },
];

export const FEATURES: { id: FeatureId; label: string; short: string }[] = [
  { id: 'F1', label: 'Complete off-hours ask', short: 'Complete ask' },
  { id: 'F2', label: 'Morning queue', short: 'Morning queue' },
  { id: 'F3', label: 'Log-off nudge', short: 'Nudge' },
  { id: 'F4', label: 'Relay meeting + Fair Turn', short: 'Relay meeting' },
];
