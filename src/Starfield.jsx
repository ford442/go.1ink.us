import React, { useState } from 'react';

const Starfield = ({ starCount = 75 }) => {
  const [stars] = useState(() => {
    return Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() < 0.1 ? '3px' : Math.random() < 0.4 ? '2px' : '1px', // Few large, some medium, mostly small
      opacity: Math.random() * 0.5 + 0.3, // Base opacity
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${Math.random() * 3 + 2}s`
    }));
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full star-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration
          }}
        />
      ))}

      {/* Shooting Stars Container */}
      <div className="absolute inset-0 w-full h-full rotate-[315deg]">
         <div className="shooting-star" style={{ top: '20%', left: '50%', animationDelay: '5s' }}></div>
         <div className="shooting-star" style={{ top: '60%', left: '30%', animationDelay: '12s' }}></div>
      </div>
    </div>
  );
};

export default Starfield;
