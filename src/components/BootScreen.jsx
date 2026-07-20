import { useActivityContext } from '../app/context/ActivityContext';

export default function BootScreen() {
  const { showBootScreen, isBooting, bootLogs, bootStep, startScan, stopScan, scanProgress } = useActivityContext();
  if (!showBootScreen) return null;

  return (
    <>
  {/* SYS_BOOT Sequence Screen */}
  {showBootScreen && (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center font-mono pointer-events-auto transition-all duration-1000 ${!isBooting ? 'animate-boot-fade pointer-events-none' : ''}`} role="status" aria-live="polite" aria-busy={isBooting} aria-label="System boot sequence">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--rgb-accent-400),0.1),transparent_50%)]"></div>
      <div className="scanline"></div>

      <div className="max-w-2xl w-full px-8 flex flex-col gap-4 relative z-10 text-left">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 border-4 border-accent-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-accent-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-purple-500/50 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-b-purple-400 border-t-transparent border-l-transparent border-r-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl glitch-text" data-text="⚡">⚡</span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-accent-200 tracking-[0.2em] uppercase glitch-text" data-text="CURATOR_OS">CURATOR_OS</h1>
            <p className="text-xs text-accent-500/70 tracking-widest mt-1">v1.0.4 - SYSTEM BOOT</p>
          </div>
        </div>

        <div className="space-y-2 min-h-[300px] flex flex-col">
          {bootLogs.map((log, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="text-accent-500">{`>`}</span>
              <span className={`text-gray-300 font-medium ${(index === bootLogs.length - 1 && bootStep !== 1) ? 'typewriter-text text-accent-400 font-bold' : ''}`}>
                {log}
              </span>
            </div>
          ))}

          {bootStep === 1 && (
            <div className="mt-12 flex flex-col items-center justify-center animate-fade-in self-center">
              <div
                className="relative w-24 h-24 cursor-pointer group"
                onMouseDown={startScan}
                onMouseUp={stopScan}
                onMouseLeave={stopScan}
                onTouchStart={startScan}
                onTouchEnd={stopScan}
              >
                {/* Background SVG */}
                <svg className="absolute inset-0 w-full h-full text-accent-500/20 group-hover:text-accent-500/40 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>

                {/* Scan Progress Overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none transition-all"
                  style={{ height: `${scanProgress}%` }}
                >
                  <svg className="absolute bottom-0 left-0 w-24 h-24 text-accent-400 drop-shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>

                {/* Scanning Line */}
                {scanProgress > 0 && scanProgress < 100 && (
                  <div className="absolute left-0 right-0 h-0.5 bg-white shadow-[0_0_10px_#fff] z-10 pointer-events-none" style={{ bottom: `${scanProgress}%` }}></div>
                )}
              </div>
              <div className="text-xs font-mono text-accent-500/70 mt-6 tracking-widest uppercase">
                {scanProgress === 0 ? 'Hold to Authorize' : `Scanning... ${Math.floor(scanProgress)}%`}
              </div>
            </div>
          )}

          {isBooting && bootStep !== 1 && (
            <div className="flex items-center gap-3 text-sm mt-2">
               <span className="text-accent-500">{`>`}</span>
               <div className="w-2 h-4 bg-accent-400 animate-pulse"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
    </>
  );
}
