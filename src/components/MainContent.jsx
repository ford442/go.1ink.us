import { flushSync } from 'react-dom';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
const SystemMap = lazy(() => import('./SystemMap'));
const SystemConstellation = lazy(() => import('./SystemConstellation'));
import ConstellationOverlay from '../effects/ConstellationOverlay';
import { CATEGORY_ICONS } from '../data/constants';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useSettingsContext } from '../app/context/SettingsContext';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useEffectsContext } from '../app/context/EffectsContext';
import { BrandImage } from './ProjectImage';

export default function MainContent() {
  const { filteredProjects, activeFilters, searchQuery, setSearchQuery, setActiveFilters, setCurrentPage, toggleFilter, sortOption, hoveredTag, paginatedProjects, focusedCardIndex, setFocusedCardIndex, favorites, toggleFavorite, handleCopyLink, handleTagClick, activeFiltersSet, draggedFavoriteId, dragOverFavoriteId, handleDragStart, handleDragOver, handleDragEnd, handleDrop, setHoveredTag, totalPages, currentPage, handlePageChange, suggestedTags } = useBrowserContext();
  const { displayMode, isGlitching, handleDisplayModeChange } = useSettingsContext();
  const { selectedProject, handleContextMenu, handleProjectSelect, isDataMode, isWarping } = useOverlayContext();
  const { flags } = useEffectsContext();
  const showWarpFx = flags.warpTransition && isWarping;

  // 🌌 CURATOR FEATURE: Global Holographic Command Table Perspective
  const gridRef = useRef(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);

  useEffect(() => {
    // Check if device supports hover and user doesn't prefer reduced motion
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateInteractive = () => {
      setIsInteractive(hoverQuery.matches && !motionQuery.matches && flags.card3d);
    };

    updateInteractive();
    hoverQuery.addEventListener('change', updateInteractive);
    motionQuery.addEventListener('change', updateInteractive);

    return () => {
      hoverQuery.removeEventListener('change', updateInteractive);
      motionQuery.removeEventListener('change', updateInteractive);
    };
  }, [flags.card3d]);

  useEffect(() => {
    let rafId = null;

    if (!isInteractive) {
      if (gridRef.current) {
        gridRef.current.style.transform = 'perspective(2000px) rotateX(0deg) rotateY(0deg)';
      }
      return;
    }

    const handleMouseMove = (e) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        const x = e.clientX;
        const y = e.clientY;

        // Calculate distance from center (-0.5 to 0.5)
        const xPos = (x / innerWidth) - 0.5;
        const yPos = (y / innerHeight) - 0.5;

        // Max tilt of 3 degrees
        const maxTilt = 3;

        // When mouse is right, rotateY should be positive to look left
        const rotateY = xPos * maxTilt * 2;
        // When mouse is down, rotateX should be negative to look up
        const rotateX = -(yPos * maxTilt * 2);

        if (gridRef.current) {
          gridRef.current.style.transform = `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }
        rafId = null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [isInteractive]);

  return (
    <>
      {/* MAIN GRID */}
      <main className="flex-1 w-full min-w-0 relative z-0">
        {/* ARIA Live Region for Screen Readers */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          Showing {filteredProjects.length} projects. Active filters: {activeFilters.length === 0 ? 'All' : activeFilters.join(', ')}.
        </div>

        {/* Active Filters Summary */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
             <span className="text-gray-500 text-sm font-mono mr-2">SYS_VIEW:</span>
             {activeFilters.length === 0 && !searchQuery ? (
               <span className="text-white text-sm font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">All Protocols</span>
             ) : (
               <>
                 {searchQuery && (
                   <span className="text-white text-sm font-bold bg-accent-500/20 px-3 py-1 rounded-full border border-accent-500/30 flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]">
                     🔍 "{searchQuery}"
                     <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="ml-1 hover:text-red-400 transition-colors p-0.5" aria-label={`Clear search`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                     </button>
                   </span>
                 )}
                 {activeFilters.map(filter => (
                   <span key={filter} className="text-white text-sm font-bold bg-accent-500/20 px-3 py-1 rounded-full border border-accent-500/30 flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]">
                     {CATEGORY_ICONS[filter] || '🏷️'} {filter}
                     <button onClick={() => toggleFilter(filter)} className="ml-1 hover:text-red-400 transition-colors p-0.5" aria-label={`Remove ${filter} filter`}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                         <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                       </svg>
                     </button>
                   </span>
                 ))}
                 {(activeFilters.length > 0 && searchQuery) || activeFilters.length > 1 ? (
                   <button onClick={() => { setActiveFilters([]); setSearchQuery(''); setCurrentPage(1); }} className="text-xs font-mono text-accent-400 hover:text-accent-300 ml-2 uppercase tracking-widest hover:underline decoration-accent-400/50 underline-offset-4 transition-all">
                     [ Clear All ]
                   </button>
                 ) : null}
               </>
             )}
          </div>

          {/* View & Sort Controls */}
          <div className="flex items-center gap-3">
             {/* Display Mode Toggle */}
             <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-1 flex" role="group" aria-label="Layout mode">
                <button
                  onClick={() => handleDisplayModeChange('grid')}
                  className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === 'grid' ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
                  aria-label="Grid View"
                  aria-pressed={displayMode === 'grid'}
                  title="Grid Protocol"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDisplayModeChange('matrix')}
                  className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === 'matrix' ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
                  aria-label="Matrix View"
                  aria-pressed={displayMode === 'matrix'}
                  title="Matrix Protocol"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDisplayModeChange('list')}
                  className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === 'list' ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
                  aria-label="List View"
                  aria-pressed={displayMode === 'list'}
                  title="List Protocol"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDisplayModeChange('map')}
                  className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === 'map' ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
                  aria-label="Neural Map View"
                  aria-pressed={displayMode === 'map'}
                  title="Map Protocol"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDisplayModeChange('constellation')}
                  className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === 'constellation' ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
                  aria-label="Constellation View"
                  aria-pressed={displayMode === 'constellation'}
                  title="Constellation Protocol"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
             </div>
          </div>
        </div>

        {filteredProjects.length > 0 ? (
          <>
            <div className="relative">
              {/* Tactical Tag Constellation Overlay */}
              {displayMode !== 'map' && displayMode !== 'constellation' && (
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
              <div
                id="project-grid"
                ref={gridRef}
                className={`transition-all duration-300 ease-out relative z-10 will-change-transform ${isGlitching ? 'animate-layout-glitch' : ''} ${
                  displayMode === 'grid'
                    ? 'columns-1 md:columns-2 lg:columns-2 xl:columns-3 gap-6 md:gap-8 opacity-100'
                    : displayMode === 'list'
                    ? 'flex flex-col gap-3 opacity-100'
                    : 'grid grid-cols-1 gap-6 md:gap-8 opacity-100'
                } ${showWarpFx ? 'opacity-20 scale-[1.05] blur-[8px] grayscale' : 'opacity-100'}`}
                style={{
                  transform: 'perspective(2000px) rotateX(0deg) rotateY(0deg)',
                  transformStyle: 'preserve-3d'
                }}
                onKeyDown={(e) => {
                let nextIndex = focusedCardIndex;
                if (e.key === 'ArrowRight') {
                  nextIndex = Math.min(paginatedProjects.length - 1, focusedCardIndex + 1);
                } else if (e.key === 'ArrowLeft') {
                  nextIndex = Math.max(0, focusedCardIndex - 1);
                } else if (e.key === 'ArrowDown') {
                  // In CSS columns, down goes to the next item sequentially within the column
                  // A true spatial down would be index + items_per_col, but visually and DOM-wise sequential is often okay,
                  // or we can jump by columns if we want spatial.
                  // Let's use simple sequential for matrix mode, and sequential for columns mode since tab order follows DOM.
                  nextIndex = Math.min(paginatedProjects.length - 1, focusedCardIndex + 1);
                } else if (e.key === 'ArrowUp') {
                  nextIndex = Math.max(0, focusedCardIndex - 1);
                } else {
                  return; // let other keys pass
                }

                if (nextIndex !== focusedCardIndex) {
                  e.preventDefault();
                  setFocusedCardIndex(nextIndex);
                  setTimeout(() => {
                    // Scope focus to the current container to avoid finding other focusable elements elsewhere
                    const cards = e.currentTarget.querySelectorAll('.card-focusable');
                    if (cards[nextIndex]) {
                      cards[nextIndex].focus();
                      cards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }, 0);
                }
              }}
            >
              <AnimatePresence mode="popLayout">
                {paginatedProjects.map((project, index) => (
                  <motion.div
                     layout
                     initial={{ opacity: 0, y: 50, scale: 0.9 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                     transition={{ duration: 0.5, type: 'spring', bounce: 0.3, delay: index * 0.05 }}
                     whileHover={{ scale: 1.02 }}
                     key={project.id} // use unique project id for reliable layout animations
                     className={`${displayMode === 'grid' ? 'break-inside-avoid inline-block w-full mb-6 md:mb-8' : ''} transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                       hoveredProjectId && hoveredProjectId !== project.id
                         ? 'blur-[4px] opacity-40 scale-[0.98] grayscale-[30%]'
                         : ''
                     }`}
                  >
                  <Card
                    project={project}
                    onCardHover={setHoveredProjectId}
                    index={index}
                    onTagClick={handleTagClick}
                    highlightedTags={activeFilters}
                    searchQuery={searchQuery}
                    onProjectClick={() => handleProjectSelect(project)}
                    isSelected={selectedProject?.id === project.id}
                    isFavorite={favorites.includes(project.id)}
                    onToggleFavorite={() => toggleFavorite(project)}
                    onContextMenu={(e) => handleContextMenu(e, project)}
                    onCopyLink={handleCopyLink}
                    layout={displayMode}
                    isDataMode={isDataMode}

                    // Drag and drop props (only active when sorting favorites)
                    draggable={sortOption === 'Featured' && activeFiltersSet.has('Favorites')}
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragOver={(e) => handleDragOver(e, project.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, project.id)}
                    isDragged={draggedFavoriteId === project.id}
                    isDragOver={dragOverFavoriteId === project.id}
                    tabIndex={index === focusedCardIndex ? 0 : -1}
                    onFocus={() => setFocusedCardIndex(index)}
                    onHoverTag={setHoveredTag}
                  />
                  </motion.div>
                ))}
              </AnimatePresence>
              </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && displayMode !== 'map' && displayMode !== 'constellation' && (
              <div className="mt-16 flex justify-center items-center gap-4 border-t border-white/10 pt-8 animate-fade-in">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  aria-label="Previous Page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first, last, current, and +/- 1 pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`w-10 h-10 rounded-lg text-sm font-mono font-bold transition-all ${
                            currentPage === page
                              ? 'bg-accent-500/20 text-accent-300 border border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]'
                              : 'bg-black/40 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-gray-600">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                  aria-label="Next Page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
      <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
         <div className="relative overflow-hidden rounded-xl p-8 backdrop-blur-md tinted-glass shifting-glass border border-accent-500/30 shadow-[0_0_30px_rgba(var(--rgb-accent-400),0.1),inset_0_0_20px_rgba(var(--rgb-accent-400),0.05)]">
            <div className="scanline"></div>
            <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
               {/* Holographic Radar / Core Searching Illustration */}
               <div className="relative w-64 h-64 flex items-center justify-center mb-6 group cursor-default perspective-1000">

                  {/* Deep Parallax Glow */}
                  <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-[60px] animate-[pulse_4s_ease-in-out_infinite] group-hover:bg-accent-500/40 transition-colors duration-1000"></div>

                  {/* Outer Radar Ring */}
                  <div className="absolute inset-2 border-[1px] border-accent-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute inset-2 border-[2px] border-dashed border-accent-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

                  {/* Radar Sweep Element */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 w-full h-full bg-[conic-gradient(from_0deg_at_0%_0%,transparent_0deg,transparent_270deg,rgba(var(--rgb-accent-400),0.3)_360deg)] animate-radar-sweep transform origin-top-left" style={{ transform: 'translate(-50%, -50%)' }}></div>
                  </div>

                  {/* Geometric Holographic Structure */}
                  <svg className="absolute w-48 h-48 text-accent-500/60 animate-[float-idle_8s_ease-in-out_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" style={{ transformStyle: 'preserve-3d' }}>
                    {/* Outer rotating hex */}
                    <polygon points="50,2 98,26 98,74 50,98 2,74 2,26" strokeDasharray="4 6" className="animate-[spin_30s_linear_infinite]" />
                    {/* Inner rotating hex opposite */}
                    <polygon points="50,15 80.3,32.5 80.3,67.5 50,85 19.7,67.5 19.7,32.5" strokeDasharray="10 5" className="animate-[spin_20s_linear_infinite_reverse] text-accent-400/80" />

                    {/* Connecting Nodes */}
                    <circle cx="50" cy="2" r="1.5" fill="currentColor" className="animate-pulse" />
                    <circle cx="98" cy="26" r="1.5" fill="currentColor" className="animate-pulse" />
                    <circle cx="98" cy="74" r="1.5" fill="currentColor" className="animate-pulse" />
                    <circle cx="50" cy="98" r="1.5" fill="currentColor" className="animate-pulse" />
                    <circle cx="2" cy="74" r="1.5" fill="currentColor" className="animate-pulse" />
                    <circle cx="2" cy="26" r="1.5" fill="currentColor" className="animate-pulse" />
                  </svg>

                  {/* Core Searching Fragments */}
                  <div className="absolute inset-0 flex items-center justify-center animate-[float-idle_5s_ease-in-out_infinite]">
                     <svg className="w-20 h-20 text-accent-300 drop-shadow-[0_0_20px_rgba(var(--rgb-accent-400),1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        {/* Scanning Eye/Core */}
                        <circle cx="12" cy="12" r="4" className="animate-[pulse_1.5s_infinite]" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" className="opacity-70 animate-[pulse_2s_infinite]" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93l-2.83 2.83m-8.48 8.48l-2.83 2.83M19.07 19.07l-2.83-2.83M4.93 4.93l2.83 2.83" className="opacity-40" />

                        {/* Floating data particles */}
                        <circle cx="16" cy="8" r="1" fill="currentColor" className="animate-[ping_2s_infinite]" />
                        <circle cx="8" cy="16" r="1" fill="currentColor" className="animate-[ping_3s_infinite]" />
                        <circle cx="8" cy="8" r="1.5" fill="currentColor" className="animate-[ping_2.5s_infinite]" />
                        <circle cx="16" cy="16" r="0.5" fill="currentColor" className="animate-[ping_1.8s_infinite]" />
                     </svg>
                  </div>

                  {/* Holographic Glare Layer */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay rotate-45 transform"></div>

                  {/* Scanline overlay for illustration */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] rounded-full overflow-hidden pointer-events-none mix-blend-multiply"></div>
               </div>

               <div className="relative">
                 <h3 className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-accent-500 to-accent-700 mb-1 tracking-[0.25em] drop-shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.8)] glitch-text" data-text="SIGNAL LOST">
                    SIGNAL LOST
                 </h3>
                 <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mt-4 mb-2 animate-pulse"></div>
               </div>

               <div className="text-accent-300/80 font-mono text-sm bg-black/60 p-6 rounded-xl border border-accent-500/40 w-full text-left shadow-[0_0_25px_rgba(var(--rgb-accent-400),0.15)] backdrop-blur-xl relative overflow-hidden group">
                  {/* Terminal Glare */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-accent-500/30">
                     <div className="flex items-center gap-3">
                        <div className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </div>
                        <span className="text-accent-400/90 text-xs font-bold tracking-widest">SYSTEM_DIAGNOSTIC</span>
                     </div>
                     <span className="text-[10px] text-accent-500/50">ERR_CODE: 404_VOID</span>
                  </div>
                  {/* Removed duplicated header */}

                  {searchQuery && (
                    <p className="mb-2 break-all"><span className="text-white/50">{`> SEARCH_QUERY:`}</span> <span className="text-accent-200">"{searchQuery}"</span></p>
                  )}

                  {activeFilters.length > 0 && (
                    <p className="mb-2"><span className="text-white/50">{`> ACTIVE_TAGS:`}</span> <span className="text-accent-200">[{activeFilters.join(', ')}]</span></p>
                  )}

                  <p className="mb-2"><span className="text-white/50">{`> STATUS:`}</span> <span className="text-red-400">NO_RESULTS_FOUND</span></p>
                  <p className="animate-pulse mb-6 mt-4 text-accent-400/70">{`> RECOMMENDATION: INITIATE_PROTOCOL_OVERRIDE`}</p>

                  {/* Suggested Protocols */}
                  <div className="flex flex-col items-center gap-3 pt-4 border-t border-accent-500/20">
                    <p className="text-xs uppercase opacity-70">Suggested Override Protocols:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {suggestedTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSearchQuery('');
                            toggleFilter(tag);
                          }}
                          className="px-3 py-1 bg-accent-900/40 hover:bg-accent-500/20 border border-accent-500/30 text-accent-200 text-xs rounded transition-all duration-300 hover:shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.3)] hover:-translate-y-0.5"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="flex flex-wrap justify-center gap-4 mt-6 w-full relative z-10">
                 {searchQuery && (
                   <button
                     onClick={() => {
                       if (document.startViewTransition) {
                         document.startViewTransition(() => {
                           flushSync(() => {
                             setSearchQuery('');
                             setCurrentPage(1);
                           });
                         });
                       } else {
                         setSearchQuery('');
                         setCurrentPage(1);
                       }
                     }}
                     className="flex-1 min-w-[140px] relative px-4 py-3 bg-black/60 hover:bg-accent-900/60 border border-accent-500/50 text-accent-200 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] hover:-translate-y-0.5 group overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500/50 group-hover:bg-accent-400"></div>
                     <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                       Clear Search
                     </span>
                   </button>
                 )}

                 {activeFilters.length > 0 && (
                   <button
                     onClick={() => {
                       if (document.startViewTransition) {
                         document.startViewTransition(() => {
                           flushSync(() => {
                             setActiveFilters([]);
                             setCurrentPage(1);
                           });
                         });
                       } else {
                         setActiveFilters([]);
                         setCurrentPage(1);
                       }
                     }}
                     className="flex-1 min-w-[140px] relative px-4 py-3 bg-black/60 hover:bg-accent-900/60 border border-accent-500/50 text-accent-200 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] hover:-translate-y-0.5 group overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500/50 group-hover:bg-accent-400"></div>
                     <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                       Clear Tags
                     </span>
                   </button>
                 )}

                 <button
                   onClick={() => {
                     if (document.startViewTransition) {
                       document.startViewTransition(() => {
                         flushSync(() => {
                           setActiveFilters([]);
                           setSearchQuery('');
                           setCurrentPage(1);
                         });
                       });
                     } else {
                       setActiveFilters([]);
                       setSearchQuery('');
                       setCurrentPage(1);
                     }
                   }}
                   className="w-full sm:flex-1 min-w-[200px] relative px-4 py-3 bg-accent-500/20 hover:bg-accent-500/40 border border-accent-500/60 text-white rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] hover:shadow-[0_0_25px_rgba(var(--rgb-accent-400),0.6)] hover:-translate-y-0.5 group overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shine_3s_infinite_linear] opacity-0 group-hover:opacity-100"></div>
                   <div className="flex items-center justify-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
                     <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                       System Reset
                     </span>
                   </div>
                 </button>
               </div>
            </div>
         </div>
      </div>
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
