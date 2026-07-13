import Starfield from '../Starfield';
import ParticleNetwork from '../ParticleNetwork';
import MatrixRain from '../MatrixRain';
import { useEffectsContext } from '../context/EffectsContext';
import { useSettingsContext } from '../context/SettingsContext';
import { useOverlayContext } from '../context/OverlayContext';

export default function BackgroundElements() {
  const { starfieldRef, deepGridRef, baseGridRef, gridSpotlightRef, canvasRef } = useEffectsContext();
  const { isMatrixMode, theme, isGodMode } = useSettingsContext();
  const { isWarping } = useOverlayContext();

  return (
    <>
  {/* Background Elements */}
  <div className={`fixed inset-0 overflow-hidden pointer-events-none transition-all duration-700 ${isWarping ? 'opacity-30 blur-sm scale-110' : 'opacity-100 scale-100'}`}>
    <div style={{
      transform: 'translate(calc(var(--parallax-x, 0) * -2%), calc(var(--parallax-y, 0) * -2%))',
      transition: 'transform 0.1s ease-out',
      position: 'absolute',
      inset: '-5%',
      width: '110%',
      height: '110%'
    }}>
      <Starfield ref={starfieldRef} />
    </div>

    {/* Deep Parallax Orbs for Enhanced Depth Layering */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
       <div className="absolute top-[20%] left-[10%] w-[40rem] h-[40rem] bg-accent-600/10 rounded-full blur-[100px] animate-blob"></div>
       <div className="absolute top-[60%] right-[10%] w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-[120px] animate-blob" style={{ animationDelay: '2s' }}></div>
       <div className="absolute -bottom-32 left-[40%] w-[35rem] h-[35rem] bg-accent-500/10 rounded-full blur-[90px] animate-blob" style={{ animationDelay: '4s' }}></div>
    </div>

    {/* Interactive Particle Network or Matrix Rain */}
    {isMatrixMode ? <MatrixRain theme={theme} /> : <ParticleNetwork theme={theme} isGodMode={isGodMode} />}

    {/* Foreground Floating Tech Debris (Extreme Depth Layering) */}
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden mix-blend-screen">
      <svg className="absolute top-[20%] left-[15%] w-16 h-16 text-accent-500/40 blur-[4px] animate-[float-idle_12s_ease-in-out_infinite]" style={{ transform: 'translate(calc(var(--parallax-x, 0) * 3%), calc(var(--parallax-y, 0) * 3%)) scale(2)' }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" strokeDasharray="4 4" className="animate-[spin_40s_linear_infinite]" />
        <circle cx="50" cy="50" r="10" />
      </svg>

      <svg className="absolute top-[65%] right-[12%] w-24 h-24 text-purple-500/30 blur-[6px] animate-[float-idle_15s_ease-in-out_infinite_reverse]" style={{ transform: 'translate(calc(var(--parallax-x, 0) * 4%), calc(var(--parallax-y, 0) * 4%)) scale(3)' }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M50 0 L50 100 M0 50 L100 50" strokeDasharray="5 5" className="animate-pulse" />
        <circle cx="50" cy="50" r="30" strokeDasharray="10 10" className="animate-[spin_20s_linear_infinite]" />
      </svg>

      <svg className="absolute bottom-[15%] left-[25%] w-12 h-12 text-accent-400/50 blur-[3px] animate-[float-idle_10s_ease-in-out_infinite]" style={{ transform: 'translate(calc(var(--parallax-x, 0) * 2.5%), calc(var(--parallax-y, 0) * 2.5%)) scale(1.5)', animationDelay: '2s' }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="25" y="25" width="50" height="50" className="animate-[spin_30s_linear_infinite_reverse]" />
        <rect x="45" y="45" width="10" height="10" fill="currentColor" className="animate-pulse" />
      </svg>

      <svg className="absolute top-[30%] right-[30%] w-20 h-20 text-emerald-500/20 blur-[5px] animate-[float-idle_18s_ease-in-out_infinite]" style={{ transform: 'translate(calc(var(--parallax-x, 0) * 5%), calc(var(--parallax-y, 0) * 5%)) scale(2.5)', animationDelay: '4s' }} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="50" cy="50" r="45" strokeDasharray="2 4 8 4" className="animate-[spin_25s_linear_infinite]" />
        <circle cx="50" cy="50" r="25" strokeDasharray="1 5" className="animate-[spin_15s_linear_infinite_reverse]" />
      </svg>
    </div>

    {/* Floating Ambient Particles (Out of focus depth) — theme-cohesive nebula layers */}
    <div className="absolute top-[15%] left-[10%] w-32 h-32 bg-accent-500/20 rounded-full blur-2xl animate-float-idle" style={{ animationDelay: '0s' }}></div>
    <div className="absolute bottom-[20%] right-[15%] w-48 h-48 bg-purple-500/15 rounded-full blur-3xl animate-float-idle" style={{ animationDelay: '2s' }}></div>
    <div className="absolute top-[60%] left-[80%] w-24 h-24 bg-accent-400/20 rounded-full blur-xl animate-float-idle" style={{ animationDelay: '4s' }}></div>
    <div className="absolute bottom-[10%] left-[30%] w-40 h-40 bg-amber-400/12 rounded-full blur-2xl animate-float-idle" style={{ animationDelay: '1s' }}></div>
    <div className="absolute top-[35%] right-[25%] w-28 h-28 bg-accent-300/10 rounded-full blur-3xl animate-float-idle" style={{ animationDelay: '3.2s' }}></div>

    {/* Deep Space Grid Layer for Parallax Depth */}
    <div
      ref={deepGridRef}
      className="absolute inset-[-5%] w-[110%] h-[110%] opacity-20 pointer-events-none"
      style={{
        backgroundSize: '120px 120px',
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        maskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
        transform: 'translate(calc(var(--parallax-x, 0) * -0.5%), calc(var(--parallax-y, 0) * -0.5%))',
        transition: 'transform 0.1s ease-out'
      }}
    ></div>

    {/* Base Grid Pattern Overlay */}
    <div
      ref={baseGridRef}
      className="absolute inset-[-5%] w-[110%] h-[110%] opacity-50"
      style={{
        backgroundSize: '60px 60px',
        backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        maskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle at center, black 10%, transparent 80%)',
        transform: 'translate(calc(var(--parallax-x, 0) * -1%), calc(var(--parallax-y, 0) * -1%))',
        transition: 'transform 0.1s ease-out'
      }}
    ></div>

    {/* Spotlight Grid Overlay (Revealed by Mouse) */}
    <div
      ref={gridSpotlightRef}
      className="absolute inset-0"
      style={{
        backgroundSize: '60px 60px',
        backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400),0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400),0.15) 1px, transparent 1px)',
        maskImage: 'transparent', // Initially invisible, updated by JS
        WebkitMaskImage: 'transparent'
      }}
    ></div>

    {/* Dynamic Canvas Cursor Trail */}
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen', zIndex: 1 }}
    />

    {/* Vignette Depth Mask */}
    <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
  </div>
    </>
  );
}
