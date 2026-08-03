import { CATEGORY_ICONS } from '../../constants';

const DISPLAY_MODES = [
  {
    mode: 'grid',
    label: 'Grid View',
    title: 'Grid Protocol',
    path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z',
  },
  { mode: 'matrix', label: 'Matrix View', title: 'Matrix Protocol', path: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { mode: 'list', label: 'List View', title: 'List Protocol', path: 'M4 6h16M4 12h16M4 18h16' },
  {
    mode: 'map',
    label: 'Neural Map View',
    title: 'Map Protocol',
    path: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    mode: 'constellation',
    label: 'Constellation View',
    title: 'Constellation Protocol',
    path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
];

export default function ViewToolbar({
  activeFilters,
  searchQuery,
  setSearchQuery,
  setActiveFilters,
  setCurrentPage,
  toggleFilter,
  displayMode,
  handleDisplayModeChange,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-gray-500 text-sm font-mono mr-2">SYS_VIEW:</span>
        {activeFilters.length === 0 && !searchQuery ? (
          <span className="text-white text-sm font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">All Protocols</span>
        ) : (
          <>
            {searchQuery && (
              <span className="text-white text-sm font-bold bg-accent-500/20 px-3 py-1 rounded-full border border-accent-500/30 flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]">
                🔍 "{searchQuery}"
                <button onClick={() => { setSearchQuery(''); setCurrentPage(1); }} className="ml-1 hover:text-red-400 transition-colors p-0.5" aria-label={`Clear search`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {activeFilters.map(filter => (
              <span key={filter} className="text-white text-sm font-bold bg-accent-500/20 px-3 py-1 rounded-full border border-accent-500/30 flex items-center gap-2 animate-fade-in shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]">
                {CATEGORY_ICONS[filter] || '🏷️'} {filter}
                <button onClick={() => toggleFilter(filter)} className="ml-1 hover:text-red-400 transition-colors p-0.5" aria-label={`Remove ${filter} filter`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            ))}
            {(activeFilters.length > 0 && searchQuery) || activeFilters.length > 1 ? (
              <button onClick={() => { setActiveFilters([]); setSearchQuery(''); setCurrentPage(1); }} className="text-xs font-mono text-accent-400 hover:text-accent-300 ml-2 uppercase tracking-widest hover:underline decoration-accent-400/50 underline-offset-4 transition-all">
                [ Clear All ]
              </button>
            ) : null}
          </>
        )}
      </div>

      {/* View & Sort Controls */}
      <div className="flex items-center gap-3">
        {/* Display Mode Toggle */}
        <div className="bg-black/20 backdrop-blur-xl rounded-lg border border-white/10 p-1 flex" role="group" aria-label="Layout mode">
          {DISPLAY_MODES.map(({ mode, label, title, path }) => (
            <button
              key={mode}
              onClick={() => handleDisplayModeChange(mode)}
              className={`p-1.5 rounded transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 ${displayMode === mode ? 'bg-accent-500/20 text-accent-300 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.2)]' : 'text-gray-500 hover:text-white'}`}
              aria-label={label}
              aria-pressed={displayMode === mode}
              title={title}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
