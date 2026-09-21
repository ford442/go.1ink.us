import type { ReactNode } from 'react';
import type { MatchRange } from '../../lib/search';

// Highlights the substring of `text` matching `regex` (built from the
// active search query). Kept outside any component to avoid re-allocating
// the function identity on every render.
export default function highlightMatch(text: string, query: string | undefined, regex: RegExp | null | undefined): ReactNode {
  if (!query || !text || !regex) return text;

  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-accent-500/30 text-accent-200 rounded px-0.5 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.2)] font-semibold">{part}</span>
    ) : part
  );
}

// Highlights arbitrary (possibly non-contiguous) `[start, end)` ranges into
// `text` — the fuzzy/subsequence matches `scoreCommands` (src/lib/search.ts)
// produces can't be expressed as a single regex the way a plain substring
// match can.
export function highlightRanges(text: string, ranges: MatchRange[] | undefined): ReactNode {
  if (!ranges?.length || !text) return text;

  const nodes: ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <span key={i} className="bg-accent-500/30 text-accent-200 rounded px-0.5 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.2)] font-semibold">
        {text.slice(start, end)}
      </span>
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
