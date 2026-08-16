import Card from '../Card';

export default function ProjectGridView({
  gridRef,
  displayMode,
  isGlitching,
  showWarpFx,
  paginatedProjects,
  focusedCardIndex,
  setFocusedCardIndex,
  hoveredProjectId,
  setHoveredProjectId,
  handleTagClick,
  activeFilters,
  searchQuery,
  handleProjectSelect,
  selectedProject,
  favorites,
  toggleFavorite,
  handleContextMenu,
  handleCopyLink,
  isDataMode,
  sortOption,
  activeFiltersSet,
  draggedFavoriteId,
  dragOverFavoriteId,
  handleDragStart,
  handleDragOver,
  handleDragEnd,
  handleDrop,
  setHoveredTag,
}) {
  const onKeyDown = (e) => {
    let nextIndex = focusedCardIndex;
    if (e.key === 'ArrowRight') {
      nextIndex = Math.min(paginatedProjects.length - 1, focusedCardIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      nextIndex = Math.max(0, focusedCardIndex - 1);
    } else if (e.key === 'ArrowDown') {
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
          cards[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 0);
    }
  };

  return (
    <div
      id="project-grid"
      ref={gridRef}
      className={`transition-all duration-300 ease-out relative z-10 will-change-transform ${isGlitching ? 'animate-layout-glitch' : ''} ${
        displayMode === 'dense'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 md:gap-4.5 opacity-100'
          : displayMode === 'grid'
          ? 'columns-1 md:columns-2 lg:columns-2 xl:columns-3 gap-6 md:gap-8 opacity-100'
          : displayMode === 'list'
          ? 'flex flex-col gap-3 opacity-100'
          : 'grid grid-cols-1 gap-6 md:gap-8 opacity-100'
      } ${showWarpFx ? 'opacity-20 scale-[1.05] blur-[8px] grayscale' : 'opacity-100'}`}
      style={{
        transform: displayMode === 'dense' ? 'none' : 'perspective(2000px) rotateX(0deg) rotateY(0deg)',
        transformStyle: displayMode === 'dense' ? 'flat' : 'preserve-3d',
      }}
      onKeyDown={onKeyDown}
    >
      {paginatedProjects.map((project, index) => (
        <div
          key={project.id}
          className={`animate-card-enter ${displayMode === 'dense' ? 'transition-transform duration-200' : 'hover:scale-[1.02] transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]'} ${displayMode === 'grid' ? 'break-inside-avoid inline-block w-full mb-6 md:mb-8' : ''} ${
            hoveredProjectId && hoveredProjectId !== project.id && displayMode !== 'dense'
              ? 'blur-[4px] opacity-40 scale-[0.98] grayscale-[30%]'
              : ''
          }`}
          style={{ animationDelay: `${Math.min(index, 20) * 0.03}s` }}
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
        </div>
      ))}
    </div>
  );
}
