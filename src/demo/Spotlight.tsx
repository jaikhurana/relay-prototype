import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Measure a [data-demo] element in unscaled app-window coordinates. */
export function measure(id: string): Box | null {
  const root = document.getElementById('app-window');
  const el = document.querySelector<HTMLElement>(`[data-demo="${CSS.escape(id)}"]`);
  if (!root || !el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  const rr = root.getBoundingClientRect();
  const s = rr.width / 1280 || 1;
  return { left: (r.left - rr.left) / s, top: (r.top - rr.top) / s, width: r.width / s, height: r.height / s };
}

const PAD = 8;

/** Dims the window with a rounded cut-out around the target. Re-measures every frame. */
export function Spotlight({ target, reduced }: { target: string | null; reduced: boolean }) {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    if (!target) {
      setBox(null);
      return;
    }
    let raf = 0;
    const tick = () => {
      const b = measure(target);
      setBox((prev) => {
        if (!b) return null;
        if (prev && Math.abs(prev.left - b.left) < 0.5 && Math.abs(prev.top - b.top) < 0.5 && Math.abs(prev.width - b.width) < 0.5 && Math.abs(prev.height - b.height) < 0.5) return prev;
        return b;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <AnimatePresence>
      {box && (
        <motion.div
          key="spot"
          className="pointer-events-none absolute rounded-[10px]"
          style={{ boxShadow: '0 0 0 9999px rgba(20,20,22,.45)' }}
          initial={{ opacity: 0, left: box.left - PAD, top: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }}
          animate={{ opacity: 1, left: box.left - PAD, top: box.top - PAD, width: box.width + PAD * 2, height: box.height + PAD * 2 }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          aria-hidden
          data-testid="spotlight"
        />
      )}
    </AnimatePresence>
  );
}
