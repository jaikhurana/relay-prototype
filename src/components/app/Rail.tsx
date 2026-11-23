import { Bell, CalendarDays, House, MessageCircle } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { isWorking } from '../../logic/time';
import { relayCount, useStore } from '../../state/store';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';

function Item({ icon, label, active = false, onClick, demo, badge }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  demo?: string;
  badge?: React.ReactNode;
}) {
  const inner = (
    <>
      <span
        className={`relative flex h-9 w-9 items-center justify-center rounded-[9px] transition-colors ${
          active ? 'bg-white/[.16] text-white' : 'text-chromemute group-hover:bg-white/[.08] group-hover:text-chrometext'
        }`}
      >
        {icon}
        {badge}
      </span>
      <span className={`mt-1 text-12 leading-none ${active ? 'font-medium text-white' : 'text-chromemute'}`}>{label}</span>
    </>
  );
  if (!onClick) {
    return (
      <div className="flex w-14 flex-col items-center" aria-hidden>
        {inner}
      </div>
    );
  }
  return (
    <button type="button" onClick={onClick} className="group flex w-14 flex-col items-center rounded-[9px]" data-demo={demo} aria-label={label}>
      {inner}
    </button>
  );
}

export function Rail() {
  const count = useStore(relayCount);
  const setTab = useStore((s) => s.setTab);
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const working = isWorking(PEOPLE[viewAs], simTime);
  return (
    <nav className="flex w-[68px] shrink-0 flex-col items-center bg-chrome pb-3 pt-2" aria-label="App">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#3B475E] text-[16px] font-bold text-white" aria-hidden>
        N
      </div>
      <div className="flex flex-col items-center gap-3.5">
        <Item icon={<House size={19} strokeWidth={1.9} />} label="Home" />
        <Item icon={<MessageCircle size={19} strokeWidth={1.9} />} label="Chat" active />
        <Item icon={<Bell size={19} strokeWidth={1.9} />} label="Activity" />
        <Item icon={<CalendarDays size={19} strokeWidth={1.9} />} label="Calendar" onClick={() => setTab('meetings')} demo="rail-calendar" />
      </div>
      <div className="flex-1" />
      <Item
        icon={<BatonIcon size={22} />}
        label="Relay"
        onClick={() => setTab('queue')}
        demo="rail-relay"
        badge={
          count > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-magentafill px-1 text-[11px] font-bold leading-none text-white ring-2 ring-chrome">
              {count}
            </span>
          ) : null
        }
      />
      <div className="relative mt-4" aria-hidden>
        <Avatar id={viewAs} size={32} />
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-[2.5px] ring-chrome ${working ? 'bg-success' : 'bg-[#6B7588]'}`}
        />
      </div>
    </nav>
  );
}
