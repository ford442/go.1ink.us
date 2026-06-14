import ActivityFeed from '../ActivityFeed';
import RadarHUD from '../RadarHUD';
import projectData from '../projectData';
import soundSystem from '../SoundSystem';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_BUTTON_STYLES } from '../constants';
import { useAppContext } from '../AppContext';

export default function Sidebar() {
  const { searchInputRef, searchQuery, setSearchQuery, setCurrentPage, addActivityLog, filteredProjects, suggestedTags, toggleFilter, isMobileFiltersOpen, setIsMobileFiltersOpen, activeFilters, sortOption, setSortOption, activeFiltersSet, counts, setHoveredTag, favoriteCount, activeCategories, handleTagClick, userActivityLogs, favorites, displayMode, setRandomSeed } = useAppContext();

  return (
    <>
      {/* SIDEBAR: Command Center (Filters & Search) */}
      <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-hide flex flex-col gap-8 pb-4">

      {/* Search Input Section */}
      <div className="flex w-full">
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-accent-500/50 group-focus-within:text-accent-400 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                if (e.target.value.trim().length > 2) {
                  addActivityLog(`USER SEARCH: "${e.target.value}"`);
                }
              }}
              onInput={() => soundSystem.playKeystroke()}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                  const firstCard = document.querySelector('.card-focusable');
                  if (firstCard) {
                    e.preventDefault();
                    firstCard.focus();
                    firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              placeholder="Search projects..."
              autoComplete="off"
              spellCheck="false"
              className="w-full bg-black/20 backdrop-blur-xl border border-white/10 text-white pl-10 pr-24 py-3 rounded-xl focus:outline-none focus:gold-glow focus:bg-black/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black transition-all duration-300 shadow-lg placeholder-gray-500 text-sm"
            />

            {/* Right Actions: Results Count or Shortcut Hint */}
            <div className="absolute right-4 flex items-center space-x-3">
              {searchQuery ? (
                <>
                  <span className="text-xs font-mono text-accent-400 bg-accent-900/30 px-2 py-1 rounded">
                    {filteredProjects.length} found
                  </span>
                  <button
                    onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-1 text-gray-500 text-xs border border-white/10 rounded px-2 py-1">
                  <span className="text-xs">⌘</span>
                  <span>K</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tags (Moved below search, simplified) */}
      <div className="hidden lg:flex flex-col gap-2 px-1">
         <span className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase">Quick Protocols:</span>
         <div className="flex flex-wrap gap-1.5">
           {suggestedTags.slice(0, 4).map((tag) => (
             <button
               key={tag}
               onClick={() => {
                 setSearchQuery('');
                 toggleFilter(tag);
               }}
               className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 hover:bg-accent-500/10 hover:text-accent-300 hover:border-accent-500/30 transition-colors"
             >
               {tag}
             </button>
           ))}
         </div>
      </div>

      {/* Mobile Filter Toggle Button (Floating Hamburger) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[65] animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className={`w-14 h-14 relative group overflow-hidden bg-black/80 backdrop-blur-xl border border-accent-500/50 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-accent-900/40 hover:scale-110 shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.3)] ${isMobileFiltersOpen ? 'scale-0' : 'scale-100'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/0 via-accent-500/5 to-accent-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>

          <div className="flex items-center justify-center relative z-10 text-accent-400 group-hover:text-accent-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>

          {/* Active Indicator Bubble */}
          {(activeFilters.length > 0 || sortOption !== 'Featured') && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500 border border-black"></span>
            </span>
          )}
        </button>
      </div>

      {/* Sort Options */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between">
          <span className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort Protocol:
          </span>
        </div>
        <select
          value={sortOption}
          onChange={(e) => {
            if (e.target.value === 'Random') {
              setRandomSeed(Math.random());
            }
            setSortOption(e.target.value);
            setCurrentPage(1);
            addActivityLog(`SORT_PROTOCOL_UPDATED: ${e.target.value.toUpperCase()}`);
          }}
          className="w-full bg-black/40 text-gray-300 text-xs font-mono px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-accent-500/50 focus-visible:ring-2 focus-visible:ring-accent-400 hover:bg-white/5 transition-colors cursor-pointer appearance-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
        >
          <option value="Featured" className="bg-gray-900">Featured</option>
          <option value="Newest" className="bg-gray-900">Newest</option>
          <option value="A-Z" className="bg-gray-900">A-Z</option>
          <option value="Random" className="bg-gray-900">Random</option>
          <option value="Most Complex" className="bg-gray-900">Most Complex</option>
        </select>
      </div>

      {/* Drawer Backdrop */}
      <div
         className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${isMobileFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
         onClick={() => setIsMobileFiltersOpen(false)}
      ></div>

      {/* Off-canvas Filter Drawer (Mobile) / Sidebar (Desktop) */}
      <div className={`
         fixed inset-y-0 right-0 z-[70] w-80 max-w-[85vw] bg-black/95 border-l border-white/10 p-6 transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-full lg:max-w-none lg:bg-transparent lg:border-none lg:p-0 lg:z-auto
         ${isMobileFiltersOpen ? 'translate-x-0 shadow-[-10px_0_30px_rgba(0,0,0,0.8)]' : 'translate-x-full lg:translate-x-0'}
         overflow-y-auto scrollbar-hide lg:overflow-visible flex flex-col gap-6 lg:gap-8
      `}>

        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="font-mono text-sm tracking-widest uppercase font-bold text-accent-400 flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Tactical Filters
            </span>
            <button
              onClick={() => setIsMobileFiltersOpen(false)}
              className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>

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
            <span className="text-xl lg:text-base">{CATEGORY_ICONS['All']}</span>
            <span>All Protocols</span>
          </span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${activeFilters.length === 0 ? 'bg-white/20' : 'bg-black/30'}`}>
            {projectData.length}
          </span>
        </button>

        {/* Categories */}
        {Object.entries(CATEGORIES).map(([category]) => {
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
      <div className="hidden lg:block mt-6">
        <ActivityFeed logs={userActivityLogs} />
      </div>
      <div className="hidden lg:block mt-6">
        <RadarHUD projects={filteredProjects} favorites={favorites} displayMode={displayMode} />
      </div>
      </div>
      </aside>
    </>
  );
}
