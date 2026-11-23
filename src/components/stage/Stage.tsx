import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { DemoCaptions, DemoOverlay, useDemoRunner } from '../../demo/DemoPlayer';
import { useStore } from '../../state/store';
import { BatonIcon } from '../app/BatonIcon';
import { AppWindow } from './AppWindow';
import { DemoPanel } from './DemoPanel';

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return size;
}

export function Stage() {
  const { w, h } = useViewport();
  const demoActive = useStore((s) => s.demo.active);
  const startDemo = useStore((s) => s.startDemo);
  const narrow = w < 1100;
  useDemoRunner();

  if (narrow && !demoActive) {
    return (
      <div className="flex min-h-full items-center justify-center bg-stage p-4">
        <div className="w-full max-w-[360px] rounded-[16px] border border-wline bg-white p-6 text-center shadow-sm">
          <BatonIcon size={36} className="mx-auto" />
          <h1 className="mt-2 text-20 font-bold text-ink">Relay</h1>
          <p className="mt-2 text-15 text-text">Relay is best viewed on a laptop.</p>
          <button
            type="button"
            onClick={startDemo}
            data-testid="watch-demo"
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-magentafill text-15 font-bold text-white"
          >
            <Play size={16} fill="currentColor" aria-hidden />
            Watch demo
          </button>
        </div>
      </div>
    );
  }

  const scale = narrow
    ? Math.min(1, (w - 32) / 1280, (h - 180) / 800)
    : Math.min(1, (w - 360 - 72) / 1280, (h - 48) / 800);

  return (
    <div className={`flex h-full overflow-hidden bg-stage ${narrow ? 'p-4' : 'gap-6 p-6'}`}>
      <div className="relative min-w-0 flex-1" data-testid="stage-left">
        <div style={{ width: 1280 * scale, height: 800 * scale }} className={`relative ${narrow ? 'mx-auto' : ''}`}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 1280, height: 800 }}>
            <AppWindow overlay={<DemoOverlay />} />
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
          <div className="pointer-events-auto w-full max-w-[900px]">
            <DemoCaptions />
          </div>
        </div>
      </div>
      {!narrow && <DemoPanel compact={h < 900} />}
    </div>
  );
}
