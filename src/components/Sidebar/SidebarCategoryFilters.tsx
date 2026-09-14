import type { Dispatch, SetStateAction } from 'react';
import projectData from '../../data/projectData';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_BUTTON_STYLES } from '../../constants';
import type { ProjectCounts } from '../../lib/projectBrowser';
import type { Category } from '../../types';

interface SidebarCategoryFiltersProps {
  activeFilters: string[];
  toggleFilter: (filter: string) => void;
  setHoveredTag: Dispatch<SetStateAction<string | null>>;
  activeFiltersSet: Set<string>;
  counts: ProjectCounts;
  favoriteCount: number;
  activeCategories: Category[];
  handleTagClick: (tag: string) => void;
}

export default function SidebarCategoryFilters({
  activeFilters,
  toggleFilter,
  setHoveredTag,
  activeFiltersSet,
  counts,
  favoriteCount,
  activeCategories,
  handleTagClick,
}: SidebarCategoryFiltersProps) {
  return (
    <>
      {/* Category Filter Section */}
      <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-3 pb-2 lg:pb-0 scrollbar-hide snap-x lg:snap-none mobile-scroll-mask lg:[mask-image:none]">
        <div className="lg:mb-2 text-accent-500/70 text-[10px] font-mono tracking-widest uppercase hidden lg:block border-b border-accent-500/20 pb-1">Primary Categories</div>

        {/* 'All' Button */}
        <button
          onClick={() => toggleFilter('All')}
          className={`
            px-4 py-2 lg:py-1.5 lg:px-3 rounded-full lg:rounded-lg text-sm lg:text-base font-medium transition-all duration-300 backdrop-blur-md border flex items-center justify-between gap-2 snap-center shrink-0 lg:w-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
            ${activeFilters.length === 0
              ? CATEGORY_BUTTON_STYLES['All'].activeClass
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <span className="text-xl lg:text-base">{(CATEGORY_ICONS as Record<string, string | undefined>)['All']}</span>
            <span>All Protocols</span>
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${activeFilters.length === 0 ? 'bg-white/20' : 'bg-black/30'}`}>
            {projectData.length}
          </span>
        </button>

        {/* Categories */}
        {(Object.keys(CATEGORIES) as Category[]).map((category) => {
          const isActive = activeFiltersSet.has(category);
          const count = counts.categoryCounts[category] || 0;
          const style = CATEGORY_BUTTON_STYLES[category] || CATEGORY_BUTTON_STYLES['default'];
          const icon = CATEGORY_ICONS[category] || '📁';

          if (count === 0 && !isActive) return null;

          return (
            <button
                key={category}
                onClick={() => toggleFilter(category)}
                onMouseEnter={() => setHoveredTag(category)}
                onMouseLeave={() => setHoveredTag(null)}
                className={`
                  px-4 py-2 lg:py-1.5 lg:px-3 rounded-full lg:rounded-lg text-sm lg:text-base font-medium transition-all duration-300 backdrop-blur-md border flex items-center justify-between gap-2 snap-center shrink-0 lg:w-full group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                ${isActive
                  ? style.activeClass
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                }
              `}
            >
              <span className="flex items-center gap-2">
                <span className="text-xl lg:text-base group-hover:scale-110 transition-transform">{icon}</span>
                <span className="whitespace-nowrap">{category}</span>
              </span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors ${isActive ? 'bg-white/20' : 'bg-black/30'}`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Favorites Button in Primary List */}
        <button
          onClick={() => toggleFilter('Favorites')}
          className={`
            px-4 py-2 lg:py-1.5 lg:px-3 rounded-full lg:rounded-lg text-sm lg:text-base font-medium transition-all duration-300 backdrop-blur-md border flex items-center justify-between gap-2 snap-center shrink-0 lg:w-full group
            ${activeFiltersSet.has('Favorites')
              ? CATEGORY_BUTTON_STYLES['Favorites'].activeClass
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <span className="text-xl lg:text-base group-hover:scale-110 transition-transform">💖</span>
            <span>Favorites</span>
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full transition-colors ${activeFiltersSet.has('Favorites') ? 'bg-white/20' : 'bg-black/30'}`}>
            {favoriteCount}
          </span>
        </button>
      </div>

      {/* Dynamic Sub-Tags Section based on Active Categories */}
      {activeCategories.length > 0 && (
        <div className="animate-fade-in lg:mt-2 hidden lg:block">
          <div className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase mb-3 border-b border-accent-500/20 pb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></span>
            Active Sub-Protocols
          </div>
          <div className="flex flex-wrap gap-2">
            {activeCategories.flatMap(cat => CATEGORIES[cat]).map(tag => {
              const count = counts.tagCounts[tag] || 0;
              const isActive = activeFiltersSet.has(tag);

              if (count === 0 && !isActive) return null;

              return (
                <button
                  key={tag}
                  onClick={(e) => {
                     e.stopPropagation();
                     handleTagClick(tag);
                  }}
                    onMouseEnter={() => setHoveredTag(tag)}
                    onMouseLeave={() => setHoveredTag(null)}
                  className={`
                    text-[11px] font-mono px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all duration-300
                    ${isActive
                      ? 'bg-accent-500/20 text-accent-300 border-accent-500/50 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]'
                      : 'bg-black/40 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30'
                    }
                  `}
                >
                  <span>{tag}</span>
                  <span className="opacity-50 text-[9px]">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
