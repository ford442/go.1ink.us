import { memo } from 'react';
import { ProjectImage } from '../ProjectImage';
import DecryptText from '../DecryptText';
import soundSystem from '../../lib/SoundSystem';
import CardTagList from '../Card/CardTagList';
import CardFavoriteButton from '../Card/CardFavoriteButton';
import CardCopyLinkButton from '../Card/CardCopyLinkButton';
import { ProjectConnectivityBadge } from '../ProjectMetaBadges';
import highlightMatch from '../Card/highlightMatch';

export default memo(function FeaturedSection({
  featuredProjects,
  searchQuery,
  regex,
  activeFilters,
  onTagClick,
  onHoverTag,
  onProjectClick,
  favorites,
  toggleFavorite,
  onCopyLink,
  hoveredProjectId,
  setHoveredProjectId,
}) {
  if (!featuredProjects || featuredProjects.length === 0) return null;

  // Render top 3-4 featured projects in a responsive strip
  const displayItems = featuredProjects.slice(0, 4);

  return (
    <section aria-labelledby="featured-protocols-heading" className="mb-8 relative z-10">
      <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 text-sm animate-pulse">★</span>
          <h2 id="featured-protocols-heading" className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
            FEATURED_PROTOCOLS
          </h2>
          <span className="text-[10px] font-mono text-gray-500">[{displayItems.length}]</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        {displayItems.map((project) => {
          const isFavorite = favorites.includes(project.id);
          const isHovered = hoveredProjectId === project.id;

          return (
            <div
              key={project.id}
              className="relative group rounded-xl border border-amber-500/30 hover:border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-black/40 to-black/60 backdrop-blur-md overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:-translate-y-0.5 flex flex-row cursor-pointer"
              onMouseEnter={() => setHoveredProjectId?.(project.id)}
              onMouseLeave={() => setHoveredProjectId?.(null)}
            >
              {/* Clickable button overlay for a11y & card click */}
              <button
                type="button"
                className="card-focusable absolute inset-0 z-[5] w-full h-full rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 bg-transparent border-0 p-0"
                aria-label={`View featured project ${project.title}`}
                onClick={(e) => {
                  e.preventDefault();
                  soundSystem.playClick();
                  onProjectClick?.(project);
                }}
              />

              {/* Left Thumbnail (or fallback icon) */}
              <div className="w-24 sm:w-28 shrink-0 relative overflow-hidden bg-black/60 border-r border-amber-500/20 pointer-events-none">
                {project.image ? (
                  <ProjectImage
                    imagePath={project.image}
                    profile="thumb"
                    alt={project.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                    pictureClassName="block w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-amber-950/30">
                    {project.icon}
                  </div>
                )}

                <div className="absolute top-1.5 left-1.5 z-20 pointer-events-auto scale-75 origin-top-left">
                  <ProjectConnectivityBadge project={project} variant="card" />
                </div>
              </div>

              {/* Right Content */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between min-w-0 pointer-events-none">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate flex-1">
                      <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />
                    </h3>

                    {/* Actions */}
                    <div className="flex items-center gap-1 z-20 pointer-events-auto shrink-0 ml-1">
                      <CardFavoriteButton
                        variant="compact"
                        project={project}
                        isFavorite={isFavorite}
                        onToggleFavorite={() => toggleFavorite(project)}
                      />
                      <CardCopyLinkButton variant="compact" project={project} onCopyLink={onCopyLink} />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-300 line-clamp-2 leading-relaxed">
                    {highlightMatch(project.description, searchQuery, regex)}
                  </p>
                </div>

                <div className="mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-white/5">
                  <CardTagList
                    variant="compact"
                    tags={project.tags}
                    highlightedTags={activeFilters}
                    onTagClick={onTagClick}
                    onHoverTag={onHoverTag}
                    searchQuery={searchQuery}
                    regex={regex}
                  />
                  <span className="text-[9px] font-mono text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                    {project.year}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
