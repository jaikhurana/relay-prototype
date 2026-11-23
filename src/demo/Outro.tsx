import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { BatonIcon } from '../components/app/BatonIcon';

export function Outro({ onTry, onReplay }: { onTry: () => void; onReplay: () => void }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[#EFEEEA]/80 backdrop-blur-[6px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      data-testid="outro"
      role="dialog"
      aria-modal="true"
      aria-label="Relay summary"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-[880px] rounded-[20px] border border-wline bg-white p-10 shadow-toast"
      >
        <div className="flex items-center justify-center gap-2.5">
          <BatonIcon size={32} />
          <span className="text-[28px] font-bold text-ink">Relay</span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5">
          <div className="rounded-[16px] border border-line bg-[#F4F3EF] p-7">
            <div className="text-13 font-bold uppercase tracking-[.06em] text-mute">Before Relay</div>
            <p className="mt-3 text-[26px] font-bold leading-[34px] text-text">{'1 day lost + 90\u00a0min of Jai\'s evening'}</p>
          </div>
          <div className="rounded-[16px] border-2 border-magenta bg-pink p-7">
            <div className="text-13 font-bold uppercase tracking-[.06em] text-mtext">With Relay</div>
            <p className="mt-3 text-[26px] font-bold leading-[34px] text-ink">{'Answer ready at Sam\'s 9\u00a0am. Jai offline by\u00a06:30.'}</p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onTry}
            data-testid="try-it"
            className="h-12 rounded-[10px] bg-magentafill px-6 text-15 font-bold text-white shadow-sm hover:bg-[#D60454]"
          >
            Try it yourself
          </button>
          <button
            type="button"
            onClick={onReplay}
            data-testid="replay"
            className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-wline px-5 text-15 font-medium text-text hover:bg-bg"
          >
            <RotateCcw size={16} aria-hidden />
            Replay
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
