import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods, NodeObject, LinkObject } from 'react-force-graph-2d';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useSettingsContext } from '../app/context/SettingsContext';
import { CATEGORY_THEMES } from '../constants';
import type { Project } from '../types';

interface GraphNode {
  name: string;
  group: string;
  val: number;
  project: Project;
  color: string;
}

interface GraphLink {
  value: number;
  color: string;
}

// Compute link similarities based on shared tags and categories
const computeGraphData = (projects: Project[]) => {
  const nodes = projects.map(p => ({
    id: p.id,
    name: p.title,
    group: p.tags[0] || 'Misc',
    val: 1.5,
    project: p,
    // CATEGORY_THEMES maps categories to a swatch array, not a single color —
    // p.tags[0] is a tag (not a Category), so this lookup always misses and
    // falls through to the fallback, matching the pre-existing behavior.
    color: (CATEGORY_THEMES as unknown as Record<string, string | undefined>)[p.tags[0]] || '#2dd4bf' // fallback to accent cyan
  }));

  const links: { source: number; target: number; value: number; color: string }[] = [];

  // Calculate Jaccard similarity for all pairs
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const p1 = nodes[i].project;
      const p2 = nodes[j].project;

      const tags1 = new Set(p1.tags || []);
      const tags2 = new Set(p2.tags || []);

      let intersection = 0;
      for (const tag of tags1) {
        if (tags2.has(tag)) intersection++;
      }

      if (intersection > 0) {
        const union = new Set([...tags1, ...tags2]).size;
        const similarity = intersection / union;

        // Only connect nodes with significant similarity to avoid hairballs
        if (similarity > 0.1) {
          links.push({
            source: p1.id,
            target: p2.id,
            value: similarity * 5, // Edge thickness based on similarity
            color: 'rgba(255, 255, 255, 0.1)'
          });
        }
      }
    }
  }

  return { nodes, links };
};

export default function SystemMap() {
  const { paginatedProjects } = useBrowserContext();
  const { handleProjectSelect } = useOverlayContext();
  const { theme } = useSettingsContext();
  const graphRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, GraphLink> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoverNode, setHoverNode] = useState<NodeObject<GraphNode> | null>(null);

  // Derive theme colors
  const getThemeColor = useCallback((): string => {
    switch (theme) {
      case 'purple': return '#c084fc'; // purple-400
      case 'emerald': return '#34d399'; // emerald-400
      case 'gold': return '#fbbf24'; // amber-400
      case 'cyan':
      default: return '#2dd4bf'; // cyan-400
    }
  }, [theme]);

  // Compute graph data
  const graphData = useMemo(() => computeGraphData(paginatedProjects), [paginatedProjects]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', updateDimensions);
    // Initial size
    setTimeout(updateDimensions, 0);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Center graph on load
  useEffect(() => {
    if (graphRef.current) {
       // Warmup physics then fit view
       setTimeout(() => {
           graphRef.current?.zoomToFit(400, 50);
       }, 500);
    }
  }, [graphData]);

  // Custom node rendering for sci-fi look
  const paintNode = useCallback((node: NodeObject<GraphNode>, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 12/globalScale;
    const x = node.x ?? 0;
    const y = node.y ?? 0;
    ctx.font = `${fontSize}px monospace`;

    // Draw pulsing halo for hovered node
    if (hoverNode === node) {
       ctx.beginPath();
       ctx.arc(x, y, node.val * 2 + 4, 0, 2 * Math.PI, false);
       ctx.fillStyle = `${getThemeColor()}33`; // 20% opacity
       ctx.fill();

       ctx.beginPath();
       ctx.arc(x, y, node.val * 2 + 8, 0, 2 * Math.PI, false);
       ctx.strokeStyle = `${getThemeColor()}66`; // 40% opacity
       ctx.lineWidth = 1/globalScale;
       ctx.stroke();
    }

    // Node core
    ctx.beginPath();
    ctx.arc(x, y, node.val * 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = hoverNode === node ? getThemeColor() : node.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5/globalScale;
    ctx.stroke();

    // Text Label (only show when zoomed in or hovered)
    if (globalScale > 1.5 || hoverNode === node) {
       ctx.textAlign = 'center';
       ctx.textBaseline = 'middle';
       ctx.fillStyle = hoverNode === node ? '#fff' : 'rgba(255,255,255,0.7)';
       ctx.fillText(label, x, y + node.val * 2 + fontSize);
    }
  }, [hoverNode, getThemeColor]);

  const paintLink = useCallback((link: LinkObject<GraphNode, GraphLink>, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = link.source as NodeObject<GraphNode> | undefined;
    const target = link.target as NodeObject<GraphNode> | undefined;
    ctx.beginPath();
    ctx.moveTo(source?.x ?? 0, source?.y ?? 0);
    ctx.lineTo(target?.x ?? 0, target?.y ?? 0);

    // Highlight links connected to the hovered node
    const isHovered = hoverNode && (link.source === hoverNode || link.target === hoverNode);
    ctx.strokeStyle = isHovered ? `${getThemeColor()}80` : 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = isHovered ? link.value * 2 / globalScale : link.value / globalScale;
    ctx.stroke();
  }, [hoverNode, getThemeColor]);


  return (
    <div
       ref={containerRef}
       className="w-full h-[600px] bg-black/40 border border-white/10 rounded-xl overflow-hidden relative group backdrop-blur-sm shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] animate-fade-in"
    >
       <div className="absolute top-4 left-4 z-10 font-mono text-xs text-white/50 bg-black/60 px-2 py-1 rounded backdrop-blur-md border border-white/10 pointer-events-none flex flex-col gap-1">
          <span className="text-accent-400 font-bold tracking-widest">NEURAL_MAP_VIEW</span>
          <span className="opacity-70">Nodes: {graphData.nodes.length} | Edges: {graphData.links.length}</span>
       </div>

       <div className="absolute bottom-4 right-4 z-10 font-mono text-[10px] text-white/40 text-right pointer-events-none">
          <p>SCROLL_TO_ZOOM</p>
          <p>DRAG_TO_PAN</p>
       </div>

       {dimensions.width > 0 && (
         <ForceGraph2D<GraphNode, GraphLink>
           ref={graphRef}
           width={dimensions.width}
           height={dimensions.height}
           graphData={graphData}
           nodeCanvasObject={paintNode}
           linkCanvasObject={paintLink}
           nodeRelSize={4}
           linkColor={() => 'rgba(255, 255, 255, 0.1)'}

           // 🌌 CURATOR FEATURE: Interactive Network Traffic Minimap
           // Adding directional particles to simulate live data stream across network edges
           linkDirectionalParticles={2}
           linkDirectionalParticleSpeed={0.005}
           linkDirectionalParticleWidth={1.5}
           linkDirectionalParticleColor={() => getThemeColor()}

           onNodeHover={(node) => setHoverNode(node)}
           onNodeClick={(node) => handleProjectSelect(node.project)}
           enableNodeDrag={true}
           cooldownTicks={100}
           onEngineStop={() => {
              // graphRef.current.zoomToFit(400, 50);
           }}
           d3VelocityDecay={0.3}
         />
       )}
    </div>
  );
}
