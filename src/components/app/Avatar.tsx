import { PEOPLE, type PersonId } from '../../data/scenario';

interface Props {
  id: PersonId;
  size?: number;
  className?: string;
  ring?: boolean;
}

/** Photo avatar if the file exists in public/avatars, otherwise an initials avatar. */
export function Avatar({ id, size = 24, className = '', ring = false }: Props) {
  const p = PEOPLE[id];
  const style = {
    width: size,
    height: size,
    fontSize: Math.max(10, Math.round(size * 0.42)),
    background: p.avatar ? undefined : p.initialsBg,
    boxShadow: ring ? '0 0 0 2px #FFFFFF' : undefined,
  };
  return (
    <span
      className={`relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-bold text-white ${className}`}
      style={style}
      aria-hidden
    >
      {p.avatar ? <img src={p.avatar} alt="" width={size} height={size} className="h-full w-full object-cover" /> : p.initials}
    </span>
  );
}
