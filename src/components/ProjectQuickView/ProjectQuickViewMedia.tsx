import type { Dispatch, SetStateAction } from 'react';
import { TAG_TO_CATEGORIES } from '../../constants';
import type { Project } from '../../types';
import { ProjectImage } from '../ProjectImage';

interface ProjectQuickViewMediaProps {
  project: Project;
  modalImageLoaded: boolean;
  setModalImageLoaded: Dispatch<SetStateAction<boolean>>;
}

export default function ProjectQuickViewMedia({ project, modalImageLoaded, setModalImageLoaded }: ProjectQuickViewMediaProps) {
  return (
    <div className="w-full md:w-1/2 relative bg-black flex-shrink-0">
      {project.image ? (
        <div className="w-full h-64 md:h-full relative overflow-hidden group">
          {!modalImageLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-md z-10 border-r border-accent-500/20 overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400), 0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-500/20 to-transparent -translate-x-full animate-[skeleton-sweep_2s_infinite_linear]" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 border border-accent-500/30 bg-black/40 mb-6 flex items-center justify-center shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.2)]">
                  <div className="w-4 h-4 bg-accent-400 animate-pulse" />
                </div>
                <div className="font-mono text-accent-400 text-sm tracking-[0.3em] uppercase animate-pulse mb-4">
                  CONSTRUCTING_GEOMETRY...
                </div>
                <div className="w-48 h-1 bg-black/50 overflow-hidden border border-accent-500/20">
                  <div className="h-full bg-accent-500/50 w-full animate-[skeleton-sweep_1.5s_infinite_linear]" />
                </div>
              </div>
            </div>
          )}
          <ProjectImage
            imagePath={project.image}
            profile="modal"
            alt={project.title}
            onLoad={() => setModalImageLoaded(true)}
            className={`w-full h-full object-cover holo-image transition-opacity duration-1000 ${modalImageLoaded ? 'opacity-80' : 'opacity-0'}`}
            pictureClassName="block w-full h-full"
            style={{ viewTransitionName: `project-image-${project.id}` }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/20 via-transparent to-purple-500/20 mix-blend-overlay" />
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />
        </div>
      ) : (
        <div className="w-full h-64 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
          <span className="text-8xl drop-shadow-2xl">{project.icon}</span>
        </div>
      )}

      <div className="absolute top-4 left-4 tinted-glass backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
        <span className="text-xl">{project.icon}</span>
        <span className="text-xs font-mono text-accent-300 font-bold uppercase tracking-wider">
          {TAG_TO_CATEGORIES[project.tags[0]]?.[0] || 'Project'}
        </span>
      </div>
    </div>
  );
}
