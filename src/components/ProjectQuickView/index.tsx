import { useEffect, useRef, useState } from 'react';
import projects from '../../data/projectData';
import type { Project } from '../../types';
import { useOverlayModalContext } from '../../app/context/OverlayModalContext';
import { useBrowserContext, useBrowserActions } from '../../app/context/BrowserContext';
import { canPreviewProject } from '../../lib/projectEmbed';
import ProjectQuickViewMedia from './ProjectQuickViewMedia';
import ProjectQuickViewEmbed from './ProjectQuickViewEmbed';
import ProjectQuickViewHeader from './ProjectQuickViewHeader';
import ProjectQuickViewRelated from './ProjectQuickViewRelated';
import ProjectQuickViewChangelog from './ProjectQuickViewChangelog';
import ProjectQuickViewActions from './ProjectQuickViewActions';

export default function ProjectQuickView() {
  const { selectedProject, closeProjectModal, handleProjectSelect, modalRef, modalImageLoaded, setModalImageLoaded } = useOverlayModalContext();
  const { favorites } = useBrowserContext();
  const { handleCopyLink, toggleFavorite } = useBrowserActions();
  const [previewProjectId, setPreviewProjectId] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!selectedProject) return undefined;
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [selectedProject]);

  if (!selectedProject) return null;

  const isEmbeddable = canPreviewProject(selectedProject);
  const isPreviewMode = previewProjectId === selectedProject.id;
  const relatedProjects = selectedProject.relatedIds
    .map((relatedId) => projects.find((project) => project.id === relatedId))
    .filter((project): project is Project => project !== undefined);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in" ref={modalRef}>
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={closeProjectModal}
        aria-hidden="true"
      />

      <div
        className={`relative w-full tinted-glass shifting-glass border-accent-500/30 rounded-2xl shadow-[0_0_40px_rgba(var(--rgb-accent-400),0.15)] overflow-hidden flex flex-col animate-crt-turn-on ${
          isPreviewMode ? 'max-w-6xl h-[min(90vh,820px)]' : 'max-w-4xl md:flex-row'
        }`}
        style={{ viewTransitionName: `project-container-${selectedProject.id}` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`project-modal-title-${selectedProject.id}`}
      >
        <div className="scanline" aria-hidden="true" />

        {isPreviewMode && isEmbeddable ? (
          <ProjectQuickViewEmbed
            project={selectedProject}
            closeButtonRef={closeButtonRef}
            closeProjectModal={closeProjectModal}
            onClosePreview={() => setPreviewProjectId(null)}
          />
        ) : (
          <>
            <ProjectQuickViewMedia
              project={selectedProject}
              modalImageLoaded={modalImageLoaded}
              setModalImageLoaded={setModalImageLoaded}
            />

            <div className="w-full md:w-1/2 max-h-[90vh] overflow-y-auto p-6 md:p-8 flex flex-col justify-between relative z-10">
              <button
                ref={closeButtonRef}
                onClick={closeProjectModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div>
                <ProjectQuickViewHeader project={selectedProject} />
                <ProjectQuickViewRelated
                  project={selectedProject}
                  relatedProjects={relatedProjects}
                  handleProjectSelect={handleProjectSelect}
                />
                <ProjectQuickViewChangelog project={selectedProject} />
              </div>

              <ProjectQuickViewActions
                project={selectedProject}
                isEmbeddable={isEmbeddable}
                favorites={favorites}
                handleCopyLink={handleCopyLink}
                toggleFavorite={toggleFavorite}
                onLaunchPreview={setPreviewProjectId}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
