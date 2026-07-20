import { useMemo } from 'react';
import projectData from '../data/projectData';
import { isAnalyticsEnabled } from '../lib/analytics';
import useOperatorStats from '../hooks/useOperatorStats';

const projectById = new Map(projectData.map((p) => [p.id, p]));

function formatRelativeTime(ts) {
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

function resolveProjectTitle(projectId) {
  return projectById.get(projectId)?.title ?? `ID ${projectId}`;
}

export default function OperatorProfileCard() {
  const stats = useOperatorStats();
  const analyticsOn = isAnalyticsEnabled();

  const topLaunch = useMemo(() => {
    const entries = Object.entries(stats.projectLaunches);
    if (entries.length === 0) return null;
    entries.sort(([, a], [, b]) => b - a);
    const [id, count] = entries[0];
    return { projectId: Number(id), count, title: resolveProjectTitle(Number(id)) };
  }, [stats.projectLaunches]);

  const recentLaunches = stats.recentLaunches.slice(0, 5);

  return (
    <div className="relative group p-4 bg-black/40 border border-accent-500/30 rounded-xl overflow-hidden backdrop-blur-md">
      <div className="absolute inset-0 bg-gradient-to-br from-accent-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none mix-blend-multiply opacity-50" />

      <div className="relative z-10 flex items-center gap-4">
        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center bg-black border border-accent-400/50 rounded shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.3)]">
          <div className="absolute inset-0 bg-accent-400/10 group-hover:bg-accent-400/20 transition-colors" />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] ${analyticsOn ? 'bg-emerald-400' : 'bg-gray-500'}`} />
        </div>

        <div className="flex flex-col overflow-hidden min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-accent-300 text-sm font-bold tracking-widest font-mono truncate">OPR-7X9</span>
            <span className="px-1.5 py-0.5 text-[8px] bg-accent-500/20 text-accent-200 border border-accent-500/30 rounded font-mono uppercase tracking-wider shrink-0">
              {analyticsOn ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="text-[10px] text-accent-500/70 font-mono tracking-widest uppercase truncate mb-1">
            {analyticsOn
              ? `${stats.totalLaunches} launch${stats.totalLaunches === 1 ? '' : 'es'} logged`
              : 'Telemetry disabled'}
          </div>
          <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-accent-500/20">
            <div
              className="h-full bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)] origin-left transition-all duration-500"
              style={{ width: analyticsOn && stats.totalLaunches > 0 ? '100%' : analyticsOn ? '35%' : '0%' }}
            />
          </div>
        </div>
      </div>

      {analyticsOn && (recentLaunches.length > 0 || topLaunch) && (
        <div className="relative z-10 mt-3 pt-3 border-t border-accent-500/20 space-y-2">
          {topLaunch && (
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
              <span className="text-accent-500/70 uppercase tracking-widest shrink-0">Top mission</span>
              <span className="text-accent-200 truncate" title={topLaunch.title}>
                {topLaunch.title}
                <span className="text-accent-500/60 ml-1">×{topLaunch.count}</span>
              </span>
            </div>
          )}

          {recentLaunches.length > 0 && (
            <div>
              <div className="text-[10px] text-accent-500/70 font-mono tracking-widest uppercase mb-1.5">
                Launch history
              </div>
              <ul className="space-y-1 max-h-24 overflow-y-auto scrollbar-hide">
                {recentLaunches.map((entry) => (
                  <li
                    key={`${entry.projectId}-${entry.ts}`}
                    className="flex items-center justify-between gap-2 text-[10px] font-mono text-gray-400"
                  >
                    <span className="truncate text-accent-300/90" title={resolveProjectTitle(entry.projectId)}>
                      {resolveProjectTitle(entry.projectId)}
                    </span>
                    <span className="shrink-0 text-accent-500/50">{formatRelativeTime(entry.ts)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent-500/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent-500/50" />
    </div>
  );
}
