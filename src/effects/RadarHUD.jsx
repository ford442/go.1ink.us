import React, { useState, useEffect, useRef } from 'react';

const RadarHUD = ({ projects, favorites, displayMode }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const radarRef = useRef(null);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const currentScroll = window.scrollY;
          const progress = scrollHeight > 0 ? currentScroll / scrollHeight : 0;
          setScrollProgress(Math.min(Math.max(progress, 0), 1));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [projects]); // Re-calculate if projects list changes height

  const handleRadarClick = (e) => {
    if (!radarRef.current) return;

    const rect = radarRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const clickProgress = y / rect.height;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = scrollHeight * clickProgress;

    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  // Calculate dots grid configuration based on displayMode
  const columns = displayMode === 'grid' ? 3 : 1;
  const dotClass = displayMode === 'grid' ? 'w-2 h-2' : 'w-full h-1';

  // Height of the viewport box relative to the radar HUD
  const viewportHeightPercent = typeof window !== 'undefined' && document.documentElement.scrollHeight > 0
    ? (window.innerHeight / document.documentElement.scrollHeight) * 100
    : 10;

  const clampedViewportHeight = Math.max(viewportHeightPercent, 5); // minimum 5% height

  // Adjust top position to keep the box entirely within the HUD
  const boxTop = scrollProgress * (100 - clampedViewportHeight);

  return (
    <div className="relative flex flex-col items-center group pointer-events-auto">
      <div className="flex items-center gap-2 mb-2 w-full border-b border-accent-500/20 pb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse"></div>
        <span className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase">Tactical Radar</span>
      </div>

      <div
        ref={radarRef}
        onClick={handleRadarClick}
        className="relative w-full h-48 bg-black/40 border border-accent-500/30 rounded-lg overflow-hidden cursor-crosshair tinted-glass shifting-glass"
      >
        {/* Radar Sweep Animation */}
        <div className="absolute inset-0 z-0 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
          <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_70%,rgba(var(--rgb-accent-400),0.4)_100%)] rounded-lg animate-spin [animation-duration:4s] origin-center"></div>
          <div className="absolute w-full h-[1px] bg-accent-500/50 top-1/2 left-0 animate-spin [animation-duration:4s] origin-center"></div>
          {/* Concentric rings */}
          <div className="absolute inset-4 border border-accent-500/20 rounded-full"></div>
          <div className="absolute inset-10 border border-accent-500/10 rounded-full"></div>
        </div>

        {/* The Grid / Dots */}
        <div className="absolute inset-2 z-10 flex flex-col justify-between">
            <div className={`grid gap-1 ${columns === 3 ? 'grid-cols-3' : 'grid-cols-1'} w-full`}>
              {projects.map((p) => {
                const isFav = favorites.includes(p.id);
                const isComplex = (p.tech?.length || 0) + (p.tags?.length || 0) > 4;

                let bgColor = 'bg-accent-500/40';
                let glow = '';

                if (isFav) {
                  bgColor = 'bg-pink-500';
                  glow = 'animate-pulse shadow-[0_0_5px_rgba(236,72,153,0.8)]';
                } else if (isComplex) {
                  bgColor = 'bg-amber-400';
                }

                return (
                  <div
                    key={p.id}
                    className={`${dotClass} ${bgColor} ${glow} rounded-full transition-all duration-300 mx-auto group-hover:scale-110`}
                  ></div>
                );
              })}
            </div>
        </div>

        {/* Viewport Bounding Box */}
        <div
          className="absolute z-20 left-0 w-full border border-accent-400/80 bg-accent-400/10 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.3)] pointer-events-none transition-all duration-100 ease-out"
          style={{
            height: `${clampedViewportHeight}%`,
            top: `${boxTop}%`
          }}
        >
          {/* Corner accents for the bounding box */}
          <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-accent-300"></div>
          <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-accent-300"></div>
          <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-accent-300"></div>
          <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-accent-300"></div>
        </div>

        {/* Subtle Scanline Overlay */}
        <div className="scanline opacity-20 pointer-events-none z-30"></div>
      </div>

      {/* Stats/Legend */}
      <div className="flex justify-between w-full mt-2 px-1 text-[9px] font-mono text-accent-500/50 uppercase tracking-widest">
        <span>Nodes: {projects.length}</span>
        <span>Pos: {Math.round(scrollProgress * 100)}%</span>
      </div>
    </div>
  );
};

export default RadarHUD;
