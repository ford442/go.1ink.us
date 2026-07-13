import soundSystem from '../../lib/SoundSystem';

// Back face of the grid card (flipped via CardGrid's isFlipped state):
// raw JSON payload + simulated diagnostics readout.
export default function CardGridBack({ project, isFlipped, onClose }) {
  return (
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); soundSystem.playClick(); }}
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
  );
}
