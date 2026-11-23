import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { CHAPTER_STARTS, STEP_OFFSETS, TOTAL_MS } from './script';

interface Props {
  chapterLabel: string;
  caption: string;
  paused: boolean;
  speed: number;
  getProgress: () => number;
  onPrev: () => void;
  onNext: () => void;
  onToggle: () => void;
  onSpeed: () => void;
  onClose: () => void;
}

const ctrl = 'flex h-9 w-9 items-center justify-center rounded-input text-text hover:bg-[#F1F0EC]';

export function CaptionBar(p: Props) {
  const bar = useRef<HTMLDivElement>(null);
  const progress = useRef(p.getProgress);
  progress.current = p.getProgress;
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (bar.current) bar.current.style.width = `${Math.min(100, progress.current() * 100).toFixed(2)}%`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-card bg-white shadow-toast"
      data-testid="caption-bar"
      data-demo-controls
    >
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[#F1F0EC]" aria-hidden>
        <div ref={bar} className="h-full bg-magenta" style={{ width: 0 }} />
        {CHAPTER_STARTS.slice(1).map((i) => (
          <span key={i} className="absolute top-0 h-[3px] w-[2px] bg-white" style={{ left: `${(STEP_OFFSETS[i] / TOTAL_MS) * 100}%` }} />
        ))}
      </div>
      <div className="flex items-center gap-4 px-5 pb-3.5 pt-4">
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className="text-12 font-bold uppercase tracking-[.06em] text-mtext">{p.chapterLabel}</div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={p.caption}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="mt-0.5 text-18 text-ink"
              data-testid="caption"
            >
              {p.caption}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button type="button" className={ctrl} onClick={p.onPrev} aria-label="Previous chapter">
            <SkipBack size={17} />
          </button>
          <button type="button" className={ctrl} onClick={p.onToggle} aria-label={p.paused ? 'Play' : 'Pause'} data-testid="demo-toggle">
            {p.paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} fill="currentColor" />}
          </button>
          <button type="button" className={ctrl} onClick={p.onNext} aria-label="Next chapter">
            <SkipForward size={17} />
          </button>
          <button
            type="button"
            onClick={p.onSpeed}
            aria-label={`Speed ${p.speed}×`}
            className="tnum ml-1 h-8 min-w-[44px] rounded-full border border-wline px-2 text-13 font-bold text-text hover:bg-[#F1F0EC]"
          >
            {`${p.speed}×`}
          </button>
          <button type="button" className={`${ctrl} ml-1`} onClick={p.onClose} aria-label="Exit demo" data-testid="demo-exit">
            <X size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
