import React, { useState, useEffect, useRef, useMemo } from 'react';
import soundSystem from './SoundSystem';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_THEMES } from './constants';

const OmniPalette = ({
  isOpen,
  onClose,
  projects,
  onProjectSelect,
  activeFilters,
  onToggleFilter,
  onChangeTheme,
  isCrtEnabled,
  onToggleCrt,
  isMatrixMode,
  onToggleMatrixMode,
  isSoundEnabled,
  onToggleSound,
  isLockdown,
  onToggleLockdown,
  onChangeDisplayMode
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Command categories
  const commands = useMemo(() => {
    const protocols = [
      { id: 'theme-cyan', type: 'protocol', label: 'Set Theme: Cyan', action: () => onChangeTheme('cyan'), icon: '🎨' },
      { id: 'theme-purple', type: 'protocol', label: 'Set Theme: Purple', action: () => onChangeTheme('purple'), icon: '🎨' },
      { id: 'theme-emerald', type: 'protocol', label: 'Set Theme: Emerald', action: () => onChangeTheme('emerald'), icon: '🎨' },
      { id: 'theme-gold', type: 'protocol', label: 'Set Theme: Gold', action: () => onChangeTheme('gold'), icon: '🎨' },
      { id: 'toggle-crt', type: 'protocol', label: `CRT Effect: ${isCrtEnabled ? 'Disable' : 'Enable'}`, action: onToggleCrt, icon: '📺' },
      { id: 'toggle-matrix', type: 'protocol', label: `Matrix Mode: ${isMatrixMode ? 'Disable' : 'Enable'}`, action: onToggleMatrixMode, icon: '🌧️' },
      { id: 'toggle-sound', type: 'protocol', label: `Audio: ${isSoundEnabled ? 'Disable' : 'Enable'}`, action: onToggleSound, icon: '🔊' },
      { id: 'toggle-lockdown', type: 'protocol', label: isLockdown ? 'Override Lockdown' : 'Engage Lockdown', action: onToggleLockdown, icon: '🔒' },
      { id: 'view-grid', type: 'protocol', label: 'View: Grid', action: () => onChangeDisplayMode('grid'), icon: '🔲' },
      { id: 'view-matrix', type: 'protocol', label: 'View: Matrix', action: () => onChangeDisplayMode('matrix'), icon: '☰' },
      { id: 'filter-clear', type: 'protocol', label: 'Clear All Filters', action: () => onToggleFilter('All'), icon: '🧹' }
    ];

    const categoryFilters = Object.keys(CATEGORIES).map(cat => ({
      id: `cat-${cat}`,
      type: 'filter',
      label: `Filter: ${cat}`,
      action: () => onToggleFilter(cat),
      icon: CATEGORY_ICONS[cat] || '📁',
      isActive: activeFilters.includes(cat)
    }));

    // Add favorites filter
    categoryFilters.push({
      id: 'cat-Favorites',
      type: 'filter',
      label: 'Filter: Favorites',
      action: () => onToggleFilter('Favorites'),
      icon: '💖',
      isActive: activeFilters.includes('Favorites')
    });

    const projectItems = projects.map(p => ({
      id: `proj-${p.id}`,
      type: 'project',
      label: p.title,
      description: p.description,
      action: () => onProjectSelect(p),
      icon: p.icon || '🚀',
      project: p
    }));

    return [...projectItems, ...categoryFilters, ...protocols];
  }, [projects, activeFilters, onToggleFilter, onProjectSelect, onChangeTheme, isCrtEnabled, onToggleCrt, isMatrixMode, onToggleMatrixMode, isSoundEnabled, onToggleSound, isLockdown, onToggleLockdown, onChangeDisplayMode]);

  // Filter commands based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) {
       // Default view: show a few protocols, filters, and featured projects
       return [
          ...commands.filter(c => c.type === 'protocol').slice(0, 3),
          ...commands.filter(c => c.type === 'filter').slice(0, 4),
          ...commands.filter(c => c.type === 'project').slice(0, 5)
       ];
    }

    const q = query.toLowerCase();
    return commands.filter(item => {
      // Check title/label
      if (item.label.toLowerCase().includes(q)) return true;
      // Check project description
      if (item.type === 'project' && item.description?.toLowerCase().includes(q)) return true;
      // Check project tags
      if (item.type === 'project' && item.project.tags?.some(t => t.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [query, commands]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleExecute = (item) => {
    soundSystem.playClick();
    item.action();
    if (item.type !== 'filter') {
       handleClose();
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        soundSystem.playKeystroke();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
        soundSystem.playKeystroke();
      } else if (e.key === 'Enter' && filteredItems.length > 0) {
        e.preventDefault();
        handleExecute(filteredItems[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filteredItems, selectedIndex]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
      setQuery('');
      soundSystem.playSelect();
    }
  }, [isOpen]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (isOpen && listRef.current && filteredItems.length > 0) {
      const selectedEl = listRef.current.children[selectedIndex];
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex, isOpen, filteredItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-fade-in pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Palette Container */}
      <div
        className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-accent-500/30 rounded-2xl shadow-[0_20px_60px_rgba(var(--rgb-accent-400),0.15),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden relative pointer-events-auto flex flex-col transform transition-all animate-slide-in-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(var(--rgb-accent-400),0.1),transparent_50%)]"></div>
        <div className="scanline opacity-20"></div>

        {/* Input Area */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 relative z-10">
          <svg className="w-5 h-5 text-accent-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder-gray-500 font-mono"
            placeholder="Search projects, filters, or type a command..."
            value={query}
            onChange={e => {
                setQuery(e.target.value);
                soundSystem.playTyping();
            }}
            spellCheck="false"
            autoComplete="off"
          />
          <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400 border border-white/10">ESC</div>
        </div>

        {/* Results Area */}
        <div
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto p-2 scrollbar-hide relative z-10"
        >
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500 font-mono text-sm flex flex-col items-center gap-2">
               <svg className="w-8 h-8 opacity-50 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               NO_MATCHING_RECORDS_FOUND
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 group ${
                    isSelected
                      ? 'bg-accent-500/20 border border-accent-500/30 shadow-[inset_0_0_15px_rgba(var(--rgb-accent-400),0.1)]'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => handleExecute(item)}
                  onMouseEnter={() => {
                      setSelectedIndex(index);
                      soundSystem.playHover();
                  }}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center text-lg shrink-0 ${
                      item.type === 'protocol' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      item.type === 'filter' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                      'bg-white/5 text-white/80 border border-white/10 group-hover:scale-110 transition-transform'
                  }`}>
                    {item.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${isSelected ? 'text-accent-300' : 'text-gray-200'}`}>
                          {item.label}
                        </span>
                        {item.type === 'filter' && item.isActive && (
                           <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]"></span>
                        )}
                        {item.type === 'protocol' && (
                           <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400/70 border border-purple-500/30 rounded px-1 ml-auto">CMD</span>
                        )}
                    </div>
                    {item.description && (
                      <p className={`text-xs truncate ${isSelected ? 'text-accent-200/70' : 'text-gray-500'}`}>
                        {item.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <div className="shrink-0 text-accent-400 mr-1 animate-pulse">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-white/10 bg-black/20 flex justify-between items-center text-xs font-mono text-gray-500 z-10 relative">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↑</span><span className="bg-white/10 px-1 rounded">↓</span> Navigate</span>
                <span className="flex items-center gap-1"><span className="bg-white/10 px-1 rounded">↵</span> Select</span>
            </div>
            <div className="text-accent-500/50">OMNI_LINK_PROTOCOL</div>
        </div>
      </div>
    </div>
  );
};

export default OmniPalette;
