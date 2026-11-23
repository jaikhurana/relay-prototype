import { type ReactNode, useRef } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'framer-motion';
import { Z } from '../../data/scenario';
import { fmtDay, fmtTime } from '../../logic/time';

const CITIES: { city: string; zone: string }[] = [
  { city: 'Bangalore', zone: Z.IST },
  { city: 'London', zone: Z.LON },
  { city: 'New York', zone: Z.NY },
];

const TIP_H = 86;

interface Tip {
  x: number;
  y: number;
  above: boolean;
  at: string;
}

const useTip = create<{ tip: Tip | null; show: (t: Tip) => void; hide: () => void }>((set) => ({
  tip: null,
  show: (tip) => set({ tip }),
  hide: () => set({ tip: null }),
}));

/** Position relative to the unscaled 1280x800 app window. */
function toAppCoords(el: HTMLElement) {
  const root = document.getElementById('app-window');
  if (!root) return null;
  const r = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  const scale = rr.width / 1280 || 1;
  return {
    left: (r.left - rr.left) / scale,
    top: (r.top - rr.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
  };
}

interface Props {
  at: string;
  children: ReactNode;
  className?: string;
  demo?: string;
}

/**
 * A time shown in the viewer's terms. Hover or focus to see the same instant
 * in Bangalore, London and New York.
 */
export function TimeTag({ at, children, className = '', demo }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const { show, hide } = useTip.getState();
  const open = () => {
    if (!ref.current) return;
    const c = toAppCoords(ref.current);
    if (!c) return;
    const above = c.top > 140;
    show({ x: c.left + c.width / 2, y: above ? c.top - 6 : c.top + c.height + 6, above, at });
  };
  return (
    <span
      ref={ref}
      tabIndex={0}
      data-demo={demo}
      className={`cursor-default rounded-[4px] underline decoration-[#C9C8C2] decoration-dotted underline-offset-[3px] ${className}`}
      onMouseEnter={open}
      onMouseLeave={hide}
      onFocus={open}
      onBlur={hide}
      aria-label={`${typeof children === 'string' ? children : ''} (${CITIES.map((c) => `${c.city} ${fmtTime(at, c.zone)}`).join(', ')})`}
    >
      {children}
    </span>
  );
}

/** Rendered once inside the app window. */
export function TipLayer() {
  const tip = useTip((s) => s.tip);
  return (
    <AnimatePresence>
      {tip && (
        <motion.div
          key={`${tip.at}-${tip.x}-${tip.y}`}
          initial={{ opacity: 0, y: tip.above ? 4 : -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          role="tooltip"
          className="pointer-events-none absolute z-[60] w-[208px] rounded-[10px] bg-ink px-3 py-2.5 text-white shadow-toast"
          style={{
            left: Math.min(Math.max(tip.x - 104, 8), 1280 - 216),
            top: tip.above ? tip.y - TIP_H : tip.y,
            height: TIP_H,
          }}
        >
          {CITIES.map((c) => (
            <div key={c.city} className="flex items-center justify-between py-[2px] text-13">
              <span className="text-[#C9C8C2]">{c.city}</span>
              <span className="tnum font-medium">
                {fmtTime(tip.at, c.zone)} <span className="text-[#A3A29C]">{fmtDay(tip.at, c.zone)}</span>
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
