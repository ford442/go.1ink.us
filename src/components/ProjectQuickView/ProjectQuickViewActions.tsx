import type { Project } from '../../types';
import { trackProjectLaunch } from '../../lib/trackEvent';

interface ProjectQuickViewActionsProps {
  project: Project;
  isEmbeddable: boolean;
  favorites: number[];
  handleCopyLink: (project: Project) => void;
  toggleFavorite: (project: Project) => void;
  onLaunchPreview: (projectId: number) => void;
}

export default function ProjectQuickViewActions({
  project,
  isEmbeddable,
  favorites,
  handleCopyLink,
  toggleFavorite,
  onLaunchPreview,
}: ProjectQuickViewActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 mt-auto pt-6 border-t border-white/10">
      <button
        onClick={() => handleCopyLink(project)}
        className="bg-accent-900/40 hover:bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:border-accent-400 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        Copy Link
      </button>

      {isEmbeddable && (
        <button
          type="button"
          onClick={() => onLaunchPreview(project.id)}
          className="flex-1 bg-accent-500/30 hover:bg-accent-500/40 text-white border border-accent-300/60 hover:border-accent-200 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.45)]"
        >
          <span className="animate-pulse">◉</span>
          Launch Preview
        </button>
      )}

      {project.repo && (
        <a
          href={project.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/15 hover:border-accent-400/50 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300"
        >
          View Source
          <span aria-hidden="true">↗</span>
        </a>
      )}

      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackProjectLaunch(project.id, 'modal')}
        className={`${isEmbeddable ? '' : 'flex-1 '} bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-400/50 hover:border-accent-300 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] group`}
      >
        Open External
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      <div className="flex gap-2">
        <button
          onClick={() => toggleFavorite(project)}
          className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-center
            ${favorites.includes(project.id)
              ? 'bg-pink-500/20 text-pink-400 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
              : 'bg-white/5 text-gray-400 border-white/10 hover:bg-pink-500/10 hover:text-pink-300 hover:border-pink-500/30'
            }
          `}
          aria-label="Toggle Favorite"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
