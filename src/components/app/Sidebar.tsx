import { AtSign, ChevronDown, FilePen, Hash, MessagesSquare, SquarePen } from 'lucide-react';
import { CHANNELS, DM_ORDER, PEOPLE, WORKSPACE, type PersonId } from '../../data/scenario';
import { isWorking } from '../../logic/time';
import { channelUnread, relayCount, useStore } from '../../state/store';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';
import { PresenceLabel } from './Presence';

const row = 'flex h-[30px] w-full items-center gap-2 rounded-[7px] px-2 text-left text-14';

function Count({ n }: { n: number }) {
  return (
    <span className="ml-auto flex h-[18px] min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-12 font-bold text-chrome">
      {n}
    </span>
  );
}

function DMAvatar({ id }: { id: PersonId }) {
  const simTime = useStore((s) => s.simTime);
  const working = isWorking(PEOPLE[id], simTime);
  return (
    <span className="relative shrink-0">
      <Avatar id={id} size={22} />
      <span
        role="img"
        aria-label={working ? 'Active' : 'Away'}
        className={`absolute -bottom-[3px] -right-[3px] h-[11px] w-[11px] rounded-full ring-2 ring-chrome2 ${
          working ? 'bg-success' : 'border-2 border-[#8C96A8] bg-chrome2'
        }`}
      />
    </span>
  );
}

export function Sidebar() {
  const viewAs = useStore((s) => s.viewAs);
  const view = useStore((s) => s.view);
  const asks = useStore((s) => s.asks);
  const simTime = useStore((s) => s.simTime);
  const messages = useStore((s) => s.messages);
  const channelSeen = useStore((s) => s.channelSeen);
  const search = useStore((s) => s.search).trim().toLowerCase();
  const openDM = useStore((s) => s.openDM);
  const openChannel = useStore((s) => s.openChannel);
  const setTab = useStore((s) => s.setTab);
  const count = useStore(relayCount);
  const me = PEOPLE[viewAs];

  const channels = CHANNELS.filter((c) => !search || c.id.includes(search));
  const dms = DM_ORDER[viewAs].filter((id) => !search || PEOPLE[id].name.toLowerCase().includes(search));

  return (
    <aside className="flex w-[248px] shrink-0 flex-col bg-chrome2 text-chrometext" aria-label="Sidebar">
      <div className="px-4 pb-2 pt-3.5">
        <div className="flex items-center gap-1">
          <span className="text-15 font-bold text-white">{WORKSPACE}</span>
          <ChevronDown size={14} className="text-chromemute" aria-hidden />
          <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/[.1] text-chrometext" aria-hidden>
            <SquarePen size={14} />
          </span>
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-12 text-chromemute">
          <span className="shrink-0 font-medium text-chrometext">{me.name}</span>
          <PresenceLabel id={me.id} tone="dark" className="min-w-0 truncate" demo="my-presence" />
        </div>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-2">
        {!search && (
          <div className="mb-2 mt-1" aria-hidden>
            {[
              { Icon: MessagesSquare, label: 'Threads' },
              { Icon: AtSign, label: 'Mentions' },
              { Icon: FilePen, label: 'Drafts' },
            ].map(({ Icon, label }) => (
              <div key={label} className={`${row} text-chromemute`}>
                <Icon size={15} />
                {label}
              </div>
            ))}
          </div>
        )}

        {channels.length > 0 && (
          <>
            <div className="flex items-center gap-1 px-2 pb-1 pt-2 text-12 font-medium uppercase tracking-[.06em] text-chromemute">
              <ChevronDown size={12} aria-hidden />
              Channels
            </div>
            <ul>
              {channels.map((c) => {
                const active = view.kind === 'channel' && view.id === c.id;
                const unread = active ? 0 : channelUnread({ simTime, viewAs, messages, channelSeen }, c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => openChannel(c.id)}
                      data-demo={`channel-${c.id}`}
                      aria-current={active ? 'true' : undefined}
                      className={`${row} ${
                        active ? 'bg-white/[.16] text-white' : unread ? 'font-bold text-white hover:bg-white/[.07]' : 'text-chromemute hover:bg-white/[.07]'
                      }`}
                    >
                      <Hash size={15} className="shrink-0 opacity-80" aria-hidden />
                      <span className="truncate">{c.id}</span>
                      {unread > 0 && <Count n={unread} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {dms.length > 0 && (
          <>
            <div className="flex items-center gap-1 px-2 pb-1 pt-4 text-12 font-medium uppercase tracking-[.06em] text-chromemute">
              <ChevronDown size={12} aria-hidden />
              Direct messages
            </div>
            <ul>
              {dms.map((id) => {
                const p = PEOPLE[id];
                const active = view.kind === 'dm' && view.with === id;
                const open = asks.filter((a) => a.from === id && a.to === viewAs && a.status === 'open').length;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => openDM(id)}
                      data-demo={`dm-${id}`}
                      aria-current={active ? 'true' : undefined}
                      className={`${row} ${
                        active ? 'bg-white/[.16] text-white' : open ? 'font-bold text-white hover:bg-white/[.07]' : 'text-chrometext/90 hover:bg-white/[.07]'
                      }`}
                    >
                      <DMAvatar id={id} />
                      <span className="truncate pl-0.5">{p.name}</span>
                      {open > 0 && !active && <Count n={open} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {search && channels.length + dms.length === 0 && <p className="px-2 pt-3 text-13 text-chromemute">No matches</p>}
      </div>

      <div className="border-t border-white/[.08] p-2">
        <button
          type="button"
          onClick={() => setTab('queue')}
          className={`${row} h-9 font-medium text-white hover:bg-white/[.07]`}
          data-demo="sidebar-relay"
        >
          <BatonIcon size={18} />
          <span className="flex-1 text-left">Relay</span>
          {count > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-magentafill px-1.5 text-12 font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
