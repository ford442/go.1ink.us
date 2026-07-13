import soundSystem from '../SoundSystem';
import { useTerminalContext } from '../context/TerminalContext';

export default function TerminalBar() {
  const { isTerminalOpen, isTerminalClosing, setIsTerminalClosing, setIsTerminalOpen, terminalHistory, terminalEndRef, handleTerminalSubmit, terminalInputRef, terminalInput, setTerminalInput, handleTerminalKeyDown } = useTerminalContext();
  if (!isTerminalOpen && !isTerminalClosing) return null;

  return (
    <>
  {/* Terminal Command Bar */}
  {(isTerminalOpen || isTerminalClosing) && (
    <div className={`fixed bottom-0 left-0 right-0 z-[200] bg-black/95 backdrop-blur-xl border-t border-accent-500/50 p-4 font-mono text-sm shadow-[0_-10px_40px_rgba(var(--rgb-accent-400),0.15)] flex flex-col transform-gpu ${isTerminalClosing ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
       <div className="flex justify-between items-center mb-2 pb-2 border-b border-accent-500/30">
          <div className="flex items-center gap-2">
             <span className="animate-pulse glitch-text text-lg" data-text="⚡">⚡</span>
             <span className="text-accent-400 font-bold tracking-widest uppercase text-xs">Terminal Protocol</span>
          </div>
          <button
            onClick={() => {
              setIsTerminalClosing(true);
              setTimeout(() => {
                setIsTerminalOpen(false);
                setIsTerminalClosing(false);
              }, 300);
            }}
            className="text-gray-500 hover:text-white transition-colors p-1"
            aria-label="Close terminal"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
       </div>

       {/* Terminal Output History */}
       <div className="flex-1 overflow-y-auto max-h-[30vh] min-h-[150px] mb-3 space-y-1.5 scrollbar-hide pr-2">
         {terminalHistory.map((entry, i) => (
           <div key={i} className={`whitespace-pre-wrap ${
             entry.type === 'error' ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' :
             entry.type === 'success' ? 'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]' :
             entry.type === 'user' ? 'text-white opacity-80' :
             'text-accent-300 opacity-90'
           }`}>
             {entry.text}
           </div>
         ))}
         <div ref={terminalEndRef} />
       </div>

       {/* Terminal Input */}
       <form onSubmit={handleTerminalSubmit} className="relative flex items-center group">
          <span className="text-accent-500 mr-2 font-bold whitespace-nowrap drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]">root@curator:~#</span>
          <input
             ref={terminalInputRef}
             type="text"
             value={terminalInput}
             onChange={(e) => setTerminalInput(e.target.value)}
             onInput={() => soundSystem.playKeystroke()}
             onKeyDown={handleTerminalKeyDown}
             className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0 placeholder-gray-600"
             placeholder="Type 'help' for available protocols..."
             autoComplete="off"
             spellCheck="false"
             autoFocus
          />
          <div className="absolute right-0 w-2 h-4 bg-accent-400 animate-pulse opacity-50 pointer-events-none"></div>
       </form>

       {/* Decorative scanline for terminal */}
       <div className="scanline opacity-20 pointer-events-none"></div>
    </div>
  )}
    </>
  );
}
