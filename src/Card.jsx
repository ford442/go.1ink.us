import React, { useRef } from 'react';

const Card = ({ project, onTagClick, searchQuery, highlightedTags = [] }) => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation based on mouse position
    // We want the card to "levitate" towards the mouse (the side under the mouse lifts up/comes forward)

    // RotateX:
    // Mouse at Top (y < center) -> We want the card to TILT TOWARDS the mouse (Magnet Effect).
    // Tilt Towards = Top comes Forward = RotateX Negative.
    // (y - centerY) is Negative.
    // Neg * K = Neg. So K is Positive (10).
    const rotateX = ((y - centerY) / centerY) * 10;

    // RotateY:
    // Mouse at Right (x > center) -> We want the card to TILT TOWARDS the mouse.
    // Tilt Towards = Right comes Forward = RotateY Negative.
    // (x - centerX) is Positive.
    // Pos * K = Neg. So K is Negative (-10).
    const rotateY = ((x - centerX) / centerX) * -10;

    // Apply the transform
    // Includes the lift (translateY) and scale that matches the CSS hover state intention
    card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

    // Set CSS variables for the spotlight effect
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);

    // Speed up transform transition for responsiveness, but keep others smooth
    // Matches CSS: transition: transform 0.6s ..., box-shadow 0.6s ..., background 0.3s ..., border-color 0.3s ...
    card.style.transition = 'transform 0.1s ease-out, box-shadow 0.6s cubic-bezier(0.23, 1, 0.32, 1), background 0.3s ease, border-color 0.3s ease';
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;

    // Reset to default state (managed by CSS)
    cardRef.current.style.transform = '';
    // Reset transition to allow the smooth CSS return animation
    cardRef.current.style.transition = '';

    // Clear spotlight variables (optional, but good practice)
    cardRef.current.style.removeProperty('--mouse-x');
    cardRef.current.style.removeProperty('--mouse-y');
  };

  // Helper to highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    // Escape special characters for regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Split by query (captured), case insensitive
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-cyan-500/30 text-cyan-200 rounded px-0.5 shadow-[0_0_8px_rgba(34,211,238,0.2)] font-semibold">{part}</span>
      ) : part
    );
  };

  return (
    <div className="perspective-container" style={{ viewTransitionName: `project-${project.id}` }}>
      <div
        ref={cardRef}
        className="glass-card card-3d block rounded-xl flex flex-col h-full relative group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-0"
          aria-label={project.title}
        ></a>

        {/* Image Area with overlay gradient */}
        <div className="h-full flex flex-col pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {project.image ? (
            <div className="h-48 overflow-hidden rounded-t-xl relative border-b border-white/5 shrink-0" style={{ transform: 'translateZ(20px)' }}>
              <img
                src={project.image}
                alt={project.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 delay-100 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center relative overflow-hidden rounded-t-xl border-b border-white/5 shrink-0" style={{ transform: 'translateZ(20px)' }}>
                <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg">{project.icon}</span>
            </div>
          )}

          <div className="p-6 flex-1 flex flex-col relative z-10" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex items-center mb-3">
              {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
              <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300">
                {highlightMatch(project.title, searchQuery)}
              </h3>
            </div>

            <p className="text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1">
              {highlightMatch(project.description, searchQuery)}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto pointer-events-auto">
              {project.tags.map((tag, index) => {
                const isHighlighted = highlightedTags.includes(tag);
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onTagClick) onTagClick(tag);
                    }}
                    className={`px-3 py-1 text-xs font-semibold tracking-wider border rounded-full transition-all duration-300 cursor-pointer z-20
                      ${isHighlighted
                        ? 'bg-cyan-500/80 text-white border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.6)] scale-105 ring-1 ring-cyan-200'
                        : 'text-cyan-200 bg-cyan-900/30 border-cyan-500/20 hover:bg-cyan-800/50 hover:text-white hover:border-cyan-400 hover:scale-105 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                      }
                    `}
                  >
                    {highlightMatch(tag, searchQuery)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* 3D shine effect overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent shine-effect"></div>
        </div>

        {/* Dynamic Holographic Spotlight */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.08), transparent 40%)`,
            zIndex: 5 // Ensure it sits nicely in the stack
          }}
        />
      </div>
    </div>
  );
};

export default Card;
