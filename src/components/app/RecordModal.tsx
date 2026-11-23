import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { fmtClock, fmtTime } from '../../logic/time';
import { useStore } from '../../state/store';
import { Avatar } from './Avatar';

// p95 latency samples for the fake "Checkout latency" dashboard: 410 ms falling to 230 ms.
const P95 = [410, 404, 412, 407, 415, 406, 411, 403, 398, 405, 394, 381, 356, 332, 306, 285, 267, 253, 245, 239, 235, 232, 231, 230];

/** The dashboard Jai shares in his demo. A picture inside a video frame, so it scales as one SVG. */
export function FakeDashboard({ className = '' }: { className?: string }) {
  const W = 640;
  const H = 360;
  const pad = { l: 64, r: 64, t: 78, b: 46 };
  const yMin = 200;
  const yMax = 440;
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (P95.length - 1);
  const y = (v: number) => pad.t + ((yMax - v) * (H - pad.t - pad.b)) / (yMax - yMin);
  const path = P95.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const ticks = [250, 300, 350, 400];
  const last = P95.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={`block h-full w-full ${className}`} role="img" aria-label="Checkout latency, p95 falling from 410 ms to 230 ms">
      <rect width={W} height={H} fill="#FFFFFF" />
      <text x={pad.l - 40} y={36} fontSize="24" fontWeight="700" fill="#141416" fontFamily="DM Sans, sans-serif">
        Checkout latency
      </text>
      <text x={pad.l - 40} y={60} fontSize="15" fill="#77777F" fontFamily="DM Sans, sans-serif">
        p95 (ms)
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#ECEBE6" strokeWidth="1" />
          <text x={pad.l - 10} y={y(t) + 5} fontSize="14" textAnchor="end" fill="#77777F" fontFamily="DM Sans, sans-serif">
            {t}
          </text>
        </g>
      ))}
      <line x1={x(11)} x2={x(11)} y1={pad.t - 6} y2={H - pad.b} stroke="#C9C8C2" strokeWidth="1.5" strokeDasharray="4 4" />
      <text x={x(11) + 6} y={pad.t + 4} fontSize="14" fill="#55555F" fontFamily="DM Sans, sans-serif">
        build 4190
      </text>
      <text x={pad.l} y={H - pad.b + 26} fontSize="14" fill="#77777F" fontFamily="DM Sans, sans-serif">
        build 4182
      </text>
      <path d={path} fill="none" stroke="#3E6A8A" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(0)} cy={y(P95[0])} r="5" fill="#3E6A8A" stroke="#FFFFFF" strokeWidth="2" />
      <circle cx={x(last)} cy={y(P95[last])} r="5" fill="#3E6A8A" stroke="#FFFFFF" strokeWidth="2" />
      <text x={x(0) + 10} y={y(P95[0]) - 12} fontSize="15" fontWeight="700" fill="#2A2A30" fontFamily="DM Sans, sans-serif">
        410 ms
      </text>
      <text x={x(last)} y={y(P95[last]) - 14} fontSize="15" fontWeight="700" textAnchor="end" fill="#2A2A30" fontFamily="DM Sans, sans-serif">
        230 ms
      </text>
    </svg>
  );
}

export function RecordModal() {
  const record = useStore((s) => s.record);
  const meetings = useStore((s) => s.meetings);
  const demoActive = useStore((s) => s.demo.active);
  const speed = useStore((s) => s.demo.speed);
  const stopRecording = useStore((s) => s.stopRecording);
  const closeRecording = useStore((s) => s.closeRecording);
  const [elapsed, setElapsed] = useState(0);
  const m = meetings.find((x) => x.id === record.meetingId);
  const org = m ? PEOPLE[m.organiser] : null;
  const total = 7 * 60 + 12;

  useEffect(() => {
    if (!record.open) return;
    setElapsed(0);
    if (demoActive) {
      // Demo mode: the timer jumps 00:00 -> 07:12 over 3 s.
      const t0 = performance.now();
      const dur = 3000 / speed;
      let raf = 0;
      const tick = () => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        setElapsed(Math.round(p * total));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [record.open, demoActive, speed, total]);

  useEffect(() => {
    if (!record.open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !demoActive && closeRecording();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [record.open, demoActive, closeRecording]);

  return (
    <AnimatePresence>
      {record.open && m && (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-ink/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Record ${m.title}`}
            data-demo="record-modal"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex h-[460px] w-[720px] flex-col overflow-hidden rounded-card bg-white shadow-toast"
          >
            <div className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEC] px-2 py-0.5 text-12 font-bold text-[#C62828]">
                <motion.span
                  className="h-2 w-2 rounded-full bg-[#E53935]"
                  animate={record.phase === 'recording' ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                REC
              </span>
              <span className="tnum text-14 font-bold text-ink" aria-live="off">
                {fmtClock(record.phase === 'recording' ? elapsed : total)}
              </span>
              <span className="truncate text-14 text-soft">{m.title}</span>
              <span className="flex-1" />
              <button
                type="button"
                onClick={closeRecording}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-bg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative flex-1 bg-[#2A2A30] p-4">
              <div className="h-full overflow-hidden rounded-lg">
                <FakeDashboard />
              </div>
              <div className="absolute bottom-7 right-7">
                <Avatar id={m.presenter ?? 'jai'} size={56} ring />
              </div>
            </div>

            <div className="flex h-[72px] shrink-0 items-center gap-3 border-t border-line px-4">
              {record.phase === 'recording' && (
                <>
                  <span className="flex-1" />
                  <button
                    type="button"
                    onClick={stopRecording}
                    data-demo="record-stop"
                    className="h-9 rounded-input bg-magentafill px-4 text-14 font-bold text-white shadow-sm"
                  >
                    Stop & upload
                  </button>
                </>
              )}
              {record.phase === 'uploading' && (
                <div className="flex-1" role="progressbar" aria-label="Uploading">
                  <div className="h-2 overflow-hidden rounded-full bg-[#F1F0EC]">
                    <motion.div
                      className="h-full rounded-full bg-magenta"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.2 / (demoActive ? speed : 1), ease: 'linear' }}
                    />
                  </div>
                </div>
              )}
              {record.phase === 'done' && org && (
                <p className="flex items-center gap-2 text-14 font-medium text-ink" role="status" data-demo="record-done">
                  <CheckCircle2 size={18} className="text-success" aria-hidden />
                  {`Relay ready · 7 min 12 s. The team will watch at ${fmtTime(m.start, org.zone)} ${org.city}.`}
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
