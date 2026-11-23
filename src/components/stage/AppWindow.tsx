import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { WORKSPACE } from '../../data/scenario';
import { useStore } from '../../state/store';
import { Composer } from '../app/Composer';
import { ConversationHeader } from '../app/ConversationHeader';
import { MeetingRoom } from '../app/MeetingRoom';
import { MessageList } from '../app/MessageList';
import { MorningToast } from '../app/MorningToast';
import { NewMeetingDialog } from '../app/NewMeetingDialog';
import { NudgeToast } from '../app/NudgeToast';
import { Rail } from '../app/Rail';
import { RecordModal } from '../app/RecordModal';
import { RelayPanel } from '../app/RelayPanel';
import { Sidebar } from '../app/Sidebar';
import { TipLayer } from '../app/TimeTag';

/** Window top bar: traffic lights, history arrows, workspace search (filters the sidebar). */
function TopBar() {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);
  return (
    <div className="relative flex h-10 shrink-0 items-center bg-chrome px-3.5">
      <div className="flex gap-2" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-[#4A5468]" />
        <span className="h-3 w-3 rounded-full bg-[#4A5468]" />
        <span className="h-3 w-3 rounded-full bg-[#4A5468]" />
      </div>
      <div className="ml-6 flex gap-3 text-[#5F6A7E]" aria-hidden>
        <ArrowLeft size={16} />
        <ArrowRight size={16} />
      </div>
      <div className="absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2">
        <label className="flex h-7 items-center gap-2 rounded-[7px] bg-white/[.13] px-2.5 text-chromemute focus-within:bg-white/[.2]">
          <Search size={14} aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
            placeholder={`Search ${WORKSPACE}`}
            aria-label={`Search ${WORKSPACE}`}
            className="h-full min-w-0 flex-1 bg-transparent text-13 text-chrometext placeholder:text-chromemute focus:outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="text-chromemute hover:text-white">
              <X size={14} />
            </button>
          )}
        </label>
      </div>
    </div>
  );
}

/** A realistic desktop chat app window, designed at exactly 1280x800. */
export function AppWindow({ overlay }: { overlay?: ReactNode }) {
  const view = useStore((s) => s.view);
  const viewAs = useStore((s) => s.viewAs);
  const key = view.kind === 'dm' ? view.with : view.kind === 'channel' ? view.id : view.meetingId;
  return (
    <div
      id="app-window"
      data-testid="app-window"
      className="relative flex h-[800px] w-[1280px] flex-col overflow-hidden rounded-window border border-[#141A26] bg-chrome shadow-window"
    >
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <div className="flex min-w-0 flex-1 overflow-hidden rounded-tl-[10px] bg-white">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col bg-white" key={`${viewAs}-${view.kind}-${key}`}>
            {view.kind === 'dm' && (
              <>
                <ConversationHeader target={{ kind: 'dm', id: view.with }} />
                <MessageList target={{ kind: 'dm', id: view.with }} />
                <Composer target={{ kind: 'dm', id: view.with }} />
              </>
            )}
            {view.kind === 'channel' && (
              <>
                <ConversationHeader target={{ kind: 'channel', id: view.id }} />
                <MessageList target={{ kind: 'channel', id: view.id }} />
                <Composer target={{ kind: 'channel', id: view.id }} />
              </>
            )}
            {view.kind === 'room' && <MeetingRoom meetingId={view.meetingId} atSec={view.atSec} />}
          </main>
          <RelayPanel />
        </div>
      </div>
      <MorningToast />
      <NudgeToast />
      <RecordModal />
      <NewMeetingDialog />
      <TipLayer />
      {overlay}
    </div>
  );
}
