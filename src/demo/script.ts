import { PINS, PIN_ANSWERS, SAM1_ABOUT, SAM1_CONTEXT, SAM1_REPLY, SAM2_NOTE, type ViewerId } from '../data/scenario';

export type ChapterId = 'intro' | 'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5' | 'ch6' | 'ch7';
export type DemoAction = 'load' | 'move' | 'click' | 'type' | 'highlight' | 'wait';

export interface DemoStep {
  chapter: ChapterId;
  /** Load this beat first. */
  at?: `beat-${1 | 2 | 3 | 4 | 5 | 6 | 7}`;
  viewAs?: ViewerId;
  action: DemoAction;
  /** Matches [data-demo="<target>"] in the real UI. */
  target?: string;
  /** For 'type'. */
  text?: string;
  /** ≤ 18 words. */
  caption: string;
  /** Minimum duration at 1×. */
  ms: number;
}

export const CHAPTERS: { id: ChapterId; label: string }[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'ch1', label: '1 · Complete ask' },
  { id: 'ch2', label: '2 · Morning queue' },
  { id: 'ch3', label: '3 · Log-off nudge' },
  { id: 'ch4', label: '4 · Record' },
  { id: 'ch5', label: '5 · Team watches' },
  { id: 'ch6', label: '6 · Fair Turn' },
  { id: 'ch7', label: '7 · Next morning' },
];

const C3a = "Jai answers Sam's first ask…";
const C3b = '…and gives his go/no-go call, with one risk flagged.';
const C5a = 'They pin questions at the exact moment in the demo.';
const C5b = "And Sam's two answers were waiting when his day began.";
const C6a = 'Some calls must be live, like the launch go/no-go.';
const C7a = 'Jai answers right there, at 02:14 in his demo.';
const C7b = "Then Dana's and Luis's questions, one by one.";

// Paced for a first-time viewer: each caption stays up long enough to read and watch (≈3.4 min at 1×).
export const SCRIPT: DemoStep[] = [
  // INTRO
  { chapter: 'intro', at: 'beat-1', action: 'load', caption: 'Meet Jai in Bangalore, Priya in London and Sam in New York. No hour is shared by all three.', ms: 9000 },

  // CH1 COMPLETE ASK, view Sam
  { chapter: 'ch1', at: 'beat-1', viewAs: 'sam', action: 'highlight', target: 'convo-header', caption: "4:00 pm in New York. Sam needs Jai, but it's 2:30 am in Bangalore.", ms: 4500 },
  { chapter: 'ch1', action: 'click', target: 'composer-input', caption: "Jai is asleep, so the composer asks for four things he'll need.", ms: 4500 },
  { chapter: 'ch1', action: 'type', target: 'strip-about', text: SAM1_ABOUT, caption: "What it's about…", ms: 4000 },
  { chapter: 'ch1', action: 'click', target: 'strip-need-Explanation', caption: '…what Sam needs…', ms: 2600 },
  { chapter: 'ch1', action: 'highlight', target: 'strip-by', caption: "…and by when. Sam's 9 am is 7:30 pm for Jai: a whole day.", ms: 5000 },
  { chapter: 'ch1', action: 'type', target: 'strip-context', text: SAM1_CONTEXT, caption: 'Context, so Jai can act without a round trip.', ms: 4500 },
  { chapter: 'ch1', action: 'highlight', target: 'strip-expected', caption: "Sam knows when to expect a reply. Jai's phone stays silent.", ms: 5000 },
  { chapter: 'ch1', action: 'click', target: 'strip-send', caption: 'Two complete asks, delivered quietly.', ms: 2800 },
  { chapter: 'ch1', action: 'highlight', target: 'message-list', caption: 'Two complete asks, delivered quietly.', ms: 4000 },

  // CH2 MORNING QUEUE, view Jai
  { chapter: 'ch2', at: 'beat-2', viewAs: 'jai', action: 'highlight', target: 'morning-toast', caption: '9:30 am in Bangalore. One notification, once a morning.', ms: 4000 },
  { chapter: 'ch2', action: 'click', target: 'morning-open', caption: "Online now first, then whoever's day starts soonest.", ms: 5000 },
  { chapter: 'ch2', action: 'highlight', target: 'queue-row-wei', caption: 'Wei is online now. A quick reply unblocks her today.', ms: 4000 },
  { chapter: 'ch2', action: 'highlight', target: 'queue-row-priya', caption: "Priya starts next, at 2:30 pm Jai's time.", ms: 4000 },
  { chapter: 'ch2', action: 'highlight', target: 'queue-row-sam', caption: 'Sam starts after Jai logs off, so his asks are due by 6:30 pm.', ms: 5000 },
  { chapter: 'ch2', action: 'highlight', target: 'queue-row-alex', caption: 'Due Friday, so it can wait.', ms: 3500 },

  // CH3 LOG-OFF NUDGE
  { chapter: 'ch3', at: 'beat-3', viewAs: 'jai', action: 'highlight', target: 'nudge-toast', caption: '5:30 pm: an hour before Jai logs off. One grouped nudge, max 3 a day.', ms: 5000 },
  { chapter: 'ch3', action: 'click', target: 'nudge-answer', caption: C3a, ms: 1600 },
  { chapter: 'ch3', action: 'type', target: 'reply-input-ask-sam-1', text: SAM1_REPLY, caption: C3a, ms: 5000 },
  { chapter: 'ch3', action: 'click', target: 'reply-send-ask-sam-1', caption: C3a, ms: 1300 },
  { chapter: 'ch3', action: 'click', target: 'decision-ask-sam-2-Yes, with risks', caption: C3b, ms: 1600 },
  { chapter: 'ch3', action: 'type', target: 'reply-input-ask-sam-2', text: SAM2_NOTE, caption: C3b, ms: 4200 },
  { chapter: 'ch3', action: 'click', target: 'reply-send-ask-sam-2', caption: C3b, ms: 1300 },
  { chapter: 'ch3', action: 'highlight', target: 'message-list', caption: "Both ready before Sam's 9 am.", ms: 4000 },

  // CH4 RECORD
  { chapter: 'ch4', at: 'beat-4', viewAs: 'jai', action: 'highlight', target: 'relay-box-mtg-demo', caption: 'The demo review is at 7:30 pm, after Jai logs off. No shared hours.', ms: 5000 },
  { chapter: 'ch4', action: 'click', target: 'record-now', caption: 'So Jai records his demo before he leaves.', ms: 6500 },
  { chapter: 'ch4', action: 'click', target: 'record-stop', caption: 'Relay ready.', ms: 5500 },
  { chapter: 'ch4', action: 'highlight', target: 'my-presence', caption: 'Jai is offline by 6:30.', ms: 4000 },

  // CH5 TEAM WATCHES, view Sam
  { chapter: 'ch5', at: 'beat-5', viewAs: 'sam', action: 'highlight', target: 'room-stage', caption: "9:00 am in New York. Sam's team watches Jai's demo together.", ms: 5000 },
  { chapter: 'ch5', action: 'type', target: 'pin-input', text: PINS[0].text, caption: C5a, ms: 4800 },
  { chapter: 'ch5', action: 'click', target: 'pin-submit', caption: C5a, ms: 1800 },
  { chapter: 'ch5', action: 'highlight', target: 'room-pins', caption: "Questions go to Jai's morning queue. No 8 pm call for Jai.", ms: 5000 },
  { chapter: 'ch5', action: 'click', target: 'dm-jai', caption: C5b, ms: 2200 },
  { chapter: 'ch5', action: 'highlight', target: 'answers-banner', caption: C5b, ms: 4500 },

  // CH6 FAIR TURN, view Sam
  { chapter: 'ch6', at: 'beat-6', viewAs: 'sam', action: 'click', target: 'new-meeting', caption: C6a, ms: 2000 },
  { chapter: 'ch6', action: 'type', target: 'nm-title', text: 'Launch go/no-go', caption: C6a, ms: 3800 },
  { chapter: 'ch6', action: 'click', target: 'nm-live', caption: 'No shared hour, so someone joins outside their day.', ms: 4500 },
  { chapter: 'ch6', action: 'highlight', target: 'nm-suggestion', caption: 'Fair Turn picks Sam: fewest off-hours minutes this month.', ms: 6000 },
  { chapter: 'ch6', action: 'click', target: 'nm-why', caption: 'Why this time? Fair Turn explains it right in the booking.', ms: 3000 },
  { chapter: 'ch6', action: 'highlight', target: 'nm-why-text', caption: 'It counts off-hours call minutes this month. The next one goes to whoever has fewest.', ms: 6500 },
  { chapter: 'ch6', action: 'highlight', target: 'nm-private', caption: "Counts stay private. No one sees anyone else's.", ms: 4500 },
  { chapter: 'ch6', action: 'click', target: 'nm-book', caption: 'Booked: 7:30 am for Sam, 6:00 pm for Jai.', ms: 4000 },

  // CH7 NEXT MORNING, view Jai: the questions arrive and Jai answers them
  { chapter: 'ch7', at: 'beat-7', viewAs: 'jai', action: 'highlight', target: 'bundle-row', caption: "Next morning, the team's questions top Jai's queue.", ms: 4500 },
  { chapter: 'ch7', action: 'click', target: 'bundle-q-0', caption: 'Each question opens the demo at the moment it was asked.', ms: 4000 },
  { chapter: 'ch7', action: 'type', target: 'pin-answer-input', text: PIN_ANSWERS['pin-sam'], caption: C7a, ms: 4500 },
  { chapter: 'ch7', action: 'click', target: 'pin-answer-send', caption: C7a, ms: 1600 },
  { chapter: 'ch7', action: 'click', target: 'pin-reply-pin-dana', caption: C7b, ms: 1600 },
  { chapter: 'ch7', action: 'type', target: 'pin-answer-input', text: PIN_ANSWERS['pin-dana'], caption: C7b, ms: 3000 },
  { chapter: 'ch7', action: 'click', target: 'pin-answer-send', caption: C7b, ms: 1200 },
  { chapter: 'ch7', action: 'click', target: 'pin-reply-pin-luis', caption: C7b, ms: 1500 },
  { chapter: 'ch7', action: 'type', target: 'pin-answer-input', text: PIN_ANSWERS['pin-luis'], caption: C7b, ms: 3200 },
  { chapter: 'ch7', action: 'click', target: 'pin-answer-send', caption: C7b, ms: 1200 },
  { chapter: 'ch7', action: 'highlight', target: 'room-pins', caption: "Every answer is ready for the team's 9 am. Nobody joins a call at night.", ms: 5000 },
  { chapter: 'ch7', action: 'highlight', target: 'calendar-row', caption: "And tonight's live call sits inside his day.", ms: 4000 },
];

/** A time card ("Tuesday 9:30 am · Bangalore") opens every chapter after the intro. */
export const CARD_MS = 1600;
export const cardMs = (i: number) =>
  SCRIPT[i].at && SCRIPT[i].chapter !== 'intro' && (i === 0 || SCRIPT[i - 1].chapter !== SCRIPT[i].chapter) ? CARD_MS : 0;

export const TOTAL_MS = SCRIPT.reduce((a, s, i) => a + s.ms + cardMs(i), 0);

/** Index of the first step of each chapter, in order. */
export const CHAPTER_STARTS: number[] = CHAPTERS.map((c) => SCRIPT.findIndex((s) => s.chapter === c.id));

/** Cumulative ms before each step. */
export const STEP_OFFSETS: number[] = SCRIPT.reduce<number[]>(
  (acc, _s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SCRIPT[i - 1].ms + cardMs(i - 1)],
  [],
);
