import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { create } from 'zustand';
import { PEOPLE, type BeatId } from '../data/scenario';
import { Avatar } from '../components/app/Avatar';
import { fmtTime, fmtWeekday } from '../logic/time';
import { useStore } from '../state/store';
import { CaptionBar } from './CaptionBar';
import { Cursor } from './Cursor';
import { Outro } from './Outro';
import { CHAPTERS, CHAPTER_STARTS, SCRIPT, STEP_OFFSETS, TOTAL_MS, cardMs, type ChapterId } from './script';
import { Spotlight, measure } from './Spotlight';

// ---------------------------------------------------------------------------
// UI state for the overlay (cursor, spotlight, caption)
// ---------------------------------------------------------------------------
interface DemoUi {
  caption: string;
  chapter: ChapterId;
  spot: string | null;
  cursor: { x: number; y: number; visible: boolean };
  ripple: { x: number; y: number; key: number } | null;
  stepStartV: number;
  /** "Tuesday 9:30 am · Bangalore" card shown when the story jumps in time. */
  timeCard: { chapter: ChapterId } | null;
}

export const useDemoUi = create<DemoUi>(() => ({
  caption: '',
  chapter: 'intro',
  spot: null,
  cursor: { x: 900, y: 520, visible: false },
  ripple: null,
  stepStartV: 0,
  timeCard: null,
}));

// ---------------------------------------------------------------------------
// Virtual clock: advances only while playing, at the chosen speed.
// ---------------------------------------------------------------------------
const clock = { v: 0, last: 0 };
function advance() {
  const t = performance.now();
  const d = useStore.getState().demo;
  if (clock.last && d.active && !d.paused) clock.v += (t - clock.last) * d.speed;
  clock.last = t;
}

class Cancelled extends Error {}

const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function frame(alive: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    requestAnimationFrame(() => {
      advance();
      if (!alive()) reject(new Cancelled());
      else resolve();
    });
  });
}

async function sleep(ms: number, alive: () => boolean) {
  const until = clock.v + ms;
  while (clock.v < until) await frame(alive);
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Scroll the nearest scrollable ancestor (inside the app window) so the element is visible. */
function ensureVisible(el: HTMLElement) {
  const root = document.getElementById('app-window');
  const scale = root ? root.getBoundingClientRect().width / 1280 || 1 : 1;
  let p = el.parentElement;
  while (p && p !== root) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && p.scrollHeight > p.clientHeight) {
      const pr = p.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      if (er.top < pr.top) p.scrollTop -= (pr.top - er.top) / scale + 12;
      else if (er.bottom > pr.bottom) p.scrollTop += (er.bottom - pr.bottom) / scale + 12;
      return;
    }
    p = p.parentElement;
  }
}

async function find(id: string, alive: () => boolean): Promise<HTMLElement | null> {
  const until = clock.v + 2000;
  while (clock.v < until) {
    const el = document.querySelector<HTMLElement>(`[data-demo="${CSS.escape(id)}"]`);
    if (el && el.getBoundingClientRect().width > 0) return el;
    await frame(alive);
  }
  return null;
}

async function moveTo(id: string, alive: () => boolean): Promise<HTMLElement | null> {
  const el = await find(id, alive);
  if (!el) return null;
  ensureVisible(el);
  await frame(alive);
  const b = measure(id);
  if (b) useDemoUi.setState({ cursor: { x: b.left + b.width / 2, y: b.top + b.height / 2, visible: true } });
  await sleep(prefersReduced() ? 60 : 750, alive);
  return el;
}

let rippleKey = 0;

async function run(from: number, alive: () => boolean) {
  const app = useStore.getState;
  for (let i = from; i < SCRIPT.length; i++) {
    const st = SCRIPT[i];
    app().setDemo({ stepIndex: i });
    const t0 = clock.v;
    useDemoUi.setState({ caption: st.caption, chapter: st.chapter, stepStartV: t0 });
    if (st.at) {
      useDemoUi.setState({ spot: null });
      app().loadBeat(Number(st.at.split('-')[1]) as BeatId);
    }
    if (st.viewAs) app().setViewAs(st.viewAs);
    await frame(alive);
    await frame(alive);
    const card = cardMs(i);
    if (card) {
      useDemoUi.setState({ timeCard: { chapter: st.chapter } });
      await sleep(card, alive);
      useDemoUi.setState({ timeCard: null });
      await sleep(250, alive);
    }
    const tAct = clock.v;

    switch (st.action) {
      case 'load':
        useDemoUi.setState({ spot: null });
        break;
      case 'move':
        if (st.target) await moveTo(st.target, alive);
        break;
      case 'highlight':
        if (st.target) {
          const el = await find(st.target, alive);
          if (el) ensureVisible(el);
          useDemoUi.setState({ spot: st.target });
        }
        break;
      case 'click': {
        useDemoUi.setState({ spot: null });
        if (!st.target) break;
        const el = await moveTo(st.target, alive);
        if (!el) break;
        const c = useDemoUi.getState().cursor;
        useDemoUi.setState({ ripple: { x: c.x, y: c.y, key: ++rippleKey } });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus();
        el.click();
        break;
      }
      case 'type': {
        useDemoUi.setState({ spot: null });
        if (!st.target || !st.text) break;
        const el = await moveTo(st.target, alive);
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) break;
        el.focus();
        const text = st.text;
        const start = clock.v;
        let shown = -1;
        while (shown < text.length) {
          const n = Math.min(text.length, Math.floor((clock.v - start) / 28));
          if (n !== shown) {
            setNativeValue(el, text.slice(0, n));
            shown = n === text.length ? text.length + 1 : n;
          }
          if (shown > text.length) break;
          await frame(alive);
        }
        break;
      }
      case 'wait':
        break;
    }

    const rest = st.ms - (clock.v - tAct);
    if (rest > 0) await sleep(rest, alive);
  }
  useDemoUi.setState({ spot: null });
  app().setDemo({ outro: true });
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------
function currentChapterIndex() {
  const i = useStore.getState().demo.stepIndex;
  return CHAPTERS.findIndex((c) => c.id === SCRIPT[i]?.chapter);
}

function jump(stepIndex: number) {
  const d = useStore.getState().demo;
  useDemoUi.setState({ spot: null, ripple: null, timeCard: null });
  useStore.getState().setDemo({ stepIndex, paused: false, outro: false, runId: d.runId + 1 });
}

export const demoControls = {
  toggle() {
    const d = useStore.getState().demo;
    if (d.outro) return;
    useStore.getState().setDemo({ paused: !d.paused });
  },
  prev() {
    const d = useStore.getState().demo;
    if (d.outro) return jump(CHAPTER_STARTS[CHAPTER_STARTS.length - 1]);
    jump(CHAPTER_STARTS[Math.max(0, currentChapterIndex() - 1)]);
  },
  next() {
    const ci = currentChapterIndex();
    if (ci >= CHAPTERS.length - 1) {
      useDemoUi.setState({ spot: null });
      const d = useStore.getState().demo;
      useStore.getState().setDemo({ outro: true, runId: d.runId + 1 });
      return;
    }
    jump(CHAPTER_STARTS[ci + 1]);
  },
  speed() {
    const steps = [0.75, 1, 1.5];
    const s = useStore.getState().demo.speed;
    const i = steps.indexOf(s);
    useStore.getState().setDemo({ speed: i === -1 ? 1 : steps[(i + 1) % steps.length] });
  },
  exit(toBeat?: BeatId) {
    useDemoUi.setState({ spot: null, ripple: null, timeCard: null, cursor: { ...useDemoUi.getState().cursor, visible: false } });
    useStore.getState().exitDemo(toBeat ? { toBeat } : undefined);
  },
  replay() {
    useDemoUi.setState({ spot: null, ripple: null });
    useStore.getState().startDemo();
  },
};

export function getProgress() {
  const d = useStore.getState().demo;
  if (d.outro) return 1;
  const i = d.stepIndex;
  const st = SCRIPT[i];
  if (!st) return 0;
  const inStep = Math.min(st.ms + cardMs(i), Math.max(0, clock.v - useDemoUi.getState().stepStartV));
  return (STEP_OFFSETS[i] + inStep) / TOTAL_MS;
}

// ---------------------------------------------------------------------------
// Hook: drives the script. Mounted once in Stage.
// ---------------------------------------------------------------------------
export function useDemoRunner() {
  const active = useStore((s) => s.demo.active);
  const runId = useStore((s) => s.demo.runId);
  const outro = useStore((s) => s.demo.outro);

  // Deep links: ?demo=1 (or #demo) autoplays, ?speed=4 for tests.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const speed = Number(q.get('speed'));
    if (speed > 0) useStore.getState().setDemo({ speed });
    if (q.get('demo') === '1' || window.location.hash === '#demo') useStore.getState().startDemo();
  }, []);

  useEffect(() => {
    if (!active || outro) return;
    let cancelled = false;
    const alive = () => !cancelled && useStore.getState().demo.runId === runId && useStore.getState().demo.active;
    clock.last = performance.now();
    run(useStore.getState().demo.stepIndex, alive).catch((e) => {
      if (!(e instanceof Cancelled)) throw e;
    });
    return () => {
      cancelled = true;
    };
  }, [active, runId, outro]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        demoControls.toggle();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        demoControls.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        demoControls.next();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        demoControls.exit();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active]);
}

// ---------------------------------------------------------------------------
// Overlay inside the app window's scale context
// ---------------------------------------------------------------------------
export function DemoOverlay() {
  const active = useStore((s) => s.demo.active);
  const outro = useStore((s) => s.demo.outro);
  const speed = useStore((s) => s.demo.speed);
  const spot = useDemoUi((s) => s.spot);
  const cursor = useDemoUi((s) => s.cursor);
  const ripple = useDemoUi((s) => s.ripple);
  const timeCard = useDemoUi((s) => s.timeCard);
  const [reduced] = useState(prefersReduced);
  if (!active) return null;
  return (
    <div
      className="absolute inset-0 z-50"
      data-testid="demo-overlay"
      onPointerDown={() => !outro && useStore.getState().setDemo({ paused: true })}
    >
      {!outro && <Spotlight target={spot} reduced={reduced} />}
      {!outro && <Cursor x={cursor.x} y={cursor.y} visible={cursor.visible} ripple={ripple} reduced={reduced} speed={speed} />}
      <AnimatePresence>{!outro && timeCard && <TimeCard key={timeCard.chapter} chapter={timeCard.chapter} reduced={reduced} />}</AnimatePresence>
      {outro && <Outro onTry={() => demoControls.exit(1)} onReplay={demoControls.replay} />}
    </div>
  );
}

/** Shown as the story jumps in time: the viewer's local time, plus the other two cities. */
function TimeCard({ chapter, reduced }: { chapter: ChapterId; reduced: boolean }) {
  const simTime = useStore((s) => s.simTime);
  const viewAs = useStore((s) => s.viewAs);
  const me = PEOPLE[viewAs];
  const others = (['jai', 'priya', 'sam'] as const).map((id) => PEOPLE[id]).filter((p) => p.city !== me.city);
  const label = CHAPTERS.find((c) => c.id === chapter)?.label ?? '';
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-ink/45"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      data-testid="time-card"
    >
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduced ? 0 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
        className="min-w-[380px] rounded-[18px] bg-white px-10 py-7 text-center shadow-toast"
      >
        <div className="text-13 font-bold uppercase tracking-[.06em] text-mtext">{label}</div>
        <div className="tnum mt-3 text-[44px] font-bold leading-none text-ink">{fmtTime(simTime, me.zone)}</div>
        <div className="mt-2 text-18 text-text">{`${fmtWeekday(simTime, me.zone)} · ${me.city}`}</div>
        <div className="mt-4 flex items-center justify-center gap-2 text-14 text-soft">
          <Avatar id={me.id} size={22} />
          {`Viewing as ${me.name}`}
        </div>
        <div className="tnum mt-4 flex justify-center gap-4 border-t border-line pt-3 text-13 text-mute">
          {others.map((p) => (
            <span key={p.id}>{`${p.city} ${fmtTime(simTime, p.zone)}`}</span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Caption bar, rendered at the bottom-centre of the stage. */
export function DemoCaptions() {
  const active = useStore((s) => s.demo.active);
  const outro = useStore((s) => s.demo.outro);
  const paused = useStore((s) => s.demo.paused);
  const speed = useStore((s) => s.demo.speed);
  const caption = useDemoUi((s) => s.caption);
  const chapter = useDemoUi((s) => s.chapter);
  const label = CHAPTERS.find((c) => c.id === chapter)?.label ?? '';
  return (
    <AnimatePresence>
      {active && !outro && (
        <CaptionBar
          key="captions"
          chapterLabel={paused ? `${label} · Paused` : label}
          caption={caption}
          paused={paused}
          speed={speed}
          getProgress={getProgress}
          onPrev={demoControls.prev}
          onNext={demoControls.next}
          onToggle={demoControls.toggle}
          onSpeed={demoControls.speed}
          onClose={() => demoControls.exit()}
        />
      )}
    </AnimatePresence>
  );
}
