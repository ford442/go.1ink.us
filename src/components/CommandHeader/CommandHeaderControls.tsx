import soundSystem from '../../lib/SoundSystem';
import type { PerformanceMode, ThemeId } from '../../types';

const PERFORMANCE_MODE_CYCLE: PerformanceMode[] = ['auto', 'balanced', 'lite', 'full', 'random'];

interface CommandHeaderControlsProps {
  isSupported: boolean;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  isCrtEnabled: boolean;
  setIsCrtEnabled: (enabled: boolean) => void;
  theme: ThemeId;
  changeTheme: (theme: ThemeId) => void;
  performanceMode: PerformanceMode;
  setPerformanceMode: (mode: PerformanceMode) => void;
  effectiveMode: PerformanceMode;
  isCheatsheetOpen: boolean;
  setIsCheatsheetOpen: (updater: (prev: boolean) => boolean) => void;
}

export default function CommandHeaderControls({
  isSupported,
  isListening,
  startListening,
  stopListening,
  isSoundEnabled,
  setIsSoundEnabled,
  isCrtEnabled,
  setIsCrtEnabled,
  theme,
  changeTheme,
  performanceMode,
  setPerformanceMode,
  effectiveMode,
  isCheatsheetOpen,
  setIsCheatsheetOpen,
}: CommandHeaderControlsProps) {
  return (
    <>
      {isSupported && (
        <div className="hidden lg:flex items-center gap-2 border-r border-accent-500/30 pr-4">
          <button
            onClick={isListening ? stopListening : startListening}
            className={`relative p-1.5 rounded-full transition-colors ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse-glow shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-accent-400 hover:text-white opacity-70 hover:opacity-100'}`}
            title="Voice Command Protocol"
            aria-label={isListening ? 'Stop voice commands' : 'Start voice commands'}
            aria-pressed={isListening}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            {isListening && <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
        </div>
      )}

      <div className="hidden sm:flex items-center gap-2 border-r border-accent-500/30 pr-4">
         <button
           onClick={() => {
             soundSystem.unlockFromGesture();
             const nextEnabled = !isSoundEnabled;
             setIsSoundEnabled(nextEnabled);
             if (nextEnabled) {
               soundSystem.playAlert();
             }
           }}
           className={`flex items-center gap-1.5 text-xs font-mono transition-colors ${isSoundEnabled ? 'text-accent-400' : 'text-gray-300 hover:text-white'}`}
           aria-label={`System audio ${isSoundEnabled ? 'on' : 'off'}`}
           aria-pressed={isSoundEnabled}
         >
           {isSoundEnabled ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
             </svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
             </svg>
           )}
           <span>AUDIO: {isSoundEnabled ? 'ON' : 'OFF'}</span>
         </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 border-r border-accent-500/30 pr-4">
         <span className="opacity-50 text-accent-200/70 mr-1">CRT:</span>
         <button
           onClick={() => {
             const newState = !isCrtEnabled;
             setIsCrtEnabled(newState);
             if (newState) {
               soundSystem.playClick();
             }
           }}
           className={`text-accent-400 hover:text-white transition-colors ${!isCrtEnabled ? 'opacity-50' : ''}`}
           aria-label={`CRT scanline effect ${isCrtEnabled ? 'on' : 'off'}`}
           aria-pressed={isCrtEnabled}
         >
           {isCrtEnabled ? (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
               <line x1="8" y1="21" x2="16" y2="21"></line>
               <line x1="12" y1="17" x2="12" y2="21"></line>
             </svg>
           ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
               <line x1="8" y1="21" x2="16" y2="21"></line>
               <line x1="12" y1="17" x2="12" y2="21"></line>
               <line x1="2" y1="3" x2="22" y2="17"></line>
             </svg>
           )}
         </button>
      </div>

      <div className="hidden lg:flex items-center gap-2 border-r border-accent-500/30 pr-4">
         <span className="opacity-50 text-accent-200/70 mr-1">THEME:</span>
         <button onClick={() => changeTheme('cyan')} className={`w-3 h-3 rounded-full bg-cyan-400 ${theme === 'cyan' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Cyan theme" aria-pressed={theme === 'cyan'}></button>
         <button onClick={() => changeTheme('purple')} className={`w-3 h-3 rounded-full bg-purple-400 ${theme === 'purple' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Purple theme" aria-pressed={theme === 'purple'}></button>
         <button onClick={() => changeTheme('emerald')} className={`w-3 h-3 rounded-full bg-emerald-400 ${theme === 'emerald' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Emerald theme" aria-pressed={theme === 'emerald'}></button>
         <button onClick={() => changeTheme('gold')} className={`w-3 h-3 rounded-full bg-amber-400 ${theme === 'gold' ? 'ring-2 ring-white scale-125' : 'opacity-50 hover:opacity-100'} transition-all`} aria-label="Gold theme" aria-pressed={theme === 'gold'}></button>
      </div>

      <div className="hidden lg:flex items-center gap-1.5 border-r border-accent-500/30 pr-4">
        <span className="opacity-50 text-accent-200/70 mr-1">PERF:</span>
        <button
          onClick={() => {
            const nextMode = PERFORMANCE_MODE_CYCLE[(PERFORMANCE_MODE_CYCLE.indexOf(performanceMode) + 1) % PERFORMANCE_MODE_CYCLE.length];
            setPerformanceMode(nextMode);
            soundSystem.playClick();
          }}
          className="px-2 py-0.5 rounded bg-black/40 border border-white/10 hover:border-accent-400/50 text-[10px] font-mono text-accent-300 hover:text-white transition-all uppercase"
          aria-label={`Performance mode ${performanceMode} (effective: ${effectiveMode})`}
          title={`Performance Mode: ${performanceMode.toUpperCase()} [Effective: ${effectiveMode.toUpperCase()}] — Click to cycle`}
        >
          {performanceMode === 'auto' ? `AUTO (${effectiveMode.toUpperCase()})` : performanceMode.toUpperCase()}
        </button>
      </div>

      <div className="flex items-center border-r border-accent-500/30 pr-4">
        <button
          onClick={() => {
            soundSystem.playClick();
            setIsCheatsheetOpen(prev => !prev);
          }}
          className={`flex items-center justify-center w-6 h-6 rounded border transition-colors ${
            isCheatsheetOpen
              ? 'bg-accent-500/20 text-accent-300 border-accent-500/50 shadow-[0_0_10px_rgba(var(--rgb-accent-400),0.3)]'
              : 'bg-black/40 text-gray-400 border-white/10 hover:text-white hover:border-white/30'
          }`}
          aria-label={isCheatsheetOpen ? 'Close keyboard shortcuts' : 'Open keyboard shortcuts'}
          aria-pressed={isCheatsheetOpen}
          title="Keyboard Shortcuts Cheatsheet [?]"
        >
          <span className="font-mono text-xs font-bold">?</span>
        </button>
      </div>
    </>
  );
}
