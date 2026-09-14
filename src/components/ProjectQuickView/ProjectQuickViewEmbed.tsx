import type { RefObject } from 'react';
import type { Project } from '../../types';
import ProjectEmbedDock from '../ProjectEmbedDock';

interface ProjectQuickViewEmbedProps {
  project: Project;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  closeProjectModal: () => void;
  onClosePreview: () => void;
}

export default function ProjectQuickViewEmbed({ project, closeButtonRef, closeProjectModal, onClosePreview }: ProjectQuickViewEmbedProps) {
  return (
    <>
      <button
        ref={closeButtonRef}
        onClick={closeProjectModal}
        className="absolute top-3 right-3 z-30 p-2 text-gray-400 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors border border-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <ProjectEmbedDock
        project={project}
        onClosePreview={onClosePreview}
      />
    </>
  );
}
