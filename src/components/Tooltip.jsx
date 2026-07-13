import React, { useState, useEffect } from 'react';

const Tooltip = ({ text, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let intervalId;
    if (isVisible) {
      let iteration = 0;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

      intervalId = setInterval(() => {
        setDisplayText(
          text
            .split('')
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              return letters[Math.floor(Math.random() * letters.length)];
            })
            .join('')
        );

        if (iteration >= text.length) {
          clearInterval(intervalId);
        }

        iteration += 1;
      }, 30);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [isVisible, text]);

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => {
    setIsVisible(false);
    setDisplayText('');
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full mb-2 z-50 animate-tooltip-fade pointer-events-none">
          <div className="relative bg-black/90 border border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] rounded px-3 py-1.5 overflow-hidden">
             {/* Scanline Effect */}
             <div className="absolute inset-0 scanline opacity-30 pointer-events-none"></div>

             {/* Text */}
             <span className="relative z-10 font-mono text-xs text-accent-400 font-bold whitespace-nowrap tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]">
                {displayText}
             </span>

             {/* Arrow */}
             <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-black/90 border-r border-b border-accent-500/50 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;