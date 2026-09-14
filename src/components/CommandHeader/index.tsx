import { useEffect, useMemo, useState } from 'react';
import AudioVisualizer from '../AudioVisualizer';
import Clock from '../Clock';
import { formatNetTelemetry } from '../../lib/projectConnectivity';
import { useSettingsContext } from '../../app/context/SettingsContext';
import { useBrowserContext } from '../../app/context/BrowserContext';
import { useOverlayContext } from '../../app/context/OverlayContext';
import { useEffectsContext } from '../../app/context/EffectsContext';
import useVoiceCommand from '../../hooks/useVoiceCommand';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import { CommandHeaderStatusChips, CommandHeaderTelemetry } from './CommandHeaderStatus';
import CommandHeaderControls from './CommandHeaderControls';

export default function CommandHeader() {
  const { isSoundEnabled, setIsSoundEnabled, isCrtEnabled, setIsCrtEnabled, theme, changeTheme, isGodMode } = useSettingsContext();
  const { totalProjects } = useBrowserContext();
  const { isCheatsheetOpen, setIsCheatsheetOpen } = useOverlayContext();
  const { performanceMode, setPerformanceMode, effectiveMode } = useEffectsContext();
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
    <CommandHeaderStatusChips
      isOnline={isOnline}
      systemStats={systemStats}
      isGodMode={isGodMode}
      totalProjects={totalProjects}
      netLabel={netLabel}
    />

    <div className="flex items-center gap-4">
      <CommandHeaderControls
        isSupported={isSupported}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        isSoundEnabled={isSoundEnabled}
        setIsSoundEnabled={setIsSoundEnabled}
        isCrtEnabled={isCrtEnabled}
        setIsCrtEnabled={setIsCrtEnabled}
        theme={theme}
        changeTheme={changeTheme}
        performanceMode={performanceMode}
        setPerformanceMode={setPerformanceMode}
        effectiveMode={effectiveMode}
        isCheatsheetOpen={isCheatsheetOpen}
        setIsCheatsheetOpen={setIsCheatsheetOpen}
      />

      <CommandHeaderTelemetry systemStats={systemStats} netLabel={netLabel} totalProjects={totalProjects} />

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
