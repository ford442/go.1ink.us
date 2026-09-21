import useProjectBrowser, { type UseProjectBrowserParams } from './useProjectBrowser';
import useTerminalController, { type UseTerminalControllerParams } from './useTerminalController';
import useGlobalShortcuts, { type UseGlobalShortcutsParams } from './useGlobalShortcuts';
import useBackgroundEffects from './useBackgroundEffects';
import type { PerformanceFlags } from '../types';

type UseAppFeaturesParams = UseProjectBrowserParams
  & Omit<UseTerminalControllerParams, 'projectsMatchingQuery' | 'toggleFilter' | 'flags'>
  // isTerminalOpen/setIsTerminalOpen/setIsTerminalClosing come from this
  // hook's own useTerminalController() call below, not from the caller.
  & Omit<UseGlobalShortcutsParams, 'isTerminalOpen' | 'setIsTerminalOpen' | 'setIsTerminalClosing'>
  & { performanceFlags: PerformanceFlags };

// Wires the four feature hooks that don't own their own persisted/URL state
// but instead derive behavior from it: the project browser (filter/sort/
// paginate), the terminal command processor, global keyboard shortcuts, and
// the background parallax/cursor-trail refs. Kept as one call in App.tsx so
// the composition root isn't the one holding all of their cross-wiring.
export default function useAppFeatures({
  activeFilters,
  addActivityLog,
  changeTheme,
  contextMenu,
  currentPage,
  enhancedProjects,
  favorites,
  replaceFavorites,
  handleDisplayModeChange,
  handleProjectSelect,
  isDataMode,
  isGodMode,
  isOmniOpen,
  isCheatsheetOpen,
  isMissionControlOpen,
  itemsPerPage,
  randomSeed,
  searchQuery,
  selectedProjectRef,
  setActiveFilters,
  setContextMenu,
  setCurrentPage,
  setDisplayMode,
  setIsCrtEnabled,
  setIsDataMode,
  setIsGodMode,
  setIsLockdown,
  setIsMatrixMode,
  setIsOmniOpen,
  setIsCheatsheetOpen,
  setIsMissionControlOpen,
  setRandomSeed,
  setSearchQuery,
  setSelectedProject,
  setSortOption,
  setIsSoundEnabled,
  setPerformanceMode,
  rerollPerformance,
  effectiveMode,
  performanceMode,
  isCrtEnabled,
  isLockdown,
  isMatrixMode,
  isSoundEnabled,
  performanceFlags,
  closeProjectModal,
  sortOption,
  toggleFavorite
}: UseAppFeaturesParams) {
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
  } = useProjectBrowser({
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
    setIsMissionControlOpen,
    setRandomSeed,
    setSortOption,
    setIsSoundEnabled,
    setPerformanceMode,
    rerollPerformance,
    toggleFavorite,
    toggleFilter,
    replaceFavorites,
    setActiveFilters,
    effectiveMode,
    performanceMode,
    flags: performanceFlags,
    isCrtEnabled,
    isLockdown,
    isMatrixMode,
    isMissionControlOpen,
    isSoundEnabled,
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
    terminalInputRef,
    terminalSuggestion,
    omniProtocolItems,
  } = terminalController;

  const { searchInputRef } = useGlobalShortcuts({
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
  });

  const backgroundRefs = useBackgroundEffects(performanceFlags);

  return {
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
    totalPages,
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
    terminalInputRef,
    terminalSuggestion,
    omniProtocolItems,
    searchInputRef,
    ...backgroundRefs,
  };
}
