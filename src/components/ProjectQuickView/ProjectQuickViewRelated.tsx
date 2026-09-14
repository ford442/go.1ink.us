import type { Project } from '../../types';

interface ProjectQuickViewRelatedProps {
  project: Project;
  relatedProjects: Project[];
  handleProjectSelect: (project: Project) => void;
}

export default function ProjectQuickViewRelated({ project, relatedProjects, handleProjectSelect }: ProjectQuickViewRelatedProps) {
  if (relatedProjects.length === 0) return null;

  return (
    <section className="mb-8" aria-labelledby={`related-projects-${project.id}`}>
      <h3
        id={`related-projects-${project.id}`}
        className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3"
      >
        Related Systems
      </h3>
      <div className="flex flex-wrap gap-2" data-testid="related-projects">
        {relatedProjects.map((related) => (
          <button
            key={related.id}
            type="button"
            onClick={() => handleProjectSelect(related)}
            aria-label={`Open related project ${related.title}`}
            className="group inline-flex items-center gap-2 rounded-lg border border-accent-500/25 bg-accent-950/30 px-3 py-2 text-left transition-all hover:border-accent-400/60 hover:bg-accent-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            <span aria-hidden="true" className="text-lg">{related.icon}</span>
            <span className="font-mono text-xs font-semibold text-accent-200 group-hover:text-white">
              {related.title}
            </span>
            <span aria-hidden="true" className="text-accent-500 transition-transform group-hover:translate-x-0.5">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}
