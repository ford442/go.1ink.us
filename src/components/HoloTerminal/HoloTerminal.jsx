import React, { useEffect, useState } from 'react';
import { useTerminalContext } from '../../app/context/TerminalContext';
import SystemMonitor from './SystemMonitor';
import AudioVisualizer from './AudioVisualizer';
import CommandLog from './CommandLog';
import soundSystem from '../../lib/SoundSystem';

const HoloTerminal = () => {
  const { isHoloTerminalOpen, setIsHoloTerminalOpen, handleTerminalSubmit, terminalInput, setTerminalInput, terminalInputRef, handleTerminalKeyDown } = useTerminalContext();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isHoloTerminalOpen && !isClosing) {
      soundSystem.playBoot();
    }
  }, [isHoloTerminalOpen, isClosing]);

  if (!isHoloTerminalOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    soundSystem.playAlert();
    setTimeout(() => {
      setIsHoloTerminalOpen(false);
      setIsClosing(false);
    }, 400); // match animation duration
  };

  const executeQuickCommand = (cmd) => {
    setTerminalInput(cmd);
    // Simulate hitting enter
    const syntheticEvent = { preventDefault: () => {} };
    handleTerminalSubmit(syntheticEvent, cmd); // We'll need to adapt handleTerminalSubmit to accept a string override if possible, or just set input and manually submit next frame.
  };

  return (
    <div className={`fixed bottom-6 left-6 w-96 max-w-[90vw] z-[250] transform-gpu transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] ${isClosing ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>

      {/* Holographic Frame Layer */}
      <div className="relative backdrop-blur-md bg-black/60 border border-accent-500/50 rounded-lg p-4 shadow-[0_0_30px_rgba(var(--rgb-accent-400),0.15),inset_0_0_20px_rgba(var(--rgb-accent-400),0.1)] overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none group">

        {/* Animated Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(var(--rgb-accent-400),0.05)_51%,transparent_51%)] bg-[length:100%_4px] pointer-events-none mix-blend-overlay animate-scanline"></div>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-accent-500/40 pb-2 mb-3 relative">
          <div className="flex items-center gap-2 text-accent-400">
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>
            <span className="font-mono text-xs font-bold tracking-widest text-shadow-glow">HOLO.TERM // v2.0</span>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
            aria-label="Close Holographic Terminal"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Core Layout Grid */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Left Col: Monitors */}
          <div className="flex flex-col gap-3">
            <SystemMonitor />
            <AudioVisualizer />
          </div>

          {/* Right Col: Logs & Commands */}
          <div className="flex flex-col gap-2 h-full">
            <CommandLog />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-1 mt-auto">
              <button onClick={() => executeQuickCommand('sys')} className="bg-accent-500/10 hover:bg-accent-500/30 border border-accent-500/30 text-[9px] font-mono text-accent-200 py-1 rounded transition-colors uppercase tracking-wider">
                System Info
              </button>
              <button onClick={() => executeQuickCommand('matrix on')} className="bg-emerald-500/10 hover:bg-emerald-500/30 border border-emerald-500/30 text-[9px] font-mono text-emerald-200 py-1 rounded transition-colors uppercase tracking-wider">
                Init Matrix
              </button>
              <button onClick={() => executeQuickCommand('crt toggle')} className="bg-accent-500/10 hover:bg-accent-500/30 border border-accent-500/30 text-[9px] font-mono text-accent-200 py-1 rounded transition-colors uppercase tracking-wider col-span-2">
                Toggle CRT
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar (integrates with global terminal logic) */}
        <div className="border-t border-accent-500/40 pt-2 mt-1 relative">
           <form onSubmit={(e) => {
               // Normal terminal submit expects event to be passed
               handleTerminalSubmit(e);
           }} className="flex items-center group relative z-10">
              <span className="text-accent-500 mr-2 font-mono text-xs font-bold whitespace-nowrap drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)]">❯</span>
              <input
                 ref={terminalInputRef}
                 type="text"
                 value={terminalInput}
                 onChange={(e) => setTerminalInput(e.target.value)}
                 onInput={() => soundSystem.playKeystroke()}
                 onKeyDown={handleTerminalKeyDown}
                 className="flex-1 bg-transparent border-none outline-none text-white focus:ring-0 p-0 font-mono text-xs placeholder-gray-600"
                 placeholder="Enter command..."
                 autoComplete="off"
                 spellCheck="false"
                 autoFocus
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400/20 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
           </form>
        </div>

        {/* Glass Edge Highlights */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-300/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-400/30 to-transparent"></div>
        <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-400/30 to-transparent"></div>
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-accent-400/30 to-transparent"></div>

      </div>
    </div>
  );
};

export default HoloTerminal;
