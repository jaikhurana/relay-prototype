import { Moon, Play, Sun } from 'lucide-react';
import { BEATS, FEATURES, PEOPLE, VIEWERS, type BeatId } from '../../data/scenario';
import { fmtTime, isWorking, toDT } from '../../logic/time';
import { useDemoUi } from '../../demo/DemoPlayer';
import { useStore } from '../../state/store';
import { Avatar } from '../app/Avatar';
import { BatonIcon } from '../app/BatonIcon';

function WorldClocks({ compact }: { compact: boolean }) {
  const simTime = useStore((s) => s.simTime);
  const rows = (['jai', 'priya', 'sam'] as const).map((id) => PEOPLE[id]);
  return (
    <section aria-label="World clocks" data-demo-panel="clocks">
      <ul className="divide-y divide-line rounded-t-card border border-line">
        {rows.map((p) => {
          const hour = toDT(simTime).setZone(p.zone).hour;
          const day = hour >= 6 && hour < 18;
          const working = isWorking(p, simTime);
          return (
            <li key={p.id} className={`flex items-center gap-2.5 px-3 ${compact ? 'h-8' : 'h-9'}`}>
              <Avatar id={p.id} size={24} />
              <span className="w-[78px] text-14 font-bold text-ink">{p.city}</span>
              <span className="tnum flex-1 text-14 text-text">{fmtTime(simTime, p.zone)}</span>
              {day ? <Sun size={15} className="text-[#C98A1B]" aria-label="Day" /> : <Moon size={15} className="text-mute" aria-label="Night" />}
              <span
                className={`inline-flex h-6 w-[68px] items-center justify-center rounded-full text-12 font-medium ${
                  working ? 'bg-successbg text-successtext' : 'bg-[#F1F0EC] text-soft'
                }`}
              >
                {working ? 'Working' : 'Off'}
              </span>
            </li>
          );
        })}
      </ul>
      <div className={`flex ${compact ? 'h-8' : 'h-9'} items-center rounded-b-card border border-t-0 border-line px-3`}>
        <span className="inline-flex h-6 items-center rounded-full bg-warnbg px-2.5 text-12 font-bold text-warn">No hour shared by all three</span>
      </div>
    </section>
  );
}

export function DemoPanel({ compact = false }: { compact?: boolean }) {
  const beat = useStore((s) => s.beat);
  const viewAs = useStore((s) => s.viewAs);
  const demo = useStore((s) => s.demo);
  const loadBeat = useStore((s) => s.loadBeat);
  const setViewAs = useStore((s) => s.setViewAs);
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

      <div className={`${compact ? 'mt-3' : 'mt-4'} flex items-center gap-2`}>
        <button
          type="button"
          onClick={startDemo}
          data-testid="watch-demo"
          className={`flex ${compact ? 'h-10' : 'h-11'} flex-1 items-center justify-center gap-2 rounded-[10px] bg-magentafill text-15 font-bold text-white shadow-sm hover:bg-[#D60454]`}
        >
          <Play size={16} fill="currentColor" aria-hidden />
          Watch demo
        </button>
        <button type="button" onClick={() => go(1)} className="h-11 rounded-[10px] px-3 text-14 font-medium text-soft hover:bg-bg" data-testid="reset">
          Reset
        </button>
      </div>

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <div className="mb-1.5 text-12 font-medium uppercase tracking-[.06em] text-mute" id="viewas-label">
          View as
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-[10px] bg-[#F1F0EC] p-1" role="radiogroup" aria-labelledby="viewas-label">
          {VIEWERS.map((v) => {
            const p = PEOPLE[v];
            const on = viewAs === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setViewAs(v)}
                data-testid={`viewas-${v}`}
                className={`flex h-9 flex-col items-center justify-center rounded-[8px] leading-[15px] transition-colors ${
                  on ? 'bg-white text-ink shadow-sm' : 'text-soft hover:text-ink'
                }`}
              >
                <span className="text-13 font-bold">{p.name}</span>
                <span className="text-12">{p.city}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`${compact ? 'mt-3' : 'mt-4'} rounded-card transition-shadow duration-300 ${introGlow ? 'shadow-[0_0_0_2px_#FFFFFF,0_0_0_4px_#EE065E]' : ''}`}>
        <WorldClocks compact={compact} />
      </div>

      <nav className={compact ? 'mt-3' : 'mt-4'} aria-label="Story">
        <div className={`${compact ? 'mb-0.5' : 'mb-1.5'} text-12 font-medium uppercase tracking-[.06em] text-mute`}>Story</div>
        <ol className="relative">
          <span className="absolute bottom-3 left-[7px] top-3 w-px bg-line" aria-hidden />
          {BEATS.map((b) => {
            const on = b.id === beat;
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => go(b.id)}
                  aria-current={on ? 'step' : undefined}
                  data-testid={`step-${b.id}`}
                  className={`relative flex ${compact ? 'h-6' : 'h-[26px]'} w-full items-center gap-3 rounded-input pr-2 text-left hover:bg-bg`}
                >
                  <span
                    className={`relative z-[1] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border-2 bg-white ${
                      on ? 'border-magenta' : 'border-[#D4D3CE]'
                    }`}
                  >
                    {on && <span className="h-[7px] w-[7px] rounded-full bg-magenta" />}
                  </span>
                  <span className={`truncate text-13 ${on ? 'font-bold text-ink' : 'text-soft'}`}>
                    <span className="tnum">{b.id}</span>&nbsp;&nbsp;{b.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className={`${compact ? 'mt-2 px-3 py-2.5' : 'mt-3 p-3'} rounded-card bg-bg`} aria-live="polite" data-testid="whats-happening">
        <div className="flex items-center gap-1">
          <span className="flex-1 text-12 font-medium uppercase tracking-[.06em] text-mute">What's happening</span>
          {FEATURES.map((f) => {
            const on = f.id === info.feature;
            return (
              <span
                key={f.id}
                title={`${f.id} ${f.label}`}
                aria-label={`${f.id} ${f.label}${on ? ' (current)' : ''}`}
                className={`inline-flex h-5 items-center rounded-full px-1.5 text-12 font-bold ${
                  on ? 'bg-magentafill text-white' : 'border border-pinkline text-mtext'
                }`}
              >
                {f.id}
              </span>
            );
          })}
        </div>
        <h2 className="mt-1 text-14 font-bold text-ink">{info.title}</h2>
        <p className="mt-1 text-13 leading-[18px] text-text">{info.lines[0]}</p>
        <p className="mt-0.5 text-13 leading-[18px] text-text">{info.lines[1]}</p>
        <p className="mt-2 text-13 leading-[18px] text-mtext">
          <span className="font-bold">Rule:</span> {info.rule}
        </p>
      </section>

    </aside>
  );
}
