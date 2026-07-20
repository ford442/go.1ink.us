import DecryptText from '../DecryptText';
import soundSystem from '../../lib/SoundSystem';
import CardMedia from './CardMedia';
import CardTechBadges from './CardTechBadges';
import CardTagList from './CardTagList';
import ComplexityMeter from './ComplexityMeter';
import CardFavoriteButton from './CardFavoriteButton';
import CardCopyLinkButton from './CardCopyLinkButton';
import { CardGridEffectsTop, CardGridEffectsOverlay } from './CardGridEffects';
import highlightMatch from './highlightMatch';

// Front face of the grid card: header actions, image, title/description,
// tech badges, tags, and the decorative hover-effect layers.
export default function CardGridFront({
  project,
  isFlipped,
  isSelected,
  draggable,
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
  complexityScore,
  onFlip
}) {
  return (
    <div className={`relative h-full flex flex-col rounded-xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'} ${isHoverDelayed ? '-translate-y-3 shadow-[0_20px_40px_-10px_rgba(var(--rgb-accent-400),0.5)]' : ''}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>

      <CardGridEffectsTop />

      {/* 🌌 CURATOR FEATURE: Holographic Projection Cone */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[120%] pointer-events-none z-10"
        style={{ transform: 'translateZ(20px)' }}
      >
        <div
          className="w-full h-full origin-bottom transition-all duration-700 ease-out opacity-0 scale-y-50 group-hover:opacity-100 group-hover:scale-y-100"
          style={{
            background: 'linear-gradient(to top, rgba(var(--rgb-accent-400), 0.2) 0%, rgba(var(--rgb-accent-400), 0.02) 60%, transparent 100%)',
            clipPath: 'polygon(0 0, 100% 0, 65% 100%, 35% 100%)',
            mixBlendMode: 'screen'
          }}
        ></div>
      </div>

      {/* Drag Handle Indicator */}
      {draggable && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
      )}
      {/* Click handled by parent container */}

      <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto" style={{ transform: 'translateZ(60px)' }}>
        <CardFavoriteButton
          variant="grid"
          project={project}
          isFavorite={isFavorite}
          onToggleFavorite={onToggleFavorite}
          favoriteParticles={favoriteParticles}
          triggerFavoriteBurst={triggerFavoriteBurst}
        />
        <CardCopyLinkButton variant="grid" project={project} onCopyLink={onCopyLink} />
      </div>

      {/* Image Area with overlay gradient */}
      <div className="h-full flex flex-col pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
        <CardMedia
          variant="grid"
          project={project}
          imageLoaded={imageLoaded}
          setImageLoaded={setImageLoaded}
          isHoverDelayed={isHoverDelayed}
          isSelected={isSelected}
        />

        {/* 🌌 CURATOR FEATURE: Live Network Node Status */}
        <div
          className={`sys-on-badge absolute top-4 left-4 z-20 flex flex-col gap-1 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'translateZ(40px)' }}
        >
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-accent-500/30" data-testid="sys-on-badge">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]"></div>
            <span className="text-[9px] font-mono font-bold text-accent-300 tracking-wider">SYS.ON</span>
          </div>
          {ping > 0 && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded border border-white/5 w-fit" data-testid="ping-indicator">
               <svg className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               <span className="text-[8px] font-mono text-gray-400">{ping}ms</span>
            </div>
          )}
        </div>

        {/* 🌌 CURATOR FEATURE: Active Data Transmission EQ */}
        <div
          className={`absolute bottom-4 right-4 z-20 flex items-end gap-[2px] h-6 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'translateZ(45px)' }}
        >
          <div className="w-1 bg-accent-500/70 h-[30%] origin-bottom animate-[pulse_0.4s_ease-in-out_infinite_alternate] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
          <div className="w-1 bg-accent-500/80 h-[80%] origin-bottom animate-[pulse_0.7s_ease-in-out_infinite_alternate-reverse] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
          <div className="w-1 bg-accent-400/90 h-[50%] origin-bottom animate-[pulse_0.5s_ease-in-out_infinite_alternate] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
          <div className="w-1 bg-accent-300/80 h-[100%] origin-bottom animate-[pulse_0.6s_ease-in-out_infinite_alternate-reverse] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
          <div className="w-1 bg-accent-500/70 h-[40%] origin-bottom animate-[pulse_0.8s_ease-in-out_infinite_alternate] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
          <div className="w-1 bg-accent-400/60 h-[70%] origin-bottom animate-[pulse_0.55s_ease-in-out_infinite_alternate-reverse] shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.5)]"></div>
        </div>

        {/* Target Lock Hover Brackets */}
        <div className="target-bracket target-bracket-tl target-bracket-gold"></div>
        <div className="target-bracket target-bracket-tr target-bracket-gold"></div>
        <div className="target-bracket target-bracket-bl target-bracket-gold"></div>
        <div className="target-bracket target-bracket-br target-bracket-gold"></div>

        <div
          className="p-6 flex-1 flex flex-col relative z-10 transition-transform duration-100 ease-out overflow-hidden"
          style={{
            transform: 'translateZ(50px) translateX(var(--parallax-x, 0px)) translateY(var(--parallax-y, 0px))'
          }}
        >
          {/* 🌌 CURATOR FEATURE: Description Area Scanline */}
          <div
            className={`absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-accent-500/10 to-transparent h-[10px] w-full transition-opacity duration-300 z-0 ${isHovered ? 'opacity-100 animate-[skeleton-sweep_2s_linear_infinite]' : 'opacity-0'}`}
            style={{ transform: 'translateY(-100%)' }}
          ></div>
          <div className="flex items-center mb-3 relative z-10">
            {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300 flex items-center justify-between">
                <DecryptText text={project.title} isHovered={isHovered} isVisible={isVisible} searchQuery={searchQuery} regex={regex} />

                <ComplexityMeter variant="grid" score={complexityScore} />
              </h3>
            </div>
          </div>

          <p className="text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1 relative z-10">
            {highlightMatch(project.description, searchQuery, regex)}
          </p>

          {/* Tech Stack Badges */}
          <CardTechBadges variant="grid" tech={project.tech} searchQuery={searchQuery} regex={regex} />

          <CardTagList
            variant="grid"
            tags={project.tags}
            highlightedTags={highlightedTags}
            onTagClick={onTagClick}
            onHoverTag={onHoverTag}
            searchQuery={searchQuery}
            regex={regex}
          />
        </div>
      </div>
      {/* Flip Diagnostics Button */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFlip(); soundSystem.playClick(); }}
        className={`absolute top-4 right-14 z-[99] p-2 rounded-full transition-all duration-300 backdrop-blur-md bg-black/30 text-accent-200 border border-accent-500/30 hover:bg-accent-500/30 hover:text-white hover:border-accent-400 hover:scale-110 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)] opacity-0 group-hover:opacity-100 pointer-events-auto`}
        aria-label="View Diagnostics"
        style={{ transform: 'translateZ(60px)' }}
        title="SYS_DIAGNOSTICS"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>


      <CardGridEffectsOverlay />
    </div>
  );
}
