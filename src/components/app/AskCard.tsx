import { useEffect, useRef } from 'react';
import { DECISIONS, PEOPLE, type Ask } from '../../data/scenario';
import { rankQueue, type PillTone } from '../../logic/queue';
import { fmtDay, fmtTime, fmtTimeShort, isWorking, localDayDiff, nextWorkStart } from '../../logic/time';
import { useStore } from '../../state/store';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';
import { TimeTag } from './TimeTag';

export const PILL: Record<PillTone | 'success', string> = {
  online: 'bg-successbg text-successtext',
  success: 'bg-successbg text-successtext',
  magenta: 'bg-magentafill text-white',
  neutral: 'bg-[#F1F0EC] text-text',
  grey: 'bg-[#F1F0EC] text-soft',
};

export function Pill({ tone, children, demo }: { tone: keyof typeof PILL; children: React.ReactNode; demo?: string }) {
  return (
    <span data-demo={demo} className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2.5 text-12 font-medium ${PILL[tone]}`}>
      {children}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-6 items-center rounded-full bg-[#F1F0EC] px-2.5 text-12 font-medium text-text">{children}</span>;
}

/** "9:00 am" or "Fri 5:30 pm" (in the sender's zone) */
function byPhrase(ask: Ask): string {
  const z = PEOPLE[ask.from].zone;
  const far = localDayDiff(ask.sentAt, ask.by, z) > 1;
  return far ? `${fmtDay(ask.by, z)} ${fmtTime(ask.by, z)}` : fmtTime(ask.by, z);
}

export function AskCard({ ask }: { ask: Ask }) {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const asks = useStore((s) => s.asks);
  const draft = useStore((s) => s.replyDrafts[ask.id]);
  const setReplyDraft = useStore((s) => s.setReplyDraft);
  const sendReply = useStore((s) => s.sendReply);
  const focusKey = useStore((s) => s.focusKey);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sender = PEOPLE[ask.from];
  const receiver = PEOPLE[ask.to];
  const isSender = ask.from === viewAs;
  const isReceiver = ask.to === viewAs;

  useEffect(() => {
    if (focusKey === `reply-${ask.id}` && inputRef.current) inputRef.current.focus({ preventScroll: false });
  }, [focusKey, ask.id]);

  let status: React.ReactNode = null;
  if (ask.status === 'done') {
    const doneAt = ask.doneAt ?? simTime;
    const label = isWorking(sender, doneAt)
      ? 'Done ✓'
      : `Ready for ${sender.name}'s ${fmtTimeShort(nextWorkStart(sender, doneAt), sender.zone)} ✓`;
    status = <Pill tone="success" demo={`status-${ask.id}`}>{label}</Pill>;
  } else if (isSender) {
    const quiet = !isWorking(receiver, simTime);
    status = <Pill tone="grey" demo={`status-${ask.id}`}>{quiet ? `Quiet until ${receiver.name}'s morning` : 'Delivered'}</Pill>;
  } else if (isReceiver) {
    const row = rankQueue(asks, PEOPLE[viewAs], simTime).find((r) => r.asks.some((a) => a.id === ask.id));
    if (row) status = <Pill tone={row.pill.tone} demo={`status-${ask.id}`}>{row.pill.label}</Pill>;
  }

  const byChip = isSender ? `By: your ${byPhrase(ask)}` : `By: ${sender.name}'s ${byPhrase(ask)}`;
  const canSend = !!draft && (draft.text.trim().length > 0 || !!draft.decision);

  return (
    <div className="mt-1.5 max-w-[468px] rounded-card border border-line bg-white p-3.5 shadow-sm" data-demo={`askcard-${ask.id}`}>
      <div className="mb-1 flex items-center gap-1.5 text-12 font-bold text-mtext">
        <BatonIcon size={13} />
        Complete ask
      </div>
      <div className="text-15 font-bold leading-5 text-ink">{ask.about}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Chip>Need: {ask.need}</Chip>
        <TimeTag at={ask.by} className="no-underline">
          <Chip>{byChip}</Chip>
        </TimeTag>
        {ask.urgentReason && (
          <span className="inline-flex h-6 items-center rounded-full border border-magenta px-2.5 text-12 font-bold text-mtext">Urgent</span>
        )}
      </div>
      {ask.context && <p className="mt-2 text-14 leading-[21px] text-text">{ask.context}</p>}
      {ask.urgentReason && <p className="mt-1 text-12 text-soft">Urgent: {ask.urgentReason}</p>}
      {status && <div className="mt-2.5">{status}</div>}

      {ask.status === 'done' && ask.reply && (
        <div className="mt-3 border-t border-line pt-3" data-demo={`reply-${ask.id}`}>
          <div className="flex items-center gap-2">
            <Avatar id={receiver.id} size={20} />
            <span className="text-13 font-bold text-ink">{receiver.name}</span>
            {ask.doneAt && (
              <TimeTag at={ask.doneAt} className="text-12 text-mute">
                {fmtTime(ask.doneAt, PEOPLE[viewAs].zone)}
              </TimeTag>
            )}
            {ask.reply.decision && (
              <span className="inline-flex h-6 items-center rounded-full bg-ink px-2.5 text-12 font-medium text-white">{ask.reply.decision}</span>
            )}
          </div>
          {ask.reply.text && <p className="mt-1.5 text-14 leading-[21px] text-text">{ask.reply.text}</p>}
        </div>
      )}

      {ask.status === 'open' && isReceiver && (
        <div className="mt-3 border-t border-line pt-3">
          {ask.need === 'Decision' && (
            <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Decision">
              {DECISIONS.map((d) => {
                const on = draft?.decision === d;
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setReplyDraft(ask.id, { decision: on ? undefined : d })}
                    data-demo={`decision-${ask.id}-${d}`}
                    className={`h-7 rounded-full border px-3 text-13 font-medium transition-colors ${
                      on ? 'border-magentafill bg-magentafill text-white' : 'border-wline bg-white text-text hover:border-[#C9C8C2]'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={2}
              value={draft?.text ?? ''}
              onChange={(e) => setReplyDraft(ask.id, { text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (canSend) sendReply(ask.id);
                }
              }}
              placeholder={`Reply to ${sender.name}`}
              aria-label={`Reply to ${sender.name}: ${ask.about}`}
              data-demo={`reply-input-${ask.id}`}
              className="min-h-[44px] flex-1 resize-none rounded-input border border-wline bg-white px-3 py-2 text-14 leading-5 text-ink placeholder:text-mute focus:border-[#C9C8C2] focus:outline-none"
            />
            <button
              type="button"
              disabled={!canSend}
              onClick={() => sendReply(ask.id)}
              data-demo={`reply-send-${ask.id}`}
              className="h-9 rounded-input bg-magentafill px-3.5 text-13 font-bold text-white transition-opacity disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
