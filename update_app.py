import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

replacement = """        {/* Floating Ambient Particles (Out of focus depth) */}
        <div className="absolute top-[15%] left-[10%] w-32 h-32 bg-accent-500/20 rounded-full blur-2xl animate-float-idle" style={{ animationDelay: '0s' }}></div>
        <div className="absolute bottom-[20%] right-[15%] w-48 h-48 bg-purple-500/20 rounded-full blur-3xl animate-float-idle" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[60%] left-[80%] w-24 h-24 bg-cyan-500/20 rounded-full blur-xl animate-float-idle" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-[10%] left-[30%] w-40 h-40 bg-gold-500/10 rounded-full blur-2xl animate-float-idle" style={{ animationDelay: '1s' }}></div>

        {/* Deep Space Grid Layer for Parallax Depth */}
        <div
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

        {/* Base Grid Pattern Overlay */}"""

content = content.replace('        {/* Base Grid Pattern Overlay */}', replacement)

vignette = """        {/* Dynamic Canvas Cursor Trail */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen', zIndex: 1 }}
        />

        {/* Vignette Depth Mask */}
        <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>
      </div>"""

content = content.replace("""        {/* Dynamic Canvas Cursor Trail */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ mixBlendMode: 'screen', zIndex: 1 }}
        />
      </div>""", vignette)

with open('src/App.jsx', 'w') as f:
    f.write(content)
