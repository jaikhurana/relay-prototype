import { Moon } from 'lucide-react';
import { PEOPLE, type PersonId } from '../../data/scenario';
import { presence } from '../../logic/time';
import { useStore } from '../../state/store';

/** Small presence marker: green dot when working, moon when off. */
export function PresenceDot({ id, className = '' }: { id: PersonId; className?: string }) {
  const simTime = useStore((s) => s.simTime);
  const viewAs = useStore((s) => s.viewAs);
  const info = presence(PEOPLE[id], PEOPLE[viewAs], simTime);
  if (info.kind === 'working') {
    return <span className={`inline-block h-2 w-2 shrink-0 rounded-full bg-success ${className}`} aria-label="Active" role="img" />;
  }
  return <Moon size={12} className={`shrink-0 text-mute ${className}`} aria-label={info.label} role="img" />;
}

/** Presence label: "Active" / "Asleep · back 11:00 pm your time" / "Offline · back 9:30 am". */
export function PresenceLabel({
  id,
  className = '',
  demo,
  tone = 'light',
}: {
  id: PersonId;
  className?: string;
  demo?: string;
  tone?: 'light' | 'dark';
}) {
  const simTime = useStore((s) => s.simTime);
  const viewAs = useStore((s) => s.viewAs);
  const info = presence(PEOPLE[id], PEOPLE[viewAs], simTime);
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`} data-demo={demo}>
      {info.kind === 'working' ? (
        <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden />
      ) : (
        <Moon size={12} className={tone === 'dark' ? 'text-chromemute' : 'text-mute'} aria-hidden />
      )}
      <span>{info.label}</span>
    </span>
  );
}
