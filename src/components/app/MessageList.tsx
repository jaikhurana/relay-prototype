import { Fragment, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { CHANNELS, CHANNEL_MESSAGES, PEOPLE, QUICK_REACTIONS, type Ask, type PersonId } from '../../data/scenario';
import { fmtTime, fmtTimeShort, localDayDiff, toDT } from '../../logic/time';
import { useStore, type ConvoTarget } from '../../state/store';
import { AskCard } from './AskCard';
import { Avatar } from './Avatar';
import { TimeTag } from './TimeTag';

type Item =
  | { kind: 'ask'; id: string; from: PersonId; at: string; ask: Ask }
  | { kind: 'msg'; id: string; from: PersonId; at: string; text: string };

function dayLabel(at: string, now: string, zone: string) {
  const diff = localDayDiff(at, now, zone);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return toDT(at).setZone(zone).setLocale('en-US').toFormat('cccc, LLLL d');
}

function Reactions({ id }: { id: string }) {
  const viewAs = useStore((s) => s.viewAs);
  const r = useStore((s) => s.reactions[id]);
  const toggle = useStore((s) => s.toggleReaction);
  const entries = Object.entries(r ?? {}).filter(([, who]) => who.length > 0);
  if (!entries.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {entries.map(([emoji, who]) => {
        const mine = who.includes(viewAs);
        const names = who.map((w) => (w === viewAs ? 'You' : PEOPLE[w].name)).join(', ');
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle(id, emoji)}
            aria-pressed={mine}
            aria-label={`${emoji} ${who.length}: ${names}`}
            title={names}
            className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-12 font-medium ${
              mine ? 'border-[#9DB8E0] bg-[#EAF1FB] text-[#1F4E8C]' : 'border-line bg-[#F7F6F2] text-text hover:border-[#C9C8C2]'
            }`}
          >
            <span className="text-[13px] leading-none">{emoji}</span>
            {who.length}
          </button>
        );
      })}
    </div>
  );
}

function HoverBar({ id }: { id: string }) {
  const toggle = useStore((s) => s.toggleReaction);
  return (
    <div className="absolute -top-3.5 right-4 z-10 flex items-center gap-0.5 rounded-input border border-line bg-white p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      {QUICK_REACTIONS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => toggle(id, e)}
          aria-label={`React with ${e}`}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[15px] hover:bg-[#F1F0EC]"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

export function MessageList({ target }: { target: ConvoTarget }) {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const asks = useStore((s) => s.asks);
  const messages = useStore((s) => s.messages);
  const scroller = useRef<HTMLDivElement>(null);
  const me = PEOPLE[viewAs];

  let items: Item[];
  if (target.kind === 'dm') {
    const other = target.id;
    const pair = (a: PersonId, b?: PersonId) => (a === viewAs && b === other) || (a === other && b === viewAs);
    items = [
      ...asks.filter((a) => pair(a.from, a.to)).map((a): Item => ({ kind: 'ask', id: a.id, from: a.from, at: a.sentAt, ask: a })),
      ...messages.filter((m) => pair(m.from, m.to)).map((m): Item => ({ kind: 'msg', id: m.id, from: m.from, at: m.at, text: m.text })),
    ];
  } else {
    items = [...CHANNEL_MESSAGES, ...messages]
      .filter((m) => m.channel === target.id && m.at <= simTime)
      .map((m): Item => ({ kind: 'msg', id: m.id, from: m.from, at: m.at, text: m.text }));
  }
  items.sort((a, b) => a.at.localeCompare(b.at));

  const mine = target.kind === 'dm' ? asks.filter((a) => a.from === viewAs && a.to === target.id) : [];
  const allAnswered = mine.length > 0 && mine.every((a) => a.status === 'done' && a.reply && (a.doneAt ?? '') <= a.by);

  const sig = items.map((i) => i.id + (i.kind === 'ask' ? i.ask.status : '')).join('|');
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [sig]);

  return (
    <>
      {allAnswered && (
        <div className="shrink-0 px-5 pt-3">
          <div
            className="flex items-center gap-2 rounded-card border border-[#BFE3CF] bg-successbg px-3 py-2 text-14 font-medium text-successtext"
            data-demo="answers-banner"
            role="status"
          >
            <CheckCircle2 size={16} aria-hidden />
            {`Answers ready at your ${fmtTimeShort(mine[0].by, me.zone)} ✓`}
          </div>
        </div>
      )}
      <div ref={scroller} className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-4" data-demo="message-list">
        {target.kind === 'dm' ? (
          <div className="mb-4 flex items-center gap-3 pb-1">
            <Avatar id={target.id} size={48} />
            <div>
              <div className="text-18 font-bold text-ink">{PEOPLE[target.id].name}</div>
              <div className="text-13 text-mute">
                {PEOPLE[target.id].role} · {PEOPLE[target.id].city}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 pb-1">
            <div className="text-18 font-bold text-ink">{`# ${target.id}`}</div>
            <div className="text-13 text-mute">{`${CHANNELS.find((c) => c.id === target.id)!.members.length} members`}</div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {items.map((it, i) => {
            const prev = items[i - 1];
            const newDay = !prev || localDayDiff(prev.at, it.at, me.zone) !== 0;
            const grouped =
              !!prev && !newDay && prev.from === it.from && toDT(it.at).diff(toDT(prev.at), 'minutes').minutes <= 5;
            return (
              <Fragment key={it.id}>
                {newDay && (
                  <div className="relative my-3 flex items-center justify-center" aria-hidden>
                    <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
                    <span className="relative rounded-full border border-line bg-white px-3 py-0.5 text-12 font-medium text-soft">
                      {dayLabel(it.at, simTime, me.zone)}
                    </span>
                  </div>
                )}
                <motion.div
                  layout="position"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`group relative -mx-5 flex gap-3 px-5 hover:bg-[#F9F9F7] ${grouped ? 'py-0.5' : 'mt-1.5 py-1.5'}`}
                >
                  {grouped ? (
                    <div className="w-8 shrink-0 pt-1 text-right">
                      <span className="invisible text-12 text-mute group-hover:visible">{fmtTime(it.at, me.zone).replace(/ (am|pm)$/, '')}</span>
                    </div>
                  ) : (
                    <Avatar id={it.from} size={32} className="mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    {!grouped && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-15 font-bold text-ink">{PEOPLE[it.from].name}</span>
                        <TimeTag at={it.at} className="text-12 text-mute">
                          {fmtTime(it.at, me.zone)}
                        </TimeTag>
                      </div>
                    )}
                    {it.kind === 'msg' ? <p className="text-15 leading-[22px] text-text">{it.text}</p> : <AskCard ask={it.ask} />}
                    <Reactions id={it.id} />
                  </div>
                  <HoverBar id={it.id} />
                </motion.div>
              </Fragment>
            );
          })}
        </AnimatePresence>
      </div>
    </>
  );
}
