import { useEffect, useMemo, useState } from 'react';
import AudioVisualizer from './AudioVisualizer';
import Clock from './Clock';
import TelemetryGraph from './TelemetryGraph';
import soundSystem from '../lib/SoundSystem';
import { formatNetTelemetry } from '../lib/projectConnectivity';
import { useSettingsContext } from '../app/context/SettingsContext';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useOverlayContext } from '../app/context/OverlayContext';
import useVoiceCommand from '../hooks/useVoiceCommand';
import useOnlineStatus from '../hooks/useOnlineStatus';

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function CommandHeader() {
  const { isSoundEnabled, setIsSoundEnabled, isCrtEnabled, setIsCrtEnabled, theme, changeTheme, isGodMode } = useSettingsContext();
  const { totalProjects } = useBrowserContext();
  const { isCheatsheetOpen, setIsCheatsheetOpen } = useOverlayContext();
  const { isSupported, isListening, startListening, stopListening } = useVoiceCommand();
  const isOnline = useOnlineStatus();

  const netTelemetry = useMemo(() => formatNetTelemetry(), []);

  const [systemStats, setSystemStats] = useState(() => ({
    uptime: 0,
    liveNodes: netTelemetry.live,
    totalNodes: netTelemetry.total,
    catalogPct: netTelemetry.pct,
  }));

  useEffect(() => {
    const start = Date.now();
    const slowTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      setSystemStats((prev) => ({
        ...prev,
        uptime: elapsed,
      }));
    }, 1000);

    return () => clearInterval(slowTimer);
  }, []);

  const netLabel = `${systemStats.liveNodes}/${systemStats.totalNodes}`;

  return (
    <>
  <div className="fixed top-0 left-0 right-0 z-50 tinted-glass backdrop-blur-xl border-b border-accent-500/30 text-xs font-mono shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.15)] drop-shadow">
    {!isOnline && (
      <div
        className="bg-amber-950/95 border-b border-amber-500/40 px-4 py-1 text-center text-[10px] font-mono tracking-widest text-amber-200"
        role="status"
        aria-live="polite"
      >
        OFFLINE PROTOCOL — browsing cached catalog. External project nodes unavailable until reconnect.
      </div>
    )}
    <div className="py-1.5 px-4 flex justify-between items-center">
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${!isOnline ? 'bg-amber-400' : systemStats.liveNodes === systemStats.totalNodes ? 'bg-green-400' : systemStats.liveNodes > 0 ? 'bg-amber-400' : 'bg-gray-400'} animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]`} />
        <span className={`${!isOnline ? 'text-amber-300' : systemStats.liveNodes === systemStats.totalNodes ? 'text-green-400' : systemStats.liveNodes > 0 ? 'text-amber-400' : 'text-gray-400'} tracking-wider font-bold`}>
          {!isOnline ? 'SYS.OFFLINE' : systemStats.liveNodes > 0 ? 'SYS.ONLINE' : 'SYS.DEGRADED'}
        </span>
      </div>
      {isGodMode && (
        <div className="flex items-center gap-2 border-l border-accent-500/30 pl-4">
          <span className="text-amber-400 font-bold tracking-widest animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]">OVERCLOCKED</span>
        </div>
      )}
      <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">UPTIME:</span>
        <span className="text-accent-100">{formatUptime(systemStats.uptime)}</span>
      </div>

      <div className="hidden md:flex items-center gap-2 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">CAT:</span>
        <div className="w-16 h-1.5 bg-black/50 rounded-full overflow-hidden border border-accent-500/30">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${systemStats.catalogPct}%`,
              backgroundColor: systemStats.catalogPct > 80 ? 'rgb(var(--rgb-accent-400))' : systemStats.catalogPct > 50 ? '#eab308' : '#ef4444',
            }}
          />
        </div>
        <span className="text-accent-100 text-[10px] w-8">{systemStats.catalogPct}%</span>
      </div>

      <div className="hidden md:flex items-center gap-2 border-l border-accent-500/30 pl-4" title="Catalog nodes reachable at last build probe">
        <span className="opacity-50">NET:</span>
        <span className="text-accent-100">{netLabel} LIVE</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 border-l border-accent-500/30 pl-4">
        <span className="opacity-50">PRJ:</span>
        <span className="text-accent-100">{totalProjects}</span>
      </div>

      <div className="hidden lg:flex items-center">
        <Clock precision="seconds" label="SYS.TIME:" />
      </div>
    </div>

    <div className="flex items-center gap-4">
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

      <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
         <span className="opacity-50">CAT:</span>
         <span className="text-accent-100 min-w-[28px] tabular-nums">{systemStats.catalogPct}%</span>
         <div className="ml-1 border border-accent-500/30 rounded overflow-hidden">
            <TelemetryGraph value={systemStats.catalogPct} max={100} width={40} height={16} />
         </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4" title="Reachable catalog nodes">
         <span className="opacity-50">NET:</span>
         <span className="text-accent-100 min-w-[52px] tabular-nums">{netLabel}</span>
         <div className="ml-1 border border-accent-500/30 rounded overflow-hidden">
            <TelemetryGraph value={systemStats.liveNodes} max={Math.max(systemStats.totalNodes, 1)} width={40} height={16} />
         </div>
      </div>
      <div className="hidden md:flex items-center gap-2 text-accent-200/70 border-r border-accent-500/30 pr-4">
         <span className="opacity-50">PRJ:</span>
         <span className="text-accent-100 min-w-[28px] tabular-nums">{totalProjects}</span>
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

      <div className="hidden md:flex">
         <AudioVisualizer theme={theme} />
      </div>
      <Clock precision="milliseconds" />
    </div>
    </div>
  </div>
    </>
  );
}
