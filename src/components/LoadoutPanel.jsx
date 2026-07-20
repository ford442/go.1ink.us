import { useRef, useState } from 'react';
import soundSystem from '../lib/SoundSystem';
import { useBrowserContext } from '../app/context/BrowserContext';

export default function LoadoutPanel() {
  const {
    loadouts,
    activeLoadoutId,
    createLoadout,
    applyLoadout,
    deleteLoadout,
    exportLoadoutFile,
    importLoadoutJson,
    copyShareLink,
    favorites,
  } = useBrowserContext();

  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef(null);

  const handleSave = () => {
    if (!newName.trim()) return;
    soundSystem.playClick();
    createLoadout(newName);
    setNewName('');
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importLoadoutJson(reader.result, { merge: true });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="hidden lg:block mt-4">
      <button
        type="button"
        onClick={() => {
          soundSystem.playClick();
          setIsOpen((v) => !v);
        }}
        className="w-full text-left text-accent-500/70 text-[10px] font-mono tracking-widest uppercase mb-3 border-b border-accent-500/20 pb-1 flex items-center justify-between gap-2 group"
      >
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
          Operator Loadouts
        </span>
        <span className="text-gray-500 group-hover:text-white transition-colors">{isOpen ? '−' : '+'}</span>
      </button>

      {isOpen && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Save favorites as…"
              className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-md px-2 py-1.5 text-[11px] font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-500/50"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!newName.trim() || favorites.length === 0}
              className="shrink-0 px-2 py-1.5 text-[10px] font-mono uppercase bg-accent-500/20 text-accent-300 border border-accent-500/40 rounded-md hover:bg-accent-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-2 py-1.5 text-[10px] font-mono uppercase bg-white/5 text-gray-400 border border-white/10 rounded-md hover:bg-white/10 hover:text-white transition-colors"
            >
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          {loadouts.length === 0 ? (
            <p className="text-[10px] font-mono text-gray-600 px-1">No saved loadouts.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {loadouts.map((loadout) => {
                const isActive = loadout.id === activeLoadoutId;
                return (
                  <li
                    key={loadout.id}
                    className={`rounded-md border px-2 py-2 ${
                      isActive
                        ? 'border-accent-500/50 bg-accent-500/10'
                        : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-white truncate" title={loadout.name}>
                        {isActive && <span className="text-accent-400 mr-1">●</span>}
                        {loadout.name}
                      </span>
                      <span className="text-[9px] font-mono text-gray-500 shrink-0">{loadout.ids.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => { soundSystem.playClick(); applyLoadout(loadout.id); }}
                        className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-accent-500/20 text-accent-300 border border-accent-500/30 rounded hover:bg-accent-500/30 transition-colors"
                      >
                        Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => { soundSystem.playClick(); copyShareLink(loadout.id); }}
                        className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-white/5 text-gray-400 border border-white/10 rounded hover:text-white transition-colors"
                      >
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => { soundSystem.playClick(); exportLoadoutFile(loadout.id); }}
                        className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-white/5 text-gray-400 border border-white/10 rounded hover:text-white transition-colors"
                      >
                        Export
                      </button>
                      <button
                        type="button"
                        onClick={() => { soundSystem.playClick(); deleteLoadout(loadout.id); }}
                        className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-red-500/10 text-red-400/80 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
