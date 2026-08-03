import { useEffect, useRef, useState, useCallback, useMemo, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createCommandRegistry, buildOmniProtocolItems } from '../lib/commandRegistry';
import {
  applyTabCompletion,
  executeCommandLine,
  getAutocompleteSuffix,
  shouldDedupeHistoryEntry,
} from '../lib/terminalParser';
import type { CommandContext } from '../lib/commandTypes';
import type { PreventDefaultEvent, TerminalHistoryEntry } from '../app/context/contextTypes';

export type UseTerminalControllerParams = Omit<CommandContext, 'isHoloTerminalOpen' | 'setIsHoloTerminalOpen'>;

export default function useTerminalController({
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
  setIsSoundEnabled,
  setRandomSeed,
  setSortOption,
  setPerformanceMode,
  rerollPerformance,
  effectiveMode,
  performanceMode,
  flags,
  toggleFavorite,
  toggleFilter,
  replaceFavorites,
  setActiveFilters,
  isCrtEnabled,
  isLockdown,
  isMatrixMode,
  isSoundEnabled,
}: UseTerminalControllerParams) {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isTerminalClosing, setIsTerminalClosing] = useState(false);
  const [isHoloTerminalOpen, setIsHoloTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<TerminalHistoryEntry[]>([
    { type: 'system', text: 'CURATOR_OS v1.0.4 - TERMINAL INITIALIZED' },
    { type: 'system', text: 'Type "help" for a list of commands.' },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftInput, setDraftInput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const terminalInputRef = useRef<HTMLInputElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const commandContext = useMemo<CommandContext>(() => ({
    addActivityLog,
    activeFilters,
    changeTheme,
    favorites,
    handleDisplayModeChange,
    handleProjectSelect,
    projectsMatchingQuery,
    setCurrentPage,
    setIsCrtEnabled,
    setIsHoloTerminalOpen,
    setIsLockdown,
    setIsMatrixMode,
    setIsSoundEnabled,
    setPerformanceMode,
    rerollPerformance,
    setRandomSeed,
    setSortOption,
    toggleFavorite,
    toggleFilter,
    replaceFavorites,
    setActiveFilters,
    isCrtEnabled,
    isHoloTerminalOpen,
    isLockdown,
    isMatrixMode,
    isSoundEnabled,
    performanceMode,
    effectiveMode,
    flags,
  }), [
    addActivityLog,
    activeFilters,
    changeTheme,
    favorites,
    handleDisplayModeChange,
    handleProjectSelect,
    projectsMatchingQuery,
    setCurrentPage,
    setIsCrtEnabled,
    setIsHoloTerminalOpen,
    setIsLockdown,
    setIsMatrixMode,
    setIsSoundEnabled,
    setPerformanceMode,
    rerollPerformance,
    setRandomSeed,
    setSortOption,
    toggleFavorite,
    toggleFilter,
    replaceFavorites,
    setActiveFilters,
    isCrtEnabled,
    isHoloTerminalOpen,
    isLockdown,
    isMatrixMode,
    isSoundEnabled,
    performanceMode,
    effectiveMode,
    flags,
  ]);

  const commandRegistry = useMemo(
    () => createCommandRegistry(commandContext),
    [commandContext],
  );

  const omniProtocolItems = useMemo(
    () => buildOmniProtocolItems(commandContext, commandRegistry),
    [commandContext, commandRegistry],
  );

  const terminalSuggestion = useMemo(
    () => getAutocompleteSuffix(terminalInput, commandRegistry, commandContext),
    [terminalInput, commandRegistry, commandContext],
  );

  const handleTerminalKeyDown = useCallback((e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      if (historyIndex === -1) {
        setDraftInput(terminalInput);
      }

      const newIndex = historyIndex === -1
        ? commandHistory.length - 1
        : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setTerminalInput(commandHistory[newIndex]);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setTerminalInput(draftInput);
      } else {
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      }
      return;
    }

    if (e.key === 'ArrowRight' && terminalSuggestion) {
      e.preventDefault();
      setTerminalInput(terminalInput + terminalSuggestion);
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const completed = applyTabCompletion(terminalInput, commandRegistry, commandContext);
      if (completed) setTerminalInput(completed);
      return;
    }

    if (historyIndex !== -1 && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setHistoryIndex(-1);
      setDraftInput('');
    }
  }, [
    commandContext,
    commandHistory,
    commandRegistry,
    draftInput,
    historyIndex,
    terminalInput,
    terminalSuggestion,
  ]);

  const handleTerminalSubmit = useCallback((e: PreventDefaultEvent, overrideCommand?: string) => {
    e.preventDefault();
    const commandStr = overrideCommand || terminalInput.trim();
    if (!commandStr) return;

    const [commandName] = commandStr.split(/\s+/);

    setCommandHistory((prev) => {
      if (shouldDedupeHistoryEntry(prev[prev.length - 1], commandStr)) return prev;
      return [...prev, commandStr];
    });
    setHistoryIndex(-1);
    setDraftInput('');

    const newHistory: TerminalHistoryEntry[] = [...terminalHistory, { type: 'user', text: `root@curator:~# ${commandStr}` }];
    const result = executeCommandLine(commandStr, commandContext, commandRegistry);

    if (result.clearHistory) {
      setTerminalHistory([]);
      setTerminalInput('');
      return;
    }

    if (result.closeTerminal) {
      setIsTerminalClosing(true);
      setTimeout(() => {
        setIsTerminalOpen(false);
        setIsTerminalClosing(false);
      }, 300);
      setTerminalInput('');
      return;
    }

    setTerminalHistory([...newHistory, { type: result.type, text: result.text }]);
    setTerminalInput('');

    if (!result.skipActivityLog && result.type !== 'error') {
      addActivityLog(`TERMINAL CMD: ${commandName} ${commandStr.split(/\s+/).slice(1).join(' ')}`.trim());
    }
  }, [
    addActivityLog,
    commandContext,
    commandRegistry,
    terminalHistory,
    terminalInput,
  ]);

  useEffect(() => {
    if (isTerminalOpen && terminalEndRef.current) {
      const terminalContainer = terminalEndRef.current.parentElement;
      if (terminalContainer) {
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
      }
    }
  }, [terminalHistory, isTerminalOpen]);

  useEffect(() => {
    if (isTerminalOpen && !isTerminalClosing && terminalInputRef.current) {
      setTimeout(() => terminalInputRef.current?.focus(), 50);
    }
  }, [isTerminalOpen, isTerminalClosing]);

  return {
    commandHistory,
    commandRegistry,
    commandContext,
    omniProtocolItems,
    handleTerminalKeyDown,
    handleTerminalSubmit,
    historyIndex,
    isHoloTerminalOpen,
    setIsHoloTerminalOpen,
    isTerminalClosing,
    isTerminalOpen,
    setIsTerminalClosing,
    setIsTerminalOpen,
    setTerminalInput,
    terminalEndRef,
    terminalHistory,
    terminalInput,
    terminalInputRef,
    terminalSuggestion,
  };
}
