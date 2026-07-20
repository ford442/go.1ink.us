import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import soundSystem from '../lib/SoundSystem';

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
}) {
  const searchInputRef = useRef(null);


  const konamiIndexRef = useRef(0);

  // Global keybindings for shortcuts and modes
  useEffect(() => {
    const handleKeyDown = (e) => {
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
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setDisplayMode((prev) => {
            const nextMode = prev === 'grid' ? 'matrix' : prev === 'matrix' ? 'list' : prev === 'list' ? 'map' : prev === 'map' ? 'constellation' : 'grid';
            addActivityLog(`SYS.UI: LAYOUT_UPDATED_${nextMode.toUpperCase()}`);
            return nextMode;
          });
        }
      }

      // Focus Search on '/'
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        soundSystem.playKeystroke();
        searchInputRef.current?.focus();
        return;
      }

      // Focus OmniPalette on 'Cmd+K' / 'Ctrl+K'
      if (((e.metaKey || e.ctrlKey) && e.key === 'k') && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOmniOpen(prev => {
          if (!prev) soundSystem.playSuccess();
          return !prev;
        });
        return;
      }

      // Toggle Shortcut Cheatsheet
      if (e.key === '?' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
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
          if (searchInputRef.current.value) {
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

        const cardLinks = Array.from(document.querySelectorAll('.card-link'));
        const activeIndex = cardLinks.indexOf(document.activeElement);

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

    const handleKeyUp = (e) => {
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
