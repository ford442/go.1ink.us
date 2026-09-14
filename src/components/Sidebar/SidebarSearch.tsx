import type { Dispatch, RefObject, SetStateAction } from 'react';
import soundSystem from '../../lib/SoundSystem';
import type { SortOption } from '../../types';

interface SidebarSearchProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  filteredProjectsCount: number;
  suggestedTags: string[];
  toggleFilter: (filter: string) => void;
  addActivityLog: (text: string) => void;
  sortOption: SortOption;
  setSortOption: Dispatch<SetStateAction<SortOption>>;
  setRandomSeed: Dispatch<SetStateAction<number>>;
}

export default function SidebarSearch({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  setCurrentPage,
  filteredProjectsCount,
  suggestedTags,
  toggleFilter,
  addActivityLog,
  sortOption,
  setSortOption,
  setRandomSeed,
}: SidebarSearchProps) {
  return (
    <>
      {/* Search Input Section */}
      <div className="flex w-full">
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-accent-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-accent-500/50 group-focus-within:text-accent-400 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
                if (e.target.value.trim().length > 2) {
                  addActivityLog(`USER SEARCH: "${e.target.value}"`);
                }
              }}
              onInput={() => soundSystem.playKeystroke()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setSearchQuery('');
                  setCurrentPage(1);
                  return;
                }
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                  const firstCard = document.querySelector<HTMLElement>('.card-focusable');
                  if (firstCard) {
                    e.preventDefault();
                    firstCard.focus();
                    firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              }}
              placeholder="Search projects, tags, tech..."
              autoComplete="off"
              spellCheck="false"
              className="w-full bg-black/20 backdrop-blur-xl border border-white/10 text-white pl-10 pr-24 py-3 rounded-xl focus:outline-none focus:bg-black/40 focus-visible:outline-none focus-visible:ring-accent-400 focus-visible:ring-2 focus-visible:border-accent-400 focus-visible:shadow-[0_0_15px_rgba(var(--color-accent-400),0.5)] transition-all duration-300 shadow-lg placeholder-gray-500 text-sm"
            />

            {/* Right Actions: Results Count or Shortcut Hint */}
            <div className="absolute right-4 flex items-center space-x-3">
              {searchQuery ? (
                <>
                  <span className="text-xs font-mono text-accent-400 bg-accent-900/30 px-2 py-1 rounded">
                    {filteredProjectsCount} found
                  </span>
                  <button
                    onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-1 text-gray-500 text-xs border border-white/10 rounded px-2 py-1">
                  <span className="text-xs">⌘</span>
                  <span>K</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Tags (Moved below search, simplified) */}
      <div className="hidden lg:flex flex-col gap-2 px-1">
         <span className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase">Quick Protocols:</span>
         <div className="flex flex-wrap gap-1.5">
           {suggestedTags.slice(0, 4).map((tag) => (
             <button
               key={tag}
               onClick={() => {
                 setSearchQuery('');
                 toggleFilter(tag);
               }}
               className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 hover:bg-accent-500/10 hover:text-accent-300 hover:border-accent-500/30 transition-colors"
             >
               {tag}
             </button>
           ))}
         </div>
      </div>

      {/* Sort Options */}
      <div className="flex flex-col gap-2 px-1">
        <div className="flex items-center justify-between">
          <span className="text-accent-500/70 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Sort Protocol:
          </span>
        </div>
        <select
          value={sortOption}
          aria-label="Sort projects"
          onChange={(e) => {
            if (e.target.value === 'Random') {
              setRandomSeed(Math.random());
            }
            setSortOption(e.target.value as SortOption);
            setCurrentPage(1);
            addActivityLog(`SORT_PROTOCOL_UPDATED: ${e.target.value.toUpperCase()}`);
          }}
          className="w-full bg-black/40 text-gray-300 text-xs font-mono px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-accent-500/50 focus-visible:ring-2 focus-visible:ring-accent-400 hover:bg-white/5 transition-colors cursor-pointer appearance-none shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`, paddingRight: `2.5rem` }}
        >
          <option value="Featured" className="bg-gray-900">Featured</option>
          <option value="Newest" className="bg-gray-900">Newest</option>
          <option value="A-Z" className="bg-gray-900">A-Z</option>
          <option value="Random" className="bg-gray-900">Random</option>
          <option value="Most Complex" className="bg-gray-900">Most Complex</option>
        </select>
      </div>
    </>
  );
}
