/**
 * Shared, dependency-free relevance scoring for the catalog search box,
 * Omni palette, and (indirectly, via the command registry) voice input.
 * Kept pure and outside React so it can be unit-tested directly and reused
 * by every surface that needs "does this query match that thing" — see
 * `matchSearchQuery` in `projectBrowser.ts` and `OmniPalette.tsx`.
 */

/** Half-open [start, end) character range into a string, for highlighting. */
export type MatchRange = [number, number];

export interface TextMatch {
  score: number;
  ranges: MatchRange[];
}

const WORD_BOUNDARY_RE = /[\s\-_/]/;

function pushRange(ranges: MatchRange[], start: number, end: number): void {
  const last = ranges[ranges.length - 1];
  if (last && last[1] === start) {
    last[1] = end;
  } else {
    ranges.push([start, end]);
  }
}

/**
 * Character-subsequence match (every query char appears in `target`, in
 * order, not necessarily contiguous) — the "hyfn" -> "Hyphon" typo-tolerant
 * case substring matching can't cover. Rewards consecutive runs and
 * word-start hits so tighter, more natural matches score higher.
 */
function subsequenceMatch(query: string, target: string): TextMatch | null {
  let qi = 0;
  let lastIndex = -2;
  let score = 0;
  const ranges: MatchRange[] = [];

  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] !== query[qi]) continue;
    const isConsecutive = ti === lastIndex + 1;
    const isWordStart = ti === 0 || WORD_BOUNDARY_RE.test(target[ti - 1]!);
    const gap = Math.min(ti - (lastIndex + 1), 5);
    score += 10 + (isConsecutive ? 15 : 0) + (isWordStart ? 8 : 0) - gap;
    pushRange(ranges, ti, ti + 1);
    lastIndex = ti;
    qi++;
  }

  if (qi < query.length) return null;
  score -= (target.length - query.length) * 0.5;
  return { score, ranges };
}

/**
 * Score a single query against a single piece of text, layered from
 * strongest to weakest: exact match, prefix, substring, then a fuzzy
 * subsequence fallback. Returns `null` when nothing matches at all.
 */
export function matchText(query: string, target: string): TextMatch | null {
  const q = query.trim().toLowerCase();
  if (!q || !target) return null;
  const t = target.toLowerCase();

  if (t === q) return { score: 1000, ranges: [[0, target.length]] };
  if (t.startsWith(q)) return { score: 900 - Math.min(q.length, 20), ranges: [[0, q.length]] };

  const idx = t.indexOf(q);
  if (idx !== -1) return { score: 700 - Math.min(idx, 100), ranges: [[idx, idx + q.length]] };

  const fuzzy = subsequenceMatch(q, t);
  if (!fuzzy) return null;
  return { score: Math.min(600, 300 + fuzzy.score), ranges: fuzzy.ranges };
}

export interface CommandLike {
  label: string;
  keywords?: string[];
  description?: string;
}

export interface ScoredCommand<T> {
  item: T;
  score: number;
  /** Match ranges into `item.label`; empty when the match came from keywords/description. */
  ranges: MatchRange[];
}

/**
 * Rank Omni-palette-style items (terminal commands, filters, projects) by
 * how well `query` matches their label, keywords, or description. An empty
 * query returns every item unscored (score 0, no ranges) so callers can
 * still apply their own "what to show by default" slicing.
 */
export function scoreCommands<T extends CommandLike>(query: string, items: T[]): ScoredCommand<T>[] {
  const trimmed = query.trim();
  if (!trimmed) return items.map((item) => ({ item, score: 0, ranges: [] }));

  const results: ScoredCommand<T>[] = [];

  for (const item of items) {
    const labelMatch = matchText(trimmed, item.label);
    if (labelMatch) {
      results.push({ item, score: labelMatch.score, ranges: labelMatch.ranges });
      continue;
    }

    let bestScore = -Infinity;
    for (const keyword of item.keywords ?? []) {
      const match = matchText(trimmed, keyword);
      if (match && match.score * 0.75 > bestScore) bestScore = match.score * 0.75;
    }
    if (item.description) {
      const match = matchText(trimmed, item.description);
      if (match && match.score * 0.5 > bestScore) bestScore = match.score * 0.5;
    }

    if (bestScore > -Infinity) results.push({ item, score: bestScore, ranges: [] });
  }

  return results.sort((a, b) => b.score - a.score);
}

/** The catalog fields `scoreCatalog` is allowed to search across. */
export interface CatalogSearchable {
  title: string;
  description: string;
  tags?: string[];
  tech?: string[];
  repo?: string | null;
  changelog?: string | null;
  status?: string;
  year?: number;
}

export interface ScoredCatalogItem<T> {
  item: T;
  score: number;
}

const YEAR_TERM_RE = /^\d{4}$/;

/**
 * Score one whitespace-delimited term against a project's fields, cheapest
 * (title) to least specific (year). Returns `null` when the term matches
 * nowhere. `year` is gated behind a 4-digit-term check so a query like
 * `2024` doesn't drown out title matches for unrelated projects — see the
 * low, fixed score below.
 */
function scoreTermAgainstProject(term: string, project: CatalogSearchable): number | null {
  const title = project.title.toLowerCase();
  if (title === term) return 100;
  if (title.startsWith(term)) return 90;
  const titleIndex = title.indexOf(term);
  if (titleIndex !== -1) return 80 - Math.min(titleIndex, 20);
  if (project.description.toLowerCase().includes(term)) return 50;
  if (project.tags?.some((tag) => tag.toLowerCase().includes(term))) return 40;
  if (project.tech?.some((tech) => tech.toLowerCase().includes(term))) return 35;
  if (project.repo?.toLowerCase().includes(term)) return 20;
  if (project.changelog?.toLowerCase().includes(term)) return 15;
  if (project.status?.toLowerCase() === term) return 15;
  if (YEAR_TERM_RE.test(term) && project.year != null && String(project.year) === term) return 10;
  return null;
}

/**
 * Whitespace-AND catalog search: every term must match *some* field, terms
 * may match different fields. Matches are then ranked by summed term score
 * (title hits outrank tag/description hits) rather than left in catalog
 * order. An empty query returns every item, unscored, in its original order.
 */
export function scoreCatalog<T extends CatalogSearchable>(query: string, items: T[]): ScoredCatalogItem<T>[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return items.map((item) => ({ item, score: 0 }));

  const results: ScoredCatalogItem<T>[] = [];

  for (const item of items) {
    let total = 0;
    let matchedEvery = true;
    for (const term of terms) {
      const termScore = scoreTermAgainstProject(term, item);
      if (termScore === null) {
        matchedEvery = false;
        break;
      }
      total += termScore;
    }
    if (matchedEvery) results.push({ item, score: total });
  }

  return results.sort((a, b) => b.score - a.score);
}
