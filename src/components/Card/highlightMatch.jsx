// Highlights the substring of `text` matching `regex` (built from the
// active search query). Kept outside any component to avoid re-allocating
// the function identity on every render.
export default function highlightMatch(text, query, regex) {
  if (!query || !text || !regex) return text;

  const parts = text.split(regex);
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-accent-500/30 text-accent-200 rounded px-0.5 shadow-[0_0_8px_rgba(var(--rgb-accent-400),0.2)] font-semibold">{part}</span>
    ) : part
  );
}
