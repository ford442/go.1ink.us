import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import type { ElementRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useGroundStationContext } from '../app/context/GroundStationContext';
import { useOverlayModalContext } from '../app/context/OverlayModalContext';
import { buildConstellationLayout } from '../lib/constellationLayout';
import type { ConstellationNode } from '../lib/constellationLayout';
import { GLOBE_RADIUS, globePosition, globeSnapshot } from '../lib/orbitalGlobe';
import { projectsToTracks } from '../lib/orbitalOps';
import soundSystem from '../lib/SoundSystem';
import type { EnhancedProject } from '../types';
import useOrbitalClock from './OrbitalOps/useOrbitalClock';
import { CameraRig, StarNode } from './SystemConstellationWebGL';
import ConstellationOrbitalOverlay from './OrbitalOps/ConstellationOrbitalOverlay';

function Globe({ projects, onSelectProject }: { projects: EnhancedProject[]; onSelectProject: (project: EnhancedProject) => void }) {
  const { frame } = useGroundStationContext();
  const now = useOrbitalClock(1000);
  const tracks = useMemo(() => projectsToTracks(projects), [projects]);
  const nodes = useMemo(() => buildConstellationLayout(projects), [projects]);
  const snapshot = useMemo(() => globeSnapshot(frame, tracks, now), [frame, tracks, now]);
  const controlsRef = useRef<ElementRef<typeof OrbitControls> | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [flyTarget, setFlyTarget] = useState<ConstellationNode | null>(null);

  const select = useCallback((node: ConstellationNode) => {
    soundSystem.playClick();
    setFlyTarget(node);
  }, []);
  const complete = useCallback((project: EnhancedProject) => {
    setFlyTarget(null);
    onSelectProject(project);
  }, [onSelectProject]);

  const satelliteById = new Map(snapshot.map((satellite) => [satellite.projectId, satellite]));
  const station = globePosition(frame.ecef);

  return (
    <>
      <color attach="background" args={['#020617']} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 20]} intensity={2} />
      {tracks.length > 0 && (
        <>
          <mesh>
            <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
            <meshStandardMaterial color="#103c55" roughness={0.85} />
          </mesh>
          <mesh>
            <sphereGeometry args={[GLOBE_RADIUS * 1.002, 24, 16]} />
            <meshBasicMaterial color="#32b7d4" wireframe transparent opacity={0.2} />
          </mesh>
          <mesh position={station}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshBasicMaterial color="#fbbf24" />
          </mesh>
        </>
      )}
      {nodes.map((node) => {
        const satellite = satelliteById.get(node.id);
        const positioned = satellite ? { ...node, position: satellite.position } : node;
        return (
          <group key={node.id}>
            {satellite && (
              <>
                <lineLoop>
                  <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[new Float32Array(satellite.ring.flat()), 3]} />
                  </bufferGeometry>
                  <lineBasicMaterial color={node.color} transparent opacity={0.7} />
                </lineLoop>
                {satellite.visible && (
                  <line>
                    <bufferGeometry>
                      <bufferAttribute attach="attributes-position" args={[new Float32Array([...station, ...satellite.position]), 3]} />
                    </bufferGeometry>
                    <lineBasicMaterial color="#fbbf24" transparent opacity={0.8} />
                  </line>
                )}
              </>
            )}
            <StarNode node={positioned} isHovered={hoverId === node.id} isSelected={flyTarget?.id === node.id} onHover={setHoverId} onSelect={select} />
          </group>
        );
      })}
      <OrbitControls ref={controlsRef} enablePan enableZoom minDistance={8} maxDistance={70} />
      <CameraRig flyTarget={flyTarget} onFlyComplete={complete} controlsRef={controlsRef} />
    </>
  );
}

export default function SystemConstellationGpu({ onFailure }: { onFailure: () => void }) {
  const { filteredProjects } = useBrowserContext();
  const { handleProjectSelect } = useOverlayModalContext();

  return (
    <div className="relative w-full min-h-[480px] h-[min(72vh,720px)] rounded-xl border border-accent-500/30 overflow-hidden tinted-glass">
      <div className="absolute top-3 left-3 z-10 px-2 py-1 rounded-md bg-black/50 border border-accent-500/30 font-mono text-[10px] text-accent-400 uppercase pointer-events-none">
        WebGPU · {filteredProjects.length} nodes
      </div>
      <p className="sr-only">Earth orbit constellation. Click a satellite or star to open its project briefing.</p>
      <Canvas camera={{ position: [0, 8, 42], fov: 55, near: 0.1, far: 200 }} dpr={[1, 1.75]} gl={async (props) => {
        let renderer: WebGPURenderer | undefined;
        try {
          renderer = new WebGPURenderer({ canvas: props.canvas as HTMLCanvasElement, antialias: true, alpha: false });
          renderer.onDeviceLost = onFailure;
          renderer.onError = onFailure;
          await renderer.init();
          if (!(renderer.backend as unknown as { isWebGPUBackend?: boolean }).isWebGPUBackend) throw new Error('WebGPU unavailable');
          return renderer as unknown as THREE.WebGLRenderer;
        } catch {
          renderer?.dispose();
          onFailure();
          return new Promise<THREE.WebGLRenderer>(() => {});
        }
      }}>
        <Suspense fallback={null}><Globe projects={filteredProjects} onSelectProject={handleProjectSelect} /></Suspense>
      </Canvas>
      <Suspense fallback={null}><ConstellationOrbitalOverlay variant="hud" /></Suspense>
      <div className="absolute bottom-3 right-3 z-10 font-mono text-[9px] text-gray-500 tracking-widest uppercase pointer-events-none">
        Drag to orbit · Scroll to zoom · Click to warp
      </div>
    </div>
  );
}
