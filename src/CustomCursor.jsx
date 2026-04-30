import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const requestRef = useRef(null);
  const [isPointerDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(pointer: fine)').matches;
    }
    return false;
  });

  // Position references
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });

  // State to hold scale independent of tailwind classes that get overwritten by style.transform
  const [isHovering, setIsHovering] = useState(false);
  const isHoveringRef = useRef(false);

  useEffect(() => {
    if (!isPointerDevice) return;

    // Add global class to hide cursor when we know we're using a mouse
    document.body.classList.add('custom-cursor-active');

    const onMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const animate = () => {
      // Lerp the ring towards the mouse
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      if (cursorRingRef.current) {
        // Apply the scale manually here instead of relying on tailwind classes
        // which get overwritten by the transform style
        const scale = isHoveringRef.current ? 1.5 : 1;
        cursorRingRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    const onMouseOver = (e) => {
      const target = e.target;
      const isClickable = target.closest('a') ||
                          target.closest('button') ||
                          target.closest('.card-link');
      const isInput = target.closest('input') || target.closest('textarea');

      if (isClickable && !isInput) {
        isHoveringRef.current = true;
        setIsHovering(true); // For React state if needed elsewhere, but ref drives animation
      }
    };

    const onMouseOut = () => {
      isHoveringRef.current = false;
      setIsHovering(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseout', onMouseOut);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      cancelAnimationFrame(requestRef.current);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isPointerDevice]);

  if (!isPointerDevice) return null;

  return (
    <>
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-cyan-400 rounded-full pointer-events-none z-[9999] shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        style={{ willChange: 'transform' }}
      />
      <div
        ref={cursorRingRef}
        className={`fixed top-0 left-0 w-8 h-8 rounded-full border border-cyan-500/50 pointer-events-none z-[9998] transition-colors duration-200 flex items-center justify-center ${isHovering ? 'bg-cyan-500/10 border-cyan-400' : ''}`}
        style={{ willChange: 'transform' }}
      >
        {/* Crosshairs */}
        <div className={`absolute w-full h-[1px] bg-cyan-500/50 transition-transform duration-300 ${isHovering ? 'scale-x-50 opacity-100' : 'scale-x-125 opacity-50'}`}></div>
        <div className={`absolute w-[1px] h-full bg-cyan-500/50 transition-transform duration-300 ${isHovering ? 'scale-y-50 opacity-100' : 'scale-y-125 opacity-50'}`}></div>

        {/* Rotating brackets on hover */}
        <div className={`absolute w-full h-full transition-all duration-500 ${isHovering ? 'opacity-100 rotate-90 scale-110' : 'opacity-0 rotate-0 scale-50'}`}>
           <div className="absolute top-[-2px] left-[-2px] w-2 h-2 border-t-2 border-l-2 border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"></div>
           <div className="absolute top-[-2px] right-[-2px] w-2 h-2 border-t-2 border-r-2 border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"></div>
           <div className="absolute bottom-[-2px] left-[-2px] w-2 h-2 border-b-2 border-l-2 border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"></div>
           <div className="absolute bottom-[-2px] right-[-2px] w-2 h-2 border-b-2 border-r-2 border-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"></div>
        </div>
      </div>
    </>
  );
}
