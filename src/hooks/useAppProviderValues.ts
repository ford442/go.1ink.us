import { useMemo } from 'react';
import type { AppContextValues } from '../app/context/contextTypes';

function useDomainValue<T extends object>(value: T): T {
  // Every enumerable context field participates in the memo comparison. The
  // domain shapes are fixed below, so dependency order and length are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, Object.values(value));
}

// Memoize the public context contracts assembled by App. The inputs are
// grouped by domain to keep the composition root readable; each value is
// rebuilt only when one of the fields exposed by that domain changes.
export default function useAppProviderValues({
  settings,
  browser,
  browserActions,
  catalogCounts,
  loadout,
  terminal,
  overlayToast,
  overlayModal,
  overlayContextMenu,
  overlayChrome,
  effects,
  activity,
  groundStation,
}: AppContextValues) {
  const settingsValue = useDomainValue({
    changeTheme: settings.changeTheme,
    displayMode: settings.displayMode,
    handleDisplayModeChange: settings.handleDisplayModeChange,
    isCrtEnabled: settings.isCrtEnabled,
    isGlitching: settings.isGlitching,
    isGodMode: settings.isGodMode,
    isMatrixMode: settings.isMatrixMode,
    isSoundEnabled: settings.isSoundEnabled,
    setDisplayMode: settings.setDisplayMode,
    setIsCrtEnabled: settings.setIsCrtEnabled,
    setIsMatrixMode: settings.setIsMatrixMode,
    setIsSoundEnabled: settings.setIsSoundEnabled,
    theme: settings.theme,
  });

  const browserValue = useDomainValue({
    activeCategories: browser.activeCategories,
    activeFilters: browser.activeFilters,
    activeFiltersSet: browser.activeFiltersSet,
    counts: browser.counts,
    currentPage: browser.currentPage,
    draggedFavoriteId: browser.draggedFavoriteId,
    dragOverFavoriteId: browser.dragOverFavoriteId,
    favoriteCount: browser.favoriteCount,
    favorites: browser.favorites,
    filteredProjects: browser.filteredProjects,
    focusedCardIndex: browser.focusedCardIndex,
    hoveredTag: browser.hoveredTag,
    isMobileFiltersOpen: browser.isMobileFiltersOpen,
    paginatedProjects: browser.paginatedProjects,
    projectsMatchingQuery: browser.projectsMatchingQuery,
    randomSeed: browser.randomSeed,
    searchInputRef: browser.searchInputRef,
    searchQuery: browser.searchQuery,
    sortOption: browser.sortOption,
    suggestedTags: browser.suggestedTags,
    totalPages: browser.totalPages,
  });

  const browserActionsValue = useDomainValue({
    handleCopyLink: browserActions.handleCopyLink,
    handleDragEnd: browserActions.handleDragEnd,
    handleDragOver: browserActions.handleDragOver,
    handleDragStart: browserActions.handleDragStart,
    handleDrop: browserActions.handleDrop,
    handlePageChange: browserActions.handlePageChange,
    handleTagClick: browserActions.handleTagClick,
    setActiveFilters: browserActions.setActiveFilters,
    setCurrentPage: browserActions.setCurrentPage,
    setFocusedCardIndex: browserActions.setFocusedCardIndex,
    setHoveredTag: browserActions.setHoveredTag,
    setIsMobileFiltersOpen: browserActions.setIsMobileFiltersOpen,
    setRandomSeed: browserActions.setRandomSeed,
    setSearchQuery: browserActions.setSearchQuery,
    setSortOption: browserActions.setSortOption,
    toggleFavorite: browserActions.toggleFavorite,
    toggleFilter: browserActions.toggleFilter,
  });

  const catalogCountsValue = useDomainValue({
    totalFavorites: catalogCounts.totalFavorites,
    totalProjects: catalogCounts.totalProjects,
  });

  const loadoutValue = useDomainValue({
    loadouts: loadout.loadouts,
    activeLoadoutId: loadout.activeLoadoutId,
    createLoadout: loadout.createLoadout,
    deleteLoadout: loadout.deleteLoadout,
    updateLoadoutFromFavorites: loadout.updateLoadoutFromFavorites,
    applyLoadout: loadout.applyLoadout,
    exportLoadoutFile: loadout.exportLoadoutFile,
    importLoadoutJson: loadout.importLoadoutJson,
    copyShareLink: loadout.copyShareLink,
  });

  const terminalValue = useDomainValue({
    handleTerminalKeyDown: terminal.handleTerminalKeyDown,
    handleTerminalSubmit: terminal.handleTerminalSubmit,
    isHoloTerminalOpen: terminal.isHoloTerminalOpen,
    isTerminalClosing: terminal.isTerminalClosing,
    isTerminalOpen: terminal.isTerminalOpen,
    setIsHoloTerminalOpen: terminal.setIsHoloTerminalOpen,
    setIsTerminalClosing: terminal.setIsTerminalClosing,
    setIsTerminalOpen: terminal.setIsTerminalOpen,
    setTerminalInput: terminal.setTerminalInput,
    terminalEndRef: terminal.terminalEndRef,
    terminalHistory: terminal.terminalHistory,
    terminalInput: terminal.terminalInput,
    terminalInputRef: terminal.terminalInputRef,
    terminalSuggestion: terminal.terminalSuggestion,
    omniProtocolItems: terminal.omniProtocolItems,
  });

  const overlayToastValue = useDomainValue({
    addToast: overlayToast.addToast,
    removeToast: overlayToast.removeToast,
    toasts: overlayToast.toasts,
  });

  const overlayModalValue = useDomainValue({
    closeProjectModal: overlayModal.closeProjectModal,
    handleProjectSelect: overlayModal.handleProjectSelect,
    modalImageLoaded: overlayModal.modalImageLoaded,
    modalRef: overlayModal.modalRef,
    selectedProject: overlayModal.selectedProject,
    setModalImageLoaded: overlayModal.setModalImageLoaded,
  });

  const overlayContextMenuValue = useDomainValue({
    closeContextMenu: overlayContextMenu.closeContextMenu,
    contextMenu: overlayContextMenu.contextMenu,
    handleContextMenu: overlayContextMenu.handleContextMenu,
  });

  const overlayChromeValue = useDomainValue({
    clickEffects: overlayChrome.clickEffects,
    isCheatsheetOpen: overlayChrome.isCheatsheetOpen,
    isDataMode: overlayChrome.isDataMode,
    isIdle: overlayChrome.isIdle,
    isLockdown: overlayChrome.isLockdown,
    isOmniOpen: overlayChrome.isOmniOpen,
    isWarping: overlayChrome.isWarping,
    setIsCheatsheetOpen: overlayChrome.setIsCheatsheetOpen,
    setIsDataMode: overlayChrome.setIsDataMode,
    setIsLockdown: overlayChrome.setIsLockdown,
    setIsOmniOpen: overlayChrome.setIsOmniOpen,
  });

  const effectsValue = useDomainValue({
    baseGridRef: effects.baseGridRef,
    deepGridRef: effects.deepGridRef,
    gridSpotlightRef: effects.gridSpotlightRef,
    starfieldRef: effects.starfieldRef,
    performanceMode: effects.performanceMode,
    setPerformanceMode: effects.setPerformanceMode,
    rerollPerformance: effects.rerollPerformance,
    effectiveMode: effects.effectiveMode,
    flags: effects.flags,
    prefersReducedMotion: effects.prefersReducedMotion,
  });

  const activityValue = useDomainValue({
    addActivityLog: activity.addActivityLog,
    bootLogs: activity.bootLogs,
    bootStep: activity.bootStep,
    isBooting: activity.isBooting,
    scanProgress: activity.scanProgress,
    showBootScreen: activity.showBootScreen,
    startScan: activity.startScan,
    stopScan: activity.stopScan,
    userActivityLogs: activity.userActivityLogs,
  });

  const groundStationValue = useDomainValue({
    frame: groundStation.frame,
    geolocationStatus: groundStation.geolocationStatus,
    requestGeolocation: groundStation.requestGeolocation,
    setStation: groundStation.setStation,
    station: groundStation.station,
  });

  return {
    settingsValue,
    browserValue,
    browserActionsValue,
    catalogCountsValue,
    loadoutValue,
    terminalValue,
    overlayToastValue,
    overlayModalValue,
    overlayContextMenuValue,
    overlayChromeValue,
    effectsValue,
    activityValue,
    groundStationValue,
  };
}
