import type {
  Dispatch,
  DragEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  SetStateAction,
  SyntheticEvent,
} from 'react';
import type { GroundStation, StationFrame } from '../../ground';
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

// Hot state: rebuilt on every search keystroke, filter toggle, sort change,
// and page turn. Kept separate from BrowserActionsContextValue so an
// actions-only consumer (e.g. `useVoiceCommand`, which only needs
// `setSearchQuery`) never re-renders on state it doesn't read.
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
  hoveredTag: string | null;
  isMobileFiltersOpen: boolean;
  paginatedProjects: EnhancedProject[];
  projectsMatchingQuery: EnhancedProject[];
  randomSeed: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  sortOption: SortOption;
  suggestedTags: string[];
  totalPages: number;
}

// Stable `useCallback` references only — this context's value never
// invalidates on a BrowserContextValue state change, so a consumer that
// reads only actions (never state) can subscribe here instead of to the
// full, search-keystroke-hot BrowserContext.
export interface BrowserActionsContextValue {
  handleCopyLink: (project: Project) => void;
  handleDragEnd: () => void;
  handleDragOver: (event: DragEvent, projectId: number) => void;
  handleDragStart: (event: DragEvent, projectId: number) => void;
  handleDrop: (event: DragEvent, projectId: number) => void;
  handlePageChange: (page: number) => void;
  handleTagClick: (tag: string) => void;
  setActiveFilters: Setter<string[]>;
  setCurrentPage: Setter<number>;
  setFocusedCardIndex: Setter<number>;
  setHoveredTag: Setter<string | null>;
  setIsMobileFiltersOpen: Setter<boolean>;
  setRandomSeed: Setter<number>;
  setSearchQuery: Setter<string>;
  setSortOption: Setter<SortOption>;
  toggleFavorite: (project: Project) => void;
  toggleFilter: (filter: string) => void;
}

// Catalog-wide counts that are independent of search/filter state — unlike
// `BrowserContextValue.favoriteCount` (which counts favorites matching the
// *current* search/filter, and is deliberately hot), these only change when
// the catalog or the favorites list itself changes. Lets `LoadoutPanel` and
// `CommandHeader` read a count without subscribing to BrowserContext.
export interface CatalogCountsContextValue {
  totalFavorites: number;
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

// Toast queue only. Split out of the old flat OverlayContextValue so a
// modal-only or chrome-only consumer isn't invalidated by a toast firing.
export interface OverlayToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

// Project quick-view modal only. `ProjectQuickView` — the single biggest
// consumer of the old OverlayContextValue — now subscribes to exactly this
// and nothing else.
export interface OverlayModalContextValue {
  closeProjectModal: () => void;
  handleProjectSelect: (project: Project) => void;
  modalImageLoaded: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  selectedProject: Project | null;
  setModalImageLoaded: Setter<boolean>;
}

// Right-click context menu only.
export interface OverlayContextMenuContextValue {
  closeContextMenu: () => void;
  contextMenu: ContextMenuState | null;
  handleContextMenu: (event: ReactMouseEvent, project: Project) => void;
}

// Small, infrequently-changing chrome flags: omni palette, lockdown, idle,
// data mode, cheatsheet, warp transition, tactical click effects. These are
// grouped rather than split further because every current consumer
// (`SystemOverlays`, `CommandHeader`, `BackgroundElements`, `ContextMenu`)
// already needs two or more of them together; split further only if
// profiling shows one of these flags flipping often enough to matter (see
// AGENTS.md's "when to split a domain" rule).
export interface OverlayChromeContextValue {
  clickEffects: ClickEffect[];
  isCheatsheetOpen: boolean;
  isDataMode: boolean;
  isIdle: boolean;
  isLockdown: boolean;
  isMissionControlOpen: boolean;
  isOmniOpen: boolean;
  isWarping: boolean;
  setIsCheatsheetOpen: Setter<boolean>;
  setIsDataMode: Setter<boolean>;
  setIsLockdown: Setter<boolean>;
  setIsMissionControlOpen: Setter<boolean>;
  setIsOmniOpen: Setter<boolean>;
}

export interface EffectsContextValue {
  baseGridRef: RefObject<HTMLDivElement | null>;
  deepGridRef: RefObject<HTMLDivElement | null>;
  gridSpotlightRef: RefObject<HTMLDivElement | null>;
  starfieldRef: RefObject<HTMLCanvasElement | null>;
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

export type GeolocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

// Stub domain for #273 (Orbital Ops): the active ground station and its
// derived frame, plus geolocation request status. Deliberately its own
// domain rather than folded into BrowserContext (unrelated to the project
// catalog) or EffectsContext (which is refs + performance flags only) — see
// AGENTS.md's "when to split a domain" rule. The pass table / constellation
// overlay that reads `frame` at frame-rate is #273's job, not this one's.
export interface GroundStationContextValue {
  frame: StationFrame;
  geolocationStatus: GeolocationStatus;
  requestGeolocation: () => void;
  setStation: Setter<GroundStation>;
  station: GroundStation;
}

export interface AppContextValues {
  settings: SettingsContextValue;
  browser: BrowserContextValue;
  browserActions: BrowserActionsContextValue;
  catalogCounts: CatalogCountsContextValue;
  loadout: LoadoutContextValue;
  terminal: TerminalContextValue;
  overlayToast: OverlayToastContextValue;
  overlayModal: OverlayModalContextValue;
  overlayContextMenu: OverlayContextMenuContextValue;
  overlayChrome: OverlayChromeContextValue;
  effects: EffectsContextValue;
  activity: ActivityContextValue;
  groundStation: GroundStationContextValue;
}
