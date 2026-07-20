import type { DisplayMode, PerformanceMode, SortOption, ThemeId } from '../types';

export type TerminalResponseType = 'system' | 'error' | 'success' | 'warning';

export interface TerminalResult {
  type: TerminalResponseType;
  text: string;
  clearHistory?: boolean;
  closeTerminal?: boolean;
  skipActivityLog?: boolean;
}

export interface CommandArgSpec {
  name: string;
  description: string;
  required?: boolean;
  values?: string[] | ((ctx: CommandContext) => string[]);
}

export interface OmniItemSpec {
  id: string;
  label: string | ((ctx: CommandContext) => string);
  icon: string;
  keywords?: string[];
  isActive?: (ctx: CommandContext) => boolean;
  action: (ctx: CommandContext) => void;
}

export interface CommandDefinition {
  name: string;
  aliases?: string[];
  args?: CommandArgSpec[];
  help: string;
  usage?: string;
  omni?: OmniItemSpec | OmniItemSpec[];
  run: (ctx: CommandContext, args: string[]) => TerminalResult | null;
}

export interface CommandContext {
  addActivityLog: (text: string) => void;
  changeTheme: (theme: ThemeId) => void;
  favorites: number[];
  activeFilters: string[];
  handleDisplayModeChange: (mode: DisplayMode) => void;
  handleProjectSelect: (project: { id: number; title: string }) => void;
  projectsMatchingQuery: Array<{ id: number; title: string }>;
  setCurrentPage: (page: number) => void;
  setIsCrtEnabled: (enabled: boolean) => void;
  setIsHoloTerminalOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsLockdown: (locked: boolean) => void;
  setIsMatrixMode: (enabled: boolean) => void;
  setIsSoundEnabled: (enabled: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  setRandomSeed: (seed: number) => void;
  setSortOption: (option: SortOption) => void;
  toggleFavorite: (project: { id: number; title: string }) => void;
  toggleFilter: (filter: string) => void;
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  isCrtEnabled: boolean;
  isHoloTerminalOpen: boolean;
  isLockdown: boolean;
  isMatrixMode: boolean;
  isSoundEnabled: boolean;
  performanceMode: PerformanceMode;
  effectiveMode: PerformanceMode;
}
