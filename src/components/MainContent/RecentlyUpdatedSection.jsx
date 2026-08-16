import { memo, useMemo } from 'react';
import soundSystem from '../../lib/SoundSystem';
import { deriveTransmissions } from '../../lib/transmissions';

export default memo(function RecentlyUpdatedSection({
  recentProjects,
  onProjectClick,
}) {
  const transmissions = useMemo(
    () => deriveTransmissions(recentProjects || []),
    [recentProjects],
  );

  if (!transmissions || transmissions.length === 0) return null;

  return (
    <section aria-labelledby="recently-updated-heading" className="mb-8 relative z-10">
      <div className="flex items-center justify-between mb-2.5 border-b border-accent-500/20 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-accent-400 text-xs animate-pulse">⚡</span>
          <h2 id="recently-updated-heading" className="text-xs font-mono font-bold tracking-widest text-accent-300 uppercase">
            RECENT_TRANSMISSIONS // PATCH_NOTES
          </h2>
          <span className="text-[10px] font-mono text-gray-500">[{transmissions.length}]</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 no-scrollbar scroll-smooth">
        {transmissions.map((item) => (
          <button
            key={item.id}
            type="button"
            className="group flex items-center gap-2.5 bg-black/40 hover:bg-accent-950/40 border border-white/10 hover:border-accent-400/50 rounded-lg py-1.5 px-3 shrink-0 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(var(--rgb-accent-400),0.25)] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            aria-label={`View patch notes for ${item.project.title}`}
            onClick={(e) => {
              e.preventDefault();
              soundSystem.playClick();
              onProjectClick?.(item.project);
            }}
          >
            <span className="text-sm shrink-0 transform group-hover:scale-110 transition-transform">
              {item.project.icon}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold text-white group-hover:text-accent-300 transition-colors whitespace-nowrap">
                {item.project.title}
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 bg-accent-500/20 text-accent-300 rounded border border-accent-500/30 uppercase">
                {item.formattedDate}
              </span>
            </div>

            <div className="h-3.5 w-px bg-white/10 shrink-0" />

            <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors truncate max-w-[200px] sm:max-w-[300px]">
              {item.summary}
            </span>

            <span className="text-accent-400/60 group-hover:text-accent-300 group-hover:translate-x-0.5 transition-all text-xs font-mono shrink-0">
              →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
});
