import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, Play } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { arrivalOrder, rankQueue } from '../../logic/queue';
import { fmtClock, fmtTime, fmtTimeShort, isWorking, sameLocalDay, toDT } from '../../logic/time';
import { questionBundles, useStore } from '../../state/store';
import { Pill } from './AskCard';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';

const spring = { layout: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const } };

export function QueueTab() {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const asks = useStore((s) => s.asks);
  const meetings = useStore((s) => s.meetings);
  const pins = useStore((s) => s.pins);
  const sorted = useStore((s) => s.queueSorted);
  const expanded = useStore((s) => s.bundleExpanded);
  const openDM = useStore((s) => s.openDM);
  const openRoom = useStore((s) => s.openRoom);
  const toggleBundle = useStore((s) => s.toggleBundle);
  const me = PEOPLE[viewAs];

  const ranked = rankQueue(asks, me, simTime);
  const rows = sorted ? ranked : arrivalOrder(ranked);
  const bundles = questionBundles({ meetings, pins, simTime, viewAs });
  const today = meetings.filter(
    (m) =>
      m.type === 'Call' &&
      m.attendees.includes(viewAs) &&
      sameLocalDay(m.start, simTime, me.zone) &&
      toDT(m.start) > toDT(simTime),
  );

  if (rows.length + bundles.length + today.length === 0) {
    return <p className="px-4 py-6 text-13 text-mute">Nothing in your queue.</p>;
  }

  return (
    <div>
      {bundles.map(({ meeting, pins: qs }) => {
        const org = PEOPLE[meeting.organiser];
        return (
          <div key={meeting.id} className="border-b border-line bg-[#FFFAFC]" data-demo="bundle-row">
            <button
              type="button"
              onClick={toggleBundle}
              aria-expanded={expanded}
              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-pink/60"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink">
                <BatonIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-14 font-bold text-ink">{`${meeting.title} · ${qs.length} questions`}</span>
                </span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex h-6 items-center rounded-full bg-magentafill px-2.5 text-12 font-medium text-white">
                    {`From the team's ${fmtTimeShort(meeting.start, org.zone)}`}
                  </span>
                  <ChevronDown size={16} className={`text-mute transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden />
                </span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden px-3 pb-2"
                >
                  {qs.map((q, i) => (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => openRoom(meeting.id, q.atSec, q.id)}
                        data-demo={`bundle-q-${i}`}
                        className="group flex w-full items-start gap-2.5 rounded-input px-2 py-2 text-left hover:bg-white"
                      >
                        <span className="tnum mt-[1px] inline-flex h-5 shrink-0 items-center gap-1 rounded bg-white px-1.5 text-12 font-bold text-mtext ring-1 ring-pinkline">
                          <Play size={9} fill="currentColor" aria-hidden />
                          {fmtClock(q.atSec)}
                        </span>
                        <span className="min-w-0 flex-1 text-13 leading-[18px] text-text">
                          <span className="font-bold text-ink">{PEOPLE[q.by].name}: </span>
                          {q.text}
                        </span>
                        {q.reply && <Check size={15} className="mt-[1px] shrink-0 text-success" aria-label="Answered" />}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {today.map((m) => (
        <div key={m.id} className="flex items-center gap-3 border-b border-line px-4 py-3" data-demo="calendar-row">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F0EC] text-soft">
            <CalendarDays size={16} aria-hidden />
          </span>
          <span className="text-13 leading-[18px] text-text">
            <span className="font-bold text-ink">{m.title}</span>
            {` · today ${fmtTime(m.start, me.zone)} · ${isWorking(me, m.start) && isWorking(me, toDT(m.end).minus({ minutes: 1 })) ? 'inside your hours' : 'outside your hours'}`}
          </span>
        </div>
      ))}

      {rows.length > 0 && (
        <AnimatePresence initial={false}>
          {sorted && (
            <motion.p
              key="ordered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.25 }}
              className="px-4 pb-1 pt-3 text-12 text-mute"
            >
              Ordered by: online now → starts soonest → can wait
            </motion.p>
          )}
        </AnimatePresence>
      )}

      <ul>
        {rows.map((r) => {
          const p = PEOPLE[r.personId];
          return (
            <motion.li key={`${r.personId}-${r.group}`} layout transition={spring} className="border-b border-line bg-white">
              <button
                type="button"
                onClick={() => openDM(r.personId)}
                data-demo={`queue-row-${r.personId}`}
                className="flex min-h-[72px] w-full items-start gap-3 px-4 py-3 text-left hover:bg-bg"
              >
                <Avatar id={r.personId} size={32} className="mt-0.5" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-14 font-bold text-ink">{p.name}</span>
                    <span className="flex-1" />
                    <Pill tone={r.pill.tone}>{r.pill.label}</Pill>
                  </span>
                  <span className="block truncate text-13 text-text">{r.about}</span>
                  <span className="mt-1 block text-12 leading-4 text-mute">{r.reason}</span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
