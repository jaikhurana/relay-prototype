import { Clock, Hash } from 'lucide-react';
import { CHANNELS, PEOPLE } from '../../data/scenario';
import { fmtTime } from '../../logic/time';
import { useStore, type ConvoTarget } from '../../state/store';
import { Avatar } from './Avatar';
import { PresenceLabel } from './Presence';
import { TimeTag } from './TimeTag';

export function ConversationHeader({ target }: { target: ConvoTarget }) {
  const simTime = useStore((s) => s.simTime);

  if (target.kind === 'channel') {
    const c = CHANNELS.find((x) => x.id === target.id)!;
    return (
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5" data-demo="convo-header">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1 text-15 font-bold leading-5 text-ink">
            <Hash size={16} className="text-soft" aria-hidden />
            {c.id}
          </h2>
          <div className="mt-0.5 flex items-center gap-1.5 text-13 leading-[18px] text-mute">
            <span className="flex -space-x-1">
              {c.members.slice(0, 3).map((m) => (
                <Avatar key={m} id={m} size={16} ring />
              ))}
            </span>
            {`${c.members.length} members`}
          </div>
        </div>
      </header>
    );
  }

  const p = PEOPLE[target.id];
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5" data-demo="convo-header">
      <Avatar id={p.id} size={28} />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 leading-5">
          <h2 className="text-15 font-bold text-ink">{p.name}</h2>
          <span className="text-13 text-mute">· {p.role}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-13 leading-[18px] text-soft">
          <span className="inline-flex items-center gap-1">
            <Clock size={12} className="text-mute" aria-hidden />
            <TimeTag at={simTime}>{`${fmtTime(simTime, p.zone)} in ${p.city}`}</TimeTag>
          </span>
          <span className="text-[#C9C8C2]" aria-hidden>
            ·
          </span>
          <PresenceLabel id={p.id} />
        </div>
      </div>
    </header>
  );
}
