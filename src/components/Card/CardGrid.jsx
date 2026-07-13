import { useState } from 'react';
import soundSystem from '../../SoundSystem';
import { getCardWrapperClasses } from './cardStyles';
import CardGridFront from './CardGridFront';
import CardGridBack from './CardGridBack';

// Default 3D-tilt "holographic" card layout, with a flip-to-diagnostics
// back face. Owns the flip state locally since no other layout uses it.
export default function CardGrid({
  project,
  index,
  isSelected,
  draggable,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onContextMenu,
  tabIndex,
  handleKeyDown,
  handleFocus,
  onProjectClick,
  cardRef,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  imageLoaded,
  setImageLoaded,
  isVisible,
  isHovered,
  isHoverDelayed,
  ping,
  searchQuery,
  regex,
  highlightedTags,
  onTagClick,
  onHoverTag,
  isFavorite,
  onToggleFavorite,
  favoriteParticles,
  triggerFavoriteBurst,
  onCopyLink,
  complexityScore
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      id={`project-card-${project.id}`}
      className={getCardWrapperClasses('grid', { draggable, isDragged, isDragOver })}
      style={{
        viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`,
        animationDelay: `${index * 100}ms`
      }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <div
        ref={cardRef}
        className="glass-card card-3d block rounded-xl flex flex-col h-full relative group will-change-transform animate-float-idle cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        tabIndex={0}
        role="button"
        aria-label={`View details for ${project.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            soundSystem.playClick();
            if (onProjectClick) onProjectClick(project);
          }
        }}
        onMouseEnter={onMouseEnter}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          soundSystem.playClick();
          if (onProjectClick) onProjectClick(project);
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700 pointer-events-none rounded-xl"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <CardGridFront
            project={project}
            isFlipped={isFlipped}
            isSelected={isSelected}
            draggable={draggable}
            imageLoaded={imageLoaded}
            setImageLoaded={setImageLoaded}
            isVisible={isVisible}
            isHovered={isHovered}
            isHoverDelayed={isHoverDelayed}
            ping={ping}
            searchQuery={searchQuery}
            regex={regex}
            highlightedTags={highlightedTags}
            onTagClick={onTagClick}
            onHoverTag={onHoverTag}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            favoriteParticles={favoriteParticles}
            triggerFavoriteBurst={triggerFavoriteBurst}
            onCopyLink={onCopyLink}
            complexityScore={complexityScore}
            onFlip={() => setIsFlipped(true)}
          />

          <CardGridBack
            project={project}
            isFlipped={isFlipped}
            onClose={() => setIsFlipped(false)}
          />
        </div>
      </div>
    </div>
  );
}
