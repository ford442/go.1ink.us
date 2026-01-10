import React, { useRef } from 'react';

const Card = ({ project, onTagClick }) => {
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
    // Mouse at Top (y < center) -> Top lifts UP (towards user).
    // Top Up = Top Forward = RotateX Negative.
    // (y - centerY) is Negative.
    // Neg * K = Neg. So K is Positive (10).
    const rotateX = ((y - centerY) / centerY) * 10;

    // RotateY:
    // Mouse at Right (x > center) -> Right lifts UP (towards user).
    // Right Up = Right Forward = RotateY Negative.
    // (x - centerX) is Positive.
    // Pos * K = Neg. So K is Negative (-10).
    const rotateY = ((x - centerX) / centerX) * -10;

    // Apply the transform
    // Includes the lift (translateY) and scale that matches the CSS hover state intention
    card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

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
  };

  return (
    <div className="perspective-container">
      <div
        ref={cardRef}
        className="glass-card card-3d block rounded-xl overflow-hidden flex flex-col h-full relative group"
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
        <div className="h-full flex flex-col pointer-events-none">
          {project.image ? (
            <div className="h-48 overflow-hidden relative border-b border-white/5 shrink-0">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover transition-transform duration-700 delay-100 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center relative overflow-hidden border-b border-white/5 shrink-0">
                <span className="text-6xl transform transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12 drop-shadow-lg">{project.icon}</span>
            </div>
          )}

          <div className="p-6 flex-1 flex flex-col relative z-10">
            <div className="flex items-center mb-3">
              {project.image && <div className="text-2xl mr-3 transform transition-transform duration-300 group-hover:rotate-12 filter drop-shadow">{project.icon}</div>}
              <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-blue-300 transition-colors duration-300">
                {project.title}
              </h3>
            </div>

            <p className="text-gray-300 mb-5 line-clamp-3 leading-relaxed flex-1">
              {project.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto pointer-events-auto">
              {project.tags.map((tag, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onTagClick) onTagClick(tag);
                  }}
                  className="px-3 py-1 text-xs font-semibold tracking-wider text-cyan-200 bg-cyan-900/30 border border-cyan-500/20 rounded-full transition-all duration-300 hover:bg-cyan-800/50 hover:text-white hover:border-cyan-400 hover:scale-105 group-hover:border-cyan-400/50 group-hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] cursor-pointer z-20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* 3D shine effect overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent shine-effect"></div>
        </div>
      </div>
    </div>
  );
};

export default Card;
