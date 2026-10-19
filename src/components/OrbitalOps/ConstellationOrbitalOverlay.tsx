import { useState } from 'react';
import { compassPoint } from '../../ground';
import { formatApproxCountdown } from '../../lib/orbitalOps';
import { useGroundStationContext } from '../../app/context/GroundStationContext';
import { useOverlayChromeContext } from '../../app/context/OverlayChromeContext';
import { useOverlayModalContext } from '../../app/context/OverlayModalContext';
import GroundTrackMap from './GroundTrackMap';
import PassTable from './PassTable';
import useOrbitalClock from './useOrbitalClock';
import useOrbitalSnapshot from './useOrbitalSnapshot';
import { PROJECT_BY_ID } from './tracks';

interface ConstellationOrbitalOverlayProps {
  /**
   * `hud`: compact look-angle + footprint card over the 3D constellation.
   * `table`: the pass table only — used when the constellation falls back
   * from WebGL (or lite mode), so pass data still shows without a canvas.
   */
  variant: 'hud' | 'table';
}

export default function ConstellationOrbitalOverlay({ variant }: ConstellationOrbitalOverlayProps) {
  const { frame, station } = useGroundStationContext();
  const { setIsOrbitalOpsOpen } = useOverlayChromeContext();
  const { handleProjectSelect } = useOverlayModalContext();
  const now = useOrbitalClock(variant === 'hud' ? 1000 : 30000);
  const { tracks, passes, looks } = useOrbitalSnapshot(frame, now, { maxRows: variant === 'hud' ? 12 : 6 });
  const [selectedId, setSelectedId] = useState<number | null>(() => tracks[0]?.projectId ?? null);

  if (tracks.length === 0) return null;

  const openProject = (projectId: number) => {
    const project = PROJECT_BY_ID.get(projectId);
    if (project) handleProjectSelect(project);
  };

  const openPanelButton = (
    <button
      type="button"
      onClick={() => setIsOrbitalOpsOpen(true)}
      className="text-[9px] font-mono uppercase tracking-widest text-accent-300 hover:text-accent-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400 rounded"
    >
      Orbital Ops ↗
    </button>
  );

  if (variant === 'table') {
    return (
      <section className="p-3 border-t border-accent-500/20 bg-black/30" aria-labelledby="constellation-passes-heading">
        <div className="flex items-center justify-between mb-2 gap-2">
          <h3 id="constellation-passes-heading" className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase truncate">
            Next Passes · {station.name}
          </h3>
          {openPanelButton}
        </div>
        <PassTable rows={passes} now={now} stationName={station.name} onSelectProject={openProject} />
      </section>
    );
  }

  const track = tracks.find((candidate) => candidate.projectId === selectedId) ?? tracks[0]!;
  const look = looks.find((row) => row.projectId === track.projectId);
  const nextPass = passes.find((pass) => pass.projectId === track.projectId && pass.end.getTime() > now);

  return (
    <div className="absolute top-3 right-3 z-10 hidden md:flex flex-col gap-2 w-64 p-2.5 rounded-lg bg-black/60 border border-accent-500/30 backdrop-blur-sm font-mono text-[10px] text-gray-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-accent-400 uppercase tracking-[0.2em] truncate" title={station.name}>📡 {station.name}</span>
        {openPanelButton}
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Tracked node">
        {tracks.map((candidate) => (
          <button
            key={candidate.projectId}
            type="button"
            onClick={() => setSelectedId(candidate.projectId)}
            aria-pressed={candidate.projectId === track.projectId}
            title={candidate.title}
            className={`px-1.5 py-0.5 rounded border text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400 ${candidate.projectId === track.projectId ? 'border-accent-400 bg-accent-500/20' : 'border-white/10 hover:border-accent-500/40'}`}
          >
            <span aria-hidden="true">{candidate.icon}</span>
            <span className="sr-only">{candidate.title}</span>
          </button>
        ))}
      </div>
      <div className="text-accent-200 truncate">{track.title}</div>
      {look ? (
        <div className="grid grid-cols-2 gap-x-2 tabular-nums">
          <span>EL {look.elevationDeg.toFixed(1)}°</span>
          <span>AZ {look.azimuthDeg.toFixed(0)}° {compassPoint(look.azimuthDeg)}</span>
          <span>RNG {Math.round(look.rangeKm)} km</span>
          <span className={look.visible ? 'text-green-400' : 'text-gray-500'}>{look.visible ? 'IN VIEW' : 'BELOW MASK'}</span>
        </div>
      ) : (
        <span>NO_STATE</span>
      )}
      <GroundTrackMap frame={frame} track={track} now={now} />
      <div className="text-gray-400">
        {nextPass
          ? nextPass.start.getTime() <= now
            ? `PASS IN PROGRESS · MAX ${Math.round(nextPass.maxElevationDeg)}°`
            : `NEXT PASS ${formatApproxCountdown(nextPass.start, now)} · MAX ${Math.round(nextPass.maxElevationDeg)}°`
          : 'NO PASS IN 24H'}
      </div>
    </div>
  );
}
