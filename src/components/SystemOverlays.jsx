import OmniPalette from '../OmniPalette';
import Screensaver from '../Screensaver';
import projectData from '../projectData';
import { useAppContext } from '../AppContext';

export default function SystemOverlays() {
  const { isOmniOpen, setIsOmniOpen, handleProjectSelect, activeFilters, toggleFilter, theme, changeTheme, isCrtEnabled, setIsCrtEnabled, isMatrixMode, setIsMatrixMode, isSoundEnabled, setIsSoundEnabled, isLockdown, setIsLockdown, displayMode, setDisplayMode, isIdle, isBooting, clickEffects, toasts, removeToast, sortOption, setSortOption } = useAppContext();

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
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
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
    {toasts.map(toast => {
      let borderClass, textClass, icon;
      switch (toast.type) {
        case 'success':
          borderClass = 'border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]';
          textClass = 'text-pink-400';
          icon = '💖';
          break;
        case 'warning':
          borderClass = 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
          textClass = 'text-yellow-400';
          icon = '⚠️';
          break;
        case 'error':
          borderClass = 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
          textClass = 'text-red-400';
          icon = '❌';
          break;
        case 'info':
        default:
          borderClass = 'border-accent-500/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)]';
          textClass = 'text-accent-400';
          icon = '🔗';
          break;
      }

      return (
        <div
          key={toast.id}
          className={`${toast.fadingOut ? 'animate-fade-out-right' : 'animate-slide-in-right'} bg-black/80 backdrop-blur-md border ${borderClass} rounded flex items-center gap-3 px-4 py-3 pointer-events-auto cursor-pointer hover:bg-black/90 transition-colors`}
          onClick={() => removeToast(toast.id)}
        >
          <div className="text-lg">{icon}</div>
          <div className={`font-mono text-sm tracking-wide ${textClass}`}>
            {toast.message}
          </div>
        </div>
      );
    })}
  </div>
    </>
  );
}
