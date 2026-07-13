import soundSystem from '../../SoundSystem';
import { getCardWrapperClasses } from './cardStyles';

// X-ray / data-mode branch: renders the raw project payload instead of the
// normal card face.
export default function CardDataMode({
  project,
  index,
  isSelected,
  draggable,
  isDragged,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onContextMenu,
  tabIndex,
  handleKeyDown,
  handleFocus,
  onProjectClick
}) {
  return (
    <div
      id={`project-card-${project.id}`}
      className={getCardWrapperClasses('dataMode', { draggable, isDragged, isDragOver })}
      style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 50}ms` }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
    >
      <div className="bg-black/90 border border-accent-500/50 font-mono text-accent-400 text-xs p-4 rounded-xl shadow-[0_0_15px_rgba(var(--rgb-accent-400),0.3)] relative overflow-hidden group h-full cursor-pointer hover:bg-black hover:border-accent-400 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
           tabIndex={0}
           role="button"
           aria-label={`View data for ${project.title}`}
           onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               soundSystem.playClick();
               if (onProjectClick) onProjectClick(project);
             }
           }}
           onClick={(e) => {
             e.preventDefault();
             soundSystem.playClick();
             if (onProjectClick) onProjectClick(project);
           }}
      >
        <div className="scanline"></div>
        <pre className="whitespace-pre-wrap break-words opacity-80 group-hover:opacity-100 transition-opacity">
          {JSON.stringify({
            id: project.id,
            title: project.title,
            tags: project.tags,
            tech: project.tech,
            url: project.url,
          }, null, 2)}
        </pre>
        <div className="absolute top-2 right-2 text-accent-500/50 group-hover:text-accent-400 transition-colors">
          [DATA_MODE]
        </div>
      </div>
    </div>
  );
}
