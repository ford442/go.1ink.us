import DecryptText from '../DecryptText';
import soundSystem from '../../lib/SoundSystem';
import { getCardWrapperClasses } from './cardStyles';
import CardTagList from './CardTagList';
import CardFavoriteButton from './CardFavoriteButton';
import CardCopyLinkButton from './CardCopyLinkButton';
import highlightMatch from './highlightMatch';

// Terminal-style single-line list layout.
export default function CardList({
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
  isHovered,
  isVisible,
  onMouseEnter,
  onMouseLeave,
  searchQuery,
  regex,
  highlightedTags,
  onTagClick,
  onHoverTag,
  isFavorite,
  onToggleFavorite,
  favoriteParticles,
  triggerFavoriteBurst,
  onCopyLink
}) {
  // Generate pseudo-terminal deterministic values
  const date = new Date(2025, project.id % 12, (project.id * 7) % 28 + 1).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  const size = (project.title.length * 14 + project.description.length * 3 + (project.tags?.length || 0) * 128).toString();
  const permissions = project.tech && project.tech.length > 3 ? '-rwxrwxrwx' : '-rw-r--r--';
  const owner = (project.tags || []).includes('Games') ? 'player1' : 'sys_admin';

  return (
    <div
      id={`project-card-${project.id}`}
      className={getCardWrapperClasses('list', { draggable, isDragged, isDragOver })}
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
        className="group relative flex flex-col md:flex-row items-start md:items-center py-2 px-3 hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer font-mono text-sm gap-2 md:gap-4 overflow-hidden"
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
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Holographic Scanline / Hover Highlight */}
        <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/10 transition-colors pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-accent-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-left"></div>

        {/* Terminal File Meta (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-4 text-xs opacity-70 shrink-0 pointer-events-none">
          <span className="text-gray-400 w-[85px]">{permissions}</span>
          <span className="text-purple-400 w-[70px] truncate">{owner}</span>
          <span className="text-yellow-400 w-[50px] text-right">{size}</span>
          <span className="text-cyan-600 w-[55px] text-right">{date}</span>
        </div>

        {/* Icon & Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
          <span className="text-lg w-6 text-center transform group-hover:scale-110 transition-transform drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{project.icon}</span>
          <div className="flex flex-col min-w-0">
             <span className="text-accent-300 font-bold tracking-wide truncate group-hover:text-accent-100 transition-colors">
               <DecryptText text={project.title} isHovered={isHovered} isVisible={isVisible} searchQuery={searchQuery} regex={regex} />
             </span>
             <span className="text-xs text-gray-500 truncate mt-0.5 max-w-[300px] lg:max-w-md xl:max-w-lg hidden sm:block">
               {highlightMatch(project.description, searchQuery, regex)}
             </span>
          </div>
        </div>

        {/* Tags */}
        <CardTagList
          variant="list"
          tags={project.tags}
          highlightedTags={highlightedTags}
          onTagClick={onTagClick}
          onHoverTag={onHoverTag}
          searchQuery={searchQuery}
          regex={regex}
        />

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 pointer-events-auto ml-auto md:ml-0 pl-4 border-l border-white/5 z-20">
           <CardFavoriteButton
             project={project}
             isFavorite={isFavorite}
             onToggleFavorite={onToggleFavorite}
             favoriteParticles={favoriteParticles}
             triggerFavoriteBurst={triggerFavoriteBurst}
           />
           <CardCopyLinkButton project={project} onCopyLink={onCopyLink} />
        </div>
      </div>
    </div>
  );
}
