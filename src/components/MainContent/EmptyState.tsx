import { flushSync } from 'react-dom';
import type { Dispatch, SetStateAction } from 'react';

function withViewTransition(fn: () => void) {
  if (document.startViewTransition) {
    document.startViewTransition(() => flushSync(fn));
  } else {
    fn();
  }
}

interface EmptyStateProps {
  searchQuery: string;
  activeFilters: string[];
  suggestedTags: string[];
  setSearchQuery: Dispatch<SetStateAction<string>>;
  toggleFilter: (filter: string) => void;
  setActiveFilters: Dispatch<SetStateAction<string[]>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
}

export default function EmptyState({
  searchQuery,
  activeFilters,
  suggestedTags,
  setSearchQuery,
  toggleFilter,
  setActiveFilters,
  setCurrentPage,
}: EmptyStateProps) {
  const clearSearch = () => withViewTransition(() => { setSearchQuery(''); setCurrentPage(1); });
  const clearTags = () => withViewTransition(() => { setActiveFilters([]); setCurrentPage(1); });
  const resetAll = () => withViewTransition(() => { setActiveFilters([]); setSearchQuery(''); setCurrentPage(1); });

  return (
    <div className="max-w-2xl mx-auto mt-10 animate-fade-in">
      <div className="relative overflow-hidden rounded-xl p-8 backdrop-blur-md tinted-glass shifting-glass border border-accent-500/30 shadow-[0_0_30px_rgba(var(--rgb-accent-400),0.1),inset_0_0_20px_rgba(var(--rgb-accent-400),0.05)]">
        <div className="scanline"></div>
        <div className="flex flex-col items-center justify-center text-center space-y-6 relative z-10">
          {/* Holographic Radar / Core Searching Illustration */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-6 group cursor-default perspective-1000">

            {/* Deep Parallax Glow */}
            <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-[60px] animate-[pulse_4s_ease-in-out_infinite] group-hover:bg-accent-500/40 transition-colors duration-1000"></div>

            {/* Outer Radar Ring */}
            <div className="absolute inset-2 border-[1px] border-accent-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-2 border-[2px] border-dashed border-accent-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>

            {/* Radar Sweep Element */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute top-1/2 left-1/2 w-full h-full bg-[conic-gradient(from_0deg_at_0%_0%,transparent_0deg,transparent_270deg,rgba(var(--rgb-accent-400),0.3)_360deg)] animate-radar-sweep transform origin-top-left" style={{ transform: 'translate(-50%, -50%)' }}></div>
            </div>

            {/* Geometric Holographic Structure */}
            <svg className="absolute w-48 h-48 text-accent-500/60 animate-[float-idle_8s_ease-in-out_infinite]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.5" style={{ transformStyle: 'preserve-3d' }}>
              {/* Outer rotating hex */}
              <polygon points="50,2 98,26 98,74 50,98 2,74 2,26" strokeDasharray="4 6" className="animate-[spin_30s_linear_infinite]" />
              {/* Inner rotating hex opposite */}
              <polygon points="50,15 80.3,32.5 80.3,67.5 50,85 19.7,67.5 19.7,32.5" strokeDasharray="10 5" className="animate-[spin_20s_linear_infinite_reverse] text-accent-400/80" />

              {/* Connecting Nodes */}
              <circle cx="50" cy="2" r="1.5" fill="currentColor" className="animate-pulse" />
              <circle cx="98" cy="26" r="1.5" fill="currentColor" className="animate-pulse" />
              <circle cx="98" cy="74" r="1.5" fill="currentColor" className="animate-pulse" />
              <circle cx="50" cy="98" r="1.5" fill="currentColor" className="animate-pulse" />
              <circle cx="2" cy="74" r="1.5" fill="currentColor" className="animate-pulse" />
              <circle cx="2" cy="26" r="1.5" fill="currentColor" className="animate-pulse" />
            </svg>

            {/* Core Searching Fragments */}
            <div className="absolute inset-0 flex items-center justify-center animate-[float-idle_5s_ease-in-out_infinite]">
              <svg className="w-20 h-20 text-accent-300 drop-shadow-[0_0_20px_rgba(var(--rgb-accent-400),1)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                {/* Scanning Eye/Core */}
                <circle cx="12" cy="12" r="4" className="animate-[pulse_1.5s_infinite]" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" className="opacity-70 animate-[pulse_2s_infinite]" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.07 4.93l-2.83 2.83m-8.48 8.48l-2.83 2.83M19.07 19.07l-2.83-2.83M4.93 4.93l2.83 2.83" className="opacity-40" />

                {/* Floating data particles */}
                <circle cx="16" cy="8" r="1" fill="currentColor" className="animate-[ping_2s_infinite]" />
                <circle cx="8" cy="16" r="1" fill="currentColor" className="animate-[ping_3s_infinite]" />
                <circle cx="8" cy="8" r="1.5" fill="currentColor" className="animate-[ping_2.5s_infinite]" />
                <circle cx="16" cy="16" r="0.5" fill="currentColor" className="animate-[ping_1.8s_infinite]" />
              </svg>
            </div>

            {/* Holographic Glare Layer */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none mix-blend-overlay rotate-45 transform"></div>

            {/* Scanline overlay for illustration */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] rounded-full overflow-hidden pointer-events-none mix-blend-multiply"></div>
          </div>

          <div className="relative">
            <h3 className="text-4xl md:text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-accent-500 to-accent-700 mb-1 tracking-[0.25em] drop-shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.8)] glitch-text" data-text="SIGNAL LOST">
              SIGNAL LOST
            </h3>
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-accent-500/50 to-transparent mt-4 mb-2 animate-pulse"></div>
          </div>

          <div className="text-accent-300/80 font-mono text-sm bg-black/60 p-6 rounded-xl border border-accent-500/40 w-full text-left shadow-[0_0_25px_rgba(var(--rgb-accent-400),0.15)] backdrop-blur-xl relative overflow-hidden group">
            {/* Terminal Glare */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-accent-500/30">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </div>
                <span className="text-accent-400/90 text-xs font-bold tracking-widest">SYSTEM_DIAGNOSTIC</span>
              </div>
              <span className="text-[10px] text-accent-500/50">ERR_CODE: 404_VOID</span>
            </div>

            {searchQuery && (
              <p className="mb-2 break-all"><span className="text-white/50">{`> SEARCH_QUERY:`}</span> <span className="text-accent-200">"{searchQuery}"</span></p>
            )}

            {activeFilters.length > 0 && (
              <p className="mb-2"><span className="text-white/50">{`> ACTIVE_TAGS:`}</span> <span className="text-accent-200">[{activeFilters.join(', ')}]</span></p>
            )}

            <p className="mb-2"><span className="text-white/50">{`> STATUS:`}</span> <span className="text-red-400">NO_RESULTS_FOUND</span></p>
            <p className="animate-pulse mb-6 mt-4 text-accent-400/70">{`> RECOMMENDATION: INITIATE_PROTOCOL_OVERRIDE`}</p>

            {/* Suggested Protocols */}
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-accent-500/20">
              <p className="text-xs uppercase opacity-70">Suggested Override Protocols:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => { setSearchQuery(''); toggleFilter(tag); }}
                    className="px-3 py-1 bg-accent-900/40 hover:bg-accent-500/20 border border-accent-500/30 text-accent-200 text-xs rounded transition-all duration-300 hover:shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.3)] hover:-translate-y-0.5"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-6 w-full relative z-10">
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="flex-1 min-w-[140px] relative px-4 py-3 bg-black/60 hover:bg-accent-900/60 border border-accent-500/50 text-accent-200 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] hover:-translate-y-0.5 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500/50 group-hover:bg-accent-400"></div>
                <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                  Clear Search
                </span>
              </button>
            )}

            {activeFilters.length > 0 && (
              <button
                onClick={clearTags}
                className="flex-1 min-w-[140px] relative px-4 py-3 bg-black/60 hover:bg-accent-900/60 border border-accent-500/50 text-accent-200 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] hover:-translate-y-0.5 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-accent-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500/50 group-hover:bg-accent-400"></div>
                <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                  Clear Tags
                </span>
              </button>
            )}

            <button
              onClick={resetAll}
              className="w-full sm:flex-1 min-w-[200px] relative px-4 py-3 bg-accent-500/20 hover:bg-accent-500/40 border border-accent-500/60 text-white rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] hover:shadow-[0_0_25px_rgba(var(--rgb-accent-400),0.6)] hover:-translate-y-0.5 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shine_3s_infinite_linear] opacity-0 group-hover:opacity-100"></div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse"></span>
                <span className="uppercase text-xs font-bold tracking-widest block font-mono">
                  System Reset
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
