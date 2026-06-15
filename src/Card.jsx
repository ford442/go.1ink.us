import React, { useRef, useState, useEffect, useMemo } from 'react';
import Tooltip from './Tooltip';
import DecryptText from './DecryptText';
import soundSystem from './SoundSystem';

// Helper to highlight matching text moved outside to avoid re-allocation on every render
const highlightMatch = (text, query, regex) => {
  if (!query || !text || !regex) return text;

  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-accent-500/30 text-accent-200 rounded px-0.5 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.2)] font-semibold">{part}</span>
    ) : part
  );
};

const Card = ({ project, index = 0, layout = 'grid', isDataMode = false, onTagClick, searchQuery, highlightedTags = [], isSelected = false, isFavorite = false, onToggleFavorite, onCopyLink, onProjectClick, draggable = false, isDragged = false, isDragOver = false, onDragStart, onDragOver, onDragEnd, onDrop, onContextMenu, tabIndex = -1, onFocus, onHoverTag, onCardHover }) => {
  const cardRef = useRef(null);
  const [isInteractive, setIsInteractive] = useState(false);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      soundSystem.playClick();
      if (onProjectClick) onProjectClick(project);
    }
  };

  const handleFocus = (e) => {
    if (onFocus) onFocus(e);
  };
  const rafRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isHoverDelayed, setIsHoverDelayed] = useState(false);
  const hoverTimerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only load once
        }
      },
      { rootMargin: '200px 0px', threshold: 0.01 }
    );

    if (cardRef.current) {
       observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);
  const [ping, setPing] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    let timeout;
    let interval;
    if (isHovered) {
      timeout = setTimeout(() => {
        setPing(Math.floor(Math.random() * 30) + 5);
      }, 0);
      interval = setInterval(() => {
        setPing(prev => Math.max(2, Math.min(150, prev + (Math.floor(Math.random() * 9) - 4))));
      }, 800);
    }
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isHovered]);

  useEffect(() => {
    // Check if device supports hover and user doesn't prefer reduced motion
    // This optimization prevents sticky tilt states on touch devices and respects accessibility settings
    const hoverQuery = window.matchMedia('(hover: hover)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateInteractive = () => {
      setIsInteractive(hoverQuery.matches && !motionQuery.matches);
    };

    updateInteractive();

    // Listeners
    hoverQuery.addEventListener('change', updateInteractive);
    motionQuery.addEventListener('change', updateInteractive);

    return () => {
      hoverQuery.removeEventListener('change', updateInteractive);
      motionQuery.removeEventListener('change', updateInteractive);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (onCardHover) onCardHover(project.id);
    soundSystem.playHover();

    // Start 700ms timer for advanced hover micro-interactions (zoom, lift)
    hoverTimerRef.current = setTimeout(() => {
      setIsHoverDelayed(true);
      soundSystem.playDeepFocus();
    }, 700);

    if (!cardRef.current) return;
    // Set fast transition for tilt responsiveness on hover enter
    // This avoids setting style on every mousemove event, improving performance
    cardRef.current.style.transition = 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1), background 0.3s ease, border-color 0.3s ease';
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isInteractive) return;

    // Use requestAnimationFrame for smoother performance (throttling to ~60fps)
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;

      const card = cardRef.current;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // 🌌 CURATOR FEATURE: Mouse Tilt (Magnet Effect)
      // Calculate rotation based on mouse position to make the card "tilt towards" the mouse cursor.

      // Mouse at Top (y < center) -> Card TILT TOWARDS mouse -> Top comes Forward -> RotateX Negative.
      // (y - centerY) is Negative. Neg * Pos = Neg.
      const rotateX = ((y - centerY) / centerY) * 15;

      // Mouse at Right (x > center) -> Card TILT TOWARDS mouse -> Right comes Forward -> RotateY Negative.
      // (x - centerX) is Positive. Pos * Neg = Neg.
      const rotateY = ((x - centerX) / centerX) * -15;

      // Calculate Parallax for Content (simulating depth)
      // Content moves slightly opposite to the tilt to enhance the "floating" effect
      const parallaxX = ((x - centerX) / centerX) * -5;
      const parallaxY = ((y - centerY) / centerY) * -5;

      // Apply the transform
      // Includes the lift (translateY) and scale that matches the CSS hover state intention
      card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

      // Calculate percentage for glare
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;

      // Set CSS variables for the spotlight effect and parallax
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      card.style.setProperty('--mouse-percent-x', `${percentX}%`);
      card.style.setProperty('--mouse-percent-y', `${percentY}%`);
      card.style.setProperty('--parallax-x', `${parallaxX}px`);
      card.style.setProperty('--parallax-y', `${parallaxY}px`);

      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (onCardHover) onCardHover(null);
    setIsHoverDelayed(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setPing(0);
    if (!cardRef.current) return;

    // Cancel any pending animation frame
    if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    }

    // Reset to default state (managed by CSS)
    cardRef.current.style.transform = '';
    // Reset transition to allow the smooth CSS return animation
    cardRef.current.style.transition = '';

    // Clear spotlight/parallax variables
    cardRef.current.style.removeProperty('--mouse-x');
    cardRef.current.style.removeProperty('--mouse-y');
    cardRef.current.style.removeProperty('--parallax-x');
    cardRef.current.style.removeProperty('--parallax-y');
  };

  // Memoize the RegExp creation
  const regex = useMemo(() => {
    if (!searchQuery) return null;
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escapedQuery})`, 'gi');
  }, [searchQuery]);

  // Calculate Complexity Score (1-5)
  const complexityScore = useMemo(() => {
    const techCount = project.tech?.length || 0;
    const tagCount = project.tags?.length || 0;
    const totalComplexity = techCount + tagCount;

    // Normalize score to 1-5
    let score = 1;
    if (totalComplexity > 6) score = 5;
    else if (totalComplexity > 4) score = 4;
    else if (totalComplexity > 3) score = 3;
    else if (totalComplexity > 2) score = 2;

    return score;
  }, [project.tech, project.tags]);

  if (isDataMode) {
    return (
      <div
        id={`project-card-${project.id}`}
        className={`perspective-container card-focusable focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-xl animate-slide-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-10 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? 'ring-2 ring-pink-500 z-50 rounded-lg' : ''}`}
        style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 50}ms` }}
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
        <div className="bg-black/90 border border-accent-500/50 font-mono text-accent-400 text-xs p-4 rounded-xl shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] relative overflow-hidden group h-full cursor-pointer hover:bg-black hover:border-accent-400 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
             tabIndex={0}
             role="button"
             aria-label={`View data for ${project.title}`}
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
          <div className="scanline"></div>
          <pre className="whitespace-pre-wrap break-words opacity-80 group-hover:opacity-100 transition-opacity">
            {JSON.stringify({
              id: project.id,
              title: project.title,
              tags: project.tags,
              tech: project.tech,
              url: project.url,
            }, null, 2)}
          </pre>
          <div className="absolute top-2 right-2 text-accent-500/50 group-hover:text-accent-400 transition-colors">
            [DATA_MODE]
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'matrix') {
    return (
      <div
        id={`project-card-${project.id}`}
        className={`perspective-container card-focusable focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-xl animate-slide-in-up transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:z-10 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? 'ring-2 ring-pink-500 z-50 rounded-lg' : ''}`}
        style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 50}ms` }}
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
          <div className="w-20 h-14 rounded border border-white/10 tinted-glass shifting-glass overflow-hidden shrink-0 relative z-10 pointer-events-none group-hover:gold-glow transition-colors duration-300">
             {(!imageLoaded || !isVisible) && project.image && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center tinted-glass animate-shimmer z-10 overflow-hidden">
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                   <div className="w-1.5 h-1.5 bg-accent-400 animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.8)] relative z-10"></div>
                </div>
             )}
             {project.image && !imageError ? (
               isVisible && (
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
               )
             ) : (
               <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 transform transition-transform duration-300 group-hover:scale-110">
                 {project.icon}
               </div>
             )}
          </div>

          {/* Target Lock Hover Brackets */}
          <div className="target-bracket target-bracket-tl target-bracket-gold"></div>
          <div className="target-bracket target-bracket-tr target-bracket-gold"></div>
          <div className="target-bracket target-bracket-bl target-bracket-gold"></div>
          <div className="target-bracket target-bracket-br target-bracket-gold"></div>

          {/* Info */}
          <div className="flex-1 flex flex-col min-w-0 z-10 pointer-events-none justify-center">
             <div className="flex items-center gap-2">
               <h3 className="text-sm md:text-base font-bold text-white truncate group-hover:text-accent-300 transition-colors duration-300">
                 <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />
               </h3>
               {/* Tech badges inline (hide on very small screens) */}
               <div className="hidden sm:flex gap-1 overflow-hidden pointer-events-auto">
                  {project.tech?.slice(0, 2).map((t, i) => (
                    <Tooltip key={i} text={`TECH: ${t}`}>
                      <span className="cursor-help text-[9px] font-mono px-1.5 rounded bg-white/5 text-gray-400 border border-white/10 whitespace-nowrap block">
                        {highlightMatch(t, searchQuery, regex)}
                      </span>
                    </Tooltip>
                  ))}
               </div>
             </div>
             <p className="text-xs text-gray-400 truncate mt-0.5">
               {highlightMatch(project.description, searchQuery, regex)}
             </p>
          </div>

          {/* Tags */}
          <div className="hidden lg:flex flex-wrap gap-1 w-40 shrink-0 z-20 pointer-events-auto justify-end">
             {project.tags.slice(0, 3).map((tag, i) => {
               const isHighlighted = highlightedTags.includes(tag);
               return (
                 <button
                   key={i}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     soundSystem.playClick();
                     if (onTagClick) onTagClick(tag);
                   }}
                   onMouseEnter={() => {
                     if (onHoverTag) onHoverTag(tag);
                   }}
                   onMouseLeave={() => {
                     if (onHoverTag) onHoverTag(null);
                   }}
                   className={`text-[9px] px-2 py-0.5 rounded-full border transition-all duration-300 whitespace-nowrap
                     ${isHighlighted
                       ? 'bg-accent-500/80 text-white border-accent-300 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.6)] ring-1 ring-accent-200'
                       : 'text-accent-200 bg-accent-900/30 border-accent-500/20 hover:bg-accent-800/50 hover:text-white hover:border-accent-400'
                     }
                   `}
                 >
                   {highlightMatch(tag, searchQuery, regex)}
                 </button>
               );
             })}
          </div>

          {/* Complexity */}
          <div className="hidden md:flex flex-col items-center justify-center gap-1 w-12 shrink-0 z-10 pointer-events-none border-l border-white/5 pl-2">
            <span className="text-[8px] font-mono text-gray-500 uppercase">CPLX</span>
            <div className="flex gap-px" title={`Complexity: ${complexityScore}/5`}>
              {[1, 2, 3, 4, 5].map(level => (
                <div
                  key={level}
                  className={`w-1 h-2 rounded-sm transition-all duration-300 ${
                    level <= complexityScore
                      ? 'bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]'
                      : 'bg-white/10'
                  }`}
                  style={{ opacity: level <= complexityScore ? 1 : 0.3 }}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 z-20 pointer-events-auto shrink-0 pr-2 border-l border-white/5 pl-3">
             <Tooltip text={isFavorite ? "REM_FAV" : "ADD_FAV"}>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                     soundSystem.playClick();
                   if (onToggleFavorite) onToggleFavorite(project);
                 }}
                 className={`p-1.5 rounded-md transition-all duration-300
                   ${isFavorite
                     ? 'text-pink-400 bg-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-pink-400/30'
                     : 'text-gray-500 hover:text-pink-300 hover:bg-pink-500/10 hover:border-pink-400/30 border border-transparent'
                   }
                 `}
                 aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                 </svg>
               </button>
             </Tooltip>
             <Tooltip text="COPY_LINK">
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                     soundSystem.playClick();
                   if (onCopyLink) onCopyLink(project);
                 }}
                 className="p-1.5 rounded-md text-gray-500 hover:text-accent-300 hover:bg-accent-500/20 hover:border-accent-400/30 border border-transparent transition-all duration-300"
                 aria-label="Copy link"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                 </svg>
               </button>
             </Tooltip>
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


  if (layout === 'list') {
    // Generate pseudo-terminal deterministic values
    const date = new Date(2025, project.id % 12, (project.id * 7) % 28 + 1).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const size = (project.title.length * 14 + project.description.length * 3 + (project.tags?.length || 0) * 128).toString();
    const permissions = project.tech && project.tech.length > 3 ? '-rwxrwxrwx' : '-rw-r--r--';
    const owner = (project.tags || []).includes('Games') ? 'player1' : 'sys_admin';

    return (
      <div
        id={`project-card-${project.id}`}
        className={`card-focusable w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black animate-slide-in-up ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? 'ring-2 ring-pink-500 rounded' : ''}`}
        style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 30}ms` }}
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
                 <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />
               </span>
               <span className="text-xs text-gray-500 truncate mt-0.5 max-w-[300px] lg:max-w-md xl:max-w-lg hidden sm:block">
                 {highlightMatch(project.description, searchQuery, regex)}
               </span>
            </div>
          </div>

          {/* Tags */}
          <div className="hidden xl:flex items-center gap-1 shrink-0 pointer-events-auto">
             {project.tags.slice(0, 3).map((tag, i) => {
               const isHighlighted = highlightedTags.includes(tag);
               return (
                 <button
                   key={i}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     soundSystem.playClick();
                     if (onTagClick) onTagClick(tag);
                   }}
                   onMouseEnter={() => {
                     if (onHoverTag) onHoverTag(tag);
                   }}
                   onMouseLeave={() => {
                     if (onHoverTag) onHoverTag(null);
                   }}
                   className={`text-[10px] px-2 py-0.5 rounded border transition-all duration-200
                     ${isHighlighted
                       ? 'bg-accent-500/50 text-white border-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.4)]'
                       : 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'
                     }
                   `}
                 >
                   {highlightMatch(tag, searchQuery, regex)}
                 </button>
               );
             })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 pointer-events-auto ml-auto md:ml-0 pl-4 border-l border-white/5 z-20">
             <Tooltip text={isFavorite ? "REM_FAV" : "ADD_FAV"}>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   soundSystem.playClick();
                   if (onToggleFavorite) onToggleFavorite(project);
                 }}
                 className={`p-1.5 rounded-md transition-all duration-300
                   ${isFavorite
                     ? 'text-pink-400 bg-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-pink-400/30'
                     : 'text-gray-500 hover:text-pink-300 hover:bg-pink-500/10 hover:border-pink-400/30 border border-transparent'
                   }
                 `}
                 aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                 </svg>
               </button>
             </Tooltip>
             <Tooltip text="COPY_LINK">
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   soundSystem.playClick();
                   if (onCopyLink) onCopyLink(project);
                 }}
                 className="p-1.5 rounded-md text-gray-500 hover:text-accent-300 hover:bg-accent-500/20 hover:border-accent-400/30 border border-transparent transition-all duration-300"
                 aria-label="Copy link"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                 </svg>
               </button>
             </Tooltip>
          </div>
        </div>
      </div>
    );
  }

  // Grid Layout (Default)
  return (
    <div
      id={`project-card-${project.id}`}
      className={`perspective-container card-focusable focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-4 focus-visible:ring-offset-black rounded-xl animate-slide-in-up transition-all duration-500 ease-out hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(var(--rgb-accent-400),0.3)] hover:z-10 ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? 'ring-2 ring-pink-500 scale-105 z-50' : ''}`}
      style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 100}ms` }}
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
        className={`glass-card card-3d block rounded-xl flex flex-col h-full relative group will-change-transform animate-float-idle cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
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
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => {
          e.preventDefault();
          soundSystem.playClick();
          if (onProjectClick) onProjectClick(project);
        }}
      >
      <div
        className={`relative w-full h-full transition-transform duration-700 pointer-events-none rounded-xl`}
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
      {/* FRONT SIDE */}
      <div className={`relative h-full flex flex-col rounded-xl overflow-hidden ${isFlipped ? 'pointer-events-none' : 'pointer-events-auto'}`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        {/* True Holographic Glass Foil */}
        <div
          className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(
              115deg,
              transparent 20%,
              rgba(var(--rgb-accent-400), 0.4) 30%,
              rgba(236, 72, 153, 0.4) 40%,
              rgba(6, 182, 212, 0.4) 50%,
              rgba(251, 191, 36, 0.4) 60%,
              transparent 70%
            )`,
            backgroundSize: '300% 300%',
            backgroundPosition: 'calc(var(--mouse-percent-x, 50%) * 1.5) calc(var(--mouse-percent-y, 50%) * 1.5)',
          }}
        />

        {/* Dynamic Specular Glare */}
        <div
          className="absolute inset-0 pointer-events-none z-30 mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden"
          style={{
            background: `radial-gradient(
              600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
              rgba(255, 255, 255, 0.15),
              transparent 40%
            )`
          }}
        />

        {/* Drag Handle Indicator */}
        {draggable && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>
        )}
        {/* Click handled by parent container */}

        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto" style={{ transform: 'translateZ(60px)' }}>
          {/* Favorite Button */}
          <Tooltip text={isFavorite ? "SYS: REM_FAV" : "SYS: ADD_FAV"}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundSystem.playClick();
                if (onToggleFavorite) onToggleFavorite(project);
              }}
              className={`p-2 rounded-full transition-all duration-300 backdrop-blur-md
                ${isFavorite
                  ? 'bg-pink-500/20 text-pink-400 opacity-100 shadow-[0_0_15px_rgba(236,72,153,0.5)] border border-pink-400/50 scale-110'
                  : 'bg-black/30 text-white/50 opacity-0 group-hover:opacity-100 border border-white/10 hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-400/50 hover:scale-110'
                }
              `}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </button>
          </Tooltip>

          {/* Copy Link Button */}
          <Tooltip text="SYS: COPY_LINK">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                soundSystem.playClick();
                if (onCopyLink) onCopyLink(project);
              }}
              className="p-2 rounded-full transition-all duration-300 backdrop-blur-md bg-black/30 text-white/50 opacity-0 group-hover:opacity-100 border border-white/10 hover:bg-accent-500/20 hover:text-accent-300 hover:border-accent-400/50 hover:scale-110"
              aria-label="Copy link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </Tooltip>
        </div>

        {/* Image Area with overlay gradient */}
        <div className="h-full flex flex-col pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {project.image ? (
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
              {/* Inner Holographic Reflection (ramp up on hover) */}
              <div className={`absolute inset-0 bg-gradient-to-tr from-accent-500/0 via-white/5 to-white/20 mix-blend-overlay transition-all duration-1000 ${isHoverDelayed ? 'opacity-100 shadow-[inset_0_0_30px_rgba(255,255,255,0.4)]' : 'opacity-0'}`}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center relative overflow-hidden rounded-t-xl border-b border-white/5 shrink-0" style={{ transform: 'translateZ(30px)' }}>
                <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg">{project.icon}</span>
            </div>
          )}

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

          {/* Target Lock Hover Brackets */}
          <div className="target-bracket target-bracket-tl target-bracket-gold"></div>
          <div className="target-bracket target-bracket-tr target-bracket-gold"></div>
          <div className="target-bracket target-bracket-bl target-bracket-gold"></div>
          <div className="target-bracket target-bracket-br target-bracket-gold"></div>

          <div
            className="p-6 flex-1 flex flex-col relative z-10 transition-transform duration-100 ease-out"
            style={{
              transform: 'translateZ(50px) translateX(var(--parallax-x, 0px)) translateY(var(--parallax-y, 0px))'
            }}
          >
            <div className="flex items-center mb-3">
              {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300 flex items-center justify-between">
                  <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />

                  {/* Complexity Meter */}
                  <Tooltip text={`COMPLEXITY: ${complexityScore}/5`}>
                    <div className="flex gap-0.5 ml-3 cursor-help">
                      {[1, 2, 3, 4, 5].map(level => (
                        <div
                          key={level}
                          className={`w-1 h-3 rounded-sm transition-all duration-300 ${
                            level <= complexityScore
                              ? 'bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]'
                              : 'bg-white/10'
                          }`}
                          style={{
                            height: `${8 + (level * 2)}px`,
                            opacity: level <= complexityScore ? 1 : 0.3
                          }}
                        />
                      ))}
                    </div>
                  </Tooltip>
                </h3>
              </div>
            </div>

            <p className="text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1">
              {highlightMatch(project.description, searchQuery, regex)}
            </p>

            {/* Tech Stack Badges */}
            {project.tech && project.tech.length > 0 && (
              <div className="mb-4 pointer-events-auto">
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((techItem, index) => (
                    <Tooltip key={index} text={`TECH: ${techItem}`}>
                      <span
                        className="cursor-help text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-black/40 text-gray-400 hover:text-accent-300 hover:gold-glow hover:bg-accent-900/40 transition-colors duration-300 block"
                      >
                        {highlightMatch(techItem, searchQuery, regex)}
                      </span>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-auto pointer-events-auto pt-2 border-t border-white/5">
              {project.tags.map((tag, index) => {
                const isHighlighted = highlightedTags.includes(tag);
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      soundSystem.playClick();
                      if (onTagClick) onTagClick(tag);
                    }}
                    onMouseEnter={() => {
                      if (onHoverTag) onHoverTag(tag);
                    }}
                    onMouseLeave={() => {
                      if (onHoverTag) onHoverTag(null);
                    }}
                    className={`px-3 py-1 text-xs font-semibold tracking-wider border rounded-full transition-all duration-300 cursor-pointer z-20
                      ${isHighlighted
                        ? 'bg-accent-500/80 text-white border-accent-300 shadow-[0_0_12px_rgba(var(--rgb-accent-400),0.6)] scale-105 ring-1 ring-accent-200'
                        : 'text-accent-200 bg-accent-900/30 border-accent-500/20 hover:bg-accent-800/50 hover:text-white hover:border-accent-400 hover:scale-105 group-hover:gold-glow group-hover:shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]'
                      }
                    `}
                  >
                    {highlightMatch(tag, searchQuery, regex)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
          {/* Flip Diagnostics Button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(true); soundSystem.playClick(); }}
            className={`absolute top-4 right-14 z-[99] p-2 rounded-full transition-all duration-300 backdrop-blur-md bg-black/30 text-accent-200 border border-accent-500/30 hover:bg-accent-500/30 hover:text-white hover:border-accent-400 hover:scale-110 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)] opacity-0 group-hover:opacity-100 pointer-events-auto`}
            aria-label="View Diagnostics"
            style={{ transform: 'translateZ(60px)' }}
            title="SYS_DIAGNOSTICS"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </button>

        
        {/* Holographic Scanline on Hover */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[6]">
          <div className="scanline" style={{ animationDuration: '2s' }}></div>
        </div>

        {/* Dynamic Holographic Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--rgb-accent-400),0.15), transparent 40%)`,
            zIndex: 5, // Ensure it sits nicely in the stack
            mixBlendMode: 'screen' // Added for better blending
          }}
        />

        {/* Holographic Sheen (Rainbow Glass Effect) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: `conic-gradient(from calc(var(--mouse-percent-x, 50) * 3.6deg) at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent 0deg, rgba(var(--rgb-accent-400),0.4) 60deg, rgba(168, 85, 247, 0.4) 120deg, transparent 180deg)`,
            zIndex: 4,
            mixBlendMode: 'color-dodge',
            filter: 'blur(10px)'
          }}
        />

        {/* Specular Glare (New, replaces shine-effect) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
          style={{
            background: `radial-gradient(1000px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.15), transparent 50%)`,
            zIndex: 3,
            mixBlendMode: 'overlay'
          }}
        />

        {/* Neon Spotlight Border (with Pulse) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500 rounded-xl"
          style={{
            zIndex: 15,
            transform: 'translateZ(60px)',
            padding: '1px',
            background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--rgb-accent-400),0.6), transparent 60%)`,
            mask: 'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
            WebkitMask: 'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            mixBlendMode: 'screen' // Added for better blending
          }}
        />

        {/* 🌌 CURATOR FEATURE: Holographic Scanline on Hover */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" style={{ transform: 'translateZ(70px)' }}>
          <div className="scanline" style={{ animationDuration: '2s' }}></div>
        </div>

        {/* 🌌 CURATOR FEATURE: Sweeping Glass Reflection */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20" style={{ transform: 'translateZ(70px)' }}>
          <div className="glass-reflection" />
        </div>

        {/* 🌌 CURATOR FEATURE: True Holographic Glass Effects */}
        <div className="holo-overlay absolute inset-0 pointer-events-none rounded-xl z-10" style={{ transform: 'translateZ(20px)', backgroundPosition: 'calc(var(--mouse-percent-x, 50%) * 2) calc(var(--mouse-percent-y, 50%) * 2)' }}></div>

        {/* 🌌 CURATOR FEATURE: Tactical Hover Brackets (Targeting Reticle) */}
        <div className="absolute inset-0 pointer-events-none z-30" style={{ transform: 'translateZ(80px)' }}>
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 -translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-tl-sm"></div>
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 -translate-y-2 group-hover:-translate-x-1 group-hover:translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-tr-sm"></div>
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-bl-sm"></div>
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 translate-y-2 group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-br-sm"></div>
        </div>

        {/* 🌌 CURATOR FEATURE: Dynamic Mouse-Follow Glare */}
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(255,255,255,0.15) 0%, transparent 60%)`,
            mixBlendMode: 'overlay',
            transform: 'translateZ(30px)'
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-xl z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(var(--rgb-accent-400), 0.1) 0%, transparent 50%)`,
            mixBlendMode: 'screen',
            transform: 'translateZ(30px)'
          }}
        />
      </div>

      {/* BACK SIDE (Diagnostics / Raw Data) */}
      <div
        className={`absolute inset-0 h-full w-full flex flex-col rounded-xl border border-accent-500/50 overflow-hidden backdrop-blur-xl bg-black/95 z-20 shadow-[inset_0_0_30px_rgba(var(--rgb-accent-400),0.15),0_0_20px_rgba(var(--rgb-accent-400),0.3)] ${isFlipped ? 'pointer-events-auto' : 'pointer-events-none'}`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-accent-500/30 bg-accent-900/30">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)]"></span>
            <span className="text-xs font-mono text-accent-300 font-bold tracking-widest uppercase">SYS_DIAGNOSTICS</span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFlipped(false); soundSystem.playClick(); }}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Return to Interface"
            data-testid="close-diagnostics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto scrollbar-hide">
          <pre className="text-[10px] sm:text-xs font-mono text-accent-100/80 whitespace-pre-wrap break-all">
            <span className="text-pink-400">const</span> <span className="text-blue-300">target_payload</span> = {JSON.stringify(project, null, 2)}
          </pre>

          <div className="mt-6 pt-4 border-t border-white/10 text-[10px] font-mono text-gray-500">
            <div>&gt; ALLOCATION: {Math.floor((project.id * 17.3) % 500) + 100} MB</div>
            <div>&gt; CPU_LOAD: {((project.id * 3.14) % 5).toFixed(2)}%</div>
            <div>&gt; ENCRYPTION: SHA-256 (VALID)</div>
            <div className="mt-2 text-accent-500/50 animate-pulse">AWAITING FURTHER COMMANDS_</div>
          </div>
        </div>

        {/* Scanning line for back face */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-[6]">
          <div className="scanline" style={{ animationDuration: '3s' }}></div>
        </div>
      </div>

      </div>
      </div>
    </div>
  );
};

export default Card;
