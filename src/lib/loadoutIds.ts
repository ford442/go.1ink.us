import projectData from '../data/projectData';

const VALID_IDS = new Set(projectData.map((p) => p.id));

export function validProjectIds(): Set<number> {
  return VALID_IDS;
}

/** Filter to known project IDs, dedupe, preserve order. */
export function sanitizeIds(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const result: number[] = [];
  for (const item of raw) {
    const id = typeof item === 'number' ? item : parseInt(String(item), 10);
    if (!Number.isFinite(id) || !VALID_IDS.has(id) || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function parseIdsParam(param: string): number[] {
  return sanitizeIds(param.split(',').map((s) => parseInt(s.trim(), 10)));
}
