import Starfield from '../Starfield';
import ParticleNetwork from '../ParticleNetwork';
import MatrixRain from '../MatrixRain';
import { useAppContext } from '../AppContext';

export default function BackgroundElements() {
  const { starfieldRef, deepGridRef, baseGridRef, gridSpotlightRef, canvasRef, isMatrixMode, theme } = useAppContext();

  return (
    <>
  {/* Background Elements */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
    {isMatrixMode ? <MatrixRain theme={theme} /> : <ParticleNetwork theme={theme} />}

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
