import React, { useState, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import CustomCursor from './CustomCursor';
import projectData from './projectData';
import soundSystem from './SoundSystem';
import { TAG_TO_CATEGORIES } from './constants';
import { AppContext } from './AppContext';
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
import useTerminalController from './hooks/useTerminalController';
import useGlobalShortcuts from './hooks/useGlobalShortcuts';
import useBackgroundEffects from './hooks/useBackgroundEffects';
import useProjectBrowser from './hooks/useProjectBrowser';
import { useScroll, useVelocity, useSpring } from 'framer-motion';
import './App.css';

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

  // Sound System State
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('curator_sound');
      if (stored !== null) {
        return stored === 'true';
      }
    }
    return false;
  });

  // Framer Motion Scroll Velocity
  const { scrollY } = useScroll();
  const rawVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(rawVelocity, {
    damping: 50,
    stiffness: 400
  });

  // Sync scroll velocity to a CSS custom property for global distortion effects
  useEffect(() => {
    return smoothVelocity.on('change', (latest) => {
      document.documentElement.style.setProperty('--scroll-velocity', latest);
    });
  }, [smoothVelocity]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_sound', soundEnabled);
      if (soundEnabled) {
        soundSystem.enable();
        soundSystem.startAmbience();
      } else {
        soundSystem.stopAmbience();
        soundSystem.disable();
      }
    }
  }, [soundEnabled]);

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


  // Command Center Header State
  const [systemStats, setSystemStats] = useState({
    uptime: 999990, // Random high start
    connections: 1337,
    memory: 42
  });

  // Animated Command Center Header Logic
  useEffect(() => {
    const slowTimer = setInterval(() => {
      setSystemStats(prev => {
        // Fluctuate connections slightly
        let newConnections = prev.connections + Math.floor(Math.random() * 5) - 2;
        if (newConnections < 1000) newConnections = 1000 + Math.floor(Math.random() * 50);

        // Fluctuate memory
        let newMemory = prev.memory + (Math.random() > 0.5 ? 1 : -1);
        if (newMemory < 20) newMemory = 20;
        if (newMemory > 80) newMemory = 80;

        return {
          ...prev,
          uptime: prev.uptime + 1,
          connections: newConnections,
          memory: newMemory
        };
      });
    }, 1000);

    return () => {
      clearInterval(slowTimer);
    };
  }, []);

  // Format uptime to HH:MM:SS
  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tag Constellation Hover State
  const [hoveredTag, setHoveredTag] = useState(null);

  // Mobile Filter Drawer State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // activeFilters is an array of Category Keys (e.g., 'Games'), specific Tags (e.g., 'Fluid'), or 'Favorites'
  const [activeFilters, setActiveFilters] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const filtersParam = params.get('filters');
      if (filtersParam) {
        return filtersParam.split(',').map(f => f.trim()).filter(Boolean);
      }
      return [];
    }
    return [];
  });

  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  const [sortOption, setSortOption] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('sort') || 'Featured';
    }
    return 'Featured';
  });

  const [displayMode, setDisplayMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('view');
      if (urlMode === 'grid' || urlMode === 'matrix' || urlMode === 'list' || urlMode === 'map') return urlMode;
      return localStorage.getItem('curator_display_mode') || 'grid';
    }
    return 'grid';
  });

  // Glitch transition state
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchTimeoutRef = useRef(null);

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

  const handleDisplayModeChange = (newMode) => {
    if (newMode === displayMode) return;
    setDisplayMode(newMode);
    addActivityLog(`SYS.UI: LAYOUT_UPDATED_${newMode.toUpperCase()}`);
  };

  // Sync display mode to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_display_mode', displayMode);
    }
  }, [displayMode]);

  const [randomSeed, setRandomSeed] = useState(() => Math.random());

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState(null);

  // Omni Command Palette State
  const [isOmniOpen, setIsOmniOpen] = useState(false);

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

  // System Idle Protocol Logic
  useEffect(() => {
    lastActivityRef.current = Date.now();

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (isIdle) {
        setIsIdle(false);
        soundSystem.playTone(600, 'sine', 0.05); // Play a subtle sound when waking up
      }
    };

    // Attach to window
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }));

    const idleCheckInterval = setInterval(() => {
      const currentTime = Date.now();
      // 60 seconds (60000ms) of inactivity triggers idle mode
      if (currentTime - lastActivityRef.current > 60000 && !isIdle && !isBooting) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      events.forEach(event => window.removeEventListener(event, updateActivity));
      clearInterval(idleCheckInterval);
    };
  }, [isIdle, isBooting]);

  // Open the Project Quick View modal
  const handleProjectSelect = (project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast("> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN", "error");
      return;
    }
    soundSystem.playClick();
    addActivityLog(`VIEWING PROTOCOL: [${project.title.toUpperCase()}]`);

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        flushSync(() => setSelectedProject(project));
      });
    } else {
      setSelectedProject(project);
    }
  };

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

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('curator_favorites');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync favorites to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curator_favorites', JSON.stringify(favorites));
    }
  }, [favorites]);

  // Drag and Drop State for Favorites
  const [draggedFavoriteId, setDraggedFavoriteId] = useState(null);
  const [dragOverFavoriteId, setDragOverFavoriteId] = useState(null);

  const handleDragStart = (e, projectId) => {
    setDraggedFavoriteId(projectId);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', projectId);
    }
  };

  const handleDragOver = (e, projectId) => {
    e.preventDefault(); // Necessary to allow dropping
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dragOverFavoriteId !== projectId) {
      setDragOverFavoriteId(projectId);
    }
  };

  const handleDragEnd = () => {
    setDraggedFavoriteId(null);
    setDragOverFavoriteId(null);
  };

  const handleDrop = (e, targetProjectId) => {
    e.preventDefault();
    if (!draggedFavoriteId || draggedFavoriteId === targetProjectId) {
      handleDragEnd();
      return;
    }

    setFavorites(prevFavorites => {
      const draggedIndex = prevFavorites.indexOf(draggedFavoriteId);
      const targetIndex = prevFavorites.indexOf(targetProjectId);

      if (draggedIndex === -1 || targetIndex === -1) return prevFavorites;

      const newFavorites = [...prevFavorites];
      newFavorites.splice(draggedIndex, 1);
      newFavorites.splice(targetIndex, 0, draggedFavoriteId);

      return newFavorites;
    });

    addToast(`> SYS_CMD: FAVORITES_REORDERED`, 'success');
    handleDragEnd();
  };

  // Toast Notifications State
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, fadingOut: true } : t));
    // Wait for the fade out animation to finish before removing
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 300); // matches the 0.3s duration of fade-out-right
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (type === 'error') {
      soundSystem.playError();
    } else if (type === 'success') {
      soundSystem.playSuccess();
    } else {
      soundSystem.playClick();
    }

    // Auto-remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const changeTheme = (newTheme) => {
    if (theme !== newTheme) {
      setTheme(newTheme);
      addToast(`> SYS_UPDATE: COLOR_PROTOCOL_${newTheme.toUpperCase()}`, 'info');
    }
  };
  const toggleFavorite = (project) => {
    if (isLockdown) {
      soundSystem.playDenied();
      addToast('> SYS_ERR: ACCESS DENIED - SYSTEM IN LOCKDOWN', 'error');
      return;
    }
    const isFavorited = favorites.includes(project.id);
    if (isFavorited) {
      addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] REMOVED`, 'warning');
      setFavorites(prev => prev.filter(id => id !== project.id));
      addActivityLog(`FAVORITE REMOVED: [${project.title.toUpperCase()}]`);
    } else {
      addToast(`> SYS_UPDATE: [${project.title.toUpperCase()}] FAVORITED`, 'success');
      setFavorites(prev => [...prev, project.id]);
      addActivityLog(`FAVORITE ADDED: [${project.title.toUpperCase()}]`);
    }
  };

  const handleCopyLink = (project) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(project.url).then(() => {
        addToast(`> SYS_CMD: [${project.title.toUpperCase()}] LINK_COPIED`, 'info');
      }).catch(() => {
        addToast(`> SYS_ERR: LINK_COPY_FAILED`, 'error');
      });
    } else {
      addToast(`> SYS_ERR: CLIPBOARD_NOT_SUPPORTED`, 'error');
    }
  };

  // Context Menu Handlers
  const handleContextMenu = (e, project) => {
    e.preventDefault();
    setContextMenu({
      mouseX: e.clientX,
      mouseY: e.clientY,
      project
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    if (!contextMenu) return;

    // Close context menu on any outside click or scroll
    window.addEventListener('click', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu);
    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu);
    };
  }, [contextMenu]);

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Keyboard Navigation state for cards
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  // Reset focus when changing pages, filters, etc.
  useEffect(() => {
    setTimeout(() => setFocusedCardIndex(0), 0);
  }, [currentPage, activeFilters, searchQuery, sortOption]);

  // Sync state to URL (Deep Linking)
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilters.length > 0) params.set('filters', activeFilters.join(','));
    if (searchQuery) params.set('q', searchQuery);
    if (sortOption !== 'Featured') params.set('sort', sortOption);
    if (displayMode !== 'grid') params.set('view', displayMode);

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;

    // Use replaceState to update URL without cluttering history stack
    window.history.replaceState(null, '', newUrl);
  }, [activeFilters, searchQuery, sortOption, displayMode]);

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
    setSoundEnabled,
    toggleFavorite,
    toggleFilter
  });

  const {
    handleTerminalKeyDown,
    handleTerminalSubmit,
    isTerminalClosing,
    isTerminalOpen,
    isHoloTerminalOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setIsHoloTerminalOpen,
    setTerminalInput,
    terminalEndRef,
    terminalHistory,
    terminalInput,
    terminalInputRef
  } = terminalController;

  const { searchInputRef } = useGlobalShortcuts({
    addActivityLog,
    contextMenu,
    isDataMode,
    isOmniOpen,
    isTerminalOpen,
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
    setSortOption
  });

  const { baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef } = useBackgroundEffects();

  const appContext = {
    activeCategories, activeFilters, activeFiltersSet, addActivityLog, addToast, baseGridRef, bootLogs, bootStep, canvasRef, changeTheme, clickEffects, closeContextMenu, contextMenu, counts, currentPage, deepGridRef, displayMode, dragOverFavoriteId, draggedFavoriteId, favoriteCount, favorites, filteredProjects, focusedCardIndex, formatUptime, gridSpotlightRef, handleContextMenu, handleCopyLink, handleDisplayModeChange, handleDragEnd, handleDragOver, handleDragStart, handleDrop, handlePageChange, handleProjectSelect, handleTagClick, handleTerminalKeyDown, handleTerminalSubmit, hoveredTag, isBooting, isCrtEnabled, isDataMode, isGlitching, isIdle, isLockdown, isMatrixMode, isMobileFiltersOpen, isOmniOpen, isSoundEnabled, isHoloTerminalOpen, isTerminalClosing, isTerminalOpen, modalImageLoaded, modalRef, paginatedProjects, removeToast, scanProgress, searchInputRef, searchQuery, selectedProject, setActiveFilters, setCurrentPage, setDisplayMode, setFocusedCardIndex, setIsCrtEnabled, setIsDataMode, setIsLockdown, setIsMatrixMode, setIsMobileFiltersOpen, setIsOmniOpen, setIsSoundEnabled, setIsHoloTerminalOpen, setIsTerminalClosing, setIsTerminalOpen, setModalImageLoaded, setRandomSeed, setSearchQuery, setSelectedProject, setSortOption, setSoundEnabled, setTerminalInput, setHoveredTag, showBootScreen, sortOption, soundEnabled, starfieldRef, startScan, stopScan, suggestedTags, systemStats, terminalEndRef, terminalHistory, terminalInput, terminalInputRef, theme, toasts, toggleFavorite, toggleFilter, totalPages, userActivityLogs
  };

  return (
    <AppContext.Provider value={appContext}>
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
    </AppContext.Provider>
  );
}

export default App;
