import React, { useEffect, useState, useCallback } from 'react';
import CustomCursor from './CustomCursor';
import projectData from './projectData';
import soundSystem from './SoundSystem';
import { TAG_TO_CATEGORIES } from './constants';
import AppProviders from './context/AppProviders';
import BootScreen from './components/BootScreen';
import CommandHeader from './components/CommandHeader';
import BackgroundElements from './components/BackgroundElements';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ProjectQuickView from './components/ProjectQuickView';
import TerminalBar from './components/TerminalBar';
import ContextMenu from './components/ContextMenu';
import SystemOverlays from './components/SystemOverlays';
import useBootSequence from './hooks/useBootSequence';
import useAppFeatures from './hooks/useAppFeatures';
import usePersistedState from './hooks/usePersistedState';
import useUrlSyncedFilters from './hooks/useUrlSyncedFilters';
import useLayoutGlitchTransition from './hooks/useLayoutGlitchTransition';
import useIdleProtocol from './hooks/useIdleProtocol';
import useToasts from './hooks/useToasts';
import useFavorites from './hooks/useFavorites';
import useQuickViewModal from './hooks/useQuickViewModal';
import useContextMenu from './hooks/useContextMenu';
import usePagination from './hooks/usePagination';
import useAppProviderValues from './hooks/useAppProviderValues';
import { useScroll, useVelocity, useSpring } from 'framer-motion';
import './App.css';

const boolFromStorage = (v) => v === 'true';

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
  return { ...project, tagSet, categorySet };
});

function App() {
  const {
    addActivityLog,
    bootLogs,
    bootStep,
    clickEffects,
    isBooting,
    isDataMode,
    isSoundEnabled,
    scanProgress,
    setIsDataMode,
    setIsSoundEnabled,
    showBootScreen,
    startScan,
    stopScan,
    userActivityLogs
  } = useBootSequence();

  const { toasts, addToast, removeToast } = useToasts();

  // Persisted UI settings
  const [soundEnabled, setSoundEnabled] = usePersistedState('curator_sound', false, { fromStorage: boolFromStorage });
  const [isCrtEnabled, setIsCrtEnabled] = usePersistedState('curator_crt', false, { fromStorage: boolFromStorage });
  const [isMatrixMode, setIsMatrixMode] = usePersistedState('curator_matrix', false, { fromStorage: boolFromStorage });
  const [theme, setTheme] = usePersistedState('curator_theme', 'cyan');

  // Framer Motion Scroll Velocity
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, { damping: 50, stiffness: 400 });

  useEffect(() => {
    return smoothVelocity.on('change', (latest) => {
      document.documentElement.style.setProperty('--scroll-velocity', latest);
    });
  }, [smoothVelocity]);

  useEffect(() => {
    if (soundEnabled) {
      soundSystem.enable();
      soundSystem.startAmbience();
    } else {
      soundSystem.stopAmbience();
      soundSystem.disable();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (theme === 'cyan') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    addActivityLog(`SYS_THEME_UPDATED: [${theme.toUpperCase()}]`);
  }, [theme, addActivityLog]);

  const [hoveredTag, setHoveredTag] = useState(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const {
    activeFilters, setActiveFilters,
    searchQuery, setSearchQuery,
    sortOption, setSortOption,
    displayMode, setDisplayMode
  } = useUrlSyncedFilters();

  const [isGodMode, setIsGodMode] = useState(false);
  useEffect(() => {
    document.body.classList.toggle('god-mode', isGodMode);
  }, [isGodMode]);

  const isGlitching = useLayoutGlitchTransition(displayMode);

  const handleDisplayModeChange = useCallback((newMode) => {
    setDisplayMode(prevMode => {
      if (newMode === prevMode) return prevMode;
      addActivityLog(`SYS.UI: LAYOUT_UPDATED_${newMode.toUpperCase()}`);
      return newMode;
    });
  }, [addActivityLog, setDisplayMode]);

  const [randomSeed, setRandomSeed] = useState(() => Math.random());
  const { contextMenu, setContextMenu, handleContextMenu, closeContextMenu } = useContextMenu();
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  const isIdle = useIdleProtocol({ timeoutMs: 60000, isBooting });

  const {
    selectedProject, setSelectedProject, selectedProjectRef, modalRef,
    modalImageLoaded, setModalImageLoaded, handleProjectSelect, closeProjectModal
  } = useQuickViewModal({ isLockdown, addToast, addActivityLog, setIsWarping });

  const {
    favorites, toggleFavorite, draggedFavoriteId, dragOverFavoriteId,
    handleDragStart, handleDragOver, handleDragEnd, handleDrop
  } = useFavorites({ isLockdown, addToast, addActivityLog });

  const changeTheme = useCallback((newTheme) => {
    setTheme(prevTheme => {
      if (prevTheme === newTheme) return prevTheme;
      addToast(`> SYS_UPDATE: COLOR_PROTOCOL_${newTheme.toUpperCase()}`, 'info');
      return newTheme;
    });
  }, [addToast, setTheme]);

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

  const { currentPage, setCurrentPage, itemsPerPage, focusedCardIndex, setFocusedCardIndex } = usePagination({
    displayMode, activeFilters, searchQuery, sortOption
  });

  const {
    activeCategories, activeFiltersSet, counts, favoriteCount, filteredProjects, handlePageChange, handleTagClick,
    paginatedProjects, projectsMatchingQuery, suggestedTags, toggleFilter, totalPages,
    handleTerminalKeyDown, handleTerminalSubmit, isTerminalClosing, isTerminalOpen, isHoloTerminalOpen,
    setIsTerminalClosing, setIsTerminalOpen, setIsHoloTerminalOpen, setTerminalInput, terminalEndRef,
    terminalHistory, terminalInput, terminalInputRef, searchInputRef,
    baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef
  } = useAppFeatures({
    activeFilters, addActivityLog, changeTheme, contextMenu, currentPage, enhancedProjects, favorites,
    handleDisplayModeChange, handleProjectSelect, isDataMode, isGodMode, isOmniOpen, itemsPerPage, randomSeed,
    searchQuery, selectedProjectRef, setActiveFilters, setContextMenu, setCurrentPage, setDisplayMode,
    setIsCrtEnabled, setIsDataMode, setIsGodMode, setIsLockdown, setIsMatrixMode, setIsOmniOpen, setRandomSeed,
    setSearchQuery, setSelectedProject, setSortOption, setSoundEnabled, closeProjectModal, sortOption, toggleFavorite
  });

  const { settingsValue, browserValue, terminalValue, overlayValue, effectsValue, activityValue } = useAppProviderValues({
    changeTheme, displayMode, handleDisplayModeChange, isCrtEnabled, isGlitching, isGodMode, isMatrixMode,
    isSoundEnabled, setDisplayMode, setIsCrtEnabled, setIsMatrixMode, setIsSoundEnabled, setSoundEnabled,
    soundEnabled, theme,
    activeCategories, activeFilters, activeFiltersSet, counts, currentPage, draggedFavoriteId, dragOverFavoriteId,
    favoriteCount, favorites, filteredProjects, focusedCardIndex, handleCopyLink, handleDragEnd, handleDragOver,
    handleDragStart, handleDrop, handlePageChange, handleTagClick, hoveredTag, isMobileFiltersOpen, paginatedProjects,
    projectsMatchingQuery, randomSeed, searchInputRef, searchQuery, setActiveFilters, setCurrentPage,
    setFocusedCardIndex, setHoveredTag, setIsMobileFiltersOpen, setRandomSeed, setSearchQuery, setSortOption,
    sortOption, suggestedTags, toggleFavorite, toggleFilter, totalPages, totalProjects: enhancedProjects.length,
    handleTerminalKeyDown, handleTerminalSubmit, isHoloTerminalOpen, isTerminalClosing, isTerminalOpen,
    setIsHoloTerminalOpen, setIsTerminalClosing, setIsTerminalOpen, setTerminalInput, terminalEndRef,
    terminalHistory, terminalInput, terminalInputRef,
    addToast, clickEffects, closeContextMenu, closeProjectModal, contextMenu, handleContextMenu, handleProjectSelect,
    isDataMode, isIdle, isLockdown, isOmniOpen, isWarping, modalImageLoaded, modalRef, removeToast, selectedProject,
    setIsDataMode, setIsLockdown, setIsOmniOpen, setModalImageLoaded, setSelectedProject, toasts,
    baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef,
    addActivityLog, bootLogs, bootStep, isBooting, scanProgress, showBootScreen, startScan, stopScan, userActivityLogs
  });

  return (
    <AppProviders
      settings={settingsValue}
      browser={browserValue}
      terminal={terminalValue}
      overlay={overlayValue}
      effects={effectsValue}
      activity={activityValue}
    >
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
        <div className="film-grain" aria-hidden="true"></div>

        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
          <header className="text-center mb-12 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-75"></div>
              <img
                src="./title.png"
                alt="Web apps from 1ink.us"
                className="relative max-w-lg md:max-w-2xl h-auto max-h-48 md:max-h-64 object-contain animate-fade-in animate-float drop-shadow-2xl filter"
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
        <ContextMenu />
        <SystemOverlays />
      </div>
    </AppProviders>
  );
}

export default App;
