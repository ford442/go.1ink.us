import React, { useEffect, useRef } from 'react';
import { useTerminalContext } from '../../app/context/TerminalContext';

const CommandLog = () => {
  const { terminalHistory } = useTerminalContext();
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  return (
    <div className="flex-1 overflow-y-auto min-h-[100px] border border-accent-500/20 bg-black/40 rounded p-2 font-mono text-[11px] leading-tight space-y-1 scrollbar-hide relative shadow-inner">
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-10 pointer-events-none mix-blend-overlay"></div>

      {terminalHistory.slice(-50).map((entry, i) => (
        <div key={i} className={`whitespace-pre-wrap break-all ${
          entry.type === 'error' ? 'text-red-400 drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]' :
          entry.type === 'success' ? 'text-green-400 drop-shadow-[0_0_2px_rgba(74,222,128,0.8)]' :
          entry.type === 'user' ? 'text-white opacity-80' :
          'text-accent-300 opacity-90 drop-shadow-[0_0_1px_rgba(var(--rgb-accent-400),0.5)]'
        }`}>
          {entry.type === 'user' ? <span className="opacity-50 select-none mr-1">❯</span> : null}
          {entry.text}
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  );
};

export default CommandLog;
