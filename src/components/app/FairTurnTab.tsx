import { Lock } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { fmtDay, fmtTime, isWorking, toDT } from '../../logic/time';
import { useStore } from '../../state/store';
import { BatonIcon } from './BatonIcon';

export function FairTurnTab() {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const mine = useStore((s) => s.counts[s.viewAs]);
  const meetings = useStore((s) => s.meetings);
  const me = PEOPLE[viewAs];
  const month = toDT(simTime).setZone(me.zone).setLocale('en-US').toFormat('LLLL yyyy');
  const booked = meetings.find((m) => m.id === 'mtg-gonogo' && m.fairTurn?.whoseTurn === viewAs);
  const invites = meetings.filter((m) => m.fairTurn && m.attendees.includes(viewAs) && m.organiser !== viewAs);

  return (
    <div className="p-4">
      <section className="rounded-card border border-line bg-white p-4 shadow-sm" data-demo="fair-own-count">
        <div className="text-12 font-medium uppercase tracking-[.06em] text-mute">{month}</div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="tnum text-[32px] font-bold leading-10 text-ink">{`${mine.minutes} min`}</span>
        </div>
        <div className="text-14 text-text">{`${mine.calls} off-hours calls this month`}</div>
        <div className="mt-3 flex h-2 gap-[3px]" aria-hidden>
          {Array.from({ length: mine.calls }).map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${booked && i === mine.calls - 1 ? 'bg-magenta' : 'bg-pinkline'}`}
            />
          ))}
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-12 text-soft">
          <Lock size={12} aria-hidden />
          Only you can see this.
        </p>
      </section>

      {invites.length > 0 && (
        <ul className="mt-3 space-y-2">
          {invites.map((m) => {
            const inside = isWorking(me, m.start) && isWorking(me, toDT(m.end).minus({ minutes: 1 }));
            const turn = m.fairTurn!.whoseTurn;
            return (
              <li key={m.id} className="flex items-start gap-2.5 rounded-card border border-line p-3" data-demo="fair-invite">
                <BatonIcon size={16} className="mt-0.5 shrink-0" />
                <span className="text-13 leading-[19px] text-text">
                  <span className="font-bold text-ink">{m.title}</span>
                  {` · ${fmtDay(m.start, me.zone)} ${fmtTime(m.start, me.zone)} · ${inside ? 'inside your hours' : 'outside your hours'} · ${
                    turn === viewAs ? 'Your turn' : `${PEOPLE[turn!].name}'s turn`
                  }`}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-12 leading-[18px] text-mute">
        Fair Turn privately counts each person's minutes in calls outside their working hours this month. The next off-hours
        call goes to whoever has the fewest.
      </p>
    </div>
  );
}
