import re

with open('src/CustomCursor.jsx', 'r') as f:
    content = f.read()

# Add a ref for telemetry HUD
new_refs = """  const requestRef = useRef(null);
  const telemetryRef = useRef(null);"""
content = content.replace("  const requestRef = useRef(null);", new_refs)

# Update animate function to update telemetry
animate_search = """      if (cursorRingRef.current) {
        // Apply the scale manually here instead of relying on tailwind classes
        // which get overwritten by the transform style
        const scale = isHoveringRef.current ? 1.5 : 1;
        cursorRingRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }"""

animate_replace = """      if (cursorRingRef.current) {
        // Apply the scale manually here instead of relying on tailwind classes
        // which get overwritten by the transform style
        const scale = isHoveringRef.current ? 1.5 : 1;
        cursorRingRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      }

      if (telemetryRef.current) {
        telemetryRef.current.style.transform = `translate3d(${mouse.current.x + 20}px, ${mouse.current.y + 20}px, 0)`;
        telemetryRef.current.innerText = `X:${Math.round(mouse.current.x)} Y:${Math.round(mouse.current.y)}${isHoveringRef.current ? ' LOCK' : ''}`;

        if (isHoveringRef.current) {
           telemetryRef.current.classList.add('text-accent-400');
           telemetryRef.current.classList.remove('text-cyan-500/70');
        } else {
           telemetryRef.current.classList.add('text-cyan-500/70');
           telemetryRef.current.classList.remove('text-accent-400');
        }
      }"""
content = content.replace(animate_search, animate_replace)

# Add the telemetry div
div_search = """        </div>
      </div>
    </>
  );
}"""

div_replace = """        </div>
      </div>
      <div
        ref={telemetryRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] font-mono text-[10px] tracking-widest text-cyan-500/70 drop-shadow-[0_0_2px_rgba(34,211,238,0.5)] transition-colors duration-200"
        style={{ willChange: 'transform' }}
      >
        X:0 Y:0
      </div>
    </>
  );
}"""
content = content.replace(div_search, div_replace)

with open('src/CustomCursor.jsx', 'w') as f:
    f.write(content)
