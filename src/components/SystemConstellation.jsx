import { Suspense, useCallback, useEffect, useMemo, useRef, useState, lazy } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Line, OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useSettingsContext } from '../app/context/SettingsContext';
import { useEffectsContext } from '../app/context/EffectsContext';
import {
  buildConstellationLayout,
  buildConstellationLinks,
  nodeMap,
} from '../lib/constellationLayout';
import { canUseConstellation3d } from '../lib/webglSupport';
import soundSystem from '../lib/SoundSystem';

const SystemMapFallback = lazy(() => import('./SystemMap'));

const THEME_COLORS = {
  cyan: '#2dd4bf',
  purple: '#c084fc',
  emerald: '#34d399',
  gold: '#fbbf24',
};

const FLY_DURATION_MS = 650;
const FLY_DISTANCE = 10;

function themeAccent(theme) {
  return THEME_COLORS[theme] ?? THEME_COLORS.cyan;
}

function ConstellationLinks({ nodes, links, accent }) {
  const positions = useMemo(() => {
    const map = nodeMap(nodes);
    return links.map((link) => {
      const a = map.get(link.source);
      const b = map.get(link.target);
      if (!a || !b) return null;
      return {
        key: `${link.source}-${link.target}`,
        points: [a.position, b.position],
        opacity: Math.min(0.45, link.strength * 0.35),
      };
    }).filter(Boolean);
  }, [nodes, links]);

  return (
    <>
      {positions.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          color={accent}
          lineWidth={1}
          transparent
          opacity={line.opacity}
        />
      ))}
    </>
  );
}

function StarNode({ node, isHovered, isSelected, onHover, onSelect }) {
  const meshRef = useRef(null);
  const scale = isSelected ? 1.6 : isHovered ? 1.35 : 1;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.5 + node.id) * 0.06;
    meshRef.current.scale.setScalar(scale * pulse);
  });

  return (
    <group position={node.position}>
      <mesh
        ref={meshRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(node.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          onHover(null);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshStandardMaterial
          color={node.color}
          emissive={node.color}
          emissiveIntensity={isSelected ? 1.4 : isHovered ? 1.1 : 0.65}
          toneMapped={false}
        />
      </mesh>
      {(isHovered || isSelected) && (
        <Html distanceFactor={14} center className="pointer-events-none select-none">
          <div className="px-2 py-1 rounded-md bg-black/80 border border-accent-500/40 font-mono text-[10px] text-accent-200 whitespace-nowrap shadow-[0_0_12px_rgba(var(--rgb-accent-400),0.35)]">
            {node.project.icon} {node.project.title}
          </div>
        </Html>
      )}
    </group>
  );
}

function CameraRig({ flyTarget, onFlyComplete, controlsRef }) {
  const { camera } = useThree();
  const flyStart = useRef(null);
  const startPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!flyTarget) {
      flyStart.current = null;
      if (controlsRef.current) controlsRef.current.enabled = true;
      return;
    }

    flyStart.current = performance.now();
    startPos.current.copy(camera.position);
    if (controlsRef.current) controlsRef.current.enabled = false;
  }, [flyTarget, camera, controlsRef]);

  useFrame(() => {
    if (!flyTarget || flyStart.current == null) return;

    const t = Math.min(1, (performance.now() - flyStart.current) / FLY_DURATION_MS);
    const eased = 1 - Math.pow(1 - t, 3);

    const targetPos = new THREE.Vector3(...flyTarget.position);
    const camDest = targetPos.clone().add(new THREE.Vector3(0, 1.5, FLY_DISTANCE));

    camera.position.lerpVectors(startPos.current, camDest, eased);
    camera.lookAt(targetPos);

    if (t >= 1) {
      flyStart.current = null;
      onFlyComplete(flyTarget.project);
    }
  });

  return null;
}

function ConstellationScene({ projects, theme, onSelectProject }) {
  const nodes = useMemo(() => buildConstellationLayout(projects), [projects]);
  const links = useMemo(() => buildConstellationLinks(nodes), [nodes]);
  const accent = themeAccent(theme);
  const controlsRef = useRef(null);
  const [hoverId, setHoverId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);

  const handleSelect = useCallback((node) => {
    soundSystem.playClick();
    setSelectedId(node.id);
    setFlyTarget(node);
  }, []);

  const handleFlyComplete = useCallback((project) => {
    setFlyTarget(null);
    setSelectedId(null);
    onSelectProject(project);
  }, [onSelectProject]);

  return (
    <>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 35, 120]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[10, 20, 10]} intensity={1.2} color={accent} />
      <pointLight position={[-15, -10, -8]} intensity={0.5} color="#6366f1" />
      <Stars radius={80} depth={40} count={1200} factor={3} saturation={0} fade speed={0.6} />

      <ConstellationLinks nodes={nodes} links={links} accent={accent} />

      {nodes.map((node) => (
        <StarNode
          key={node.id}
          node={node}
          isHovered={hoverId === node.id}
          isSelected={selectedId === node.id}
          onHover={setHoverId}
          onSelect={handleSelect}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        minDistance={8}
        maxDistance={70}
        maxPolarAngle={Math.PI * 0.85}
      />

      <CameraRig
        flyTarget={flyTarget}
        onFlyComplete={handleFlyComplete}
        controlsRef={controlsRef}
      />
    </>
  );
}

function ConstellationCanvas({ projects, theme, onSelectProject }) {
  const { flags } = useEffectsContext();

  return (
    <Canvas
      camera={{ position: [0, 8, 42], fov: 55, near: 0.1, far: 200 }}
      dpr={[1, flags.constellation3d ? 1.75 : 1.25]}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        <ConstellationScene
          projects={projects}
          theme={theme}
          onSelectProject={onSelectProject}
        />
      </Suspense>
    </Canvas>
  );
}

function FallbackBanner({ reason, onOpenMap }) {
  return (
    <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-black/70 border border-amber-500/40 backdrop-blur-md">
      <p className="text-[11px] font-mono text-amber-200/90 tracking-wide">
        <span className="text-amber-400 font-bold">3D FALLBACK:</span> {reason} — showing 2D neural map.
      </p>
      <button
        type="button"
        onClick={onOpenMap}
        className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-white/20 text-gray-300 hover:text-white hover:border-white/40 transition-colors"
      >
        Pin map view
      </button>
    </div>
  );
}

export default function SystemConstellation() {
  const { filteredProjects } = useBrowserContext();
  const { handleProjectSelect } = useOverlayContext();
  const { theme, handleDisplayModeChange } = useSettingsContext();
  const { flags } = useEffectsContext();
  const containerRef = useRef(null);
  const [use3d, setUse3d] = useState(null);
  const [fallbackReason, setFallbackReason] = useState('');

  useEffect(() => {
    const ok = canUseConstellation3d(flags.constellation3d);
    if (!ok) {
      if (!flags.constellation3d) {
        setFallbackReason('Performance mode is set to Lite');
      } else {
        setFallbackReason('WebGL unavailable or software renderer detected');
      }
    }
    setUse3d(ok);
  }, [flags.constellation3d]);

  const handleSelect = useCallback((project) => {
    handleProjectSelect(project);
  }, [handleProjectSelect]);

  const openMap = useCallback(() => {
    handleDisplayModeChange('map');
  }, [handleDisplayModeChange]);

  if (use3d === null) {
    return (
      <div className="flex items-center justify-center min-h-[480px] rounded-xl border border-accent-500/20 tinted-glass">
        <span className="font-mono text-accent-400 text-sm tracking-widest uppercase animate-pulse">
          Calibrating stellar array...
        </span>
      </div>
    );
  }

  if (!use3d) {
    return (
      <div className="relative min-h-[480px] rounded-xl border border-accent-500/20 overflow-hidden tinted-glass">
        <FallbackBanner reason={fallbackReason} onOpenMap={openMap} />
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <span className="font-mono text-accent-400 text-xs tracking-widest uppercase animate-pulse">Loading neural map...</span>
          </div>
        }>
          <SystemMapFallback />
        </Suspense>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[480px] h-[min(72vh,720px)] rounded-xl border border-accent-500/30 overflow-hidden tinted-glass shadow-[0_0_30px_rgba(var(--rgb-accent-400),0.12)]"
    >
      <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-black/50 border border-accent-500/30 font-mono text-[10px] text-accent-400 uppercase tracking-[0.2em] pointer-events-none">
        Constellation · {filteredProjects.length} nodes
      </div>
      <p className="sr-only">
        Three-dimensional constellation view. Click a star to fly in and open the project briefing.
      </p>
      <ConstellationCanvas
        projects={filteredProjects}
        theme={theme}
        onSelectProject={handleSelect}
      />
      <div className="absolute bottom-3 right-3 z-10 font-mono text-[9px] text-gray-500 tracking-widest uppercase pointer-events-none">
        Drag to orbit · Scroll to zoom · Click to warp
      </div>
    </div>
  );
}
