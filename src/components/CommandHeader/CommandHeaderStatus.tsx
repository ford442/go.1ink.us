import Clock from '../Clock';
import TelemetryGraph from '../TelemetryGraph';

interface SystemStats {
  uptime: number;
  liveNodes: number;
  totalNodes: number;
  catalogPct: number;
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

interface CommandHeaderStatusProps {
  isOnline: boolean;
  systemStats: SystemStats;
  isGodMode: boolean;
  totalProjects: number;
  netLabel: string;
}

export function CommandHeaderStatusChips({ isOnline, systemStats, isGodMode, totalProjects, netLabel }: CommandHeaderStatusProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-amber-400' : systemStats.liveNodes === systemStats.totalNodes ? 'bg-green-400' : systemStats.liveNodes > 0 ? 'bg-amber-400' : 'bg-gray-400'} animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]`} />
        <span className={`${!isOnline ? 'text-amber-300' : systemStats.liveNodes === systemStats.totalNodes ? 'text-green-400' : systemStats.liveNodes > 0 ? 'text-amber-400' : 'text-gray-400'} tracking-wider font-bold`}>
          {!isOnline ? 'SYS.OFFLINE' : systemStats.liveNodes > 0 ? 'SYS.ONLINE' : 'SYS.DEGRADED'}
        </span>
      </div>
      {isGodMode && (
        <div className="flex items-center gap-2 border-l border-accent-500/30 pl-4">
          <span className="text-amber-400 font-bold tracking-widest animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]">OVERCLOCKED</span>
        </div>
      )}
      <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">UPTIME:</span>
        <span className="text-accent-100">{formatUptime(systemStats.uptime)}</span>
      </div>

      <div className="hidden md:flex items-center gap-2 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">CAT:</span>
        <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden border border-accent-500/30">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${systemStats.catalogPct}%`,
              backgroundColor: systemStats.catalogPct > 80 ? 'rgb(var(--rgb-accent-400))' : systemStats.catalogPct > 50 ? '#eab308' : '#ef4444',
            }}
          />
        </div>
        <span className="text-accent-100 text-[10px] w-8">{systemStats.catalogPct}%</span>
      </div>

      <div className="hidden md:flex items-center gap-2 border-l border-accent-500/30 pl-4" title="Catalog nodes reachable at last build probe">
        <span className="opacity-50">NET:</span>
        <span className="text-accent-100">{netLabel} LIVE</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">PRJ:</span>
        <span className="text-accent-100">{totalProjects}</span>
      </div>

      <div className="hidden lg:flex items-center">
        <Clock precision="seconds" label="SYS.TIME:" />
      </div>
    </div>
  );
}

interface CommandHeaderTelemetryProps {
  systemStats: SystemStats;
  netLabel: string;
  totalProjects: number;
}

export function CommandHeaderTelemetry({ systemStats, netLabel, totalProjects }: CommandHeaderTelemetryProps) {
  return (
    <>
      <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
         <span className="opacity-50">CAT:</span>
         <span className="text-accent-100 min-w-[28px] tabular-nums">{systemStats.catalogPct}%</span>
         <div className="ml-1 border border-accent-500/30 rounded overflow-hidden">
            <TelemetryGraph value={systemStats.catalogPct} max={100} width={40} height={16} />
         </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4" title="Reachable catalog nodes">
         <span className="opacity-50">NET:</span>
         <span className="text-accent-100 min-w-[52px] tabular-nums">{netLabel}</span>
         <div className="ml-1 border border-accent-500/30 rounded overflow-hidden">
            <TelemetryGraph value={systemStats.liveNodes} max={Math.max(systemStats.totalNodes, 1)} width={40} height={16} />
         </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
         <span className="opacity-50">PRJ:</span>
         <span className="text-accent-100 min-w-[28px] tabular-nums">{totalProjects}</span>
      </div>
    </>
  );
}
