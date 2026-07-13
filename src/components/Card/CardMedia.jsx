// Project image area with skeleton loader and RGB-glitch hover overlay.
// `variant="grid"` renders the full-height hero image (with hover-delayed
// zoom); `variant="matrix"` renders the small thumbnail (gated on
// `isVisible` from the intersection observer, and tolerant of load errors).
export default function CardMedia({
  variant,
  project,
  imageLoaded,
  setImageLoaded,
  imageError,
  setImageError,
  isVisible,
  isHoverDelayed,
  isSelected
}) {
  if (variant === 'matrix') {
    return (
      <div className="w-20 h-14 rounded border border-white/10 tinted-glass shifting-glass overflow-hidden shrink-0 relative z-10 pointer-events-none group-hover:gold-glow transition-colors duration-300">
        {(!imageLoaded || !isVisible) && project.image && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center tinted-glass animate-shimmer z-10 overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            <div className="w-1.5 h-1.5 bg-accent-400 animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.8)] relative z-10"></div>
          </div>
        )}
        {project.image && !imageError ? (
          isVisible && (
            <>
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                className={`w-full h-full object-cover transition-all duration-700 ${imageLoaded ? 'opacity-80 blur-0 scale-100' : 'opacity-0 blur-sm scale-105'} group-hover:opacity-100`}
                style={{ viewTransitionName: isSelected ? 'none' : `project-image-${project.id}` }}
              />
              <img
                src={project.image}
                alt=""
                className={`absolute inset-0 w-full h-full object-cover mix-blend-screen transition-all duration-700 group-hover:animate-image-glitch ${imageLoaded ? 'opacity-0 group-hover:opacity-60' : 'opacity-0'}`}
                style={{ filter: 'drop-shadow(2px 0 0 rgba(255,0,0,1)) drop-shadow(-2px 0 0 rgba(0,255,255,1))' }}
                aria-hidden="true"
              />
            </>
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 transform transition-transform duration-300 group-hover:scale-110">
            {project.icon}
          </div>
        )}
      </div>
    );
  }

  // grid variant
  if (!project.image) {
    return (
      <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center relative overflow-hidden rounded-t-xl border-b border-white/5 shrink-0" style={{ transform: 'translateZ(30px)' }}>
        <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg">{project.icon}</span>
      </div>
    );
  }

  return (
    <div className="h-48 overflow-hidden rounded-t-xl relative border-b border-white/5 shrink-0 bg-black/40" style={{ transform: 'translateZ(30px)' }}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center tinted-glass shifting-glass z-10 overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-500/20 to-transparent -translate-x-full animate-[skeleton-sweep_1.5s_infinite_linear]"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-10 h-10 border border-accent-500/30 bg-black/40 mb-3 flex items-center justify-center shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.2)]">
              <div className="w-2 h-2 bg-accent-400 animate-pulse"></div>
            </div>
            <div className="font-mono text-accent-400 text-[10px] tracking-[0.2em] uppercase animate-pulse mb-2">
              CONSTRUCTING_GEOMETRY...
            </div>
            <div className="w-32 h-0.5 bg-black/50 overflow-hidden border border-accent-500/20">
              <div className="h-full bg-accent-500/50 w-full animate-[skeleton-sweep_1.5s_infinite_linear]"></div>
            </div>
          </div>
        </div>
      )}
      <img
        src={project.image}
        alt={project.title}
        loading="lazy"
        onLoad={() => setImageLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-[1500ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:animate-image-glitch ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${isHoverDelayed ? 'scale-125' : 'scale-100'}`}
        style={{ viewTransitionName: isSelected ? 'none' : `project-image-${project.id}` }}
      />
      {/* 🌌 CURATOR FEATURE: RGB Glitch Split Hover Effect */}
      <img
        src={project.image}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover mix-blend-screen transition-all duration-[1500ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:animate-image-glitch ${imageLoaded ? 'opacity-0 group-hover:opacity-70' : 'opacity-0'} ${isHoverDelayed ? 'scale-[1.26] -translate-x-1 translate-y-0.5' : 'scale-100 translate-x-0'}`}
        style={{ filter: 'drop-shadow(3px 0 0 rgba(255,0,0,1)) drop-shadow(-3px 0 0 rgba(0,255,255,1))' }}
        aria-hidden="true"
      />
      {/* Inner Holographic Reflection (ramp up on hover) */}
      <div className={`absolute inset-0 bg-gradient-to-tr from-accent-500/0 via-white/5 to-white/20 mix-blend-overlay transition-all duration-1000 ${isHoverDelayed ? 'opacity-100 shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]' : 'opacity-0'}`}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
    </div>
  );
}
