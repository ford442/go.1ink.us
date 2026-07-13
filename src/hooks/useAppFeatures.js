import useProjectBrowser from './useProjectBrowser';
import useTerminalController from './useTerminalController';
import useGlobalShortcuts from './useGlobalShortcuts';
import useBackgroundEffects from './useBackgroundEffects';

// Wires the four feature hooks that don't own their own persisted/URL state
// but instead derive behavior from it: the project browser (filter/sort/
// paginate), the terminal command processor, global keyboard shortcuts, and
// the background parallax/cursor-trail refs. Kept as one call in App.jsx so
// the composition root isn't the one holding all of their cross-wiring.
export default function useAppFeatures({
  activeFilters,
  addActivityLog,
  changeTheme,
  contextMenu,
  currentPage,
  enhancedProjects,
  favorites,
  handleDisplayModeChange,
  handleProjectSelect,
  isDataMode,
  isGodMode,
  isOmniOpen,
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
  setRandomSeed,
  setSearchQuery,
  setSelectedProject,
  setSortOption,
  setSoundEnabled,
  closeProjectModal,
  sortOption,
  toggleFavorite
}) {
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
    isGodMode,
    setIsGodMode,
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

  const { baseGridRef, canvasRef, deepGridRef, gridSpotlightRef, starfieldRef } = useBackgroundEffects();

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
    searchInputRef,
    baseGridRef,
    canvasRef,
    deepGridRef,
    gridSpotlightRef,
    starfieldRef
  };
}
