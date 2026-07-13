import React, { useEffect, useState, useRef } from 'react';

const ConstellationOverlay = ({ hoveredTag, visibleProjects, displayMode }) => {
  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    // We defer setting an empty state inside the effect body to avoid synchronous setState warnings.
    // Instead we clear it when the effect cleans up or bypass the update entirely.

    let rafId;

    const updateLines = () => {
      if (!hoveredTag || !visibleProjects || visibleProjects.length < 2) {
        setLines([]);
        return;
      }

      // Find all projects that share this tag or category
      const relatedProjects = visibleProjects.filter(p =>
        p.tagSet?.has(hoveredTag) || p.categorySet?.has(hoveredTag) || (p.tags && p.tags.includes(hoveredTag))
      );

      if (relatedProjects.length < 2) {
        setLines([]);
        return;
      }

      // We need to measure the positions of the actual DOM elements
      const points = [];
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (!containerRect) return;

      relatedProjects.forEach(project => {
        const el = document.getElementById(`project-card-${project.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Calculate center point relative to the container
          const x = rect.left - containerRect.left + (rect.width / 2);
          const y = rect.top - containerRect.top + (rect.height / 2);
          points.push({ x, y, id: project.id });
        }
      });

      // Generate lines between points (simple distance-based or just connecting all to all if few, or nearest neighbor)
      const newLines = [];

      // Draw lines between closest nodes to form a constellation
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            // Calculate distance
            const dx = points[i].x - points[j].x;
            const dy = points[i].y - points[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only connect if within a reasonable distance or if we want all connected
            // For a cool effect, connect all but change opacity based on distance
            newLines.push({
                x1: points[i].x,
                y1: points[i].y,
                x2: points[j].x,
                y2: points[j].y,
                key: `${points[i].id}-${points[j].id}`,
                distance
            });
        }
      }

      setLines(newLines);
    };

    const loop = () => {
        updateLines();
        rafId = requestAnimationFrame(loop);
    };

    // Start loop
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      // Don't synchronously set state here, but if the component is just going to unmount or reset,
      // it handles itself naturally on the next render.
    };
  }, [hoveredTag, visibleProjects, displayMode]);

  // If we should not show anything based on props, just return null immediately.
  // This helps avoid rendering old state lines before the raf loop catches up.
  if (!hoveredTag || !visibleProjects || visibleProjects.length < 2) {
      return null;
  }

  if (!hoveredTag || lines.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[5]"
      style={{ overflow: 'visible' }}
    >
      <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="neon-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(var(--rgb-accent-400), 0.8)" />
            <stop offset="50%" stopColor="rgba(168, 85, 247, 0.6)" />
            <stop offset="100%" stopColor="rgba(var(--rgb-accent-400), 0.8)" />
          </linearGradient>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {lines.map(line => {
          // Opacity based on distance (closer = brighter)
          const maxDist = 800; // max distance for lines
          const rawOpacity = 1 - (line.distance / maxDist);
          const opacity = Math.max(0.1, Math.min(0.8, rawOpacity));

          if (line.distance > maxDist) return null; // Don't draw very long lines

          return (
            <g key={line.key}>
                {/* Glow layer */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="url(#neon-glow)"
                  strokeWidth="3"
                  opacity={opacity * 0.5}
                  filter="url(#glow-filter)"
                  className="transition-all duration-300 ease-out"
                />
                {/* Core line */}
                <line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1"
                  opacity={opacity}
                  strokeDasharray="4 8"
                  className="transition-all duration-300 ease-out animate-[dash_2s_linear_infinite]"
                />

                {/* Connection Nodes */}
                <circle cx={line.x1} cy={line.y1} r="3" fill="rgba(var(--rgb-accent-400), 1)" filter="url(#glow-filter)" />
                <circle cx={line.x2} cy={line.y2} r="3" fill="rgba(var(--rgb-accent-400), 1)" filter="url(#glow-filter)" />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default ConstellationOverlay;
