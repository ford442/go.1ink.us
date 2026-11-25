import { Component, Suspense, lazy, useEffect, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useEffectsContext } from '../app/context/EffectsContext';
import { probeGpu } from '../lib/gpuSupport';
import type { GpuCapability } from '../lib/gpuSupport';

const WebGPU = lazy(() => import('./SystemConstellationGpu'));
const WebGL = lazy(() => import('./SystemConstellationWebGL'));
const Map = lazy(() => import('./SystemMap'));
const OrbitalOverlay = lazy(() => import('./OrbitalOps/ConstellationOrbitalOverlay'));

type View = 'webgpu' | 'webgl' | 'map';

class RendererBoundary extends Component<{ onFailure: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onFailure();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function SystemConstellation() {
  const { flags } = useEffectsContext();
  const [capability, setCapability] = useState<GpuCapability | null>(null);
  const [choice, setChoice] = useState<View | null>(null);
  const [gpuFailed, setGpuFailed] = useState(false);
  const [glFailed, setGlFailed] = useState(false);

  useEffect(() => {
    if (!flags.constellation3d) return;
    let active = true;
    void probeGpu().then((result) => {
      if (active) setCapability(result);
    });
    return () => { active = false; };
  }, [flags.constellation3d]);

  if (flags.constellation3d && capability === null) {
    return <div className="min-h-[480px] tinted-glass">Detecting graphics capabilities...</div>;
  }

  const gpuAvailable = flags.constellation3d && capability === 'webgpu' && !gpuFailed;
  // WebGPU availability does not guarantee that WebGL is usable; the WebGL
  // sibling performs its own conservative probe before creating a canvas.
  const glAvailable = flags.constellation3d && (capability === 'webgpu' || capability === 'webgl') && !glFailed;
  const preferred = gpuAvailable ? 'webgpu' : glAvailable ? 'webgl' : 'map';
  const view = choice === 'map' ? 'map'
    : choice === 'webgl' && glAvailable ? 'webgl'
      : choice === 'webgpu' && gpuAvailable ? 'webgpu' : preferred;

  return (
    <div className="relative">
      <div role="group" aria-label="Constellation renderer" className="flex flex-wrap gap-2 mb-2 font-mono text-xs">
        <button type="button" disabled={!gpuAvailable} aria-pressed={view === 'webgpu'} onClick={() => setChoice('webgpu')} className="px-2 py-1 border rounded border-accent-500/40 disabled:opacity-40">WebGPU</button>
        <button type="button" disabled={!glAvailable} aria-pressed={view === 'webgl'} onClick={() => setChoice('webgl')} className="px-2 py-1 border rounded border-accent-500/40 disabled:opacity-40">WebGL</button>
        <button type="button" aria-pressed={view === 'map'} onClick={() => setChoice('map')} className="px-2 py-1 border rounded border-accent-500/40">2D map</button>
      </div>
      <Suspense fallback={<div className="min-h-[480px] tinted-glass">Loading constellation...</div>}>
        {view === 'map' ? (
          <div className="relative min-h-[480px] rounded-xl border border-accent-500/20 overflow-hidden tinted-glass">
            <Map />
            <Suspense fallback={null}><OrbitalOverlay variant="table" /></Suspense>
          </div>
        ) : (
          <RendererBoundary key={view} onFailure={() => view === 'webgpu' ? setGpuFailed(true) : setGlFailed(true)}>
            {view === 'webgpu'
              ? <WebGPU onFailure={() => setGpuFailed(true)} />
              : <WebGL onFailure={() => setGlFailed(true)} />}
          </RendererBoundary>
        )}
      </Suspense>
    </div>
  );
}
