import highlightMatch from './highlightMatch';
import soundSystem from '../../SoundSystem';

const VARIANTS = {
  grid: {
    wrapper: 'flex flex-wrap gap-2 mt-auto pointer-events-auto pt-2 border-t border-white/5',
    slice: null,
    tagClass: (isHighlighted) => `px-3 py-1 text-xs font-semibold tracking-wider border rounded-full transition-all duration-300 cursor-pointer z-20 ${isHighlighted
      ? 'bg-accent-500/80 text-white border-accent-300 shadow-[0_0_12px_rgba(var(--rgb-accent-400),0.6)] scale-105 ring-1 ring-accent-200'
      : 'text-accent-200 bg-accent-900/30 border-accent-500/20 hover:bg-accent-800/50 hover:text-white hover:border-accent-400 hover:scale-105 group-hover:gold-glow group-hover:shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]'
    }`
  },
  matrix: {
    wrapper: 'hidden lg:flex flex-wrap gap-1 w-40 shrink-0 z-20 pointer-events-auto justify-end',
    slice: 3,
    tagClass: (isHighlighted) => `text-[9px] px-2 py-0.5 rounded-full border transition-all duration-300 whitespace-nowrap ${isHighlighted
      ? 'bg-accent-500/80 text-white border-accent-300 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.6)] ring-1 ring-accent-200'
      : 'text-accent-200 bg-accent-900/30 border-accent-500/20 hover:bg-accent-800/50 hover:text-white hover:border-accent-400'
    }`
  },
  list: {
    wrapper: 'hidden xl:flex items-center gap-1 shrink-0 pointer-events-auto',
    slice: 3,
    tagClass: (isHighlighted) => `text-[10px] px-2 py-0.5 rounded border transition-all duration-200 ${isHighlighted
      ? 'bg-accent-500/50 text-white border-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.4)]'
      : 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'
    }`
  }
};

// Renders the clickable tag-pill list shared across grid/list/matrix
// layouts. Each variant differs in wrapper visibility breakpoints, pill
// styling, and how many tags are shown.
export default function CardTagList({ variant, tags, highlightedTags, onTagClick, onHoverTag, searchQuery, regex }) {
  const cfg = VARIANTS[variant];
  const visibleTags = cfg.slice ? tags.slice(0, cfg.slice) : tags;

  return (
    <div className={cfg.wrapper}>
      {visibleTags.map((tag, i) => {
        const isHighlighted = highlightedTags.includes(tag);
        return (
          <button
            key={i}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              soundSystem.playClick();
              if (onTagClick) onTagClick(tag);
            }}
            onMouseEnter={() => {
              if (onHoverTag) onHoverTag(tag);
            }}
            onMouseLeave={() => {
              if (onHoverTag) onHoverTag(null);
            }}
            className={cfg.tagClass(isHighlighted)}
          >
            {highlightMatch(tag, searchQuery, regex)}
          </button>
        );
      })}
    </div>
  );
}
