import { motion } from 'framer-motion';
import { BellOff, Clock } from 'lucide-react';
import { NEEDS, PEOPLE, type PersonId } from '../../data/scenario';
import { canSendUrgent, urgentLabel } from '../../logic/queue';
import { fmtDay, fmtTime, fmtTimeShort, nextWorkStart, toDT, workEnd, zoneAbbr } from '../../logic/time';
import { useStore } from '../../state/store';
import { BatonIcon } from './BatonIcon';

const label = 'mb-1 block text-12 font-bold text-soft';
const field =
  'w-full rounded-input border border-wline bg-white px-2.5 text-14 text-ink placeholder:text-mute focus:border-[#C9C8C2] focus:outline-none';

/** The four prompts. Shown only when the receiver is offline. */
export function CompleteAskStrip({ to }: { to: PersonId }) {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const draft = useStore((s) => s.draft);
  const used = useStore((s) => s.urgentUsed[s.viewAs] ?? 0);
  const update = useStore((s) => s.updateDraft);
  const sendCompleteAsk = useStore((s) => s.sendCompleteAsk);
  const sendPlain = useStore((s) => s.sendPlain);

  const me = PEOPLE[viewAs];
  const r = PEOPLE[to];
  const now = toDT(simTime);
  const myStart = nextWorkStart(me, now);
  const rStart = nextWorkStart(r, now);
  const rDayEnd = workEnd(r, rStart);

  let by = myStart;
  if (draft.by === 'end') by = workEnd(me, now);
  if (draft.by === 'pick') {
    const [hh, mm] = draft.pickTime.split(':').map(Number);
    by = myStart.setZone(me.zone).set({ hour: hh, minute: mm }).toUTC();
  }
  const pron = r.pronouns?.subj && r.pronouns?.poss ? r.pronouns : null;
  const wholeDay = pron && by >= rDayEnd ? ` · ${pron.subj} has ${pron.poss} whole day` : '';
  const expected =
    draft.by === 'start' ? `before your ${fmtTime(by, me.zone)} start.` : `before ${fmtTime(by, me.zone)} your time.`;
  const subject = r.pronouns?.subj ?? r.name;
  const valid = draft.about.trim().length > 0 && !!draft.need && (!draft.urgentOn || canSendUrgent(draft.urgentReason, used));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: 12, height: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="overflow-hidden"
    >
      <section
        className="mb-2 rounded-[10px] border-l-[3px] border-magenta bg-pink p-[14px]"
        aria-label="Complete ask"
        data-demo="strip"
      >
        <h3 className="flex items-start gap-2 text-14 font-bold leading-5 text-mtext">
          <BatonIcon size={16} className="mt-0.5 shrink-0" />
          {`${r.name} is offline. Make it a complete ask so ${subject} can act without a round trip.`}
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
          <div>
            <label className={label} htmlFor="ask-about">
              What's it about?
            </label>
            <input
              id="ask-about"
              data-demo="strip-about"
              value={draft.about}
              onChange={(e) => update({ about: e.target.value })}
              placeholder="Link, ticket or file"
              className={`${field} h-8`}
            />
          </div>
          <div>
            <span className={label} id="ask-need-label">
              What do you need?
            </span>
            <div className="flex flex-wrap gap-1" role="group" aria-labelledby="ask-need-label">
              {NEEDS.map((n) => {
                const on = draft.need === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => update({ need: on ? null : n })}
                    data-demo={`strip-need-${n}`}
                    className={`h-[26px] rounded-full border px-2.5 text-12 font-medium transition-colors ${
                      on ? 'border-magentafill bg-magentafill text-white' : 'border-wline bg-white text-text hover:border-[#C9C8C2]'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
          <div data-demo="strip-by">
            <label className={label} htmlFor="ask-by">
              By when?
            </label>
            <div className="flex gap-1.5">
              <select
                id="ask-by"
                value={draft.by}
                onChange={(e) => update({ by: e.target.value as 'start' | 'end' | 'pick' })}
                className={`${field} h-8 flex-1 pr-7`}
              >
                <option value="start">{`My ${fmtTimeShort(myStart, me.zone)} start (${fmtDay(myStart, me.zone)})`}</option>
                <option value="end">End of my day</option>
                <option value="pick">Pick a time</option>
              </select>
              {draft.by === 'pick' && (
                <input
                  type="time"
                  aria-label="Time"
                  value={draft.pickTime}
                  step={900}
                  onChange={(e) => update({ pickTime: e.target.value || '12:00' })}
                  className={`${field} h-8 w-[104px]`}
                />
              )}
            </div>
            <p className="mt-1 text-12 text-soft" data-demo="strip-conversion">
              {`= ${fmtTime(by, r.zone)} ${fmtDay(by, r.zone)} for ${r.name}${wholeDay}`}
            </p>
          </div>
          <div>
            <label className={label} htmlFor="ask-context">
              Context
            </label>
            <textarea
              id="ask-context"
              data-demo="strip-context"
              rows={2}
              value={draft.context}
              onChange={(e) => update({ context: e.target.value })}
              placeholder="What have you tried? What's blocking you?"
              className={`${field} resize-none py-1.5 leading-5`}
            />
          </div>
        </div>

        <div className="mt-2.5 space-y-1 text-13 text-text" data-demo="strip-expected">
          <p className="flex items-start gap-1.5">
            <Clock size={14} className="mt-[2px] shrink-0 text-mtext" aria-hidden />
            <span>
              {`Expected reply: ${expected} ${r.name} starts at ${fmtTime(rStart, me.zone)} your time (${fmtTime(rStart, r.zone)} ${zoneAbbr(r.zone, rStart)}).`}
            </span>
          </p>
          <p className="flex items-start gap-1.5">
            <BellOff size={14} className="mt-[2px] shrink-0 text-mtext" aria-hidden />
            <span>{`Delivered quietly. No notification until ${r.name}'s morning.`}</span>
          </p>
        </div>

        {draft.urgentOn && (
          <div className="mt-2.5 flex items-center gap-2">
            <input
              aria-label="Reason it's urgent"
              value={draft.urgentReason}
              onChange={(e) => update({ urgentReason: e.target.value })}
              placeholder="Reason (required)"
              className={`${field} h-8 max-w-[220px]`}
              data-demo="strip-urgent-reason"
            />
            <span className="text-12 text-soft">{urgentLabel(used)}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            aria-pressed={draft.urgentOn}
            onClick={() => update({ urgentOn: !draft.urgentOn })}
            className={`rounded px-0.5 text-13 font-medium underline-offset-2 hover:underline ${draft.urgentOn ? 'text-mtext underline' : 'text-mtext'}`}
            data-demo="strip-urgent"
          >
            Mark urgent
          </button>
          <div className="flex-1" />
          <button
            type="button"
            disabled={!draft.text.trim()}
            onClick={sendPlain}
            className="h-8 rounded-input px-2.5 text-13 font-medium text-soft hover:bg-white/60 disabled:opacity-40"
          >
            Send as plain message
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={sendCompleteAsk}
            data-demo="strip-send"
            className="h-8 rounded-input bg-magentafill px-3.5 text-13 font-bold text-white shadow-sm transition-opacity disabled:opacity-40"
          >
            Send complete ask
          </button>
        </div>
      </section>
    </motion.div>
  );
}
