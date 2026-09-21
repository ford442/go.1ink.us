import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useBrowserActions } from '../app/context/BrowserContext';
import { useSettingsContext } from '../app/context/SettingsContext';
import { useOverlayChromeContext } from '../app/context/OverlayChromeContext';
import { useOverlayToastContext } from '../app/context/OverlayToastContext';
import { useActivityContext } from '../app/context/ActivityContext';
import soundSystem from '../lib/SoundSystem';
import { createCommandRegistry } from '../lib/commandRegistry';
import { resolveCommand } from '../lib/commandParserUtils';
import { executeCommandLine } from '../lib/terminalParser';
import { getPerformanceFlags } from '../lib/performanceMode';
import type { CommandContext, TerminalResult } from '../lib/commandTypes';

interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: Record<number, Record<number, { transcript: string }>>;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const THEME_WORDS = ['cyan', 'purple', 'emerald', 'gold'];

const VIEW_WORD_TO_MODE: Record<string, string> = {
  dense: 'dense',
  compact: 'dense',
  grid: 'grid',
  list: 'list',
  matrix: 'matrix',
  map: 'map',
  constellation: 'constellation',
  stars: 'constellation',
};

// Command names voice is allowed to trigger via the shared registry. Voice
// only wires up real state for these (see `commandContext` below), so
// anything else stays out of reach even if `resolveCommand` would match it —
// letting arbitrary registry commands through here would silently no-op
// against the stub context instead of actually doing anything.
const VOICE_ALLOWED_COMMANDS = new Set(['theme', 'view', 'lockdown', 'unlock']);

/** Translate loose spoken phrasing into a `command [arg]` line the shared registry understands. */
function voicePhraseToCommandLine(cmd: string): string {
  if (cmd.includes('theme')) {
    const word = THEME_WORDS.find((theme) => cmd.includes(theme));
    return word ? `theme ${word}` : 'theme';
  }

  if (cmd.includes('layout') || cmd.includes('view') || cmd.includes('mode')) {
    const mode = Object.entries(VIEW_WORD_TO_MODE).find(([word]) => cmd.includes(word))?.[1];
    return mode ? `view ${mode}` : 'view';
  }

  if (cmd.includes('lockdown')) {
    const disable = cmd.includes('disable') || cmd.includes('off') || cmd.includes('cancel');
    return disable ? 'unlock' : 'lockdown';
  }

  return cmd;
}

export default function useVoiceCommand() {
  const { setSearchQuery } = useBrowserActions();
  const { changeTheme, handleDisplayModeChange } = useSettingsContext();
  const { setIsLockdown } = useOverlayChromeContext();
  const { addToast } = useOverlayToastContext();
  const { addActivityLog } = useActivityContext();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && (!!window.SpeechRecognition || !!window.webkitSpeechRecognition);
  });

  // Voice drives the shared command registry (same one the terminal and Omni
  // palette use) instead of a parallel `includes` DSL, so new registry
  // commands don't need a second implementation to become voice-accessible.
  // It only exercises `theme` / `view` / `lockdown` / `unlock` today (see
  // VOICE_ALLOWED_COMMANDS), so most of this context is inert stub state —
  // wiring the rest up is only worth it once voice grows into those commands.
  const commandContext = useMemo<CommandContext>(() => ({
    addActivityLog,
    activeFilters: [],
    changeTheme,
    favorites: [],
    handleDisplayModeChange,
    handleProjectSelect: () => {},
    projectsMatchingQuery: [],
    setCurrentPage: () => {},
    setIsCrtEnabled: () => {},
    setIsHoloTerminalOpen: () => {},
    setIsLockdown,
    setIsMatrixMode: () => {},
    setIsSoundEnabled: () => {},
    setPerformanceMode: () => {},
    rerollPerformance: () => {},
    setRandomSeed: () => {},
    setSortOption: () => {},
    toggleFavorite: () => {},
    toggleFilter: () => {},
    replaceFavorites: () => {},
    setActiveFilters: () => {},
    isCrtEnabled: false,
    isHoloTerminalOpen: false,
    isLockdown: false,
    isMatrixMode: false,
    isSoundEnabled: false,
    performanceMode: 'auto',
    effectiveMode: 'auto',
    flags: getPerformanceFlags('lite'),
  }), [addActivityLog, changeTheme, handleDisplayModeChange, setIsLockdown]);

  const commandRegistry = useMemo(() => createCommandRegistry(commandContext), [commandContext]);

  const reportResult = useCallback((cmd: string, result: TerminalResult) => {
    if (result.text.startsWith('ERR:')) {
      soundSystem.playAlert();
      addToast(result.text, 'warning');
      return;
    }
    soundSystem.playSuccess();
    addToast(`Voice command executed: "${cmd}"`, 'success');
  }, [addToast]);

  const processCommand = useCallback((cmd: string) => {
    if (cmd.includes('search')) {
      const term = cmd.replace('search for', '').replace('search', '').trim();
      if (term) {
        setSearchQuery(term);
        soundSystem.playSuccess();
        addToast(`Searching for: ${term}`, 'success');
      }
      return;
    }

    const commandLine = voicePhraseToCommandLine(cmd);
    const commandName = commandLine.split(/\s+/)[0];
    const resolved = commandName ? resolveCommand(commandName, commandRegistry) : undefined;

    if (!resolved || !VOICE_ALLOWED_COMMANDS.has(resolved.name)) {
      addToast(`Unknown voice command: ${cmd}`, 'warning');
      return;
    }

    const result = executeCommandLine(commandLine, commandContext, commandRegistry);
    reportResult(cmd, result);
  }, [commandContext, commandRegistry, reportResult, setSearchQuery, addToast]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        soundSystem.playClick();
        addActivityLog('VOICE_PROTOCOL: LISTENING...');
      };

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current]![0]!.transcript.toLowerCase();
        setTranscript(result);
        addActivityLog(`VOICE_PROTOCOL: "${result}"`);
        processCommand(result);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [addActivityLog, processCommand]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening
  };
}
