import React, { useState, useEffect, useRef, useMemo } from 'react';
import soundSystem from '../lib/SoundSystem';
import { CATEGORY_THEMES } from '../data/constants';
import { useTerminalContext } from '../app/context/TerminalContext';
import useFocusTrap from '../hooks/useFocusTrap';

const OmniPalette = ({
  isOpen,
  onClose,
  projects,
  onProjectSelect,
}) => {
  const { omniProtocolItems = [] } = useTerminalContext() || {};
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen);

  const commands = useMemo(() => {
    const projectItems = projects.map((p) => ({
      id: `proj-${p.id}`,
      type: 'project',
      label: p.title,
      description: p.description,
      action: () => onProjectSelect(p),
      icon: p.icon || '🚀',
      project: p,
      keywords: [p.title, ...(p.tags ?? []), ...(p.tech ?? [])],
    }));

    return [...projectItems, ...omniProtocolItems];
  }, [projects, onProjectSelect, omniProtocolItems]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) {
      return [
        ...commands.filter((c) => c.type === 'protocol').slice(0, 3),
        ...commands.filter((c) => c.type === 'filter').slice(0, 4),
        ...commands.filter((c) => c.type === 'project').slice(0, 5),
      ];
    }

    const q = query.toLowerCase();
    return commands.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (item.keywords?.some((kw) => kw.toLowerCase().includes(q))) return true;
      if (item.type === 'project' && item.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [query, commands]);

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

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
        soundSystem.playKeystroke();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 50);
      setQuery('');
      soundSystem.playSelect();
    }
  }, [isOpen]);

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
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 animate-fade-in pointer-events-none omni-palette">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="omni-palette-title"
        className="w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl border border-accent-500/30 rounded-2xl shadow-[0_20px_60px_rgba(var(--rgb-accent-400),0.15),0_0_0_1px_rgba(255,255,255,0.05)] overflow-hidden relative pointer-events-auto flex flex-col transform transition-all animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="omni-palette-title" className="sr-only">Omni command palette</h2>
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(var(--rgb-accent-400),0.1),transparent_50%)]" />
        <div className="scanline opacity-20" />

        <div className="p-4 border-b border-white/10 flex items-center gap-3 relative z-10">
          <svg className="w-5 h-5 text-accent-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-white text-lg focus:outline-none placeholder-gray-400 font-mono"
            placeholder="Search projects, tags, tech, filters, or type a command..."
            value={query}
            aria-label="Search commands and projects"
            onChange={(e) => {
              setQuery(e.target.value);
              soundSystem.playTyping();
            }}
            spellCheck="false"
            autoComplete="off"
          />
          <div className="text-xs font-mono bg-white/10 px-2 py-1 rounded text-gray-400 border border-white/10">ESC</div>
        </div>

        <div
          ref={listRef}
          role="listbox"
          aria-label="Command results"
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
              const filterTheme = item.type === 'filter'
                ? CATEGORY_THEMES[item.label.replace('Filter: ', '')]
                : null;

              return (
                <div
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={isSelected ? 0 : -1}
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
                    item.type === 'filter' ? `${filterTheme?.bgClass ?? 'bg-cyan-500/20'} ${filterTheme?.textClass ?? 'text-cyan-400'} border border-cyan-500/30` :
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
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]" />
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
