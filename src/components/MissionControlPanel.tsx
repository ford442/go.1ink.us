import { useEffect, useMemo, useRef } from 'react';
import projectData from '../data/projectData';
import useFocusTrap from '../hooks/useFocusTrap';
import useOperatorStats from '../hooks/useOperatorStats';
import { isAnalyticsEnabled } from '../lib/analytics';
import { buildLiveMissionControlReport, type MissionControlNode } from '../lib/missionControl';
import { getConnectivityDisplay } from '../lib/projectConnectivity';
import soundSystem from '../lib/SoundSystem';
import { useEffectsContext } from '../app/context/EffectsContext';
import { useOverlayModalContext } from '../app/context/OverlayModalContext';

interface MissionControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const HEALTH_RANK: Record<MissionControlNode['health'], number> = { degraded: 0, unknown: 1, live: 2 };

function formatRelativeTime(ts: number): string {
  const deltaMs = Date.now() - ts;
  const minutes = Math.floor(deltaMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatBuildStamp(generatedAt: string): string {
  if (!generatedAt) return 'UNKNOWN';
  return generatedAt.slice(0, 19).replace('T', ' ') + 'Z';
}

export default function MissionControlPanel({ isOpen, onClose }: MissionControlPanelProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, isOpen);
  const { effectiveMode } = useEffectsContext();
  const { handleProjectSelect } = useOverlayModalContext();
  const stats = useOperatorStats();
  const analyticsOn = isAnalyticsEnabled();
  const isLite = effectiveMode === 'lite';

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

  // `stats` is a dependency so the report re-derives whenever analytics
  // writes fire, even though it's read through the live-data wrapper.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const report = useMemo(() => buildLiveMissionControlReport(), [stats]);

  const sortedNodes = useMemo(
    () =>
      [...report.nodes].sort((a, b) => {
        const rankDiff = HEALTH_RANK[a.health] - HEALTH_RANK[b.health];
        if (rankDiff !== 0) return rankDiff;
        return b.launches - a.launches;
      }),
    [report.nodes],
  );

  const projectById = useMemo(() => new Map(projectData.map((project) => [project.id, project])), []);

  const openProject = (projectId: number) => {
    const project = projectById.get(projectId);
    if (!project) return;
    soundSystem.playClick();
    handleProjectSelect(project);
    onClose();
  };

  if (!isOpen) return null;

  const { healthCounts } = report;
  const healthTotal = healthCounts.total || 1;
  const healthSegments: Array<{ key: MissionControlNode['health']; count: number; className: string }> = [
    { key: 'live', count: healthCounts.live, className: 'bg-green-400' },
    { key: 'degraded', count: healthCounts.degraded, className: 'bg-amber-400' },
    { key: 'unknown', count: healthCounts.unknown, className: 'bg-gray-500' },
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mission-control-title"
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col bg-gray-900/95 border border-accent-500/50 shadow-[0_0_50px_rgba(var(--rgb-accent-400),0.3)] rounded-xl overflow-hidden backdrop-blur-xl"
      >
        <div className="p-4 border-b border-accent-500/30 flex items-center justify-between bg-black/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.8)] shrink-0" aria-hidden="true" />
            <h2 id="mission-control-title" className="font-mono text-sm tracking-widest text-accent-300 uppercase font-bold truncate">
              Mission Control
            </h2>
            <span className="hidden sm:inline text-[10px] font-mono text-accent-500/60 tracking-widest truncate">
              PROBE_STAMP: {formatBuildStamp(report.generatedAt)} · SRC: {report.probeSource.toUpperCase()}
              {report.buildSha ? ` · SHA: ${report.buildSha.slice(0, 7)}` : ''}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded-md transition-colors hover:bg-white/10 shrink-0"
            aria-label="Close mission control"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hide p-4 bg-black/20 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Constellation status */}
          <section aria-labelledby="mc-status-heading" className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <h3 id="mc-status-heading" className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase">
                Constellation Status
              </h3>
              <span className="text-[10px] font-mono text-accent-500/60">
                {healthCounts.live}/{healthCounts.total} LIVE
              </span>
            </div>

            <div className="flex h-2 rounded-full overflow-hidden border border-white/10 bg-black/60 mb-3" aria-hidden="true">
              {healthSegments.map((segment) => (
                <div
                  key={segment.key}
                  className={segment.className}
                  style={{ width: `${(segment.count / healthTotal) * 100}%` }}
                />
              ))}
            </div>

            <ul className="flex flex-col gap-1 overflow-y-auto scrollbar-hide max-h-64 border border-white/5 rounded-lg bg-black/30 p-2" role="list">
              {sortedNodes.map((node) => {
                const display = getConnectivityDisplay(node.health);
                return (
                  <li key={node.id}>
                    <button
                      type="button"
                      onClick={() => openProject(node.id)}
                      className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-left hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${display.dotClass}`} />
                        <span className="text-xs font-mono text-gray-200 truncate" title={node.title}>{node.title}</span>
                      </span>
                      <span className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                        {node.launches > 0 && (
                          <span className="text-accent-500/60">×{node.launches}</span>
                        )}
                        <span className={display.textClass}>{display.label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Operator log + transmissions */}
          <section className="flex flex-col gap-4 min-h-0">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase">Operator Log</h3>
                <span className="text-[10px] font-mono text-accent-500/60">
                  {analyticsOn ? `${report.totalLaunches} LAUNCHES` : 'TELEMETRY OFF'}
                </span>
              </div>

              {!analyticsOn ? (
                <p className="text-[10px] font-mono text-gray-500 border border-white/5 rounded-lg bg-black/30 p-3">
                  TELEMETRY_DISABLED — showing catalog health only. Enable analytics to see launches.
                </p>
              ) : report.recentLaunches.length === 0 ? (
                <p className="text-[10px] font-mono text-gray-500 border border-white/5 rounded-lg bg-black/30 p-3">
                  NO_LAUNCHES_LOGGED
                </p>
              ) : (
                <ul className="flex flex-col gap-1 border border-white/5 rounded-lg bg-black/30 p-2 max-h-32 overflow-y-auto scrollbar-hide" role="list">
                  {report.recentLaunches.map((launch) => (
                    <li key={`${launch.projectId}-${launch.ts}`}>
                      <button
                        type="button"
                        onClick={() => openProject(launch.projectId)}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1 rounded text-left hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400"
                      >
                        <span className="text-xs font-mono text-accent-200/90 truncate" title={launch.title}>{launch.title}</span>
                        <span className="text-[10px] font-mono text-accent-500/50 shrink-0">{formatRelativeTime(launch.ts)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-[10px] font-mono tracking-widest text-accent-400/80 uppercase mb-2">Latest Transmissions</h3>
              {report.transmissions.length === 0 ? (
                <p className="text-[10px] font-mono text-gray-500 border border-white/5 rounded-lg bg-black/30 p-3">
                  NO_ACTIVE_TRANSMISSIONS
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5 border border-white/5 rounded-lg bg-black/30 p-2 max-h-40 overflow-y-auto scrollbar-hide" role="list">
                  {report.transmissions.map((transmission) => (
                    <li key={transmission.id}>
                      <button
                        type="button"
                        onClick={() => openProject(transmission.projectId)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400"
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-mono text-white truncate">{transmission.title}</span>
                          <span className="text-[9px] font-mono text-accent-400 shrink-0">{transmission.formattedDate}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 line-clamp-1 font-sans">{transmission.summary}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="p-3 border-t border-accent-500/30 bg-black/40 text-center shrink-0">
          <span className="text-[10px] font-mono text-accent-400/80 uppercase tracking-widest">
            Ground Ops Desk
          </span>
        </div>

        {!isLite && <div className="scanline opacity-10 pointer-events-none" aria-hidden="true" />}
      </div>
    </div>
  );
}
