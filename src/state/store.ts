import { create } from 'zustand';
import {
  ASKS,
  BEATS,
  CHANNEL_MESSAGES,
  SEED_REACTIONS,
  DM_ORDER,
  GONOGO_DURATION,
  GONOGO_TITLE,
  MONTH_COUNTS,
  MTG_DEMO,
  PEOPLE,
  PINS,
  RELAY_RECORDING,
  SAM1_REPLY,
  SAM2_DECISION,
  SAM2_NOTE,
  Z,
  localInstant,
  type Ask,
  type BeatId,
  type Decision,
  type Meeting,
  type MonthCount,
  type Need,
  type PersonId,
  type Pin,
  type ViewerId,
} from '../data/scenario';
import { fairTurnOptions } from '../logic/fairTurn';
import { nudgeFor, type NudgeBanner } from '../logic/nudge';
import { needsRelay } from '../logic/relay';
import { isWorking, lastWorkEnd, nextWorkStart, toDT, toISO, workEnd } from '../logic/time';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type View =
  | { kind: 'dm'; with: PersonId }
  | { kind: 'channel'; id: string }
  | { kind: 'room'; meetingId: string; atSec: number };
export type RelayTab = 'queue' | 'meetings' | 'fairTurn';
export type ConvoTarget = { kind: 'dm'; id: PersonId } | { kind: 'channel'; id: string };

export interface Message {
  id: string;
  from: PersonId;
  /** A DM has `to`; a channel message has `channel`. */
  to?: PersonId;
  channel?: string;
  at: string;
  text: string;
}

export interface Draft {
  text: string;
  stripOpen: boolean;
  about: string;
  need: Need | null;
  by: 'start' | 'end' | 'pick';
  pickTime: string; // 'HH:mm' in the sender's zone
  context: string;
  urgentOn: boolean;
  urgentReason: string;
}

export interface ReplyDraft {
  text: string;
  decision?: Decision;
}

export interface RecordState {
  open: boolean;
  meetingId: string | null;
  phase: 'recording' | 'uploading' | 'done';
}

export interface NewMeetingState {
  open: boolean;
  title: string;
  durationMin: number;
  withId: PersonId;
  mustBeLive: boolean;
  whyOpen: boolean;
  picking: boolean;
  optionIndex: number;
}

export interface DemoState {
  active: boolean;
  paused: boolean;
  stepIndex: number;
  speed: number;
  outro: boolean;
  runId: number;
}

export interface Scene {
  beat: BeatId;
  simTime: string;
  viewAs: ViewerId;
  view: View;
  relayTab: RelayTab;
  asks: Ask[];
  messages: Message[];
  meetings: Meeting[];
  pins: Pin[];
  counts: Record<ViewerId, MonthCount>;
  urgentUsed: Partial<Record<PersonId, number>>;
  morningToastFor: PersonId | null;
  nudge: (NudgeBanner & { for: PersonId }) | null;
  nudgesSentToday: number;
  queueSorted: boolean;
  bundleExpanded: boolean;
  draft: Draft;
  replyDrafts: Record<string, ReplyDraft>;
  pinDraft: string;
  /** The pinned question the presenter is answering in the room. */
  roomReplyPin: string | null;
  pinReplyDraft: string;
  roomPlaying: boolean;
  record: RecordState;
  newMeeting: NewMeetingState;
  /** Bumped when something should take keyboard focus (e.g. the first reply box). */
  focusKey: string | null;
  /** messageId -> emoji -> who reacted */
  reactions: Record<string, Record<string, PersonId[]>>;
  /** `${viewer}:${channel}` -> when the viewer last opened it */
  channelSeen: Record<string, string>;
  search: string;
}

export interface Store extends Scene {
  demo: DemoState;
  loadBeat: (n: BeatId) => void;
  setViewAs: (v: ViewerId) => void;
  openDM: (id: PersonId) => void;
  openChannel: (id: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  setSearch: (q: string) => void;
  openRoom: (meetingId: string, atSec?: number, pinId?: string) => void;
  openPinReply: (pinId: string) => void;
  setPinReplyDraft: (s: string) => void;
  answerPin: () => void;
  setTab: (t: RelayTab) => void;
  updateDraft: (d: Partial<Draft>) => void;
  sendCompleteAsk: () => void;
  sendPlain: () => void;
  dismissMorning: () => void;
  openQueueFromToast: () => void;
  sortQueue: () => void;
  dismissNudge: () => void;
  nudgeAnswer: () => void;
  nudgeRecord: () => void;
  setReplyDraft: (askId: string, d: Partial<ReplyDraft>) => void;
  sendReply: (askId: string) => void;
  keepLive: (meetingId: string) => void;
  startRecording: (meetingId: string) => void;
  stopRecording: () => void;
  closeRecording: () => void;
  setPinDraft: (s: string) => void;
  pinQuestion: () => void;
  seekRoom: (sec: number) => void;
  setRoomPlaying: (b: boolean) => void;
  toggleBundle: () => void;
  openNewMeeting: () => void;
  updateNewMeeting: (d: Partial<NewMeetingState>) => void;
  closeNewMeeting: () => void;
  bookMeeting: () => void;
  // demo
  startDemo: () => void;
  setDemo: (d: Partial<DemoState>) => void;
  exitDemo: (opts?: { toBeat?: BeatId }) => void;
}

// ---------------------------------------------------------------------------
// Timers (follow-ups like "Dana's pin arrives"). Cleared on every beat load so jumps are clean.
// ---------------------------------------------------------------------------
const timers = new Set<ReturnType<typeof setTimeout>>();
function later(fn: () => void, ms: number) {
  const speed = useStore.getState().demo.active ? useStore.getState().demo.speed : 1;
  const id = setTimeout(() => {
    timers.delete(id);
    fn();
  }, ms / speed);
  timers.add(id);
}
function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
}

// ---------------------------------------------------------------------------
// Beat loaders: full deterministic state for each moment.
// ---------------------------------------------------------------------------
const emptyDraft = (): Draft => ({
  text: '',
  stripOpen: false,
  about: '',
  need: null,
  by: 'start',
  pickTime: '12:00',
  context: '',
  urgentOn: false,
  urgentReason: '',
});

const emptyNewMeeting = (): NewMeetingState => ({
  open: false,
  title: '',
  durationMin: GONOGO_DURATION,
  withId: 'jai',
  mustBeLive: false,
  whyOpen: false,
  picking: false,
  optionIndex: 0,
});

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

const IST = (date: string, hm: string) => localInstant(Z.IST, date, hm);

function asksAt(simTime: string, opts: { excludeLive?: boolean } = {}): Ask[] {
  return Object.values(clone(ASKS))
    .filter((a) => a.sentAt <= simTime)
    .filter((a) => !(opts.excludeLive && a.from === 'sam'));
}

function markDone(asks: Ask[], id: string, doneAt: string, reply?: Ask['reply']): Ask[] {
  return asks.map((a) => (a.id === id ? { ...a, status: 'done', doneAt, reply } : a));
}

function gonogoMeeting(): Meeting {
  const start = localInstant(Z.NY, '2027-01-20', '07:30');
  const end = localInstant(Z.NY, '2027-01-20', '08:00');
  return {
    id: 'mtg-gonogo',
    title: GONOGO_TITLE,
    start,
    end,
    organiser: 'sam',
    attendees: ['sam', 'jai'],
    type: 'Call',
    mustBeLive: true,
    fairTurn: { whoseTurn: 'sam' },
  };
}

export function beatScene(n: BeatId): Scene {
  const info = BEATS[n - 1];
  const simTime = info.time;
  let asks: Ask[] = [];
  let meetings: Meeting[] = [clone(MTG_DEMO)];
  let pins: Pin[] = [];
  const counts = clone(MONTH_COUNTS);
  let view: View = { kind: 'dm', with: 'sam' };
  let relayTab: RelayTab = 'queue';
  let morningToastFor: PersonId | null = null;
  let nudge: Scene['nudge'] = null;
  let nudgesSentToday = 0;
  let queueSorted = true;
  let bundleExpanded = false;

  const tueAsks = () => asksAt(BEATS[1].time);
  const answeredMorning = (a: Ask[]) =>
    markDone(markDone(a, 'ask-wei', IST('2027-01-19', '09:45')), 'ask-priya', IST('2027-01-19', '10:05'));
  const answeredSam = (a: Ask[]) =>
    markDone(
      markDone(a, 'ask-sam-1', IST('2027-01-19', '17:36'), { text: SAM1_REPLY }),
      'ask-sam-2',
      IST('2027-01-19', '17:38'),
      { text: SAM2_NOTE, decision: SAM2_DECISION },
    );
  const relayed = (m: Meeting[]) => m.map((x) => (x.id === 'mtg-demo' ? { ...x, relay: { ...RELAY_RECORDING } } : x));

  switch (n) {
    case 1:
      asks = asksAt(simTime, { excludeLive: true });
      view = { kind: 'dm', with: 'jai' };
      relayTab = 'meetings';
      break;
    case 2:
      asks = tueAsks();
      morningToastFor = 'jai';
      queueSorted = false;
      break;
    case 3: {
      asks = answeredMorning(tueAsks());
      view = { kind: 'dm', with: 'priya' };
      const b = nudgeFor(PEOPLE.jai, simTime, asks, meetings, 0);
      nudge = b ? { ...b, for: 'jai' } : null;
      nudgesSentToday = 1;
      break;
    }
    case 4:
      asks = answeredSam(answeredMorning(tueAsks()));
      relayTab = 'meetings';
      nudgesSentToday = 1;
      break;
    case 5:
      asks = answeredSam(answeredMorning(tueAsks()));
      meetings = relayed(meetings);
      view = { kind: 'room', meetingId: 'mtg-demo', atSec: 134 };
      relayTab = 'meetings';
      nudgesSentToday = 1;
      break;
    case 6:
      asks = answeredSam(answeredMorning(tueAsks()));
      meetings = relayed(meetings);
      pins = clone(PINS);
      view = { kind: 'dm', with: 'jai' };
      relayTab = 'meetings';
      nudgesSentToday = 1;
      break;
    case 7:
      asks = answeredSam(answeredMorning(tueAsks()));
      meetings = [...relayed(meetings), gonogoMeeting()];
      pins = clone(PINS);
      counts.sam = { minutes: counts.sam.minutes + 30, calls: counts.sam.calls + 1 };
      bundleExpanded = true;
      break;
  }

  return {
    beat: n,
    simTime,
    viewAs: info.viewAs,
    view,
    relayTab,
    asks,
    messages: [],
    meetings,
    pins,
    counts,
    urgentUsed: {},
    morningToastFor,
    nudge,
    nudgesSentToday,
    queueSorted,
    bundleExpanded,
    draft: emptyDraft(),
    replyDrafts: {},
    pinDraft: '',
    roomReplyPin: null,
    pinReplyDraft: '',
    roomPlaying: false,
    record: { open: false, meetingId: null, phase: 'recording' },
    newMeeting: emptyNewMeeting(),
    focusKey: null,
    reactions: clone(SEED_REACTIONS),
    channelSeen: {},
    search: '',
  };
}

function defaultView(beat: BeatId, viewer: ViewerId): View {
  const scene = beatScene(beat);
  if (scene.viewAs === viewer) return scene.view;
  return { kind: 'dm', with: DM_ORDER[viewer][0] };
}

function defaultTab(beat: BeatId, viewer: ViewerId): RelayTab {
  const scene = beatScene(beat);
  if (scene.viewAs === viewer) return scene.relayTab;
  return viewer === 'sam' ? 'meetings' : 'queue';
}

let idSeq = 0;
const nextId = (p: string) => `${p}-${++idSeq}`;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useStore = create<Store>((set, get) => ({
  ...beatScene(1),
  demo: { active: false, paused: false, stepIndex: 0, speed: 1, outro: false, runId: 0 },

  loadBeat: (n) => {
    clearTimers();
    set({ ...beatScene(n) });
  },

  setViewAs: (v) => {
    const s = get();
    if (s.viewAs === v) return;
    set({
      viewAs: v,
      view: defaultView(s.beat, v),
      relayTab: defaultTab(s.beat, v),
      draft: emptyDraft(),
      newMeeting: emptyNewMeeting(),
      record: { open: false, meetingId: null, phase: 'recording' },
      roomPlaying: false,
    });
  },

  openDM: (id) => set({ view: { kind: 'dm', with: id }, draft: emptyDraft(), roomPlaying: false, roomReplyPin: null }),
  openChannel: (id) => {
    const s = get();
    set({
      view: { kind: 'channel', id },
      draft: emptyDraft(),
      roomPlaying: false,
      channelSeen: { ...s.channelSeen, [`${s.viewAs}:${id}`]: s.simTime },
    });
  },
  toggleReaction: (messageId, emoji) => {
    const s = get();
    const cur = s.reactions[messageId] ?? {};
    const who = cur[emoji] ?? [];
    const next = who.includes(s.viewAs) ? who.filter((p) => p !== s.viewAs) : [...who, s.viewAs];
    set({ reactions: { ...s.reactions, [messageId]: { ...cur, [emoji]: next } } });
  },
  setSearch: (search) => set({ search }),
  openRoom: (meetingId, atSec = 0, pinId) => {
    const s = get();
    const m = s.meetings.find((x) => x.id === meetingId);
    const pin = pinId ? s.pins.find((p) => p.id === pinId) : undefined;
    const answering = !!pin && !pin.reply && m?.presenter === s.viewAs;
    set({
      view: { kind: 'room', meetingId, atSec },
      roomPlaying: false,
      roomReplyPin: answering ? pin!.id : null,
      pinReplyDraft: '',
      focusKey: answering ? `pin-answer-${pin!.id}` : s.focusKey,
    });
  },
  openPinReply: (pinId) => {
    const s = get();
    const pin = s.pins.find((p) => p.id === pinId);
    if (!pin || s.view.kind !== 'room') return;
    set({
      view: { ...s.view, atSec: pin.atSec },
      roomPlaying: false,
      roomReplyPin: pinId,
      pinReplyDraft: '',
      focusKey: `pin-answer-${pinId}`,
    });
  },
  setPinReplyDraft: (pinReplyDraft) => set({ pinReplyDraft }),
  answerPin: () => {
    const s = get();
    const text = s.pinReplyDraft.trim();
    if (!s.roomReplyPin || !text) return;
    set({
      pins: s.pins.map((p) => (p.id === s.roomReplyPin ? { ...p, reply: { text, at: s.simTime } } : p)),
      roomReplyPin: null,
      pinReplyDraft: '',
    });
  },
  setTab: (t) => {
    set({ relayTab: t });
    if (t === 'queue') get().sortQueue();
  },

  updateDraft: (d) => set({ draft: { ...get().draft, ...d } }),

  sendCompleteAsk: () => {
    const s = get();
    if (s.view.kind !== 'dm') return;
    const to = s.view.with;
    const me = PEOPLE[s.viewAs];
    const d = s.draft;
    if (!d.about.trim() || !d.need) return;
    const used = s.urgentUsed[me.id] ?? 0;
    if (d.urgentOn && (!d.urgentReason.trim() || used >= 2)) return;
    const now = toDT(s.simTime);
    let by: string;
    if (d.by === 'start') by = toISO(nextWorkStart(me, now));
    else if (d.by === 'end') by = toISO(workEnd(me, now));
    else {
      const [hh, mm] = d.pickTime.split(':').map(Number);
      const day = nextWorkStart(me, now).setZone(me.zone);
      by = toISO(day.set({ hour: hh, minute: mm }));
    }
    const isStoryAsk = me.id === 'sam' && to === 'jai' && !s.asks.some((a) => a.id === 'ask-sam-1');
    const ask: Ask = {
      id: isStoryAsk ? 'ask-sam-1' : nextId('ask'),
      from: me.id,
      to,
      sentAt: s.simTime,
      about: d.about.trim(),
      need: d.need,
      by,
      byKind: d.by,
      context: (d.context.trim() || d.text.trim()),
      urgentReason: d.urgentOn ? d.urgentReason.trim() : undefined,
      status: 'open',
    };
    set({
      asks: [...s.asks, ask],
      draft: emptyDraft(),
      urgentUsed: d.urgentOn ? { ...s.urgentUsed, [me.id]: used + 1 } : s.urgentUsed,
    });
    // Story: Sam's second ask (go/no-go) follows two minutes later.
    if (isStoryAsk && !s.asks.some((a) => a.id === 'ask-sam-2')) {
      later(() => {
        const cur = get();
        if (cur.asks.some((a) => a.id === 'ask-sam-2')) return;
        const second = clone(ASKS['ask-sam-2']);
        set({ asks: [...cur.asks, second], simTime: second.sentAt });
      }, 1600);
    }
  },

  sendPlain: () => {
    const s = get();
    if (s.view.kind === 'room' || !s.draft.text.trim()) return;
    const target = s.view.kind === 'dm' ? { to: s.view.with } : { channel: s.view.id };
    set({
      messages: [...s.messages, { id: nextId('msg'), from: s.viewAs, ...target, at: s.simTime, text: s.draft.text.trim() }],
      draft: emptyDraft(),
    });
  },

  dismissMorning: () => set({ morningToastFor: null }),
  openQueueFromToast: () => {
    set({ morningToastFor: null, relayTab: 'queue' });
    // let the panel paint in arrival order first, then animate into ranked order
    later(() => set({ queueSorted: true }), 120);
  },
  sortQueue: () => {
    if (!get().queueSorted) later(() => set({ queueSorted: true }), 120);
  },

  dismissNudge: () => set({ nudge: null }),
  nudgeAnswer: () => {
    const n = get().nudge;
    if (!n) return;
    const first = n.items[0];
    set({ nudge: null, view: first ? { kind: 'dm', with: first.personId } : get().view, focusKey: first ? `reply-${first.askIds[0]}` : null });
  },
  nudgeRecord: () => {
    const n = get().nudge;
    if (!n || !n.meetings[0]) return;
    set({ nudge: null, relayTab: 'meetings' });
    get().startRecording(n.meetings[0].meetingId);
  },

  setReplyDraft: (askId, d) => {
    const cur = get().replyDrafts[askId] ?? { text: '' };
    set({ replyDrafts: { ...get().replyDrafts, [askId]: { ...cur, ...d } } });
  },
  sendReply: (askId) => {
    const s = get();
    const r = s.replyDrafts[askId];
    const ask = s.asks.find((a) => a.id === askId);
    if (!ask || !r || (!r.text.trim() && !r.decision)) return;
    set({
      asks: s.asks.map((a) =>
        a.id === askId ? { ...a, status: 'done', doneAt: s.simTime, reply: { text: r.text.trim(), decision: r.decision } } : a,
      ),
    });
  },

  keepLive: (meetingId) => set({ meetings: get().meetings.map((m) => (m.id === meetingId ? { ...m, keptLive: true } : m)) }),

  startRecording: (meetingId) => set({ record: { open: true, meetingId, phase: 'recording' } }),
  stopRecording: () => {
    const s = get();
    if (!s.record.open || s.record.phase !== 'recording') return;
    set({ record: { ...s.record, phase: 'uploading' } });
    later(() => {
      const cur = get();
      set({
        record: { ...cur.record, phase: 'done' },
        meetings: cur.meetings.map((m) => (m.id === cur.record.meetingId ? { ...m, relay: { ...RELAY_RECORDING } } : m)),
      });
      later(() => get().closeRecording(), 2200);
    }, 1200);
  },
  closeRecording: () => {
    const s = get();
    if (!s.record.open) return;
    const wasDone = s.record.phase === 'done';
    set({ record: { open: false, meetingId: null, phase: 'recording' } });
    if (wasDone) {
      // Jai has done everything for today: the clock moves on to his log-off.
      const me = PEOPLE[s.viewAs];
      const end = workEnd(me, s.simTime);
      if (isWorking(me, s.simTime) && toDT(s.simTime) < end) set({ simTime: toISO(end) });
    }
  },

  setPinDraft: (pinDraft) => set({ pinDraft }),
  pinQuestion: () => {
    const s = get();
    if (s.view.kind !== 'room' || !s.pinDraft.trim()) return;
    const meetingId = s.view.meetingId;
    const pin: Pin = { id: nextId('pin'), meetingId, by: s.viewAs, atSec: Math.floor(s.view.atSec), text: s.pinDraft.trim() };
    set({ pins: [...s.pins, pin], pinDraft: '' });
    if (meetingId === 'mtg-demo') {
      // The other watchers pin theirs a moment later.
      PINS.filter((p) => p.by !== s.viewAs).forEach((p, i) => {
        later(() => {
          const cur = get();
          if (cur.pins.some((x) => x.id === p.id)) return;
          set({ pins: [...cur.pins, clone(p)] });
        }, 1300 * (i + 1));
      });
    }
  },
  seekRoom: (sec) => {
    const v = get().view;
    if (v.kind === 'room') set({ view: { ...v, atSec: sec } });
  },
  setRoomPlaying: (roomPlaying) => set({ roomPlaying }),
  toggleBundle: () => set({ bundleExpanded: !get().bundleExpanded }),

  openNewMeeting: () => set({ newMeeting: { ...emptyNewMeeting(), open: true } }),
  updateNewMeeting: (d) => set({ newMeeting: { ...get().newMeeting, ...d } }),
  closeNewMeeting: () => set({ newMeeting: emptyNewMeeting() }),
  bookMeeting: () => {
    const s = get();
    const nm = s.newMeeting;
    const me = PEOPLE[s.viewAs];
    const other = PEOPLE[nm.withId];
    const { whoseTurn, options } = fairTurnOptions([me, other], nm.durationMin, s.counts, s.simTime);
    const opt = options[nm.optionIndex] ?? options[0];
    if (!opt) return;
    const meeting: Meeting = {
      id: 'mtg-gonogo',
      title: nm.title.trim() || GONOGO_TITLE,
      start: toISO(opt.start),
      end: toISO(opt.end),
      organiser: me.id,
      attendees: [me.id, other.id],
      type: 'Call',
      mustBeLive: true,
      fairTurn: { whoseTurn },
    };
    const counts = { ...s.counts };
    if (whoseTurn in counts && opt.offHoursMinutes > 0) {
      const k = whoseTurn as ViewerId;
      counts[k] = { minutes: counts[k].minutes + opt.offHoursMinutes, calls: counts[k].calls + 1 };
    }
    set({
      meetings: [...s.meetings.filter((m) => m.id !== 'mtg-gonogo'), meeting],
      counts,
      newMeeting: emptyNewMeeting(),
      relayTab: 'meetings',
    });
  },

  startDemo: () => {
    clearTimers();
    set({ demo: { ...get().demo, active: true, paused: false, stepIndex: 0, outro: false, runId: get().demo.runId + 1 } });
  },
  setDemo: (d) => set({ demo: { ...get().demo, ...d } }),
  exitDemo: (opts) => {
    clearTimers();
    set({ demo: { ...get().demo, active: false, paused: false, outro: false, runId: get().demo.runId + 1 } });
    if (opts?.toBeat) get().loadBeat(opts.toBeat);
  },
}));

export { clearTimers };

// ---------------------------------------------------------------------------
// Derived selectors
// ---------------------------------------------------------------------------

/** Pinned-question bundles waiting in a presenter's morning queue. */
type SceneLike = Pick<Scene, 'meetings' | 'pins' | 'simTime' | 'viewAs'>;

export function questionBundles(s: SceneLike, viewer: PersonId = s.viewAs) {
  return s.meetings
    .filter((m) => m.presenter === viewer && m.relay)
    .map((m) => ({ meeting: m, pins: s.pins.filter((p) => p.meetingId === m.id).sort((a, b) => a.atSec - b.atSec) }))
    .filter((b) => b.pins.length > 0 && toDT(s.simTime) >= nextWorkStart(PEOPLE[viewer], b.meeting.start));
}

/** Meetings the viewer presents that should be relayed and are not yet. */
export function relayDue(s: SceneLike, viewer: PersonId = s.viewAs) {
  return s.meetings.filter(
    (m) =>
      m.presenter === viewer &&
      !m.relay &&
      !m.keptLive &&
      toDT(s.simTime) < toDT(m.start) &&
      needsRelay(m, PEOPLE).needed,
  );
}

/** Channel messages the viewer hasn't seen: arrived while they were off since their last day ended, or since they last opened it. */
export function channelUnread(
  s: Pick<Scene, 'simTime' | 'viewAs' | 'messages' | 'channelSeen'>,
  channelId: string,
): number {
  const me = PEOPLE[s.viewAs];
  const seen = s.channelSeen[`${s.viewAs}:${channelId}`];
  const since = lastWorkEnd(me, s.simTime);
  return [...CHANNEL_MESSAGES, ...s.messages]
    .filter((m) => m.channel === channelId && m.from !== s.viewAs && m.at <= s.simTime)
    .filter((m) => (seen ? m.at > seen : toDT(m.at) > since && !isWorking(me, m.at))).length;
}

/** Badge count: open Relay items for the viewer. */
export function relayCount(s: Scene): number {
  const asks = s.asks.filter((a) => a.to === s.viewAs && a.status === 'open').length;
  const bundles = questionBundles(s).filter((b) => b.pins.some((p) => !p.reply)).length;
  return asks + relayDue(s).length + bundles;
}
