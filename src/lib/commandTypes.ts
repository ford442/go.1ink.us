import type { GroundStation } from '../ground/GroundStation';
import type { DisplayMode, PerformanceFlags, PerformanceMode, Project, SortOption, ThemeId } from '../types';

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
  /** Print a result after the command returned — for commands that lazy-load their work (e.g. `passes`). */
  appendTerminalOutput: (result: TerminalResult) => void;
  changeTheme: (theme: ThemeId) => void;
  favorites: number[];
  activeFilters: string[];
  handleDisplayModeChange: (mode: DisplayMode) => void;
  handleProjectSelect: (project: Project) => void;
  projectsMatchingQuery: Array<{ id: number; title: string }>;
  setCurrentPage: (page: number) => void;
  setIsCrtEnabled: (enabled: boolean) => void;
  setIsHoloTerminalOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsLockdown: (locked: boolean) => void;
  setIsMissionControlOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  setIsOrbitalOpsOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  groundStation: GroundStation;
  setGroundStation: (station: GroundStation) => void;
  /** Opt-in geolocation; resolves null (station unchanged) on refusal/unsupported. */
  requestGeolocation: () => Promise<GroundStation | null>;
  setIsMatrixMode: (enabled: boolean) => void;
  setIsSoundEnabled: (enabled: boolean) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  rerollPerformance: () => void;
  setRandomSeed: (seed: number) => void;
  setSortOption: (option: SortOption) => void;
  toggleFavorite: (project: Project) => void;
  toggleFilter: (filter: string) => void;
  replaceFavorites: (ids: number[], label?: string, options?: { silent?: boolean }) => void;
  setActiveFilters: (filters: string[]) => void;
  isCrtEnabled: boolean;
  isHoloTerminalOpen: boolean;
  isLockdown: boolean;
  isMatrixMode: boolean;
  isMissionControlOpen: boolean;
  isOrbitalOpsOpen: boolean;
  isSoundEnabled: boolean;
  performanceMode: PerformanceMode;
  effectiveMode: PerformanceMode;
  flags: PerformanceFlags;
}
