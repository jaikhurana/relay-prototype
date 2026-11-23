import { CheckCircle2, Plus, Video } from 'lucide-react';
import { PEOPLE, type Meeting, type PersonId } from '../../data/scenario';
import { needsRelay } from '../../logic/relay';
import { availableFrom, fmtDay, fmtRange, fmtTime, toDT } from '../../logic/time';
import { relayDue, useStore } from '../../state/store';
import { BatonIcon } from './BatonIcon';
import { TimeTag } from './TimeTag';

function who(id: PersonId, viewer: PersonId) {
  return id === viewer ? 'you' : PEOPLE[id].name;
}

function RelayBox({ m }: { m: Meeting }) {
  const simTime = useStore((s) => s.simTime);
  const viewAs = useStore((s) => s.viewAs);
  const startRecording = useStore((s) => s.startRecording);
  const keepLive = useStore((s) => s.keepLive);
  const me = PEOPLE[viewAs];
  const { recordBy } = needsRelay(m, PEOPLE);
  const teamStart = m.attendees
    .filter((a) => a !== m.presenter)
    .map((a) => availableFrom(PEOPLE[a], simTime))
    .sort((a, b) => a.toMillis() - b.toMillis())[0];
  const org = PEOPLE[m.organiser];
  return (
    <div className="mt-3 rounded-[10px] border border-pinkline bg-pink p-3" data-demo={`relay-box-${m.id}`}>
      <div className="flex items-center gap-1.5 text-14 font-bold text-mtext">
        <BatonIcon size={15} />
        No shared working hours.
      </div>
      <p className="mt-1 text-13 leading-[19px] text-text">
        {`You end at ${fmtTime(recordBy, me.zone)}. The team starts at ${fmtTime(teamStart, me.zone)}. Relay it: record your demo by ${fmtTime(recordBy, me.zone)}. The team watches together at ${fmtTime(m.start, org.zone)} ${org.city} and pins questions for your morning.`}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => startRecording(m.id)}
          data-demo="record-now"
          className="inline-flex h-8 items-center gap-1.5 rounded-input bg-magentafill px-3 text-13 font-bold text-white shadow-sm"
        >
          <Video size={14} aria-hidden />
          Record now
        </button>
        <button type="button" onClick={() => keepLive(m.id)} className="h-8 rounded-input px-2 text-13 font-medium text-soft hover:bg-white/60">
          Keep it live
        </button>
      </div>
    </div>
  );
}

function MeetingCard({ m }: { m: Meeting }) {
  const viewAs = useStore((s) => s.viewAs);
  const simTime = useStore((s) => s.simTime);
  const meetings = useStore((s) => s.meetings);
  const pins = useStore((s) => s.pins);
  const openRoom = useStore((s) => s.openRoom);
  const me = PEOPLE[viewAs];
  const org = PEOPLE[m.organiser];
  const due = relayDue({ meetings, pins, simTime, viewAs }).some((x) => x.id === m.id);
  const upcoming = toDT(simTime) < toDT(m.start);
  const others = m.attendees.filter((a) => a !== viewAs && a !== m.organiser);

  return (
    <article className="rounded-card border border-line bg-white p-3.5 shadow-sm" data-demo={`meeting-${m.id}`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-14 font-bold text-ink">{m.title}</h3>
        {m.fairTurn?.whoseTurn && (
          <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-pink px-2.5 text-12 font-bold text-mtext">
            {m.fairTurn.whoseTurn === viewAs ? 'Your turn' : `${PEOPLE[m.fairTurn.whoseTurn].name}'s turn`}
          </span>
        )}
      </div>
      <div className="mt-0.5 text-13 text-text">
        <TimeTag at={m.start}>{`${fmtDay(m.start, me.zone)} ${fmtRange(m.start, m.end, me.zone)}`}</TimeTag>
      </div>
      <div className="mt-0.5 text-13 text-mute">
        {m.presenter
          ? `Presenter: ${who(m.presenter, viewAs)} · Organiser: ${who(m.organiser, viewAs)}`
          : `Organiser: ${who(m.organiser, viewAs)}${others.length ? ` · With ${others.map((o) => PEOPLE[o].name).join(', ')}` : ''}`}
      </div>

      {due && <RelayBox m={m} />}

      {m.relay && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] bg-pink px-3 py-2">
          <CheckCircle2 size={15} className="shrink-0 text-mtext" aria-hidden />
          <span className="flex-1 text-13 leading-[18px] text-text">
            {`Relay ready · ${Math.floor(m.relay.durationSec / 60)} min ${m.relay.durationSec % 60} s.`}
            {upcoming && ` The team will watch at ${fmtTime(m.start, org.zone)} ${org.city}.`}
          </span>
          <button
            type="button"
            onClick={() => openRoom(m.id, 0)}
            data-demo={`watch-${m.id}`}
            className="h-7 shrink-0 rounded-input border border-pinkline bg-white px-2.5 text-12 font-bold text-mtext"
          >
            Watch
          </button>
        </div>
      )}
    </article>
  );
}

export function MeetingsTab() {
  const viewAs = useStore((s) => s.viewAs);
  const meetings = useStore((s) => s.meetings);
  const openNewMeeting = useStore((s) => s.openNewMeeting);
  const mine = meetings
    .filter((m) => m.organiser === viewAs || m.presenter === viewAs || m.attendees.includes(viewAs))
    .sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="space-y-3 p-4">
      {viewAs === 'sam' && (
        <button
          type="button"
          onClick={openNewMeeting}
          data-demo="new-meeting"
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-input border border-wline bg-white text-14 font-medium text-ink hover:bg-bg"
        >
          <Plus size={16} aria-hidden />
          New meeting
        </button>
      )}
      {mine.length === 0 && <p className="py-2 text-13 text-mute">No meetings.</p>}
      {mine.map((m) => (
        <MeetingCard key={m.id} m={m} />
      ))}
    </div>
  );
}
