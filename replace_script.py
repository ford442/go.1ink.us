import re

with open('src/Card.jsx', 'r') as f:
    content = f.read()

# Generate the block for the list view
list_view_code = """
  if (layout === 'list') {
    // Generate pseudo-terminal deterministic values
    const date = new Date(2025, project.id % 12, (project.id * 7) % 28 + 1).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const size = (project.title.length * 14 + project.description.length * 3 + (project.tags?.length || 0) * 128).toString();
    const permissions = project.tech && project.tech.length > 3 ? '-rwxrwxrwx' : '-rw-r--r--';
    const owner = (project.tags || []).includes('Games') ? 'player1' : 'sys_admin';

    return (
      <div
        id={`project-card-${project.id}`}
        className={`card-focusable w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black animate-slide-in-up ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${isDragged ? 'opacity-50 scale-95 shadow-none' : ''} ${isDragOver ? 'ring-2 ring-pink-500 rounded' : ''}`}
        style={{ viewTransitionName: isSelected ? 'none' : `project-container-${project.id}`, animationDelay: `${index * 30}ms` }}
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
        <div
          className="group relative flex flex-col md:flex-row items-start md:items-center py-2 px-3 hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer font-mono text-sm gap-2 md:gap-4 overflow-hidden"
          tabIndex={0}
          role="button"
          aria-label={`View details for ${project.title}`}
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Holographic Scanline / Hover Highlight */}
          <div className="absolute inset-0 bg-accent-500/0 group-hover:bg-accent-500/10 transition-colors pointer-events-none"></div>
          <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-accent-400 scale-y-0 group-hover:scale-y-100 transition-transform origin-left"></div>

          {/* Terminal File Meta (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4 text-xs opacity-70 shrink-0 pointer-events-none">
            <span className="text-gray-400 w-[85px]">{permissions}</span>
            <span className="text-purple-400 w-[70px] truncate">{owner}</span>
            <span className="text-yellow-400 w-[50px] text-right">{size}</span>
            <span className="text-cyan-600 w-[55px] text-right">{date}</span>
          </div>

          {/* Icon & Title */}
          <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
            <span className="text-lg w-6 text-center transform group-hover:scale-110 transition-transform drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{project.icon}</span>
            <div className="flex flex-col min-w-0">
               <span className="text-accent-300 font-bold tracking-wide truncate group-hover:text-accent-100 transition-colors">
                 <DecryptText text={project.title} isHovered={isHovered} searchQuery={searchQuery} regex={regex} />
               </span>
               <span className="text-xs text-gray-500 truncate mt-0.5 max-w-[300px] lg:max-w-md xl:max-w-lg hidden sm:block">
                 {highlightMatch(project.description, searchQuery, regex)}
               </span>
            </div>
          </div>

          {/* Tags */}
          <div className="hidden xl:flex items-center gap-1 shrink-0 pointer-events-auto">
             {project.tags.slice(0, 3).map((tag, i) => {
               const isHighlighted = highlightedTags.includes(tag);
               return (
                 <button
                   key={i}
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     soundSystem.playClick();
                     if (onTagClick) onTagClick(tag);
                   }}
                   onMouseEnter={() => {
                     if (onHoverTag) onHoverTag(tag);
                   }}
                   onMouseLeave={() => {
                     if (onHoverTag) onHoverTag(null);
                   }}
                   className={`text-[10px] px-2 py-0.5 rounded border transition-all duration-200
                     ${isHighlighted
                       ? 'bg-accent-500/50 text-white border-accent-400 shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.4)]'
                       : 'text-gray-400 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white'
                     }
                   `}
                 >
                   {highlightMatch(tag, searchQuery, regex)}
                 </button>
               );
             })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 pointer-events-auto ml-auto md:ml-0 pl-4 border-l border-white/5 z-20">
             <Tooltip text={isFavorite ? "REM_FAV" : "ADD_FAV"}>
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   soundSystem.playClick();
                   if (onToggleFavorite) onToggleFavorite(project);
                 }}
                 className={`p-1.5 rounded-md transition-all duration-300
                   ${isFavorite
                     ? 'text-pink-400 bg-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.3)] border border-pink-400/30'
                     : 'text-gray-500 hover:text-pink-300 hover:bg-pink-500/10 hover:border-pink-400/30 border border-transparent'
                   }
                 `}
                 aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                 </svg>
               </button>
             </Tooltip>
             <Tooltip text="COPY_LINK">
               <button
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   soundSystem.playClick();
                   if (onCopyLink) onCopyLink(project);
                 }}
                 className="p-1.5 rounded-md text-gray-500 hover:text-accent-300 hover:bg-accent-500/20 hover:border-accent-400/30 border border-transparent transition-all duration-300"
                 aria-label="Copy link"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                 </svg>
               </button>
             </Tooltip>
          </div>
        </div>
      </div>
    );
  }
"""

replacement = list_view_code + "\n  // Grid Layout (Default)"

# The goal is to insert list_view_code right before "// Grid Layout (Default)"
new_content = content.replace("  // Grid Layout (Default)", replacement)

with open('src/Card.jsx', 'w') as f:
    f.write(new_content)
