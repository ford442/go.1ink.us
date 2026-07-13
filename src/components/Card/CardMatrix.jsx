import Tooltip from '../../Tooltip';
import DecryptText from '../../DecryptText';
import soundSystem from '../../SoundSystem';
import { getCardWrapperClasses } from './cardStyles';
import CardMedia from './CardMedia';
import CardTechBadges from './CardTechBadges';
import CardTagList from './CardTagList';
import ComplexityMeter from './ComplexityMeter';
import CardFavoriteButton from './CardFavoriteButton';
import CardCopyLinkButton from './CardCopyLinkButton';
import highlightMatch from './highlightMatch';

// Dense single-row "matrix" layout.
export default function CardMatrix({
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
  imageLoaded,
  setImageLoaded,
  imageError,
  setImageError,
  isVisible,
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
  complexityScore
}) {
  return (
    <div
      id={`project-card-${project.id}`}
      className={getCardWrapperClasses('matrix', { draggable, isDragged, isDragOver })}
      style={{
        viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`,
        animationDelay: `${index * 50}ms`
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
        className="glass-card relative group flex items-center p-3 gap-4 rounded-lg hover:bg-white/5 hover:gold-glow transition-colors h-20 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
        onClick={(e) => {
          e.preventDefault();
          soundSystem.playClick();
          if (onProjectClick) onProjectClick(project);
        }}
      >
        {/* Click handled by parent container */}

        {/* Drag Handle Indicator */}
        {draggable && (
          <div className="absolute left-1 top-1/2 -translate-y-1/2 z-40 w-1 h-8 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
        )}

        {/* ID & Status */}
        <Tooltip text="SYSTEM ID">
          <div className={`flex flex-col items-center justify-center gap-0.5 w-12 shrink-0 z-10 pointer-events-auto cursor-help ${draggable ? 'ml-2' : ''}`}>
             <span className="text-[9px] font-mono text-accent-500 opacity-50 uppercase tracking-widest pointer-events-none">Sys.ID</span>
             <span className="text-xs font-mono text-accent-400 font-bold pointer-events-none">{project.id.toString().padStart(4, '0')}</span>
          </div>
        </Tooltip>

        {/* Thumbnail */}
        <CardMedia
          variant="matrix"
          project={project}
          imageLoaded={imageLoaded}
          setImageLoaded={setImageLoaded}
          imageError={imageError}
          setImageError={setImageError}
          isVisible={isVisible}
          isSelected={isSelected}
        />

        {/* Target Lock Hover Brackets */}
        <div className="target-bracket target-bracket-tl target-bracket-gold"></div>
        <div className="target-bracket target-bracket-tr target-bracket-gold"></div>
        <div className="target-bracket target-bracket-bl target-bracket-gold"></div>
        <div className="target-bracket target-bracket-br target-bracket-gold"></div>

        {/* Info */}
        <div className="flex-1 flex flex-col min-w-0 z-10 pointer-events-none justify-center">
           <div className="flex items-center gap-2">
             <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-accent-300 transition-colors duration-300">
               <DecryptText text={project.title} isHovered={isHovered} isVisible={isVisible} searchQuery={searchQuery} regex={regex} />
             </h3>
             {/* Tech badges inline (hide on very small screens) */}
             <CardTechBadges variant="matrix" tech={project.tech} searchQuery={searchQuery} regex={regex} />
           </div>
           <p className="text-xs text-gray-400 truncate mt-0.5">
             {highlightMatch(project.description, searchQuery, regex)}
           </p>
        </div>

        {/* Tags */}
        <CardTagList
          variant="matrix"
          tags={project.tags}
          highlightedTags={highlightedTags}
          onTagClick={onTagClick}
          onHoverTag={onHoverTag}
          searchQuery={searchQuery}
          regex={regex}
        />

        {/* Complexity */}
        <ComplexityMeter variant="matrix" score={complexityScore} />

        {/* Actions */}
        <div className="flex items-center gap-1.5 z-20 pointer-events-auto shrink-0 pr-2 border-l border-white/5 pl-3">
           <CardFavoriteButton
             project={project}
             isFavorite={isFavorite}
             onToggleFavorite={onToggleFavorite}
             favoriteParticles={favoriteParticles}
             triggerFavoriteBurst={triggerFavoriteBurst}
           />
           <CardCopyLinkButton project={project} onCopyLink={onCopyLink} />
        </div>

        {/* Holographic Scanline on Hover */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <div className="scanline" style={{ animationDuration: '2s' }}></div>
        </div>

        {/* Holographic sweep effect for matrix row */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg z-0">
           <div className="glass-reflection opacity-50" />
        </div>

        {/* 🌌 CURATOR FEATURE: Dynamic Mouse-Follow Glare (Matrix) */}
        <div
          className="absolute inset-0 pointer-events-none rounded-lg z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(255,255,255,0.1) 0%, transparent 40%)`,
            mixBlendMode: 'overlay'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-lg z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(var(--rgb-accent-400), 0.05) 0%, transparent 30%)`,
            mixBlendMode: 'screen'
          }}
        />
      </div>
    </div>
  );
}
