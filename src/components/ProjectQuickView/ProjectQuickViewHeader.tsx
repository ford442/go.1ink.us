import type { Project } from '../../types';
import ProjectMetaBadges from '../ProjectMetaBadges';

interface ProjectQuickViewHeaderProps {
  project: Project;
}

export default function ProjectQuickViewHeader({ project }: ProjectQuickViewHeaderProps) {
  return (
    <>
      <h2
        id={`project-modal-title-${project.id}`}
        className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-wide glitch-text uppercase"
        data-text={project.title}
      >
        {project.title}
      </h2>

      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <span className="text-xs font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
          ID: {project.id.toString().padStart(4, '0')}
        </span>
        <ProjectMetaBadges
          project={project}
          variant="modal"
          showFeatured
          showYear
          showStatus
        />
      </div>

      <div className="mb-8 relative">
        <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-500 to-transparent opacity-50" />
        <p className="text-gray-300 text-lg leading-relaxed font-light">
          {project.description}
        </p>
      </div>

      <div className="mb-8">
        <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">System Protocols</h4>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium text-accent-200 bg-accent-900/30 border border-accent-500/20 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
