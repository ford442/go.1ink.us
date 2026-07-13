import { AnimatePresence } from 'framer-motion';
import OmniPalette from './OmniPalette';
import Screensaver from '../effects/Screensaver';
import projectData from '../data/projectData';
import Toast from './Toast';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useSettingsContext } from '../app/context/SettingsContext';
import { useActivityContext } from '../app/context/ActivityContext';

export default function SystemOverlays() {
  const { isOmniOpen, setIsOmniOpen, handleProjectSelect, isLockdown, setIsLockdown, isIdle, clickEffects, toasts, removeToast } = useOverlayContext();
  const { activeFilters, toggleFilter, sortOption, setSortOption } = useBrowserContext();
  const { theme, changeTheme, isCrtEnabled, setIsCrtEnabled, isMatrixMode, setIsMatrixMode, isSoundEnabled, setSoundEnabled, displayMode, setDisplayMode } = useSettingsContext();
  const { isBooting } = useActivityContext();

  return (
    <>
      <OmniPalette
        isOpen={isOmniOpen}
        onClose={() => setIsOmniOpen(false)}
        projects={projectData}
        onProjectSelect={handleProjectSelect}
        activeFilters={activeFilters}
        onToggleFilter={toggleFilter}
        currentTheme={theme}
        onChangeTheme={changeTheme}
        isCrtEnabled={isCrtEnabled}
        onToggleCrt={() => setIsCrtEnabled(!isCrtEnabled)}
        isMatrixMode={isMatrixMode}
        onToggleMatrixMode={() => setIsMatrixMode(!isMatrixMode)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        isLockdown={isLockdown}
        onToggleLockdown={() => setIsLockdown(!isLockdown)}
        displayMode={displayMode}
        onChangeDisplayMode={setDisplayMode}
        sortOption={sortOption}
        onChangeSortOption={setSortOption}
      />

      {isIdle && !isBooting && <Screensaver />}
  {/* System Lockdown Overlay */}
  {isLockdown && (
    <div className="fixed inset-0 z-[9998] pointer-events-none flex flex-col items-center justify-center">
      <div className="absolute inset-0 animate-pulse bg-red-900/20 shadow-[inset_0_0_100px_rgba(255,0,0,0.5)]"></div>
      <div className="bg-red-900/80 text-white font-mono text-2xl md:text-4xl px-8 py-4 border-y-4 border-red-500 w-full text-center animate-pulse shadow-[0_0_50px_rgba(255,0,0,0.8)] backdrop-blur-sm z-10">
        <span className="animate-pulse">⚠️ SYSTEM LOCKDOWN ACTIVE - ACCESS DENIED ⚠️</span>
      </div>
    </div>
  )}

  {/* Tactical Click Ripples */}
  <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
    {clickEffects.map(effect => (
      <div
        key={effect.id}
        className="absolute rounded-full border border-cyan-400 animate-tactical-ripple"
        style={{
          left: effect.x - 20, // Center the 40x40 circle
          top: effect.y - 20,
          width: '40px',
          height: '40px',
        }}
      />
    ))}
  </div>

  {/* Toast Notifications Container */}
  <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
    <AnimatePresence>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </AnimatePresence>
  </div>
    </>
  );
}
