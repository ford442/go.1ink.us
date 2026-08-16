import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import soundSystem from '../lib/SoundSystem';
import type { ContextMenuState } from './useContextMenu';
import type { DisplayMode, Project, SortOption } from '../types';

export interface UseGlobalShortcutsParams {
  addActivityLog: (text: string) => void;
  contextMenu: ContextMenuState | null;
  isDataMode: boolean;
  isOmniOpen: boolean;
  isTerminalOpen: boolean;
  isGodMode: boolean;
  setIsGodMode: Dispatch<SetStateAction<boolean>>;
  isCheatsheetOpen: boolean;
  setIsCheatsheetOpen: Dispatch<SetStateAction<boolean>>;
  selectedProjectRef: RefObject<Project | null>;
  setActiveFilters: Dispatch<SetStateAction<string[]>>;
  setContextMenu: Dispatch<SetStateAction<ContextMenuState | null>>;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  setDisplayMode: Dispatch<SetStateAction<DisplayMode>>;
  setIsDataMode: Dispatch<SetStateAction<boolean>>;
  setIsOmniOpen: Dispatch<SetStateAction<boolean>>;
  setIsTerminalClosing: Dispatch<SetStateAction<boolean>>;
  setIsTerminalOpen: Dispatch<SetStateAction<boolean>>;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedProject: Dispatch<SetStateAction<Project | null>>;
  closeProjectModal?: () => void;
  setSortOption: Dispatch<SetStateAction<SortOption>>;
}

const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export default function useGlobalShortcuts({
  addActivityLog,
  contextMenu,
  isDataMode,
  isOmniOpen,
  isTerminalOpen,
  isGodMode,
  setIsGodMode,
  isCheatsheetOpen,
  setIsCheatsheetOpen,
  selectedProjectRef,
  setActiveFilters,
  setContextMenu,
  setCurrentPage,
  setDisplayMode,
  setIsDataMode,
  setIsOmniOpen,
  setIsTerminalClosing,
  setIsTerminalOpen,
  setSearchQuery,
  setSelectedProject,
  closeProjectModal,
  setSortOption
}: UseGlobalShortcutsParams) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);


  const konamiIndexRef = useRef(0);

  // Global keybindings for shortcuts and modes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTextEntry = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      // Konami Code logic
      if (e.key === konamiCode[konamiIndexRef.current]) {
        konamiIndexRef.current++;
        if (konamiIndexRef.current === konamiCode.length) {
          setIsGodMode(prev => {
            const nextState = !prev;
            if (nextState) {
              soundSystem.playEpicUnlock();
              addActivityLog('SYS_OVERRIDE: GOD_MODE_ACTIVATED');
            } else {
              soundSystem.playAlert();
              addActivityLog('SYS_OVERRIDE: GOD_MODE_DEACTIVATED');
            }
            return nextState;
          });
          konamiIndexRef.current = 0;
        }
      } else {
        konamiIndexRef.current = 0;
      }

      // Toggle Data Decryption Mode on Alt down
      if (e.key === 'Alt' && !isDataMode) {
        setIsDataMode(true);
        addActivityLog(`PROTOCOL OVERRIDE: DATA_MODE_ACTIVE`);
      }

      // Quick Layout Toggle (L)
      if (e.key === 'l' || e.key === 'L') {
        if (!isTextEntry) {
          e.preventDefault();
          setDisplayMode((prev) => {
            const nextMode = prev === 'dense' ? 'grid' : prev === 'grid' ? 'matrix' : prev === 'matrix' ? 'list' : prev === 'list' ? 'map' : prev === 'map' ? 'constellation' : 'dense';
            addActivityLog(`SYS.UI: LAYOUT_UPDATED_${nextMode.toUpperCase()}`);
            return nextMode;
          });
        }
      }

      // Focus Search on '/'
      if (e.key === '/' && !isTextEntry) {
        e.preventDefault();
        soundSystem.playKeystroke();
        searchInputRef.current?.focus();
        return;
      }

      // Focus OmniPalette on 'Cmd+K' / 'Ctrl+K'
      if (((e.metaKey || e.ctrlKey) && e.key === 'k') && !isTextEntry) {
        e.preventDefault();
        setIsOmniOpen(prev => {
          if (!prev) soundSystem.playSuccess();
          return !prev;
        });
        return;
      }

      // Toggle Shortcut Cheatsheet
      if (e.key === '?' && !isTextEntry) {
        e.preventDefault();
        setIsCheatsheetOpen(prev => {
          if (!prev) soundSystem.playSuccess();
          return !prev;
        });
        return;
      }

      // Global Terminal Toggle
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        if (isTerminalOpen) {
          setIsTerminalClosing(true);
          soundSystem.playClick();
          setTimeout(() => {
            setIsTerminalOpen(false);
            setIsTerminalClosing(false);
          }, 300); // Wait for animation
        } else {
          setIsTerminalOpen(true);
          soundSystem.playSuccess();
        }
        return;
      }

      // Global Escape Handler
      if (e.key === 'Escape') {
        if (contextMenu) {
          setContextMenu(null);
          return;
        }

        if (isOmniOpen) {
          setIsOmniOpen(false);
          return;
        }

        if (isCheatsheetOpen) {
          setIsCheatsheetOpen(false);
          return;
        }

        if (isTerminalOpen) {
          setIsTerminalClosing(true);
          setTimeout(() => {
            setIsTerminalOpen(false);
            setIsTerminalClosing(false);
          }, 300);
          return;
        }

        if (selectedProjectRef.current) {
          if (closeProjectModal) {
            closeProjectModal();
          } else {
            if (document.startViewTransition) {
              document.startViewTransition(() => {
                flushSync(() => setSelectedProject(null));
              });
            } else {
              setSelectedProject(null);
            }
          }
          return;
        }

        if (document.activeElement === searchInputRef.current) {
          // If in search input: Clear if text exists, otherwise Blur
          if (searchInputRef.current?.value) {
            setSearchQuery('');
            setCurrentPage(1);
          } else {
            searchInputRef.current?.blur();
          }
        } else {
          // If anywhere else: Reset everything
          if (document.startViewTransition) {
            document.startViewTransition(() => {
              flushSync(() => {
                setActiveFilters([]);
                setSearchQuery('');
                setSortOption('Featured');
                setCurrentPage(1);
              });
            });
          } else {
            setActiveFilters([]);
            setSearchQuery('');
            setSortOption('Featured');
            setCurrentPage(1);
          }
        }
      }

      // Card Navigation (Arrow Keys - Spatial Grid)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        // Prevent double-handling if focus originated from search input
        if (e.target === searchInputRef.current) return;

        const cardLinks = Array.from(document.querySelectorAll<HTMLElement>('.card-link'));
        const activeIndex = document.activeElement instanceof HTMLElement
          ? cardLinks.indexOf(document.activeElement)
          : -1;

        if (activeIndex !== -1) {
          e.preventDefault(); // Prevent page scroll

          // Determine current grid layout
          const getGridColumns = () => {
            if (window.matchMedia('(min-width: 1024px)').matches) return 3; // lg:grid-cols-3
            if (window.matchMedia('(min-width: 768px)').matches) return 2;  // md:grid-cols-2
            return 1; // grid-cols-1
          };

          const cols = getGridColumns();
          let nextIndex = activeIndex;

          if (e.key === 'ArrowRight') nextIndex = activeIndex + 1;
          if (e.key === 'ArrowLeft') nextIndex = activeIndex - 1;
          if (e.key === 'ArrowDown') nextIndex = activeIndex + cols;

          if (e.key === 'ArrowUp') {
            // If in the top row, move focus back to search input
            if (activeIndex < cols) {
              searchInputRef.current?.focus();
              searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return;
            }
            nextIndex = activeIndex - cols;
          }

          if (nextIndex >= 0 && nextIndex < cardLinks.length) {
            cardLinks[nextIndex].focus();
            cardLinks[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setIsDataMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    addActivityLog,
    contextMenu,
    isDataMode,
    isOmniOpen,
    isTerminalOpen,
    isGodMode,
    setIsGodMode,
    isCheatsheetOpen,
    setIsCheatsheetOpen,
    selectedProjectRef,
    setActiveFilters,
    setContextMenu,
    setCurrentPage,
    setDisplayMode,
    setIsDataMode,
    setIsOmniOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setSearchQuery,
    setSelectedProject,
    closeProjectModal,
    setSortOption
  ]);




  return { searchInputRef };
}
