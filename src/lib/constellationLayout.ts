import type { Category, EnhancedProject } from '../types';

export const CATEGORY_COLORS: Record<Category, string> = {
  Games: '#f97316',
  'Audio/Visual': '#a855f7',
  Tools: '#3b82f6',
  Experiments: '#10b981',
};

/** Fixed 3D anchors — one cluster per primary category. */
const CATEGORY_ANCHORS: Record<Category, [number, number, number]> = {
  Games: [20, 4, 0],
  'Audio/Visual': [-20, 4, 0],
  Tools: [0, -12, 18],
  Experiments: [0, 12, -18],
};

const GOLDEN_ANGLE = 2.399963229728653;

export interface ConstellationNode {
  id: number;
  project: EnhancedProject;
  category: Category;
  position: [number, number, number];
  color: string;
}

export interface ConstellationLink {
  source: number;
  target: number;
  strength: number;
}

function primaryCategory(project: EnhancedProject): Category {
  const cats = project.categorySet ? [...project.categorySet] : [];
  if (cats.length > 0) return cats[0];
  return 'Experiments';
}

function clusterPosition(
  anchor: [number, number, number],
  index: number,
  total: number,
  seed: number
): [number, number, number] {
  const angle = index * GOLDEN_ANGLE + seed * 0.17;
  const radius = 2.8 + Math.sqrt(Math.max(total, 1)) * 1.1;
  const vertical = (index / Math.max(total, 1) - 0.5) * 5;
  return [
    anchor[0] + Math.cos(angle) * radius,
    anchor[1] + vertical + (seed % 7) * 0.25,
    anchor[2] + Math.sin(angle) * radius,
  ];
}

/** Place projects near category anchors with deterministic jitter. */
export function buildConstellationLayout(projects: EnhancedProject[]): ConstellationNode[] {
  const byCategory = new Map<Category, EnhancedProject[]>();
  for (const project of projects) {
    const cat = primaryCategory(project);
    const list = byCategory.get(cat) ?? [];
    list.push(project);
    byCategory.set(cat, list);
  }

  const nodes: ConstellationNode[] = [];
  for (const [category, group] of byCategory) {
    const anchor = CATEGORY_ANCHORS[category];
    const sorted = [...group].sort((a, b) => a.id - b.id);
    sorted.forEach((project, index) => {
      nodes.push({
        id: project.id,
        project,
        category,
        position: clusterPosition(anchor, index, sorted.length, project.id),
        color: CATEGORY_COLORS[category],
      });
    });
  }

  return nodes;
}

/** Tag-similarity edges (Jaccard), same threshold as the 2D neural map. */
export function buildConstellationLinks(nodes: ConstellationNode[]): ConstellationLink[] {
  const links: ConstellationLink[] = [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const p1 = nodes[i].project;
      const p2 = nodes[j].project;
      const tags1 = new Set(p1.tags ?? []);
      const tags2 = new Set(p2.tags ?? []);

      let intersection = 0;
      for (const tag of tags1) {
        if (tags2.has(tag)) intersection++;
      }
      if (intersection === 0) continue;

      const union = new Set([...tags1, ...tags2]).size;
      const similarity = intersection / union;
      if (similarity > 0.1) {
        links.push({
          source: p1.id,
          target: p2.id,
          strength: similarity,
        });
      }
    }
  }

  // Drop orphan references if filters removed a node mid-layout
  return links.filter(
    (link) => nodeById.has(link.source) && nodeById.has(link.target)
  );
}

export function nodeMap(nodes: ConstellationNode[]): Map<number, ConstellationNode> {
  return new Map(nodes.map((n) => [n.id, n]));
}
