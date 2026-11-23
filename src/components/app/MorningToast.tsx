import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { HOST_APP, PEOPLE } from '../../data/scenario';
import { overnightCount } from '../../logic/queue';
import { useStore } from '../../state/store';
import { BatonIcon } from './BatonIcon';

export function MorningToast() {
  const forId = useStore((s) => s.morningToastFor);
  const viewAs = useStore((s) => s.viewAs);
  const asks = useStore((s) => s.asks);
  const simTime = useStore((s) => s.simTime);
  const open = useStore((s) => s.openQueueFromToast);
  const dismiss = useStore((s) => s.dismissMorning);
  const show = forId !== null && forId === viewAs;
  const me = PEOPLE[viewAs];
  const n = overnightCount(asks, me, simTime);

  return (
    <div aria-live="polite" className="pointer-events-none absolute right-4 top-12 z-30">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto w-[360px] rounded-[14px] border border-line bg-white/95 p-3.5 shadow-toast backdrop-blur"
            data-demo="morning-toast"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-pink">
                <BatonIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-12 font-medium text-mute">{`${HOST_APP} · Relay`}</div>
                <p className="mt-0.5 text-14 font-medium leading-5 text-ink">
                  {`Good morning, ${me.name}. ${n} asks arrived overnight, sorted for you.`}
                </p>
                <button
                  type="button"
                  onClick={open}
                  data-demo="morning-open"
                  className="mt-2.5 h-8 rounded-input bg-magentafill px-3 text-13 font-bold text-white shadow-sm"
                >
                  Open queue
                </button>
              </div>
              <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-mute hover:bg-bg">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
