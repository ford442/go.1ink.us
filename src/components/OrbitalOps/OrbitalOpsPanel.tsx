import { useEffect, useMemo, useRef, useState } from 'react';
import { compassPoint } from '../../ground';
import useFocusTrap from '../../hooks/useFocusTrap';
import soundSystem from '../../lib/SoundSystem';
import { useEffectsContext } from '../../app/context/EffectsContext';
import { useGroundStationContext } from '../../app/context/GroundStationContext';
import { useOverlayModalContext } from '../../app/context/OverlayModalContext';
import GroundTrackMap from './GroundTrackMap';
import PassTable from './PassTable';
import SkyPlot from './SkyPlot';
import StationPicker from './StationPicker';
import useOrbitalClock from './useOrbitalClock';
import useOrbitalSnapshot from './useOrbitalSnapshot';
import { PROJECT_BY_ID } from './tracks';

interface OrbitalOpsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Orbital Ops: the hub as a ground station for the 1ink.us constellation.
 * Station picker, live look angles, sky plot + footprint map, and the next
 * passes for every catalog project that carries an `orbit`. Lazy-loaded from
 * SystemOverlays; lite mode renders the station picker and pass table only.
 */
export default function OrbitalOpsPanel({ isOpen, onClose }: OrbitalOpsPanelProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, isOpen);
  const { effectiveMode } = useEffectsContext();
  const { frame, station } = useGroundStationContext();
  const { handleProjectSelect } = useOverlayModalContext();
  const isLite = effectiveMode === 'lite';

  // Lite mode only shows the pass table, which is minute-granular anyway.
  const now = useOrbitalClock(isLite ? 30000 : 1000);
  const { tracks, passes, looks } = useOrbitalSnapshot(frame, now);
  const [selectedId, setSelectedId] = useState<number | null>(() => tracks[0]?.projectId ?? null);
  const selectedTrack = tracks.find((track) => track.projectId === selectedId) ?? tracks[0] ?? null;
  const accentById = useMemo(() => new Map(tracks.map((track) => [track.projectId, track.accent])), [tracks]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const openProject = (projectId: number) => {
    const project = PROJECT_BY_ID.get(projectId);
    if (!project) return;
    soundSystem.playClick();
    handleProjectSelect(project);
    onClose();
  };

  if (!isOpen) return null;

  const visibleCount = looks.filter((look) => look.visible).length;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbital-ops-title"
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-gray-900/95 border border-accent-500/50 shadow-[0_0_50px_rgba(var(--rgb-accent-400),0.3)] rounded-xl overflow-hidden backdrop-blur-xl"
      >
        <div className="p-4 border-b border-accent-500/30 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.8)] shrink-0" aria-hidden="true" />
            <h2 id="orbital-ops-title" className="font-mono text-sm tracking-widest text-accent-300 uppercase font-bold truncate">
              Orbital Ops
            </h2>
            <span className="hidden sm:inline text-[10px] font-mono text-accent-500/60 tracking-widest truncate">
              {station.name.toUpperCase()} · {visibleCount}/{tracks.length} ABOVE HORIZON
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-md transition-colors hover:bg-white/10 shrink-0"
            aria-label="Close orbital ops"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide p-4 bg-black/20 flex flex-col gap-4">
          {tracks.length === 0 ? (
            <p className="text-[10px] font-mono text-gray-500 border border-white/5 rounded-lg bg-black/30 p-3">
              NO_TRACKED_NODES — add an `orbit` payload to a project in projects.json.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <section className="flex flex-col gap-4 min-w-0">
                  <StationPicker />
                  {!isLite && (
                    <div>
                      <h3 className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase mb-2">Look Angles</h3>
                      <ul className="flex flex-col gap-1 border border-white/5 rounded-lg bg-black/30 p-2" role="list">
                        {looks.map((look) => (
                          <li key={look.projectId}>
                            <button
                              type="button"
                              onClick={() => setSelectedId(look.projectId)}
                              aria-pressed={look.projectId === selectedTrack?.projectId}
                              className={`w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-left font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400 ${look.projectId === selectedTrack?.projectId ? 'bg-accent-500/15' : 'hover:bg-white/5'}`}
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${look.visible ? 'bg-green-400' : 'bg-gray-600'}`} aria-hidden="true" />
                                <span aria-hidden="true">{look.icon}</span>
                                <span className="text-gray-200 truncate">{look.title}</span>
                                <span className="sr-only">{look.visible ? 'above horizon' : 'below horizon'}</span>
                              </span>
                              <span className="shrink-0 text-gray-400 tabular-nums">
                                EL {look.elevationDeg.toFixed(0)}° · AZ {look.azimuthDeg.toFixed(0)}° {compassPoint(look.azimuthDeg)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>

                {!isLite && selectedTrack && (
                  <section className="flex flex-col gap-3 min-w-0" aria-label={`${selectedTrack.title} tracking`}>
                    <div className="flex items-start gap-3">
                      <SkyPlot
                        looks={looks}
                        minElevationDeg={station.minElevationDeg}
                        selectedId={selectedTrack.projectId}
                        accentById={accentById}
                        onSelect={setSelectedId}
                        size={170}
                      />
                      <div className="flex flex-col gap-1 font-mono text-[10px] text-gray-400 min-w-0">
                        <span className="text-accent-300 text-xs truncate">{selectedTrack.icon} {selectedTrack.title}</span>
                        <span>SRC: {selectedTrack.source === 'tle' ? 'TLE' : 'ELEMENTS'}</span>
                        {(() => {
                          const look = looks.find((row) => row.projectId === selectedTrack.projectId);
                          if (!look) return <span>NO_STATE</span>;
                          return (
                            <>
                              <span>EL {look.elevationDeg.toFixed(1)}°</span>
                              <span>AZ {look.azimuthDeg.toFixed(1)}° {compassPoint(look.azimuthDeg)}</span>
                              <span>RNG {Math.round(look.rangeKm)} km</span>
                              <span>ALT {Math.round(look.altitudeKm)} km</span>
                              <span className={look.visible ? 'text-green-400' : 'text-gray-500'}>
                                {look.visible ? 'IN VIEW' : 'BELOW MASK'}
                              </span>
                            </>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => openProject(selectedTrack.projectId)}
                          className="mt-1 self-start text-accent-300 hover:text-accent-200 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400 rounded"
                        >
                          Open briefing
                        </button>
                      </div>
                    </div>
                    <GroundTrackMap frame={frame} track={selectedTrack} now={now} />
                    <p className="text-[9px] font-mono text-accent-500/50">
                      Ring = footprint above {station.minElevationDeg}° · dashed = next ~95 min ground track · ▲ = station
                    </p>
                  </section>
                )}
              </div>

              <section>
                <h3 className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase mb-2">Next Passes · 24h</h3>
                <PassTable rows={passes} now={now} stationName={station.name} onSelectProject={openProject} />
              </section>
            </>
          )}
        </div>

        <div className="p-3 border-t border-accent-500/30 bg-black/40 text-center shrink-0">
          <span className="text-[10px] font-mono text-accent-400/80 uppercase tracking-widest">
            Ground Station · `station` · `passes` · `horizon`
          </span>
        </div>
      </div>
    </div>
  );
}
