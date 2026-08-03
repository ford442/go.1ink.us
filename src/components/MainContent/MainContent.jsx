import { lazy, Suspense, useState } from 'react';
import ConstellationOverlay from '../../effects/ConstellationOverlay';
import { useBrowserContext } from '../../app/context/BrowserContext';
import { useSettingsContext } from '../../app/context/SettingsContext';
import { useOverlayContext } from '../../app/context/OverlayContext';
import { useEffectsContext } from '../../app/context/EffectsContext';
import { BrandImage } from '../ProjectImage';
import ViewToolbar from './ViewToolbar';
import ProjectGridView from './ProjectGridView';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import useGridPerspective from './useGridPerspective';

const SystemMap = lazy(() => import('../SystemMap'));
const SystemConstellation = lazy(() => import('../SystemConstellation'));

export default function MainContent() {
  const { filteredProjects, activeFilters, searchQuery, setSearchQuery, setActiveFilters, setCurrentPage, toggleFilter, sortOption, hoveredTag, paginatedProjects, focusedCardIndex, setFocusedCardIndex, favorites, toggleFavorite, handleCopyLink, handleTagClick, activeFiltersSet, draggedFavoriteId, dragOverFavoriteId, handleDragStart, handleDragOver, handleDragEnd, handleDrop, setHoveredTag, totalPages, currentPage, handlePageChange, suggestedTags } = useBrowserContext();
  const { displayMode, isGlitching, handleDisplayModeChange } = useSettingsContext();
  const { selectedProject, handleContextMenu, handleProjectSelect, isDataMode, isWarping } = useOverlayContext();
  const { flags } = useEffectsContext();
  const showWarpFx = flags.warpTransition && isWarping;

  // 🌌 CURATOR FEATURE: Global Holographic Command Table Perspective
  const gridRef = useGridPerspective(flags.card3d);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const isMapMode = displayMode === 'map' || displayMode === 'constellation';

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
              {!isMapMode && (
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
