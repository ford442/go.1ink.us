import { memo, useMemo } from 'react';
import projectData from '../data/projectData';
import { deriveTransmissions } from '../lib/transmissions';
import soundSystem from '../lib/SoundSystem';

export default memo(function TransmissionsPanel({
  projects = projectData,
  onSelectProject,
  variant = 'rail',
  limit,
}) {
  const allTransmissions = useMemo(() => deriveTransmissions(projects), [projects]);
  const transmissions = limit ? allTransmissions.slice(0, limit) : allTransmissions;

  return (
    <aside
      aria-labelledby="transmissions-panel-heading"
      className={`flex flex-col tinted-glass shifting-glass border border-accent-500/30 rounded-xl overflow-hidden relative shadow-lg ${
        variant === 'rail'
          ? 'w-full lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-hide'
          : 'w-full'
      }`}
    >
      {/* Header with Radar Beacon */}
      <div className="p-3.5 border-b border-accent-500/20 bg-accent-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-accent-400 text-xs animate-pulse">📡</span>
          <h2
            id="transmissions-panel-heading"
            className="text-xs font-mono font-bold tracking-widest text-accent-300 uppercase"
          >
            TRANSMISSIONS
          </h2>
        </div>
        <span className="text-[10px] font-mono text-accent-400/80 bg-accent-500/10 px-1.5 py-0.5 rounded border border-accent-500/20">
          {allTransmissions.length} LIVE
        </span>
      </div>

      {/* Transmissions List */}
      <div className="p-3 flex flex-col gap-2.5 overflow-y-auto scrollbar-hide">
        {transmissions.length > 0 ? (
          transmissions.map((item) => (
            <button
              key={item.id}
              type="button"
              className="group text-left p-2.5 rounded-lg border border-white/10 hover:border-accent-400/50 bg-black/40 hover:bg-accent-950/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(var(--rgb-accent-400),0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              aria-label={`Open dispatch for ${item.project.title}: ${item.summary}`}
              onClick={(e) => {
                e.preventDefault();
                soundSystem.playClick();
                onSelectProject?.(item.project);
              }}
            >
              {/* Top Row: Icon + Title + Date */}
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs shrink-0 transform group-hover:scale-110 transition-transform">
                    {item.project.icon}
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-accent-300 transition-colors truncate">
                    {item.project.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-accent-400 bg-accent-950/80 px-1.5 py-0.2 rounded border border-accent-500/30 shrink-0 uppercase tracking-tighter">
                  {item.formattedDate}
                </span>
              </div>

              {/* Middle Row: Summary Excerpt */}
              <p className="text-[11px] text-gray-300 group-hover:text-gray-100 transition-colors leading-relaxed line-clamp-2 mb-2 font-sans">
                {item.summary}
              </p>

              {/* Bottom Row: Terminal Link */}
              <div className="flex items-center justify-between text-[9px] font-mono text-accent-500/70 group-hover:text-accent-300 transition-colors pt-1 border-t border-white/5">
                <span>INSPECT_CHANGELOG</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </div>
            </button>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500 font-mono text-xs">
            <span className="text-base block mb-2 opacity-50">📻</span>
            NO_RECENT_TRANSMISSIONS
            <span className="block text-[10px] text-gray-600 mt-1">LISTENING ON FREQUENCY...</span>
          </div>
        )}
      </div>

      {/* Terminal Footer */}
      <div className="p-2 border-t border-accent-500/10 bg-black/40 flex items-center justify-between text-[9px] font-mono text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-ping inline-block" />
          MONITORING
        </span>
        <span>SYS.PATCH_FEED</span>
      </div>
    </aside>
  );
});
