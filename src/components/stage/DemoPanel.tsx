import { Moon, Play, Sun } from 'lucide-react';
import { BEATS, FEATURES, PEOPLE, VIEWERS, type BeatId } from '../../data/scenario';
import { fmtDay, fmtTime, isWorking, toDT } from '../../logic/time';
import { useDemoUi } from '../../demo/DemoPlayer';
import { useStore } from '../../state/store';
import { Avatar } from '../app/Avatar';
import { BatonIcon } from '../app/BatonIcon';

/** View as + world clocks in one control: each card is a person, their city and their local time. */
function ViewAsClocks({ compact }: { compact: boolean }) {
  const simTime = useStore((s) => s.simTime);
  const viewAs = useStore((s) => s.viewAs);
  const setViewAs = useStore((s) => s.setViewAs);
  return (
    <section aria-labelledby="viewas-label">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-12 font-medium uppercase tracking-[.06em] text-mute" id="viewas-label">
          View as
        </span>
        <span className="inline-flex h-5 items-center rounded-full bg-warnbg px-2 text-12 font-bold text-warn">No hour shared by all three</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-labelledby="viewas-label">
        {VIEWERS.map((id) => {
          const p = PEOPLE[id];
          const on = viewAs === id;
          const hour = toDT(simTime).setZone(p.zone).hour;
          const day = hour >= 6 && hour < 18;
          const working = isWorking(p, simTime);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setViewAs(id)}
              data-testid={`viewas-${id}`}
              aria-label={`View as ${p.name}, ${p.city}, ${fmtTime(simTime, p.zone)}, ${working ? 'working' : 'off'}`}
              className={`flex flex-col items-start rounded-[10px] border text-left transition-colors ${compact ? 'px-2.5 py-1.5' : 'px-2.5 py-2'} ${
                on ? 'border-ink bg-white shadow-sm' : 'border-line bg-bg hover:border-[#C9C8C2]'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Avatar id={p.id} size={18} />
                <span className="text-13 font-bold text-ink">{p.name}</span>
              </span>
              <span className="mt-0.5 text-12 text-mute">{p.city}</span>
              <span className="tnum mt-0.5 flex items-center gap-1 text-15 font-bold text-ink">
                {fmtTime(simTime, p.zone)}
                {day ? <Sun size={13} className="text-[#C98A1B]" aria-hidden /> : <Moon size={13} className="text-mute" aria-hidden />}
              </span>
              <span
                className={`mt-1 inline-flex h-5 items-center rounded-full px-2 text-12 font-medium ${
                  working ? 'bg-successbg text-successtext' : 'bg-[#F1F0EC] text-soft'
                }`}
              >
                {working ? 'Working' : 'Off'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function DemoPanel({ compact = false }: { compact?: boolean }) {
  const beat = useStore((s) => s.beat);
  const demo = useStore((s) => s.demo);
  const loadBeat = useStore((s) => s.loadBeat);
  const startDemo = useStore((s) => s.startDemo);
  const exitDemo = useStore((s) => s.exitDemo);
  const info = BEATS[beat - 1];
  const chapter = useDemoUi((s) => s.chapter);
  const introGlow = demo.active && !demo.outro && chapter === 'intro';

  const go = (n: BeatId) => {
    if (demo.active) exitDemo();
    loadBeat(n);
  };

  return (
    <aside
      className={`scroll-thin flex h-full w-[360px] shrink-0 flex-col overflow-y-auto rounded-[16px] border border-wline bg-white ${compact ? 'p-4' : 'p-5'}`}
      aria-label="Demo controls"
    >
      <div className="flex items-center gap-2">
        <BatonIcon size={24} />
        <h1 className="text-20 font-bold text-ink">Relay</h1>
      </div>
      <p className="mt-0.5 text-13 text-soft">Prototype · Media.net APM case</p>

      <div className={`${compact ? 'mt-2.5' : 'mt-4'} flex items-center gap-2`}>
        <button
          type="button"
          onClick={startDemo}
          data-testid="watch-demo"
          className={`flex ${compact ? 'h-9' : 'h-11'} flex-1 items-center justify-center gap-2 rounded-[10px] bg-magentafill text-15 font-bold text-white shadow-sm hover:bg-[#D60454]`}
        >
          <Play size={16} fill="currentColor" aria-hidden />
          Watch demo
        </button>
        <button type="button" onClick={() => go(1)} className="h-11 rounded-[10px] px-3 text-14 font-medium text-soft hover:bg-bg" data-testid="reset">
          Reset
        </button>
      </div>

      <div className={`${compact ? 'mt-2.5' : 'mt-4'} rounded-card transition-shadow duration-300 ${introGlow ? 'shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#EE065E]' : ''}`}>
        <ViewAsClocks compact={compact} />
      </div>

      <nav className={compact ? 'mt-2.5' : 'mt-4'} aria-label="One day, three time zones">
        <div className="text-12 font-medium uppercase tracking-[.06em] text-mute">One day, three time zones</div>
        <p className={`${compact ? 'mb-1' : 'mb-1.5'} mt-0.5 text-12 leading-4 text-soft`} data-testid="how-to">
          Click a moment to jump there, then try the app yourself.
        </p>
        <ol className="relative">
          <span className="absolute bottom-4 left-[7px] top-4 w-px bg-line" aria-hidden />
          {BEATS.map((b) => {
            const on = b.id === beat;
            const v = PEOPLE[b.viewAs];
            const feature = FEATURES.find((f) => f.id === b.feature)!;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => go(b.id)}
                  aria-current={on ? 'step' : undefined}
                  data-testid={`step-${b.id}`}
                  className={`relative flex w-full items-start gap-3 rounded-input pr-2 text-left ${compact ? 'py-0.5' : 'py-1'} ${
                    on ? '' : 'hover:bg-bg'
                  }`}
                >
                  <span
                    className={`relative z-[1] mt-[2px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                      on ? 'border-magenta' : 'border-[#D4D3CE]'
                    }`}
                  >
                    {on && <span className="h-[7px] w-[7px] rounded-full bg-magenta" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-13 leading-[18px] ${on ? 'font-bold text-ink' : 'text-text'}`}>
                      <span className={`tnum ${on ? '' : 'text-mute'}`}>{b.id}</span>&nbsp;&nbsp;{b.step}
                    </span>
                    <span className="tnum flex items-center gap-1.5 pl-[18px] text-12 leading-4 text-mute">
                      <Avatar id={v.id} size={13} />
                      {`${v.name} · ${fmtDay(b.time, v.zone)} ${fmtTime(b.time, v.zone)}, ${v.city}`}
                    </span>
                  </span>
                </button>
                {on && (
                  <div
                    className={`mb-1 ml-[27px] mt-1 rounded-input bg-bg ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'}`}
                    aria-live="polite"
                    data-testid="whats-happening"
                  >
                    <span
                      className="inline-flex h-5 items-center rounded-full bg-magentafill px-2 text-12 font-bold text-white"
                      title={`${feature.id} ${feature.label}`}
                    >
                      {`${feature.id} · ${feature.label}`}
                    </span>
                    <p className={`${compact ? 'mt-1' : 'mt-1.5'} text-13 leading-[18px] text-text`}>{`${info.lines[0]} ${info.lines[1]}`}</p>
                    <p className={`${compact ? 'mt-1' : 'mt-1.5'} text-13 leading-[18px] text-mtext`}>
                      <span className="font-bold">Rule:</span> {info.rule}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
