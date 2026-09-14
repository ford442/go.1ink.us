import { parseChangelog } from '../../lib/transmissions';
import type { Project } from '../../types';

interface ProjectQuickViewChangelogProps {
  project: Project;
}

export default function ProjectQuickViewChangelog({ project }: ProjectQuickViewChangelogProps) {
  if (!project.changelog) return null;

  const { formattedDate, summary } = parseChangelog(project.changelog, project.year);

  return (
    <details className="mb-8 rounded-lg border border-accent-500/30 bg-accent-950/20 px-4 py-3 shadow-inner">
      <summary className="cursor-pointer select-none font-mono text-xs font-bold uppercase tracking-widest text-accent-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="text-accent-400 text-xs">⚡</span>
          Patch Notes
        </span>
        <span className="text-[10px] text-accent-400 bg-accent-900/40 px-2 py-0.5 rounded border border-accent-500/30">
          {formattedDate}
        </span>
      </summary>
      <p className="mt-3 whitespace-pre-wrap border-l-2 border-accent-500/40 pl-3 font-mono text-sm leading-relaxed text-gray-200">
        {summary}
      </p>
    </details>
  );
}
