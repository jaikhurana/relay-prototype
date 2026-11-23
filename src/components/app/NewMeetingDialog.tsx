import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Lock, X } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { fairTurn, fairTurnOptions } from '../../logic/fairTurn';
import { fmtDay, fmtRange, fmtTime, isWorking, minutesOutside } from '../../logic/time';
import { useStore } from '../../state/store';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';

const label = 'mb-1 block text-12 font-bold text-soft';
const field = 'h-9 w-full rounded-input border border-wline bg-white px-3 text-14 text-ink focus:border-[#C9C8C2] focus:outline-none';

export function NewMeetingDialog() {
  const nm = useStore((s) => s.newMeeting);
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const counts = useStore((s) => s.counts);
  const update = useStore((s) => s.updateNewMeeting);
  const close = useStore((s) => s.closeNewMeeting);
  const book = useStore((s) => s.bookMeeting);
  const me = PEOPLE[viewAs];
  const other = PEOPLE[nm.withId];

  const result = nm.open ? fairTurn([me, other], nm.durationMin, counts, simTime) : null;
  const { options } = nm.open ? fairTurnOptions([me, other], nm.durationMin, counts, simTime) : { options: [] };
  const chosen = options[nm.optionIndex] ?? options[0];
  const turn = result?.whoseTurn ?? null;
  const myTurn = turn === me.id;
  const mine = counts[viewAs];
  const extra = chosen && myTurn ? minutesOutside(me, chosen.start, chosen.end) : 0;
  const otherInside = chosen && isWorking(other, chosen.start);

  return (
    <AnimatePresence>
      {nm.open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-start justify-center bg-ink/30 pt-[72px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="nm-title-h"
            data-demo="nm-dialog"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-[480px] overflow-hidden rounded-card bg-white shadow-toast"
          >
            <div className="flex h-12 items-center border-b border-line px-5">
              <h2 id="nm-title-h" className="text-15 font-bold text-ink">
                New meeting
              </h2>
              <span className="flex-1" />
              <button type="button" onClick={close} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-md text-mute hover:bg-bg">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div>
                <label className={label} htmlFor="nm-title">
                  Title
                </label>
                <input id="nm-title" data-demo="nm-title" value={nm.title} onChange={(e) => update({ title: e.target.value })} className={field} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={label} htmlFor="nm-duration">
                    Duration
                  </label>
                  <select
                    id="nm-duration"
                    value={nm.durationMin}
                    onChange={(e) => update({ durationMin: Number(e.target.value), optionIndex: 0 })}
                    className={field}
                  >
                    {[15, 30, 45, 60].map((d) => (
                      <option key={d} value={d}>{`${d} min`}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className={label}>With</span>
                  <span className="flex h-9 items-center gap-2 rounded-input border border-wline bg-bg px-2.5 text-14 text-ink">
                    <Avatar id={other.id} size={20} />
                    {other.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={nm.mustBeLive}
                  aria-labelledby="nm-live-label"
                  onClick={() => update({ mustBeLive: !nm.mustBeLive, optionIndex: 0, picking: false })}
                  data-demo="nm-live"
                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${nm.mustBeLive ? 'bg-ink' : 'bg-[#D9D8D3]'}`}
                >
                  <motion.span
                    className="absolute top-1 h-4 w-4 rounded-full bg-white shadow"
                    animate={{ left: nm.mustBeLive ? 20 : 4 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                  />
                </button>
                <span id="nm-live-label" className="text-14 font-medium text-ink">
                  Must be live
                </span>
              </div>
              {!nm.mustBeLive && <p className="text-13 text-mute">Not a demo? Relay works best for presentations and demos.</p>}

              <AnimatePresence initial={false}>
                {nm.mustBeLive && chosen && turn && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-[10px] border-l-[3px] border-magenta bg-pink p-[14px]" data-demo="nm-relay-box">
                      <p className="flex items-start gap-2 text-13 font-bold leading-[18px] text-mtext">
                        <BatonIcon size={15} className="mt-[1px] shrink-0" />
                        {`No shared working hours with ${other.name}. Someone joins outside their day.`}
                      </p>
                      <div className="mt-3 flex items-start justify-between gap-3" data-demo="nm-suggestion">
                        <div>
                          <div className="text-18 font-bold text-ink">{`${fmtDay(chosen.start, me.zone)} ${fmtRange(chosen.start, chosen.end, me.zone)} your time`}</div>
                          <div className="text-14 text-text">
                            {`${fmtRange(chosen.start, chosen.end, other.zone)} for ${other.name}${otherInside ? `, inside ${other.pronouns?.poss ?? `${other.name}'s`} day` : ''}`}
                          </div>
                        </div>
                        <span data-demo="nm-turn" className="inline-flex h-7 shrink-0 items-center rounded-full bg-magentafill px-3 text-13 font-bold text-white">
                          {myTurn ? 'Your turn' : `${PEOPLE[turn].name}'s turn`}
                        </span>
                      </div>
                      <p className="mt-3 flex items-start gap-1.5 text-13 leading-[18px] text-soft" data-demo="nm-private">
                        <Lock size={13} className="mt-[2px] shrink-0" aria-hidden />
                        <span>
                          {myTurn
                            ? `Your off-hours call minutes this month: ${mine.minutes} → ${mine.minutes + extra}. Only you can see this.`
                            : `Your off-hours call minutes this month: ${mine.minutes}. Only you can see this.`}
                        </span>
                      </p>
                      <button
                        type="button"
                        aria-expanded={nm.whyOpen}
                        onClick={() => update({ whyOpen: !nm.whyOpen })}
                        className="mt-2 inline-flex items-center gap-1 rounded text-13 font-medium text-mtext"
                      >
                        Why this time?
                        <ChevronDown size={14} className={`transition-transform ${nm.whyOpen ? 'rotate-180' : ''}`} aria-hidden />
                      </button>
                      {nm.whyOpen && (
                        <p className="mt-1 text-13 leading-[18px] text-text">
                          Fair Turn privately counts each person's minutes in calls outside their working hours this month. The next off-hours
                          call goes to whoever has the fewest.
                        </p>
                      )}
                      {nm.picking && (
                        <div className="mt-3">
                          <select
                            aria-label="Pick another time"
                            value={nm.optionIndex}
                            onChange={(e) => update({ optionIndex: Number(e.target.value) })}
                            className={field}
                          >
                            {options.slice(0, 12).map((o, i) => (
                              <option key={o.start.toISO()} value={i}>
                                {`${fmtDay(o.start, me.zone)} ${fmtRange(o.start, o.end, me.zone)} your time · ${fmtRange(o.start, o.end, other.zone)} for ${other.name}`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={book}
                          data-demo="nm-book"
                          className="h-9 rounded-input bg-magentafill px-4 text-14 font-bold text-white shadow-sm"
                        >
                          {`Book ${fmtTime(chosen.start, me.zone)}`}
                        </button>
                        {!nm.picking && (
                          <button
                            type="button"
                            onClick={() => update({ picking: true })}
                            className="h-9 rounded-input px-2.5 text-13 font-medium text-soft hover:bg-white/60"
                          >
                            Pick another time
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
