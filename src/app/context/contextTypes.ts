import type {
  Dispatch,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  SetStateAction,
  SyntheticEvent,
} from 'react';
import type { ActivityLog, ClickEffect } from '../../hooks/useBootSequence';
import type { ContextMenuState } from '../../hooks/useContextMenu';
import type { Toast, ToastType } from '../../hooks/useToasts';
import type { ProjectCounts } from '../../lib/projectBrowser';
import type { Loadout, Category, DisplayMode, EnhancedProject, PerformanceFlags, PerformanceMode, Project, SortOption, ThemeId } from '../../types';

type Setter<T> = Dispatch<SetStateAction<T>>;

export interface SettingsContextValue {
  changeTheme: (theme: ThemeId) => void;
  displayMode: DisplayMode;
  handleDisplayModeChange: (mode: DisplayMode) => void;
  isCrtEnabled: boolean;
  isGlitching: boolean;
  isGodMode: boolean;
  isMatrixMode: boolean;
  isSoundEnabled: boolean;
  setDisplayMode: Setter<DisplayMode>;
  setIsCrtEnabled: Setter<boolean>;
  setIsMatrixMode: Setter<boolean>;
  setIsSoundEnabled: (enabled: boolean) => void;
  theme: ThemeId;
}

export interface BrowserContextValue {
  activeCategories: Category[];
  activeFilters: string[];
  activeFiltersSet: Set<string>;
  counts: ProjectCounts;
  currentPage: number;
  draggedFavoriteId: number | null;
  dragOverFavoriteId: number | null;
  favoriteCount: number;
  favorites: number[];
  filteredProjects: EnhancedProject[];
  focusedCardIndex: number;
  handleCopyLink: (project: Project) => void;
  handleDragEnd: () => void;
  handleDragOver: (event: DragEvent, projectId: number) => void;
  handleDragStart: (event: DragEvent, projectId: number) => void;
  handleDrop: (event: DragEvent, projectId: number) => void;
  handlePageChange: (page: number) => void;
  handleTagClick: (tag: string) => void;
  hoveredTag: string | null;
  isMobileFiltersOpen: boolean;
  paginatedProjects: EnhancedProject[];
  projectsMatchingQuery: EnhancedProject[];
  randomSeed: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setActiveFilters: Setter<string[]>;
  setCurrentPage: Setter<number>;
  setFocusedCardIndex: Setter<number>;
  setHoveredTag: Setter<string | null>;
  setIsMobileFiltersOpen: Setter<boolean>;
  setRandomSeed: Setter<number>;
  setSearchQuery: Setter<string>;
  setSortOption: Setter<SortOption>;
  sortOption: SortOption;
  suggestedTags: string[];
  toggleFavorite: (project: Project) => void;
  toggleFilter: (filter: string) => void;
  totalPages: number;
  totalProjects: number;
}

export interface LoadoutContextValue {
  loadouts: Loadout[];
  activeLoadoutId: string | null;
  createLoadout: (name: string, ids?: number[]) => Loadout | null;
  deleteLoadout: (id: string) => void;
  updateLoadoutFromFavorites: (id: string) => void;
  applyLoadout: (id: string) => void;
  exportLoadoutFile: (id: string) => void;
  importLoadoutJson: (text: string, options?: { merge?: boolean }) => void;
  copyShareLink: (id: string) => Promise<void>;
}

export interface TerminalHistoryEntry {
  type: 'system' | 'error' | 'success' | 'warning' | 'user';
  text: string;
}

export interface PreventDefaultEvent {
  preventDefault: () => void;
}

export interface OmniProtocolItem {
  id: string;
  type: 'protocol' | 'filter';
  label: string;
  description?: string;
  action: () => void;
  icon: string;
  keywords: string[];
  isActive?: boolean;
}

export interface TerminalContextValue {
  handleTerminalKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  handleTerminalSubmit: (event: PreventDefaultEvent, overrideCommand?: string) => void;
  isHoloTerminalOpen: boolean;
  isTerminalClosing: boolean;
  isTerminalOpen: boolean;
  setIsHoloTerminalOpen: Setter<boolean>;
  setIsTerminalClosing: Setter<boolean>;
  setIsTerminalOpen: Setter<boolean>;
  setTerminalInput: Setter<string>;
  terminalEndRef: RefObject<HTMLDivElement | null>;
  terminalHistory: TerminalHistoryEntry[];
  terminalInput: string;
  terminalInputRef: RefObject<HTMLInputElement | null>;
  terminalSuggestion: string;
  omniProtocolItems: OmniProtocolItem[];
}

export interface OverlayContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  clickEffects: ClickEffect[];
  closeContextMenu: () => void;
  closeProjectModal: () => void;
  contextMenu: ContextMenuState | null;
  handleContextMenu: (event: ReactMouseEvent, project: Project) => void;
  handleProjectSelect: (project: Project) => void;
  isDataMode: boolean;
  isIdle: boolean;
  isLockdown: boolean;
  isOmniOpen: boolean;
  isCheatsheetOpen: boolean;
  isWarping: boolean;
  modalImageLoaded: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  removeToast: (id: string) => void;
  selectedProject: Project | null;
  setIsDataMode: Setter<boolean>;
  setIsLockdown: Setter<boolean>;
  setIsOmniOpen: Setter<boolean>;
  setIsCheatsheetOpen: Setter<boolean>;
  setModalImageLoaded: Setter<boolean>;
  setSelectedProject: Setter<Project | null>;
  toasts: Toast[];
}

export interface EffectsContextValue {
  baseGridRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  deepGridRef: RefObject<HTMLDivElement | null>;
  gridSpotlightRef: RefObject<HTMLDivElement | null>;
  starfieldRef: RefObject<HTMLDivElement | null>;
  performanceMode: PerformanceMode;
  setPerformanceMode: Setter<PerformanceMode>;
  rerollPerformance: () => void;
  effectiveMode: Exclude<PerformanceMode, 'auto'>;
  flags: PerformanceFlags;
  prefersReducedMotion: boolean;
}

export interface ActivityContextValue {
  addActivityLog: (text: string) => void;
  bootLogs: string[];
  bootStep: number;
  isBooting: boolean;
  scanProgress: number;
  showBootScreen: boolean;
  startScan: (event?: SyntheticEvent) => void;
  stopScan: () => void;
  userActivityLogs: ActivityLog[];
}

export interface AppContextValues {
  settings: SettingsContextValue;
  browser: BrowserContextValue;
  loadout: LoadoutContextValue;
  terminal: TerminalContextValue;
  overlay: OverlayContextValue;
  effects: EffectsContextValue;
  activity: ActivityContextValue;
}
