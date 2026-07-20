import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { trackDisplayMode } from '../lib/trackEvent';
import CustomCursor from '../effects/CustomCursor';
import projectData from '../data/projectData';
import useAudioSettings from '../hooks/useAudioSettings';
import soundSystem from '../lib/SoundSystem';
import { TAG_TO_CATEGORIES } from '../data/constants';
import AppProviders from './context/AppProviders';
import BootScreen from '../components/BootScreen';
import CommandHeader from '../components/CommandHeader';
import BackgroundElements from '../components/BackgroundElements';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import ProjectQuickView from '../components/ProjectQuickView';
import TerminalBar from '../components/TerminalBar';
const HoloTerminal = lazy(() => import('../components/HoloTerminal/HoloTerminal'));
import { BrandImage } from '../components/ProjectImage';
import ContextMenu from '../components/ContextMenu';
import SystemOverlays from '../components/SystemOverlays';
import useBootSequence from '../hooks/useBootSequence';
import useTerminalController from '../hooks/useTerminalController';
import useGlobalShortcuts from '../hooks/useGlobalShortcuts';
import useBackgroundEffects from '../hooks/useBackgroundEffects';
import useProjectBrowser from '../hooks/useProjectBrowser';
import useScrollVelocity from '../hooks/useScrollVelocity';
import usePerformanceMode from '../hooks/usePerformanceMode';
import useFavorites from '../hooks/useFavorites';
import useUrlSyncedFilters from '../hooks/useUrlSyncedFilters';
import useLoadoutShare from '../hooks/useLoadoutShare';
import { loadoutsStub } from '../lib/loadoutsStub.js';
import './App.css';

const LoadoutsBootstrap = lazy(() => import('../components/LoadoutsBootstrap.jsx'));

// Pre-process project data to add Sets for O(1) lookups during filtering
// This is done at the module level as projectData is static, avoiding redundant
// computations and memory allocations on every re-render or re-mount.
const enhancedProjects = projectData.map(project => {
  const tagSet = new Set(project.tags || []);
  const categorySet = new Set();
  (project.tags || []).forEach(tag => {
    const categories = TAG_TO_CATEGORIES[tag];
    if (categories) {
      categories.forEach(cat => categorySet.add(cat));
    }
  });
  return {
    ...project,
    tagSet,
    categorySet
  };
});

function App() {

  const { isSoundEnabled, setIsSoundEnabled } = useAudioSettings();

  const {
    addActivityLog,
    bootLogs,
    bootStep,
    clickEffects,
    isBooting,
    isDataMode,
    scanProgress,
    setIsDataMode,
    showBootScreen,
    startScan,
    stopScan,
    userActivityLogs
  } = useBootSequence({ isSoundEnabled });

  const {
    performanceMode,
    setPerformanceMode,
    effectiveMode,
    flags,
    prefersReducedMotion,
  } = usePerformanceMode();

  useScrollVelocity(flags.scrollVelocity);

  // CRT Global Effect State
  const [isCrtEnabled, setIsCrtEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_crt') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_crt', isCrtEnabled);
    }
  }, [isCrtEnabled]);

  // Matrix Mode Global Effect State
  const [isMatrixMode, setIsMatrixMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_matrix') === 'true';
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_matrix', isMatrixMode);
    }
  }, [isMatrixMode]);

  // Theme State
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curator_theme') || 'cyan';
    }
    return 'cyan';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_theme', theme);
      if (theme === 'cyan') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    }
    addActivityLog(`SYS_THEME_UPDATED: [${theme.toUpperCase()}]`);
  }, [theme, addActivityLog]);

  // Tag Constellation Hover State
  const [hoveredTag, setHoveredTag] = useState(null);

  // Mobile Filter Drawer State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const {
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    displayMode,
    setDisplayMode,
  } = useUrlSyncedFilters();

  // Glitch transition state
  const [isGlitching, setIsGlitching] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const glitchTimeoutRef = useRef(null);

  useEffect(() => {
    if (isGodMode) {
      document.body.classList.add('god-mode');
    } else {
      document.body.classList.remove('god-mode');
    }
  }, [isGodMode]);

  // Track previous mode for glitch transition when changed via shortcuts
  const prevDisplayModeRef = useRef(displayMode);

  useEffect(() => {
    if (displayMode !== prevDisplayModeRef.current) {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);

      setTimeout(() => setIsGlitching(true), 0);
      soundSystem.playSelect();

      glitchTimeoutRef.current = setTimeout(() => {
        setIsGlitching(false);
      }, 400);

      prevDisplayModeRef.current = displayMode;
    }
  }, [displayMode]);

  const handleDisplayModeChange = useCallback((newMode) => {
    setDisplayMode(prevMode => {
      if (newMode === prevMode) return prevMode;
      addActivityLog(`SYS.UI: LAYOUT_UPDATED_${newMode.toUpperCase()}`);
      trackDisplayMode(newMode);
      return newMode;
    });
  }, [addActivityLog, setDisplayMode]);

  const [randomSeed, setRandomSeed] = useState(() => Math.random());

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Omni Command Palette State
  const [isOmniOpen, setIsOmniOpen] = useState(false);

  // Keyboard Shortcut Cheatsheet State
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);

  // Quick View Modal State
  const [selectedProject, setSelectedProject] = useState(null);
  const selectedProjectRef = useRef(null);
  const modalRef = useRef(null);
  const [modalImageLoaded, setModalImageLoaded] = useState(false);

  // System Lockdown Protocol State
  const [isLockdown, setIsLockdown] = useState(false);

  // System Idle Protocol State
  const [isIdle, setIsIdle] = useState(false);
  const lastActivityRef = useRef(0);

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);

    if (type === 'error') {
      soundSystem.playError();
    } else if (type === 'success') {
      soundSystem.playSuccess();
    } else {
      soundSystem.playClick();
    }
  }, []);

  // System Idle Protocol Logic
  useEffect(() => {
    lastActivityRef.current = Date.now();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      setIsIdle(prevIdle => {
        if (prevIdle) {
          soundSystem.playTone(600, 'sine', 0.05); // Play a subtle sound when waking up
        }
        return false;
      });
    };

    // Attach to window
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    const idleCheckInterval = setInterval(() => {
      const currentTime = Date.now();
      // 60 seconds (60000ms) of inactivity triggers idle mode
      if (currentTime - lastActivityRef.current > 60000 && !isBooting) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(idleCheckInterval);
    };
  }, [isBooting]);

  // Warp Speed State
  const [isWarping, setIsWarping] = useState(false);

  // Open the Project Quick View modal
  const handleProjectSelect = useCallback((project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast("> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN", "error");
      return;
    }
    soundSystem.playClick();
    addActivityLog(`VIEWING PROTOCOL: [${project.title.toUpperCase()}]`);

    const openModal = () => {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          flushSync(() => setSelectedProject(project));
        });
      } else {
        setSelectedProject(project);
      }
    };

    if (flags.warpTransition) {
      setIsWarping(true);
      soundSystem.playWarp();

      setTimeout(() => {
        if (document.startViewTransition) {
          document.startViewTransition(() => {
            flushSync(() => {
              setSelectedProject(project);
              setIsWarping(false);
            });
          });
        } else {
          setSelectedProject(project);
          setIsWarping(false);
        }
      }, 600);
    } else {
      openModal();
    }
  }, [isLockdown, addToast, addActivityLog, flags.warpTransition]);

  // Close the Project Quick View modal
  const closeProjectModal = useCallback(() => {
    if (flags.warpTransition) {
      soundSystem.playExitWarp();
    }
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setSelectedProject(null));
      });
    } else {
      setSelectedProject(null);
    }
  }, [flags.warpTransition]);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;

    // Body Scroll Lock for Modal
    if (selectedProject) {
      document.body.style.overflow = 'hidden';

      // Focus Trap for Accessibility
      const handleTab = (e) => {
        if (e.key === 'Tab' && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement || document.activeElement === document.body) {
                lastElement.focus();
                e.preventDefault();
              }
            } else {
              if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
              }
            }
          }
        }
      };

      window.addEventListener('keydown', handleTab);

      // Set initial focus
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          if (focusableElements.length > 0) {
            focusableElements[0].focus();
          }
        }
      }, 100);

      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleTab);
      };
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedProject]);

  const {
    favorites,
    replaceFavorites,
    toggleFavorite,
    draggedFavoriteId,
    dragOverFavoriteId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
  } = useFavorites({ isLockdown, addToast, addActivityLog });

  const changeTheme = useCallback((newTheme) => {
    setTheme(prevTheme => {
      if (prevTheme === newTheme) return prevTheme;
      addToast(`> SYS_UPDATE: COLOR_PROTOCOL_${newTheme.toUpperCase()}`, 'info');
      return newTheme;
    });
  }, [addToast]);

  const handleCopyLink = useCallback((project) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(project.url).then(() => {
        addToast(`> SYS_CMD: [${project.title.toUpperCase()}] LINK_COPIED`, 'copy');
      }).catch(() => {
        addToast(`> SYS_ERR: LINK_COPY_FAILED`, 'error');
      });
    } else {
      addToast(`> SYS_ERR: CLIPBOARD_NOT_SUPPORTED`, 'error');
    }
  }, [addToast]);

  // Context Menu Handlers
  const handleContextMenu = useCallback((e, project) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      project
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    if (!contextMenu) return;

    // Close context menu on any outside click or scroll
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu);
    };
  }, [contextMenu, closeContextMenu]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = displayMode === 'map' || displayMode === 'constellation' ? 100 : displayMode === 'matrix' ? 10 : displayMode === 'list' ? 8 : 6;

  // Keyboard Navigation state for cards
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  // Reset focus when changing pages, filters, etc.
  useEffect(() => {
    setTimeout(() => setFocusedCardIndex(0), 0);
  }, [currentPage, activeFilters, searchQuery, sortOption]);

  const [loadoutsApi, setLoadoutsApi] = useState(loadoutsStub);

  useLoadoutShare({
    replaceFavorites,
    setActiveFilters,
    setCurrentPage,
    addToast,
    addActivityLog,
  });

  const {
    loadouts,
    activeLoadoutId,
    createLoadout,
    deleteLoadout,
    updateLoadoutFromFavorites,
    applyLoadout,
    exportLoadoutFile,
    importLoadoutJson,
    copyShareLink,
  } = loadoutsApi;

  const browser = useProjectBrowser({
    activeFilters,
    addActivityLog,
    currentPage,
    enhancedProjects,
    favorites,
    itemsPerPage,
    randomSeed,
    searchQuery,
    setActiveFilters,
    setCurrentPage,
    sortOption
  });

  const {
    activeCategories,
    activeFiltersSet,
    counts,
    favoriteCount,
    filteredProjects,
    handlePageChange,
    handleTagClick,
    paginatedProjects,
    projectsMatchingQuery,
    suggestedTags,
    toggleFilter,
    totalPages
  } = browser;

  const terminalController = useTerminalController({
    addActivityLog,
    activeFilters,
    changeTheme,
    favorites,
    handleDisplayModeChange,
    handleProjectSelect,
    projectsMatchingQuery,
    setCurrentPage,
    setIsCrtEnabled,
    setIsLockdown,
    setIsMatrixMode,
    setRandomSeed,
    setSortOption,
    setIsSoundEnabled,
    toggleFavorite,
    toggleFilter,
    replaceFavorites,
    setActiveFilters,
    setPerformanceMode,
    effectiveMode,
    performanceMode,
    isCrtEnabled,
    isLockdown,
    isMatrixMode,
    isSoundEnabled,
  });

  const {
    handleTerminalKeyDown,
    handleTerminalSubmit,
    isTerminalClosing,
    isHoloTerminalOpen,
    setIsHoloTerminalOpen,
    isTerminalOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setTerminalInput,
    terminalEndRef,
    terminalHistory,
    terminalInput,
    terminalInputRef,
    terminalSuggestion,
    omniProtocolItems,
  } = terminalController;

  const { searchInputRef } = useGlobalShortcuts({
    addActivityLog,
    contextMenu,
    isDataMode,
    isOmniOpen,
    isTerminalClosing,
    isHoloTerminalOpen,
    setIsHoloTerminalOpen,
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
  });

  const { baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef } = useBackgroundEffects(flags);

  const totalProjects = enhancedProjects.length;

  // Context is split by update frequency so a change in one domain (e.g. a
  // search keystroke) can't force components subscribed only to another
  // domain (e.g. the starfield background) to re-render. See src/context/
  // and AGENTS.md for the domain map.
  const settingsValue = useMemo(() => ({
    changeTheme,
    displayMode,
    handleDisplayModeChange,
    isCrtEnabled,
    isGlitching,
    isGodMode,
    isMatrixMode,
    isSoundEnabled,
    setDisplayMode,
    setIsCrtEnabled,
    setIsMatrixMode,
    setIsSoundEnabled,
    theme
  }), [changeTheme, displayMode, handleDisplayModeChange, isCrtEnabled, isGlitching, isGodMode, isMatrixMode, setDisplayMode, setIsCrtEnabled, setIsMatrixMode, setIsSoundEnabled, isSoundEnabled, theme]);

  const browserValue = useMemo(() => ({
    activeCategories,
    activeFilters,
    activeFiltersSet,
    counts,
    currentPage,
    draggedFavoriteId,
    dragOverFavoriteId,
    favoriteCount,
    favorites,
    filteredProjects,
    focusedCardIndex,
    handleCopyLink,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handlePageChange,
    handleTagClick,
    hoveredTag,
    isMobileFiltersOpen,
    paginatedProjects,
    projectsMatchingQuery,
    randomSeed,
    searchInputRef,
    searchQuery,
    setActiveFilters,
    setCurrentPage,
    setFocusedCardIndex,
    setHoveredTag,
    setIsMobileFiltersOpen,
    setRandomSeed,
    setSearchQuery,
    setSortOption,
    sortOption,
    suggestedTags,
    toggleFavorite,
    toggleFilter,
    totalPages,
    totalProjects,
    loadouts,
    activeLoadoutId,
    createLoadout,
    deleteLoadout,
    updateLoadoutFromFavorites,
    applyLoadout,
    exportLoadoutFile,
    importLoadoutJson,
    copyShareLink,
  }), [activeCategories, activeFilters, activeFiltersSet, counts, currentPage, draggedFavoriteId, dragOverFavoriteId, favoriteCount, favorites, filteredProjects, focusedCardIndex, handleCopyLink, handleDragEnd, handleDragOver, handleDragStart, handleDrop, handlePageChange, handleTagClick, hoveredTag, isMobileFiltersOpen, paginatedProjects, projectsMatchingQuery, randomSeed, searchInputRef, searchQuery, setActiveFilters, setSearchQuery, setSortOption, suggestedTags, toggleFavorite, toggleFilter, totalPages, totalProjects, sortOption, loadouts, activeLoadoutId, createLoadout, deleteLoadout, updateLoadoutFromFavorites, applyLoadout, exportLoadoutFile, importLoadoutJson, copyShareLink]);

  const terminalValue = useMemo(() => ({
    handleTerminalKeyDown,
    handleTerminalSubmit,
    isHoloTerminalOpen,
    isTerminalClosing,
    isTerminalOpen,
    setIsHoloTerminalOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setTerminalInput,
    terminalEndRef,
    terminalHistory,
    terminalInput,
    terminalInputRef,
    terminalSuggestion,
    omniProtocolItems,
  }), [handleTerminalKeyDown, handleTerminalSubmit, isHoloTerminalOpen, isTerminalClosing, isTerminalOpen, omniProtocolItems, setIsHoloTerminalOpen, setIsTerminalClosing, setIsTerminalOpen, setTerminalInput, terminalEndRef, terminalHistory, terminalInput, terminalInputRef, terminalSuggestion]);

  const overlayValue = useMemo(() => ({
    addToast,
    clickEffects,
    closeContextMenu,
    closeProjectModal,
    contextMenu,
    handleContextMenu,
    handleProjectSelect,
    isDataMode,
    isIdle,
    isLockdown,
    isOmniOpen,
    isCheatsheetOpen,
    isWarping,
    modalImageLoaded,
    modalRef,
    removeToast,
    selectedProject,
    setIsDataMode,
    setIsLockdown,
    setIsOmniOpen,
    setIsCheatsheetOpen,
    setModalImageLoaded,
    setSelectedProject,
    toasts
  }), [addToast, clickEffects, closeContextMenu, closeProjectModal, contextMenu, handleContextMenu, handleProjectSelect, isDataMode, isIdle, isLockdown, isOmniOpen, isCheatsheetOpen, isWarping, modalImageLoaded, removeToast, selectedProject, setIsDataMode, toasts]);

  const effectsValue = useMemo(() => ({
    baseGridRef,
    canvasRef,
    deepGridRef,
    gridSpotlightRef,
    starfieldRef,
    performanceMode,
    setPerformanceMode,
    effectiveMode,
    flags,
    prefersReducedMotion,
  }), [baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef, performanceMode, setPerformanceMode, effectiveMode, flags, prefersReducedMotion]);

  const activityValue = useMemo(() => ({
    addActivityLog,
    bootLogs,
    bootStep,
    isBooting,
    scanProgress,
    showBootScreen,
    startScan,
    stopScan,
    userActivityLogs
  }), [addActivityLog, bootLogs, bootStep, isBooting, scanProgress, showBootScreen, startScan, stopScan, userActivityLogs]);

  return (
    <AppProviders
      settings={settingsValue}
      browser={browserValue}
      terminal={terminalValue}
      overlay={overlayValue}
      effects={effectsValue}
      activity={activityValue}
    >
      <Suspense fallback={null}>
        <LoadoutsBootstrap
          favorites={favorites}
          isLockdown={isLockdown}
          replaceFavorites={replaceFavorites}
          setActiveFilters={setActiveFilters}
          setCurrentPage={setCurrentPage}
          addToast={addToast}
          addActivityLog={addActivityLog}
          onReady={setLoadoutsApi}
        />
      </Suspense>
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-slate-950 relative overflow-hidden font-sans ${isCrtEnabled ? 'crt-flicker' : ''}`}>
        {isCrtEnabled && (
          <>
            <div className="crt-scanlines pointer-events-none fixed inset-0 z-[9999] mix-blend-overlay"></div>
            <div className="crt-vignette pointer-events-none fixed inset-0 z-[9998]"></div>
          </>
        )}
        <CustomCursor />
        <BootScreen />
        <CommandHeader />
        <BackgroundElements />
        {flags.filmGrain && <div className="film-grain" aria-hidden="true"></div>}

        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
          <header className="text-center mb-12 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-75"></div>
              <BrandImage
                brand="title"
                alt="Web apps from 1ink.us"
                loading="eager"
                fetchPriority="high"
                className="relative max-w-lg md:max-w-2xl h-auto max-h-48 md:max-h-64 object-contain animate-fade-in animate-float drop-shadow-2xl filter"
                pictureClassName="relative block"
              />
            </div>
          </header>

          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-12 animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
            <Sidebar />
            <MainContent />
          </div>
        </div>

        <ProjectQuickView />
        <TerminalBar />
        <Suspense fallback={null}>
          <HoloTerminal />
        </Suspense>
        <ContextMenu />
        <SystemOverlays />
      </div>
    </AppProviders>
  );
}

export default App;
