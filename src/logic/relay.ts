import type { DateTime } from 'luxon';
import { Interval } from 'luxon';
import type { Meeting, Person, PersonId } from '../data/scenario';
import { toDT, workEnd, workIntervals, workStart, type Instant } from './time';

export interface RelayCheck {
  needed: boolean;
  /** The presenter's workEnd on the meeting day: record before this. */
  recordBy: DateTime;
}

/**
 * Relay applies to presentations and demos only.
 * needed = on the meeting day, the presenter's working hours overlap no attendee's working hours.
 */
export function needsRelay(meeting: Meeting, people: Record<PersonId, Person>, day?: Instant): RelayCheck {
  const presenterId = meeting.presenter ?? meeting.organiser;
  const presenter = people[presenterId];
  const ref = toDT(day ?? meeting.start);
  const pDay = Interval.fromDateTimes(workStart(presenter, ref), workEnd(presenter, ref));
  const recordBy = workEnd(presenter, ref);
  const presentational = meeting.type === 'Demo' || meeting.type === 'Presentation';

  const overlapsSomeone = meeting.attendees
    .filter((id) => id !== presenterId)
    .some((id) =>
      workIntervals(people[id], pDay.start!.minus({ days: 1 }), pDay.end!.plus({ days: 1 })).some((iv) => iv.overlaps(pDay)),
    );

  return { needed: presentational && !overlapsSomeone, recordBy };
}
