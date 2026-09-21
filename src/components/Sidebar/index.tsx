import { lazy, Suspense } from 'react';
import RadarHUD from '../../effects/RadarHUD';
import { useBrowserContext, useBrowserActions } from '../../app/context/BrowserContext';
import { useActivityContext } from '../../app/context/ActivityContext';
import { useSettingsContext } from '../../app/context/SettingsContext';
import { useOverlayModalContext } from '../../app/context/OverlayModalContext';
import { useEffectsContext } from '../../app/context/EffectsContext';
import ActivityFeed from '../ActivityFeed';
import TransmissionsPanel from '../TransmissionsPanel';
import SidebarSearch from './SidebarSearch';
import SidebarCategoryFilters from './SidebarCategoryFilters';
import SidebarThemeSwitcher from './SidebarThemeSwitcher';

const LoadoutPanel = lazy(() => import('../LoadoutPanel'));
const OperatorProfileCard = lazy(() => import('../OperatorProfileCard'));

export default function Sidebar() {
  const { searchInputRef, searchQuery, filteredProjects, suggestedTags, isMobileFiltersOpen, activeFilters, sortOption, activeFiltersSet, counts, favoriteCount, activeCategories, favorites } = useBrowserContext();
  const { setSearchQuery, setCurrentPage, toggleFilter, setIsMobileFiltersOpen, setSortOption, setHoveredTag, handleTagClick, setRandomSeed } = useBrowserActions();
  const { addActivityLog } = useActivityContext();
  const { displayMode, theme, changeTheme } = useSettingsContext();
  const { handleProjectSelect } = useOverlayModalContext();
  const { flags } = useEffectsContext();

  return (
    <>
      {/* SIDEBAR: Command Center (Filters & Search) */}
      <aside className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-hide flex flex-col gap-8 pb-4" aria-label="Filters and search" tabIndex={0}>

      <Suspense fallback={
        <div className="p-4 bg-black/40 border border-accent-500/30 rounded-xl h-[88px] animate-pulse" aria-hidden="true" />
      }>
        <OperatorProfileCard />
      </Suspense>

      <SidebarSearch
        searchInputRef={searchInputRef}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setCurrentPage={setCurrentPage}
        filteredProjectsCount={filteredProjects.length}
        suggestedTags={suggestedTags}
        toggleFilter={toggleFilter}
        addActivityLog={addActivityLog}
        sortOption={sortOption}
        setSortOption={setSortOption}
        setRandomSeed={setRandomSeed}
      />

      {/* Mobile Filter Toggle Button (Floating Hamburger) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-[65] animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <button
          onClick={() => setIsMobileFiltersOpen(true)}
          className={`w-14 h-14 relative group overflow-hidden bg-black/80 backdrop-blur-xl border border-accent-500/50 rounded-full flex items-center justify-center transition-all duration-300 hover:bg-accent-900/40 hover:scale-110 shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.3)] ${isMobileFiltersOpen ? 'scale-0' : 'scale-100'}`}
          aria-label="Open filters menu"
          aria-expanded={isMobileFiltersOpen}
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
              className="text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full"
              aria-label="Close filters menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
        </div>

      <SidebarCategoryFilters
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        setHoveredTag={setHoveredTag}
        activeFiltersSet={activeFiltersSet}
        counts={counts}
        favoriteCount={favoriteCount}
        activeCategories={activeCategories}
        handleTagClick={handleTagClick}
      />

      <Suspense fallback={null}>
        <LoadoutPanel />
      </Suspense>

      <SidebarThemeSwitcher theme={theme} changeTheme={changeTheme} />

      <div className="hidden lg:block mt-6">
        <ActivityFeed />
      </div>
      <div className="hidden lg:block xl:hidden mt-6">
        <TransmissionsPanel onSelectProject={handleProjectSelect} variant="sidebar" limit={4} />
      </div>
      <div className="hidden lg:block mt-6">
        {flags.radarHud && (
          <RadarHUD projects={filteredProjects} favorites={favorites} displayMode={displayMode} />
        )}
      </div>
      </div>
      </aside>
    </>
  );
}
