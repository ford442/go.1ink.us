import soundSystem from '../lib/SoundSystem';
import { useOverlayContext } from '../app/context/OverlayContext';
import { useBrowserContext } from '../app/context/BrowserContext';
import { useActivityContext } from '../app/context/ActivityContext';

export default function ContextMenu() {
  const { contextMenu, closeContextMenu, setIsDataMode, isDataMode } = useOverlayContext();
  const { toggleFavorite, favorites, handleCopyLink } = useBrowserContext();
  const { addActivityLog } = useActivityContext();
  if (!contextMenu) return null;

  return (
    <>
  {/* Custom Context Menu */}
  {contextMenu && (
    <div
      className="fixed z-[9999] bg-black/90 backdrop-blur-xl border border-accent-500/50 rounded-xl shadow-[0_0_20px_rgba(var(--rgb-accent-400),0.3)] overflow-hidden flex flex-col font-mono text-sm min-w-[200px] animate-fade-in"
      style={{
        top: contextMenu.mouseY,
        left: contextMenu.mouseX,
        // Ensure menu doesn't go off screen
        transform: `translate(${contextMenu.mouseX > window.innerWidth - 200 ? '-100%' : '0'}, ${contextMenu.mouseY > window.innerHeight - 250 ? '-100%' : '0'})`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(var(--rgb-accent-400),0.1),transparent_50%)]"></div>
      <div className="scanline opacity-20 pointer-events-none"></div>

      <div className="px-4 py-2 border-b border-accent-500/30 bg-accent-900/30 text-accent-300 text-xs font-bold tracking-widest uppercase flex items-center justify-between">
        <span className="truncate pr-2">{contextMenu.project.title}</span>
        <span className="text-[10px] opacity-70 border border-accent-500/30 px-1 rounded">ID:{contextMenu.project.id.toString().padStart(4, '0')}</span>
      </div>

      <div className="flex flex-col p-1 relative z-10">
         <a
            href={contextMenu.project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-accent-500/20 transition-colors flex items-center gap-3 group"
            onClick={() => {
               soundSystem.playClick();
               closeContextMenu();
            }}
            onMouseEnter={() => soundSystem.playHover()}
         >
            <span className="text-accent-400 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </span>
            Open App
         </a>

         <button
            className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-pink-500/20 transition-colors flex items-center gap-3 group border-y border-white/5 my-1"
            onClick={() => {
               toggleFavorite(contextMenu.project);
               closeContextMenu();
            }}
            onMouseEnter={() => soundSystem.playHover()}
         >
            <span className={`${favorites.includes(contextMenu.project.id) ? 'text-pink-400' : 'text-gray-400 group-hover:text-pink-400'} group-hover:scale-110 transition-transform`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </span>
            {favorites.includes(contextMenu.project.id) ? 'Remove Favorite' : 'Mark Favorite'}
         </button>

         <button
            className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-accent-500/20 transition-colors flex items-center gap-3 group"
            onClick={() => {
               handleCopyLink(contextMenu.project);
               closeContextMenu();
            }}
            onMouseEnter={() => soundSystem.playHover()}
         >
            <span className="text-gray-400 group-hover:text-white group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </span>
            Copy Data Link
         </button>

         <button
            className="w-full text-left px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-yellow-500/20 transition-colors flex items-center gap-3 group"
            onClick={() => {
               setIsDataMode(!isDataMode);
               soundSystem.playClick();
               addActivityLog(`PROTOCOL OVERRIDE: DATA_MODE_${!isDataMode ? 'ACTIVE' : 'INACTIVE'}`);
               closeContextMenu();
            }}
            onMouseEnter={() => soundSystem.playHover()}
         >
            <span className="text-yellow-500 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
            </span>
            Toggle Data Mode
         </button>
      </div>
    </div>
  )}
    </>
  );
}
