import DecryptText from '../DecryptText';
import soundSystem from '../../lib/SoundSystem';
import { getCardWrapperClasses } from './cardStyles';
import CardMedia from './CardMedia';
import CardTagList from './CardTagList';
import CardFavoriteButton from './CardFavoriteButton';
import CardCopyLinkButton from './CardCopyLinkButton';
import { ProjectConnectivityBadge } from '../ProjectMetaBadges';
import highlightMatch from './highlightMatch';

// Compact high-density card variant used in the dense grid catalog.
// Keeps DOM chrome light (no 3D tilt tracking or heavy backdrop blur layers)
// for maximum density and high performance.
export default function CardCompact({
  project,
  index = 0,
  isSelected = false,
  draggable = false,
  isDragged = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onContextMenu,
  tabIndex = -1,
  handleKeyDown,
  handleFocus,
  onProjectClick,
  imageLoaded,
  setImageLoaded,
  imageError,
  setImageError,
  isHovered,
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
}) {
  return (
    <div
      id={`project-card-${project.id}`}
      className={getCardWrapperClasses('compact', { draggable, isDragged, isDragOver })}
      style={{
        viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`,
        animationDelay: `${Math.min(index, 20) * 30}ms`,
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
      <div className="relative h-full flex flex-col rounded-xl overflow-hidden bg-black/40 hover:bg-black/60 border border-white/10 hover:border-accent-400/50 transition-all duration-300 group shadow-md hover:shadow-[0_8px_25px_-5px_rgba(var(--rgb-accent-400),0.25)]">
        {/* Clickable button overlay for a11y & card click */}
        <button
          type="button"
          tabIndex={tabIndex}
          className="card-focusable absolute inset-0 z-[5] w-full h-full rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 bg-transparent border-0 p-0"
          aria-label={`View details for ${project.title}`}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            e.preventDefault();
            soundSystem.playClick();
            onProjectClick?.(project);
          }}
        />

        {/* Top Thumbnail */}
        <div className="relative pointer-events-none">
          <CardMedia
            variant="compact"
            project={project}
            imageLoaded={imageLoaded}
            setImageLoaded={setImageLoaded}
            imageError={imageError}
            setImageError={setImageError}
            isSelected={isSelected}
          />

          {/* Connectivity Badge */}
          <div className="absolute top-2 left-2 z-20 pointer-events-auto scale-90 origin-top-left">
            <ProjectConnectivityBadge project={project} variant="card" />
          </div>

          {/* Actions (Favorite + Copy Link) */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 pointer-events-auto">
            <CardFavoriteButton
              variant="compact"
              project={project}
              isFavorite={isFavorite}
              onToggleFavorite={onToggleFavorite}
              favoriteParticles={favoriteParticles}
              triggerFavoriteBurst={triggerFavoriteBurst}
            />
            <CardCopyLinkButton variant="compact" project={project} onCopyLink={onCopyLink} />
          </div>

          {/* Year */}
          <span className="absolute bottom-1.5 right-2 z-20 text-[9px] font-mono text-gray-400 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/10">
            {project.year}
          </span>
        </div>

        {/* Card Content Body */}
        <div className="p-3 flex-1 flex flex-col justify-between min-w-0 pointer-events-none">
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base shrink-0 transform group-hover:scale-110 transition-transform">{project.icon}</span>
              <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-accent-300 transition-colors truncate flex-1">
                <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />
              </h3>
              {project.featured && (
                <span className="text-amber-400 text-xs shrink-0" title="Featured">★</span>
              )}
            </div>

            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
              {highlightMatch(project.description, searchQuery, regex)}
            </p>
          </div>

          {/* Tags */}
          <CardTagList
            variant="compact"
            tags={project.tags}
            highlightedTags={highlightedTags}
            onTagClick={onTagClick}
            onHoverTag={onHoverTag}
            searchQuery={searchQuery}
            regex={regex}
          />
        </div>
      </div>
    </div>
  );
}
