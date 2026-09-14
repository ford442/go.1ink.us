import { useMemo } from 'react';
import type { AppContextValues } from '../app/context/contextTypes';

function useDomainValue<T extends object>(value: T): T {
  // Every enumerable context field participates in the memo comparison. The
  // domain shapes are fixed below, so dependency order and length are stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, Object.values(value));
}

// Memoize the seven public context contracts assembled by App. The inputs
// are grouped by domain to keep the composition root readable; each value is
// rebuilt only when one of the fields exposed by that domain changes.
export default function useAppProviderValues({
  settings,
  browser,
  loadout,
  terminal,
  overlay,
  effects,
  activity,
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
    handleCopyLink: browser.handleCopyLink,
    handleDragEnd: browser.handleDragEnd,
    handleDragOver: browser.handleDragOver,
    handleDragStart: browser.handleDragStart,
    handleDrop: browser.handleDrop,
    handlePageChange: browser.handlePageChange,
    handleTagClick: browser.handleTagClick,
    hoveredTag: browser.hoveredTag,
    isMobileFiltersOpen: browser.isMobileFiltersOpen,
    paginatedProjects: browser.paginatedProjects,
    projectsMatchingQuery: browser.projectsMatchingQuery,
    randomSeed: browser.randomSeed,
    searchInputRef: browser.searchInputRef,
    searchQuery: browser.searchQuery,
    setActiveFilters: browser.setActiveFilters,
    setCurrentPage: browser.setCurrentPage,
    setFocusedCardIndex: browser.setFocusedCardIndex,
    setHoveredTag: browser.setHoveredTag,
    setIsMobileFiltersOpen: browser.setIsMobileFiltersOpen,
    setRandomSeed: browser.setRandomSeed,
    setSearchQuery: browser.setSearchQuery,
    setSortOption: browser.setSortOption,
    sortOption: browser.sortOption,
    suggestedTags: browser.suggestedTags,
    toggleFavorite: browser.toggleFavorite,
    toggleFilter: browser.toggleFilter,
    totalPages: browser.totalPages,
    totalProjects: browser.totalProjects,
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

  const overlayValue = useDomainValue({
    addToast: overlay.addToast,
    clickEffects: overlay.clickEffects,
    closeContextMenu: overlay.closeContextMenu,
    closeProjectModal: overlay.closeProjectModal,
    contextMenu: overlay.contextMenu,
    handleContextMenu: overlay.handleContextMenu,
    handleProjectSelect: overlay.handleProjectSelect,
    isDataMode: overlay.isDataMode,
    isIdle: overlay.isIdle,
    isLockdown: overlay.isLockdown,
    isOmniOpen: overlay.isOmniOpen,
    isCheatsheetOpen: overlay.isCheatsheetOpen,
    isWarping: overlay.isWarping,
    modalImageLoaded: overlay.modalImageLoaded,
    modalRef: overlay.modalRef,
    removeToast: overlay.removeToast,
    selectedProject: overlay.selectedProject,
    setIsDataMode: overlay.setIsDataMode,
    setIsLockdown: overlay.setIsLockdown,
    setIsOmniOpen: overlay.setIsOmniOpen,
    setIsCheatsheetOpen: overlay.setIsCheatsheetOpen,
    setModalImageLoaded: overlay.setModalImageLoaded,
    setSelectedProject: overlay.setSelectedProject,
    toasts: overlay.toasts,
  });

  const effectsValue = useDomainValue({
    baseGridRef: effects.baseGridRef,
    canvasRef: effects.canvasRef,
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

  return { settingsValue, browserValue, loadoutValue, terminalValue, overlayValue, effectsValue, activityValue };
}
