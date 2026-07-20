import { useState } from 'react';
import { TAG_TO_CATEGORIES } from '../data/constants';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useBrowserContext } from '../app/context/BrowserContext';
import { canPreviewProject } from '../lib/projectEmbed';
import { ProjectImage } from './ProjectImage';
import ProjectEmbedDock from './ProjectEmbedDock';
import ProjectMetaBadges from './ProjectMetaBadges';
import { trackProjectLaunch } from '../lib/trackEvent';

export default function ProjectQuickView() {
  const { selectedProject, closeProjectModal, modalRef, modalImageLoaded, setModalImageLoaded } = useOverlayContext();
  const { handleCopyLink, toggleFavorite, favorites } = useBrowserContext();
  const [previewProjectId, setPreviewProjectId] = useState(null);

  if (!selectedProject) return null;

  const isEmbeddable = canPreviewProject(selectedProject);
  const isPreviewMode = previewProjectId === selectedProject.id;

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
          <>
            <button
              onClick={closeProjectModal}
              className="absolute top-3 right-3 z-30 p-2 text-gray-400 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors border border-white/10 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <ProjectEmbedDock
              project={selectedProject}
              onClosePreview={() => setPreviewProjectId(null)}
            />
          </>
        ) : (
          <>
            <div className="w-full md:w-1/2 relative bg-black flex-shrink-0">
              {selectedProject.image ? (
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
                    imagePath={selectedProject.image}
                    profile="modal"
                    alt={selectedProject.title}
                    onLoad={() => setModalImageLoaded(true)}
                    className={`w-full h-full object-cover holo-image transition-opacity duration-1000 ${modalImageLoaded ? 'opacity-80' : 'opacity-0'}`}
                    pictureClassName="block w-full h-full"
                    style={{ viewTransitionName: `project-image-${selectedProject.id}` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/20 via-transparent to-purple-500/20 mix-blend-overlay" />
                  <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'linear-gradient(to right, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(var(--rgb-accent-400),0.2) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }} />
                </div>
              ) : (
                <div className="w-full h-64 md:h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
                  <span className="text-8xl drop-shadow-2xl">{selectedProject.icon}</span>
                </div>
              )}

              <div className="absolute top-4 left-4 tinted-glass backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="text-xl">{selectedProject.icon}</span>
                <span className="text-xs font-mono text-accent-300 font-bold uppercase tracking-wider">
                  {TAG_TO_CATEGORIES[selectedProject.tags[0]]?.[0] || 'Project'}
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between relative z-10">
              <button
                onClick={closeProjectModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-transparent hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              <div>
                <h2
                  id={`project-modal-title-${selectedProject.id}`}
                  className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-wide glitch-text uppercase"
                  data-text={selectedProject.title}
                >
                  {selectedProject.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <span className="text-xs font-mono text-accent-500 bg-accent-500/10 px-2 py-0.5 rounded border border-accent-500/20">
                    ID: {selectedProject.id.toString().padStart(4, '0')}
                  </span>
                  <ProjectMetaBadges
                    project={selectedProject}
                    variant="modal"
                    showFeatured
                    showYear
                    showStatus
                  />
                </div>

                <div className="mb-8 relative">
                  <div className="absolute -left-3 top-0 bottom-0 w-1 bg-gradient-to-b from-accent-500 to-transparent opacity-50" />
                  <p className="text-gray-300 text-lg leading-relaxed font-light">
                    {selectedProject.description}
                  </p>
                </div>

                <div className="mb-8">
                  <h4 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-3">System Protocols</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs font-medium text-accent-200 bg-accent-900/30 border border-accent-500/20 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-auto pt-6 border-t border-white/10">
                <button
                  onClick={() => handleCopyLink(selectedProject)}
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
                    onClick={() => setPreviewProjectId(selectedProject.id)}
                    className="flex-1 bg-accent-500/30 hover:bg-accent-500/40 text-white border border-accent-300/60 hover:border-accent-200 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.45)]"
                  >
                    <span className="animate-pulse">◉</span>
                    Launch Preview
                  </button>
                )}

                <a
                  href={selectedProject.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackProjectLaunch(selectedProject.id, 'modal')}
                  className={`${isEmbeddable ? '' : 'flex-1 '} bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 border border-accent-400/50 hover:border-accent-300 px-6 py-3 rounded-lg font-bold tracking-widest uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.4)] group`}
                >
                  Open External
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedProject)}
                    className={`p-3 rounded-lg border transition-all duration-300 flex items-center justify-center
                      ${favorites.includes(selectedProject.id)
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
