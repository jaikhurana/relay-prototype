import { relayCount, useStore, type RelayTab } from '../../state/store';
import { BatonIcon } from './BatonIcon';
import { FairTurnTab } from './FairTurnTab';
import { MeetingsTab } from './MeetingsTab';
import { QueueTab } from './QueueTab';

const TABS: { id: RelayTab; label: string }[] = [
  { id: 'queue', label: 'Queue' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'fairTurn', label: 'Fair Turn' },
];

export function RelayPanel() {
  const tab = useStore((s) => s.relayTab);
  const setTab = useStore((s) => s.setTab);
  const count = useStore(relayCount);
  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-line bg-white" aria-label="Relay" data-demo="relay-panel">
      <div className="flex h-[52px] shrink-0 items-center gap-2 px-4">
        <BatonIcon size={20} />
        <h2 className="text-15 font-bold text-ink">Relay</h2>
        {count > 0 && (
          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-pink px-1.5 text-12 font-bold text-mtext">
            {count}
          </span>
        )}
      </div>
      <div className="flex shrink-0 gap-5 border-b border-line px-4" role="tablist" aria-label="Relay views">
        {TABS.map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              data-demo={`tab-${t.id}`}
              className={`relative -mb-px h-10 border-b-2 text-14 font-medium transition-colors ${
                on ? 'border-magenta text-mtext' : 'border-transparent text-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto" role="tabpanel">
        {tab === 'queue' && <QueueTab />}
        {tab === 'meetings' && <MeetingsTab />}
        {tab === 'fairTurn' && <FairTurnTab />}
      </div>
    </aside>
  );
}
