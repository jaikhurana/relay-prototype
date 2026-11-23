import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { HOST_APP, MTG_DEMO, PEOPLE, poss } from '../../data/scenario';
import { fmtTime, fmtTimeShort } from '../../logic/time';
import { useStore } from '../../state/store';
import { BatonIcon } from './BatonIcon';

export function NudgeToast() {
  const nudge = useStore((s) => s.nudge);
  const viewAs = useStore((s) => s.viewAs);
  const meetings = useStore((s) => s.meetings);
  const answer = useStore((s) => s.nudgeAnswer);
  const record = useStore((s) => s.nudgeRecord);
  const dismiss = useStore((s) => s.dismissNudge);
  const show = !!nudge && nudge.for === viewAs;
  const me = PEOPLE[viewAs];

  return (
    <div aria-live="polite" className="pointer-events-none absolute right-4 top-12 z-30">
      <AnimatePresence>
        {show && nudge && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="pointer-events-auto w-[380px] rounded-[14px] border border-line border-l-[3px] border-l-magenta bg-white/95 p-3.5 shadow-toast backdrop-blur"
            data-demo="nudge-toast"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-pink">
                <BatonIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-12 font-medium text-mute">{`${HOST_APP} · Relay`}</div>
                <h3 className="mt-0.5 text-14 font-bold text-ink">1 hour left today</h3>
                <div className="mt-1 space-y-1 text-13 leading-[18px] text-text">
                  {nudge.items.map((it) => {
                    const p = PEOPLE[it.personId];
                    const n = it.askIds.length;
                    return (
                      <p key={it.personId}>
                        {`${p.name} needs ${n} ${n === 1 ? 'answer' : 'answers'} before ${poss(p.id)} ${fmtTimeShort(it.askerStart, p.zone)} start.`}
                      </p>
                    );
                  })}
                  {nudge.meetings.map((nm) => {
                    const m = meetings.find((x) => x.id === nm.meetingId) ?? MTG_DEMO;
                    return <p key={nm.meetingId}>{`Your ${fmtTime(nm.start, me.zone)} ${m.short ?? m.title} is after you log off. Record it now.`}</p>;
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  {nudge.items.length > 0 && (
                    <button type="button" onClick={answer} data-demo="nudge-answer" className="h-8 rounded-input bg-magentafill px-3 text-13 font-bold text-white shadow-sm">
                      Answer
                    </button>
                  )}
                  {nudge.meetings.length > 0 && (
                    <button type="button" onClick={record} data-demo="nudge-record" className="h-8 rounded-input border border-pinkline bg-white px-3 text-13 font-bold text-mtext">
                      Record
                    </button>
                  )}
                </div>
              </div>
              <button type="button" onClick={dismiss} aria-label="Dismiss" className="-mr-1 -mt-1 flex h-7 w-7 items-center justify-center rounded-md text-mute hover:bg-bg">
                <X size={16} />
              </button>
            </div>
            <p className="mt-3 border-t border-line pt-2.5 text-12 text-mute">{`Nudge ${nudge.index} of ${nudge.cap} today · only inside your working hours`}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
