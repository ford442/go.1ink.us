import { lazy, Suspense, useMemo, useState } from 'react';
import ConstellationOverlay from '../../effects/ConstellationOverlay';
import { useBrowserContext } from '../../app/context/BrowserContext';
import { useSettingsContext } from '../../app/context/SettingsContext';
import { useOverlayContext } from '../../app/context/OverlayContext';
import { useEffectsContext } from '../../app/context/EffectsContext';
import { BrandImage } from '../ProjectImage';
import ViewToolbar from './ViewToolbar';
import ProjectGridView from './ProjectGridView';
import FeaturedSection from './FeaturedSection';
import RecentlyUpdatedSection from './RecentlyUpdatedSection';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import useGridPerspective from './useGridPerspective';

const SystemMap = lazy(() => import('../SystemMap'));
const SystemConstellation = lazy(() => import('../SystemConstellation'));

export default function MainContent() {
  const { filteredProjects, activeFilters, searchQuery, setSearchQuery, setActiveFilters, setCurrentPage, toggleFilter, sortOption, hoveredTag, paginatedProjects, focusedCardIndex, setFocusedCardIndex, favorites, toggleFavorite, handleCopyLink, handleTagClick, activeFiltersSet, draggedFavoriteId, dragOverFavoriteId, handleDragStart, handleDragOver, handleDragEnd, handleDrop, setHoveredTag, totalPages, currentPage, handlePageChange, suggestedTags } = useBrowserContext();
  const { displayMode, isGlitching, handleDisplayModeChange } = useSettingsContext();
  const { selectedProject, handleContextMenu, handleProjectSelect, isDataMode, isWarping } = useOverlayContext();
  const { flags, effectiveMode, performanceMode } = useEffectsContext();
  const showWarpFx = flags.warpTransition && isWarping;

  // Memoize search regex for card highlights
  const regex = useMemo(() => {
    if (!searchQuery) return null;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escapedQuery})`, 'gi');
  }, [searchQuery]);

  // Featured and Recently Updated subsets (respecting active filters/search)
  const featuredProjects = useMemo(
    () => filteredProjects.filter((project) => project.featured),
    [filteredProjects]
  );

  const recentProjects = useMemo(
    () => filteredProjects.filter((project) => Boolean(project.changelog)),
    [filteredProjects]
  );

  // In dense / compact mode, avoid enabling card3d grid perspective or constellation overlay
  // unless the user is explicitly in Full (or has opted into those flags via random mode).
  const isDenseLayout = displayMode === 'dense';
  const allowDenseHeavyFx = effectiveMode === 'full' || performanceMode === 'random';
  const enableGridPerspective = flags.card3d && (!isDenseLayout || allowDenseHeavyFx);

  // 🌌 CURATOR FEATURE: Global Holographic Command Table Perspective
  const gridRef = useGridPerspective(enableGridPerspective);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const isMapMode = displayMode === 'map' || displayMode === 'constellation';
  const enableConstellationOverlay = !isMapMode && flags.constellation3d && (!isDenseLayout || allowDenseHeavyFx);

  return (
    <>
      {/* MAIN GRID */}
      <main className="flex-1 w-full min-w-0 relative z-0">
        {/* ARIA Live Region for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Showing {filteredProjects.length} projects. Active filters: {activeFilters.length === 0 ? 'All' : activeFilters.join(', ')}.
        </div>

        <ViewToolbar
          activeFilters={activeFilters}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setActiveFilters={setActiveFilters}
          setCurrentPage={setCurrentPage}
          toggleFilter={toggleFilter}
          displayMode={displayMode}
          handleDisplayModeChange={handleDisplayModeChange}
        />

        {filteredProjects.length > 0 ? (
          <>
            <div className="relative">
              {/* Tactical Tag Constellation Overlay */}
              {enableConstellationOverlay && (
                <ConstellationOverlay
                  hoveredTag={hoveredTag}
                  visibleProjects={paginatedProjects}
                  displayMode={displayMode}
                />
              )}
              {displayMode === 'map' ? (
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[400px] rounded-xl border border-accent-500/20 tinted-glass">
                    <span className="font-mono text-accent-400 text-sm tracking-widest uppercase animate-pulse">Loading neural map...</span>
                  </div>
                }>
                  <SystemMap />
                </Suspense>
              ) : displayMode === 'constellation' ? (
                <Suspense fallback={
                  <div className="flex items-center justify-center min-h-[480px] rounded-xl border border-accent-500/20 tinted-glass">
                    <span className="font-mono text-accent-400 text-sm tracking-widest uppercase animate-pulse">Loading constellation...</span>
                  </div>
                }>
                  <SystemConstellation />
                </Suspense>
              ) : (
                <>
                  {displayMode === 'dense' && (
                    <>
                      <FeaturedSection
                        featuredProjects={featuredProjects}
                        searchQuery={searchQuery}
                        regex={regex}
                        activeFilters={activeFilters}
                        onTagClick={handleTagClick}
                        onHoverTag={setHoveredTag}
                        onProjectClick={handleProjectSelect}
                        favorites={favorites}
                        toggleFavorite={toggleFavorite}
                        onCopyLink={handleCopyLink}
                        hoveredProjectId={hoveredProjectId}
                        setHoveredProjectId={setHoveredProjectId}
                      />

                      <RecentlyUpdatedSection
                        recentProjects={recentProjects}
                        onProjectClick={handleProjectSelect}
                      />

                      {(featuredProjects.length > 0 || recentProjects.length > 0) && (
                        <div className="flex items-center justify-between mb-3.5 border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-mono">■</span>
                            <h2 className="text-xs font-mono font-bold tracking-widest text-gray-300 uppercase">
                              ALL_PROTOCOLS
                            </h2>
                            <span className="text-[10px] font-mono text-gray-500">[{filteredProjects.length}]</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  <ProjectGridView
                    gridRef={gridRef}
                    displayMode={displayMode}
                    isGlitching={isGlitching}
                    showWarpFx={showWarpFx}
                    paginatedProjects={paginatedProjects}
                    focusedCardIndex={focusedCardIndex}
                    setFocusedCardIndex={setFocusedCardIndex}
                    hoveredProjectId={hoveredProjectId}
                    setHoveredProjectId={setHoveredProjectId}
                    handleTagClick={handleTagClick}
                    activeFilters={activeFilters}
                    searchQuery={searchQuery}
                    handleProjectSelect={handleProjectSelect}
                    selectedProject={selectedProject}
                    favorites={favorites}
                    toggleFavorite={toggleFavorite}
                    handleContextMenu={handleContextMenu}
                    handleCopyLink={handleCopyLink}
                    isDataMode={isDataMode}
                    sortOption={sortOption}
                    activeFiltersSet={activeFiltersSet}
                    draggedFavoriteId={draggedFavoriteId}
                    dragOverFavoriteId={dragOverFavoriteId}
                    handleDragStart={handleDragStart}
                    handleDragOver={handleDragOver}
                    handleDragEnd={handleDragEnd}
                    handleDrop={handleDrop}
                    setHoveredTag={setHoveredTag}
                  />
                </>
              )}
            </div>

            {!isMapMode && (
              <Pagination totalPages={totalPages} currentPage={currentPage} handlePageChange={handlePageChange} />
            )}
          </>
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            activeFilters={activeFilters}
            suggestedTags={suggestedTags}
            setSearchQuery={setSearchQuery}
            toggleFilter={toggleFilter}
            setActiveFilters={setActiveFilters}
            setCurrentPage={setCurrentPage}
          />
        )}
      </main>

      <footer className="mt-24 mb-8 flex flex-col justify-center items-center gap-4">
        <BrandImage
          brand="go1inkus"
          alt="go1ink.us"
          loading="lazy"
          className="h-16 md:h-20 lg:h-24 w-auto opacity-60 hover:opacity-100 transition-all duration-300 hover:scale-105"
          pictureClassName="block"
        />
      </footer>
    </>
  );
}
