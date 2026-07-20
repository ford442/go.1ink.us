import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useFocusTrap from '../hooks/useFocusTrap';

const ShortcutCheatsheet = ({ isOpen, onClose }) => {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, isOpen);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '?', description: 'Toggle this keyboard map' },
    { key: '/', description: 'Focus project search' },
    { key: 'Ctrl + K', description: 'Open Omni command palette' },
    { key: '`', description: 'Toggle terminal bar' },
    { key: 'L', description: 'Cycle layout (grid → matrix → list → map → constellation)' },
    { key: 'Alt (hold)', description: 'Data mode — raw JSON on cards' },
    { key: '↓ from search', description: 'Focus first project card' },
    { key: 'Arrow keys', description: 'Move between project cards' },
    { key: 'Enter', description: 'Open quick view for focused card' },
    { key: 'Esc', description: 'Close modal, palette, terminal, or cheatsheet' },
    { key: 'Konami code', description: 'Toggle God Mode (overclocked visuals)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-gray-900/95 border border-accent-500/50 shadow-[0_0_50px_rgba(var(--rgb-accent-400),0.3)] rounded-xl overflow-hidden backdrop-blur-xl"
          >
            <div className="p-4 border-b border-accent-500/30 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-400 animate-pulse shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.8)]" aria-hidden="true" />
                <h2 id="shortcuts-title" className="font-mono text-sm tracking-widest text-accent-300 uppercase font-bold">
                  Global Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-300 hover:text-white p-1 rounded-md transition-colors hover:bg-white/10"
                aria-label="Close keyboard shortcuts"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 bg-black/20">
              <div className="grid gap-2">
                {shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 hover:border-accent-500/30 transition-colors"
                  >
                    <span className="font-mono text-xs text-gray-200">{shortcut.description}</span>
                    <span className="font-mono text-xs font-bold text-accent-300 bg-accent-500/10 px-2 py-1 rounded border border-accent-500/20">
                      {shortcut.key}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-accent-500/30 bg-black/40 text-center">
              <span className="text-[10px] font-mono text-accent-400/80 uppercase tracking-widest">
                System Command Manual
              </span>
            </div>

            <div className="scanline opacity-10 pointer-events-none" aria-hidden="true" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShortcutCheatsheet;
