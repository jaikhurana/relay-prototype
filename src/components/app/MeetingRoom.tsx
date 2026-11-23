import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';
import { PEOPLE } from '../../data/scenario';
import { fmtClock, fmtTime, fmtTimeShort, isWorking, nextWorkStart, toDT, zoneAbbr } from '../../logic/time';
import { useStore } from '../../state/store';
import { Avatar } from './Avatar';
import { BatonIcon } from './BatonIcon';
import { FakeDashboard } from './RecordModal';

export function MeetingRoom({ meetingId, atSec }: { meetingId: string; atSec: number }) {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const meetings = useStore((s) => s.meetings);
  const pins = useStore((s) => s.pins);
  const pinDraft = useStore((s) => s.pinDraft);
  const playing = useStore((s) => s.roomPlaying);
  const setPinDraft = useStore((s) => s.setPinDraft);
  const pinQuestion = useStore((s) => s.pinQuestion);
  const seek = useStore((s) => s.seekRoom);
  const setPlaying = useStore((s) => s.setRoomPlaying);
  const replyPin = useStore((s) => s.roomReplyPin);
  const pinReplyDraft = useStore((s) => s.pinReplyDraft);
  const openPinReply = useStore((s) => s.openPinReply);
  const setPinReplyDraft = useStore((s) => s.setPinReplyDraft);
  const answerPin = useStore((s) => s.answerPin);
  const focusKey = useStore((s) => s.focusKey);
  const bar = useRef<HTMLDivElement>(null);
  const answerInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replyPin && answerInput.current) answerInput.current.focus();
  }, [replyPin, focusKey]);
  const m = meetings.find((x) => x.id === meetingId);
  const total = m?.relay?.durationSec ?? 432;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      const v = useStore.getState().view;
      if (v.kind !== 'room') return;
      if (v.atSec >= total) {
        setPlaying(false);
        return;
      }
      seek(Math.min(total, v.atSec + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [playing, total, seek, setPlaying]);

  if (!m) return null;
  const presenter = PEOPLE[m.presenter ?? m.organiser];
  const me = PEOPLE[viewAs];
  const live = toDT(simTime) >= toDT(m.start) && toDT(simTime) < toDT(m.end);
  const watchers = m.attendees.filter((a) => a !== m.presenter);
  const myPins = pins.filter((p) => p.meetingId === m.id).sort((a, b) => a.atSec - b.atSec);
  const isPresenter = viewAs === presenter.id;
  const presenterOff = !isWorking(presenter, simTime) && !isPresenter;
  const back = nextWorkStart(presenter, simTime);
  const recordedAt = m.relay?.recordedAt;

  const onScrub = (clientX: number) => {
    const el = bar.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    seek(Math.round(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * total));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-demo="meeting-room">
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-line px-5">
        <BatonIcon size={20} />
        <div className="min-w-0">
          <h2 className="text-15 font-bold leading-5 text-ink">{`${m.title} · Relay`}</h2>
          {recordedAt && (
            <p className="text-13 leading-[18px] text-mute">
              {`Recorded by ${presenter.name} at ${fmtTime(recordedAt, presenter.zone)} ${zoneAbbr(presenter.zone, recordedAt)}`}
            </p>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3">
        <div className="shrink-0" data-demo="room-stage">
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px] bg-[#2A2A30] p-2" data-demo="room-video">
            <div className="h-full overflow-hidden rounded-md">
              <FakeDashboard />
            </div>
            <div className="absolute bottom-4 right-4">
              <Avatar id={presenter.id} size={44} ring />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-white"
            >
              {playing ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-[1px]" />}
            </button>
            <div
              ref={bar}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={Math.round(atSec)}
              aria-valuetext={fmtClock(atSec)}
              onClick={(e) => onScrub(e.clientX)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') seek(Math.min(total, atSec + 5));
                if (e.key === 'ArrowLeft') seek(Math.max(0, atSec - 5));
              }}
              className="relative h-5 flex-1 cursor-pointer"
              data-demo="room-scrubber"
            >
              <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#E2E1DC]" />
              <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink" style={{ width: `${(atSec / total) * 100}%` }} />
              {myPins.map((p) => (
                <span
                  key={p.id}
                  className="absolute top-1/2 h-4 w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-magenta ring-2 ring-white"
                  style={{ left: `${(p.atSec / total) * 100}%` }}
                  aria-hidden
                />
              ))}
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-ink shadow"
                style={{ left: `${(atSec / total) * 100}%` }}
                aria-hidden
              />
            </div>
            <span className="tnum shrink-0 text-12 text-mute">
              {fmtClock(atSec)} / {fmtClock(total)}
            </span>
          </div>
          {live && (
            <div className="mt-2.5 flex items-center gap-2" data-demo="room-watchers">
              <div className="flex -space-x-1.5">
                {watchers.map((w) => (
                  <Avatar key={w} id={w} size={24} ring />
                ))}
              </div>
              <span className="truncate text-13 text-soft">{watchers.map((w) => PEOPLE[w].name).join(', ')}</span>
              <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-13 font-medium text-text">
                <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                {`${watchers.length} watching`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-3 flex min-h-0 flex-1 gap-4">
          {presenterOff && (
            <div className="min-w-0 flex-1">
              <div
                className="flex items-start gap-2 rounded-[10px] border border-pinkline bg-pink px-3 py-2.5 text-13 leading-[18px] text-text"
                data-demo="room-banner"
              >
                <BatonIcon size={15} className="mt-[1px] shrink-0" />
                <span>{`${presenter.name} is offline. Questions go to ${presenter.pronouns?.poss ?? `${presenter.name}'s`} morning queue, answered by ${fmtTime(back, me.zone)} your time.`}</span>
              </div>
            </div>
          )}

          <aside className={`flex shrink-0 flex-col ${presenterOff ? 'w-[300px]' : 'min-w-0 flex-1'}`} aria-label="Pinned questions">
            <h3 className="mb-1.5 text-13 font-bold text-ink">Pinned questions</h3>
            <ul className="scroll-thin min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5" data-demo="room-pins">
              <AnimatePresence initial={false}>
                {myPins.map((p) => {
                  const asker = PEOPLE[p.by];
                  const active = replyPin === p.id;
                  const ready = p.reply
                    ? isWorking(asker, p.reply.at)
                      ? 'Done ✓'
                      : `Ready for ${asker.name}'s ${fmtTimeShort(nextWorkStart(asker, p.reply.at), asker.zone)} ✓`
                    : null;
                  return (
                    <motion.li key={p.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                      <div
                        className={`rounded-input border px-2 py-1.5 ${active ? 'border-pinkline bg-[#FFF7FA]' : 'border-line bg-white'}`}
                        data-demo={`pin-${p.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => seek(p.atSec)}
                            aria-label={`Play from ${fmtClock(p.atSec)}`}
                            className="tnum mt-[1px] shrink-0 rounded bg-pink px-1 text-12 font-bold text-mtext hover:bg-pinkline/60"
                          >
                            {fmtClock(p.atSec)}
                          </button>
                          <span className="min-w-0 flex-1 text-13 leading-[18px] text-text">
                            <span className="font-bold text-ink">{`${asker.name}: `}</span>
                            {`“${p.text}”`}
                          </span>
                          {isPresenter && !p.reply && !active && (
                            <button
                              type="button"
                              onClick={() => openPinReply(p.id)}
                              data-demo={`pin-reply-${p.id}`}
                              className="shrink-0 rounded px-1.5 text-12 font-bold text-mtext hover:bg-pink"
                            >
                              Answer
                            </button>
                          )}
                        </div>
                        {p.reply && (
                          <div className="mt-1.5 flex items-start gap-2 pl-[46px]" data-demo={`pin-answer-${p.id}`}>
                            <Avatar id={presenter.id} size={16} className="mt-[1px]" />
                            <span className="min-w-0 flex-1 text-13 leading-[18px] text-text">
                              <span className="font-bold text-ink">{`${presenter.name}: `}</span>
                              {p.reply.text}
                            </span>
                            {ready && (
                              <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-successbg px-2 text-12 font-medium text-successtext">
                                {ready}
                              </span>
                            )}
                          </div>
                        )}
                        {active && (
                          <form
                            className="mt-2 flex gap-1.5 pl-[46px]"
                            onSubmit={(e) => {
                              e.preventDefault();
                              answerPin();
                            }}
                          >
                            <input
                              ref={answerInput}
                              value={pinReplyDraft}
                              onChange={(e) => setPinReplyDraft(e.target.value)}
                              placeholder={`Answer ${asker.name}`}
                              aria-label={`Answer ${asker.name}: ${p.text}`}
                              data-demo="pin-answer-input"
                              className="h-8 min-w-0 flex-1 rounded-input border border-wline bg-white px-2.5 text-13 text-ink placeholder:text-mute focus:border-[#C9C8C2] focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={!pinReplyDraft.trim()}
                              data-demo="pin-answer-send"
                              className="h-8 shrink-0 rounded-input bg-magentafill px-3 text-13 font-bold text-white disabled:opacity-40"
                            >
                              Send
                            </button>
                          </form>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
            {!isPresenter && (
              <form
                className="mt-2 flex shrink-0 gap-1.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  pinQuestion();
                }}
              >
                <input
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value)}
                  placeholder={`Pin a question at ${fmtClock(atSec)}`}
                  aria-label={`Pin a question at ${fmtClock(atSec)}`}
                  data-demo="pin-input"
                  className="h-9 min-w-0 flex-1 rounded-input border border-wline px-2.5 text-13 text-ink placeholder:text-mute focus:border-[#C9C8C2] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!pinDraft.trim()}
                  data-demo="pin-submit"
                  className="h-9 shrink-0 rounded-input bg-magentafill px-3.5 text-13 font-bold text-white disabled:opacity-40"
                >
                  Pin
                </button>
              </form>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
