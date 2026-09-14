// Purely decorative hover-effect overlays for the grid layout's front face.
// None of these read component props — they're all driven by the
// --mouse-x/--mouse-y/--mouse-percent-x/--mouse-percent-y/--parallax-x/-y
// CSS custom properties that useCardTilt sets directly on the card DOM node.

// Rendered near the top of the front face, before the action buttons.
export function CardGridEffectsTop() {
  return (
    <>
      {/* 🌌 CURATOR FEATURE: Holographic Scanline */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden rounded-xl">
        <div className="w-full h-1 bg-accent-400/50 shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.8)] animate-scanline"></div>
      </div>

      {/* True Holographic Glass Foil */}
      <div
        className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(
            115deg,
            transparent 20%,
            rgba(var(--rgb-accent-400), 0.4) 30%,
            rgba(236, 72, 153, 0.4) 40%,
            rgba(6, 182, 212, 0.4) 50%,
            rgba(251, 191, 36, 0.4) 60%,
            transparent 70%
          )`,
          backgroundSize: '300% 300%',
          backgroundPosition: 'calc(var(--mouse-percent-x, 50%) * 1.5) calc(var(--mouse-percent-y, 50%) * 1.5)',
        }}
      />

      {/* Dynamic Specular Glare */}
      <div
        className="absolute inset-0 pointer-events-none z-30 mix-blend-screen opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl overflow-hidden"
        style={{
          background: `radial-gradient(
            600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
            rgba(255, 255, 255, 0.15),
            transparent 40%
          )`
        }}
      />
    </>
  );
}

// Rendered after the main content section, before the back face.
export function CardGridEffectsOverlay() {
  return (
    <>
      {/* Holographic Scanline on Hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[6]">
        <div className="scanline" style={{ animationDuration: '2s' }}></div>
      </div>

      {/* Dynamic Holographic Spotlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--rgb-accent-400),0.15), transparent 40%)`,
          zIndex: 5, // Ensure it sits nicely in the stack
          mixBlendMode: 'screen' // Added for better blending
        }}
      />

      {/* Holographic Sheen (Rainbow Glass Effect) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-60 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from calc(var(--mouse-percent-x, 50) * 3.6deg) at var(--mouse-x, 50%) var(--mouse-y, 50%), transparent 0deg, rgba(var(--rgb-accent-400),0.4) 60deg, rgba(168, 85, 247, 0.4) 120deg, transparent 180deg)`,
          zIndex: 4,
          mixBlendMode: 'color-dodge',
          filter: 'blur(10px)'
        }}
      />

      {/* Specular Glare (New, replaces shine-effect) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{
          background: `radial-gradient(1000px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.15), transparent 50%)`,
          zIndex: 3,
          mixBlendMode: 'overlay'
        }}
      />

      {/* Neon Spotlight Border (with Pulse) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500 rounded-xl"
        style={{
          zIndex: 15,
          transform: 'translateZ(60px)',
          padding: '1px',
          background: `radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(var(--rgb-accent-400),0.6), transparent 60%)`,
          mask: 'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
          WebkitMask: 'linear-gradient(#fff, #fff) content-box, linear-gradient(#fff, #fff)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          mixBlendMode: 'screen' // Added for better blending
        }}
      />

      {/* 🌌 CURATOR FEATURE: Holographic Scanline on Hover */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" style={{ transform: 'translateZ(70px)' }}>
        <div className="scanline" style={{ animationDuration: '2s' }}></div>
      </div>

      {/* 🌌 CURATOR FEATURE: Sweeping Glass Reflection */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl z-20" style={{ transform: 'translateZ(70px)' }}>
        <div className="glass-reflection" />
      </div>

      {/* 🌌 CURATOR FEATURE: True Holographic Glass Effects with Inner Reflections */}
      <div className="holo-overlay absolute inset-0 pointer-events-none rounded-xl z-10" style={{ transform: 'translateZ(20px)', backgroundPosition: 'calc(var(--mouse-percent-x, 50%) * 2) calc(var(--mouse-percent-y, 50%) * 2)' }}></div>

      {/* Dynamic Inner Rim Light (Refractive edge) */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl z-[25] opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          boxShadow: `inset calc((var(--mouse-percent-x, 50) - 50) * -0.2px) calc((var(--mouse-percent-y, 50) - 50) * -0.2px) 15px rgba(255, 255, 255, 0.4), inset calc((var(--mouse-percent-x, 50) - 50) * -0.5px) calc((var(--mouse-percent-y, 50) - 50) * -0.5px) 2px rgba(var(--rgb-accent-300), 0.5)`,
          transform: 'translateZ(40px)',
          mixBlendMode: 'screen'
        }}
      />

      {/* Diagonal Glossy Shine moving with mouse */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl z-[26] opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden"
        style={{ transform: 'translateZ(50px)' }}
      >
        <div
          className="absolute inset-[-100%] w-[300%] h-[300%] transition-transform duration-100 ease-out"
          style={{
            background: `linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 52%, transparent 60%)`,
            transform: `translate(calc((var(--mouse-percent-x, 50) - 50) * -1%), calc((var(--mouse-percent-y, 50) - 50) * -1%))`,
            mixBlendMode: 'color-dodge'
          }}
        />
      </div>

      {/* 🌌 CURATOR FEATURE: Tactical Hover Brackets (Targeting Reticle) */}
      <div className="absolute inset-0 pointer-events-none z-30" style={{ transform: 'translateZ(80px)' }}>
        {/* Top Left */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 -translate-y-2 group-hover:translate-x-1 group-hover:translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-tl-sm"></div>
        {/* Top Right */}
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 -translate-y-2 group-hover:-translate-x-1 group-hover:translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-tr-sm"></div>
        {/* Bottom Left */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 translate-y-2 group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-bl-sm"></div>
        {/* Bottom Right */}
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-accent-400 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-2 translate-y-2 group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.8)] rounded-br-sm"></div>
      </div>

      {/* 🌌 CURATOR FEATURE: Dynamic Mouse-Follow Glare */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(255,255,255,0.15) 0%, transparent 60%)`,
          mixBlendMode: 'overlay',
          transform: 'translateZ(30px)'
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none rounded-xl z-[15] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at var(--mouse-percent-x, 50%) var(--mouse-percent-y, 50%), rgba(var(--rgb-accent-400), 0.1) 0%, transparent 50%)`,
          mixBlendMode: 'screen',
          transform: 'translateZ(30px)'
        }}
      />
    </>
  );
}
