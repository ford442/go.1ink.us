import Tooltip from '../Tooltip';

// Complexity dots (1-5), derived from tech+tag count. Grid shows a taller
// variable-height bar meter with a tooltip next to the title; matrix shows
// a compact fixed-height meter with a "CPLX" label and a native title attr.
export default function ComplexityMeter({ variant, score }) {
  if (variant === 'matrix') {
    return (
      <div className="hidden md:flex flex-col items-center justify-center gap-1 w-12 shrink-0 z-10 pointer-events-none border-l border-white/5 pl-2">
        <span className="text-[8px] font-mono text-gray-500 uppercase">CPLX</span>
        <div className="flex gap-px" title={`Complexity: ${score}/5`}>
          {[1, 2, 3, 4, 5].map(level => (
            <div
              key={level}
              className={`w-1 h-2 rounded-sm transition-all duration-300 ${
                level <= score
                  ? 'bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]'
                  : 'bg-white/10'
              }`}
              style={{ opacity: level <= score ? 1 : 0.3 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Tooltip text={`COMPLEXITY: ${score}/5`}>
      <div className="flex gap-0.5 ml-3 cursor-help">
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            className={`w-1 h-3 rounded-sm transition-all duration-300 ${
              level <= score
                ? 'bg-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]'
                : 'bg-white/10'
            }`}
            style={{
              height: `${8 + (level * 2)}px`,
              opacity: level <= score ? 1 : 0.3
            }}
          />
        ))}
      </div>
    </Tooltip>
  );
}
