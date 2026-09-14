import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { trackDisplayMode } from '../lib/trackEvent';
import projectData from '../data/projectData';
import { enhanceProjects } from '../lib/projectBrowser';
import AppProviders from './context/AppProviders';
import BootScreen from '../components/BootScreen';
import CommandHeader from '../components/CommandHeader';
import BackgroundElements from '../components/BackgroundElements';
import Sidebar from '../components/Sidebar';
import MainContent from '../components/MainContent';
import TransmissionsPanel from '../components/TransmissionsPanel';
import TerminalBar from '../components/TerminalBar';
import { BrandImage } from '../components/ProjectImage';
import ContextMenu from '../components/ContextMenu';
import SystemOverlays from '../components/SystemOverlays';
import useAppFeatures from '../hooks/useAppFeatures';
import useAppProviderValues from '../hooks/useAppProviderValues';
import useAudioSettings from '../hooks/useAudioSettings';
import useBootSequence from '../hooks/useBootSequence';
import useContextMenu from '../hooks/useContextMenu';
import useFavorites from '../hooks/useFavorites';
import useIdleProtocol from '../hooks/useIdleProtocol';
import useLayoutGlitchTransition from '../hooks/useLayoutGlitchTransition';
import useLoadoutShare from '../hooks/useLoadoutShare';
import usePagination from '../hooks/usePagination';
import usePerformanceMode from '../hooks/usePerformanceMode';
import usePersistedState from '../hooks/usePersistedState';
import useQuickViewModal from '../hooks/useQuickViewModal';
import useScrollVelocity from '../hooks/useScrollVelocity';
import useToasts from '../hooks/useToasts';
import useUrlSyncedFilters from '../hooks/useUrlSyncedFilters';
import { loadoutsStub } from '../lib/loadoutsStub';
import type { DisplayMode, Project, ThemeId } from '../types';
import './App.css';

const HoloTerminal = lazy(() => import('../components/HoloTerminal/HoloTerminal'));
const LoadoutsBootstrap = lazy(() => import('../components/LoadoutsBootstrap'));
const CustomCursor = lazy(() => import('../effects/CustomCursor'));
const ProjectQuickView = lazy(() => import('../components/ProjectQuickView'));
const BOOLEAN_STORAGE = { fromStorage: (value: string) => value === 'true' };

// Static catalog metadata is enhanced once, rather than on every render.
const enhancedProjects = enhanceProjects(projectData);

function App() {
  const { isSoundEnabled, setIsSoundEnabled } = useAudioSettings();
  const boot = useBootSequence({ isSoundEnabled });
  const { addActivityLog } = boot;
  const performance = usePerformanceMode();
  useScrollVelocity(performance.flags.scrollVelocity);

  const [isCrtEnabled, setIsCrtEnabled] = usePersistedState('curator_crt', false, BOOLEAN_STORAGE);
  const [isMatrixMode, setIsMatrixMode] = usePersistedState('curator_matrix', false, BOOLEAN_STORAGE);
  const [theme, setTheme] = usePersistedState<ThemeId>('curator_theme', 'cyan');
  const filters = useUrlSyncedFilters();
  const { setDisplayMode } = filters;
  const pagination = usePagination({
    displayMode: filters.displayMode,
    activeFilters: filters.activeFilters,
    searchQuery: filters.searchQuery,
    sortOption: filters.sortOption,
  });

  const [hoveredTag, setHoveredTag] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isGodMode, setIsGodMode] = useState(false);
  const [randomSeed, setRandomSeed] = useState(() => Math.random());
  const [isOmniOpen, setIsOmniOpen] = useState(false);
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false);
  const [isLockdown, setIsLockdown] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [loadoutsApi, setLoadoutsApi] = useState(loadoutsStub);

  const isGlitching = useLayoutGlitchTransition(filters.displayMode);
  const isIdle = useIdleProtocol({ isBooting: boot.isBooting });
  const toastState = useToasts();
  const { addToast } = toastState;
  const contextMenuState = useContextMenu();

  useEffect(() => {
    document.documentElement.toggleAttribute('data-theme', theme !== 'cyan');
    if (theme !== 'cyan') document.documentElement.setAttribute('data-theme', theme);
    addActivityLog(`SYS_THEME_UPDATED: [${theme.toUpperCase()}]`);
  }, [theme, addActivityLog]);

  useEffect(() => {
    document.body.classList.toggle('god-mode', isGodMode);
    return () => document.body.classList.remove('god-mode');
  }, [isGodMode]);

  const handleDisplayModeChange = useCallback((newMode: DisplayMode) => {
    setDisplayMode(previousMode => {
      if (newMode === previousMode) return previousMode;
      addActivityLog(`SYS.UI: LAYOUT_UPDATED_${newMode.toUpperCase()}`);
      trackDisplayMode(newMode);
      return newMode;
    });
  }, [addActivityLog, setDisplayMode]);

  const changeTheme = useCallback((newTheme: ThemeId) => {
    setTheme(previousTheme => {
      if (previousTheme === newTheme) return previousTheme;
      addToast(`> SYS_UPDATE: COLOR_PROTOCOL_${newTheme.toUpperCase()}`, 'info');
      return newTheme;
    });
  }, [addToast, setTheme]);

  const quickView = useQuickViewModal({
    isLockdown,
    addToast,
    addActivityLog,
    setIsWarping,
    warpTransition: performance.flags.warpTransition,
  });
  const favoritesState = useFavorites({
    isLockdown,
    addToast,
    addActivityLog,
  });

  const handleCopyLink = useCallback((project: Project) => {
    if (!navigator.clipboard?.writeText) {
      addToast('> SYS_ERR: CLIPBOARD_NOT_SUPPORTED', 'error');
      return;
    }
    navigator.clipboard.writeText(project.url)
      .then(() => addToast(`> SYS_CMD: [${project.title.toUpperCase()}] LINK_COPIED`, 'copy'))
      .catch(() => addToast('> SYS_ERR: LINK_COPY_FAILED', 'error'));
  }, [addToast]);

  useLoadoutShare({
    replaceFavorites: favoritesState.replaceFavorites,
    setActiveFilters: filters.setActiveFilters,
    setCurrentPage: pagination.setCurrentPage,
    addToast,
    addActivityLog,
  });

  const features = useAppFeatures({
    ...filters,
    ...pagination,
    ...contextMenuState,
    activeFilters: filters.activeFilters,
    addActivityLog,
    changeTheme,
    closeProjectModal: quickView.closeProjectModal,
    enhancedProjects,
    favorites: favoritesState.favorites,
    replaceFavorites: favoritesState.replaceFavorites,
    handleDisplayModeChange,
    handleProjectSelect: quickView.handleProjectSelect,
    isDataMode: boot.isDataMode,
    isGodMode,
    isOmniOpen,
    isCheatsheetOpen,
    randomSeed,
    selectedProjectRef: quickView.selectedProjectRef,
    setIsCrtEnabled,
    setIsDataMode: boot.setIsDataMode,
    setIsGodMode,
    setIsLockdown,
    setIsMatrixMode,
    setIsOmniOpen,
    setIsCheatsheetOpen,
    setIsSoundEnabled,
    setPerformanceMode: performance.setPerformanceMode,
    rerollPerformance: performance.rerollPerformance,
    effectiveMode: performance.effectiveMode,
    performanceMode: performance.performanceMode,
    isCrtEnabled,
    isLockdown,
    isMatrixMode,
    isSoundEnabled,
    performanceFlags: performance.flags,
    setRandomSeed,
    setSelectedProject: quickView.setSelectedProject,
    toggleFavorite: favoritesState.toggleFavorite,
  });

  const providerValues = useAppProviderValues({
    settings: {
      changeTheme, handleDisplayModeChange, isCrtEnabled, isGlitching,
      isGodMode, isMatrixMode, isSoundEnabled, setIsCrtEnabled,
      setIsMatrixMode, setIsSoundEnabled, theme,
      displayMode: filters.displayMode, setDisplayMode: filters.setDisplayMode,
    },
    browser: {
      ...filters, ...pagination, ...favoritesState, ...features,
      handleCopyLink, hoveredTag, isMobileFiltersOpen, randomSeed,
      setHoveredTag, setIsMobileFiltersOpen, setRandomSeed,
      totalProjects: enhancedProjects.length,
    },
    loadout: loadoutsApi,
    terminal: features,
    overlay: {
      ...toastState, ...contextMenuState, ...quickView,
      clickEffects: boot.clickEffects, isDataMode: boot.isDataMode, isIdle,
      isLockdown, isOmniOpen, isCheatsheetOpen, isWarping,
      setIsDataMode: boot.setIsDataMode, setIsLockdown, setIsOmniOpen,
      setIsCheatsheetOpen,
    },
    effects: { ...features, ...performance },
    activity: boot,
  });

  return (
    <AppProviders
      settings={providerValues.settingsValue}
      browser={providerValues.browserValue}
      loadout={providerValues.loadoutValue}
      terminal={providerValues.terminalValue}
      overlay={providerValues.overlayValue}
      effects={providerValues.effectsValue}
      activity={providerValues.activityValue}
    >
      <Suspense fallback={null}>
        <LoadoutsBootstrap
          favorites={favoritesState.favorites}
          isLockdown={isLockdown}
          replaceFavorites={favoritesState.replaceFavorites}
          setActiveFilters={filters.setActiveFilters}
          setCurrentPage={pagination.setCurrentPage}
          addToast={addToast}
          addActivityLog={addActivityLog}
          onReady={setLoadoutsApi}
        />
      </Suspense>
      <div className={`min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-slate-950 relative overflow-hidden font-sans ${isCrtEnabled ? 'crt-flicker' : ''}`}>
        {isCrtEnabled && <><div className="crt-scanlines pointer-events-none fixed inset-0 z-[9999] mix-blend-overlay" /><div className="crt-vignette pointer-events-none fixed inset-0 z-[9998]" /></>}
        <Suspense fallback={null}><CustomCursor /></Suspense>
        <BootScreen />
        <CommandHeader />
        <BackgroundElements />
        {performance.flags.filmGrain && <div className="film-grain" aria-hidden="true" />}
        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10">
          <header className="text-center mb-12 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/30 blur-3xl rounded-full transform scale-75" />
              <BrandImage brand="title" alt="Web apps from 1ink.us" loading="eager" fetchPriority="high" className="relative max-w-lg md:max-w-2xl h-auto max-h-48 md:max-h-64 object-contain animate-fade-in animate-float drop-shadow-2xl filter" pictureClassName="relative block" />
            </div>
          </header>
          <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 xl:gap-8 animate-fade-in relative" style={{ animationDelay: '0.2s' }}>
            <Sidebar />
            <MainContent />
            <div className="hidden xl:block w-72 shrink-0">
              <TransmissionsPanel onSelectProject={quickView.handleProjectSelect} />
            </div>
          </div>
        </div>
        {quickView.selectedProject && (
          <Suspense fallback={null}><ProjectQuickView /></Suspense>
        )}
        <TerminalBar />
        <Suspense fallback={null}><HoloTerminal /></Suspense>
        <ContextMenu />
        <SystemOverlays />
      </div>
    </AppProviders>
  );
}

export default App;
