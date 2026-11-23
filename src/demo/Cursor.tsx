import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  x: number;
  y: number;
  visible: boolean;
  ripple: { x: number; y: number; key: number } | null;
  reduced: boolean;
  speed: number;
}

/** A 20px arrow that glides to targets. Coordinates are design px inside the app window. */
export function Cursor({ x, y, visible, ripple, reduced, speed }: Props) {
  return (
    <>
      <AnimatePresence>
        {ripple && !reduced && (
          <motion.span
            key={ripple.key}
            className="pointer-events-none absolute rounded-full border-2 border-magenta"
            style={{ left: ripple.x - 12, top: ripple.y - 12, width: 24, height: 24 }}
            initial={{ scale: 0.4, opacity: 0.9 }}
            animate={{ scale: 1.7, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 / speed, ease: 'easeOut' }}
            aria-hidden
          />
        )}
      </AnimatePresence>
      <motion.div
        className="pointer-events-none absolute left-0 top-0 z-10"
        initial={false}
        animate={{ x, y, opacity: visible ? 1 : 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.7 / speed, ease: [0.2, 0.8, 0.2, 1], opacity: { duration: 0.2 } }}
        aria-hidden
        data-testid="demo-cursor"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ filter: 'drop-shadow(0 2px 4px rgba(20,20,22,.35))', marginLeft: -3, marginTop: -2 }}>
          <path d="M3 2 L3 16.5 L6.9 12.9 L9.6 18.6 L12.2 17.4 L9.6 11.8 L15 11.6 Z" fill="#141416" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </>
  );
}
