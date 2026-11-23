import { AnimatePresence } from 'framer-motion';
import { SendHorizontal } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { isWorking } from '../../logic/time';
import { useStore, type ConvoTarget } from '../../state/store';
import { CompleteAskStrip } from './CompleteAskStrip';

export function Composer({ target }: { target: ConvoTarget }) {
  const simTime = useStore((s) => s.simTime);
  const draft = useStore((s) => s.draft);
  const update = useStore((s) => s.updateDraft);
  const sendPlain = useStore((s) => s.sendPlain);
  const sendCompleteAsk = useStore((s) => s.sendCompleteAsk);
  const isDM = target.kind === 'dm';
  const r = isDM ? PEOPLE[target.id] : null;
  // Prompts only for a DM to someone who is offline. Never in channels.
  const online = r ? isWorking(r, simTime) : true;
  const strip = isDM && !online && draft.stripOpen;
  const name = r ? r.name : `#${target.id}`;

  return (
    <div className="shrink-0 px-5 pb-4 pt-1">
      <AnimatePresence>{strip && r && <CompleteAskStrip key="strip" to={r.id} />}</AnimatePresence>
      <div className="flex min-h-[88px] flex-col rounded-[10px] border border-wline bg-white focus-within:border-[#C9C8C2]">
        <textarea
          rows={2}
          value={draft.text}
          onFocus={() => isDM && !online && !draft.stripOpen && update({ stripOpen: true })}
          onChange={(e) => update({ text: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && draft.stripOpen) update({ stripOpen: false });
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (strip) sendCompleteAsk();
              else sendPlain();
            }
          }}
          placeholder={`Message ${name}`}
          aria-label={`Message ${name}`}
          data-demo="composer-input"
          className="flex-1 resize-none rounded-[10px] bg-transparent px-3.5 pt-3 text-15 leading-[22px] text-ink placeholder:text-mute focus:outline-none"
        />
        <div className="flex h-9 items-center justify-end px-2 pb-1.5">
          {!strip && (
            <button
              type="button"
              onClick={sendPlain}
              disabled={!draft.text.trim()}
              aria-label="Send"
              className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white transition-opacity disabled:bg-[#E2E1DC] disabled:text-mute"
            >
              <SendHorizontal size={15} />
            </button>
          )}
        </div>
      </div>
      {r && online && (
        <p className="mt-1.5 text-12 text-mute" data-demo="online-hint">
          {`${r.name} is online. Prompts are off.`}
        </p>
      )}
    </div>
  );
}
