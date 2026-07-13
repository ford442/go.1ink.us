import Tooltip from '../../Tooltip';
import highlightMatch from './highlightMatch';

// Tech-stack badge pills. Grid shows every tech entry (and renders nothing
// if there is none); matrix shows the first two behind a `sm:` breakpoint.
// List layout has no tech badges at all.
export default function CardTechBadges({ variant, tech, searchQuery, regex }) {
  if (variant === 'grid') {
    if (!tech || tech.length === 0) return null;
    return (
      <div className="mb-4 pointer-events-auto">
        <div className="flex flex-wrap gap-1.5">
          {tech.map((techItem, index) => (
            <Tooltip key={index} text={`TECH: ${techItem}`}>
              <span className="relative group/tech cursor-help text-[10px] font-mono px-2 py-0.5 rounded border border-accent-500/30 bg-black/40 text-gray-400 hover:text-accent-300 hover:bg-accent-500/20 hover:border-accent-400 hover:shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.6)] transition-all duration-300 block overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-400/20 to-transparent -translate-x-full group-hover/tech:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
                <span className="relative z-10">{highlightMatch(techItem, searchQuery, regex)}</span>
              </span>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex gap-1 overflow-hidden pointer-events-auto">
      {tech?.slice(0, 2).map((t, i) => (
        <Tooltip key={i} text={`TECH: ${t}`}>
          <span className="relative group/tech cursor-help text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-400 border border-accent-500/30 hover:bg-accent-500/20 hover:text-accent-300 hover:border-accent-400 hover:shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.6)] whitespace-nowrap block transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-400/20 to-transparent -translate-x-full group-hover/tech:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
            <span className="relative z-10">{highlightMatch(t, searchQuery, regex)}</span>
          </span>
        </Tooltip>
      ))}
    </div>
  );
}
