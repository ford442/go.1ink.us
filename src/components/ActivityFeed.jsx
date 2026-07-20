import React, { useState, useEffect, useRef, useMemo } from 'react';
import { buildConnectivityActivityLogs, formatNetTelemetry } from '../lib/projectConnectivity';
import { useActivityContext } from '../app/context/ActivityContext';

const ActivityFeed = () => {
  const { userActivityLogs = [] } = useActivityContext() || {};

  const healthLogs = useMemo(() => buildConnectivityActivityLogs(12), []);
  const netTelemetry = useMemo(() => formatNetTelemetry(), []);

  const [logs, setLogs] = useState(() =>
    healthLogs.slice(0, 8).map((text, index) => ({
      id: `health-${index}`,
      text,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
    })),
  );

  const logCursor = useRef(healthLogs.length > 8 ? 8 : 0);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (healthLogs.length <= 8) return undefined;

    const interval = setInterval(() => {
      setLogs((prev) => {
        const text = healthLogs[logCursor.current % healthLogs.length];
        logCursor.current += 1;
        const newLog = {
          id: `health-${Date.now()}-${logCursor.current}`,
          text,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        };
        return [...prev.slice(-14), newLog];
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [healthLogs]);

  useEffect(() => {
    if (bottomRef.current) {
      const feedContainer = bottomRef.current.parentElement;
      if (feedContainer) {
        feedContainer.scrollTop = feedContainer.scrollHeight;
      }
    }
  }, [logs, userActivityLogs]);

  const netLabel = `${netTelemetry.live}/${netTelemetry.total}`;

  return (
    <div className="flex flex-col h-full tinted-glass shifting-glass border border-white/5 rounded-lg overflow-hidden relative group" aria-labelledby="activity-feed-heading">
      <h2 id="activity-feed-heading" className="sr-only">System activity feed</h2>
      <div className="h-16 border-b border-white/5 relative overflow-hidden bg-accent-900/10 flex items-center justify-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--rgb-accent-400),0.1)_0,transparent_70%)]"></div>
         <div className="absolute inset-0 border border-accent-500/10 rounded-lg m-2"></div>
         <div className="w-12 h-12 rounded-full border border-accent-500/20 absolute"></div>
         <div className="w-8 h-8 rounded-full border border-accent-500/30 absolute"></div>
         <div className="w-4 h-4 rounded-full border border-accent-500/40 absolute"></div>
         <div className="w-1 h-1 rounded-full bg-accent-400 absolute animate-pulse"></div>
         <div className="w-6 h-6 absolute origin-bottom-right rounded-tl-full bg-gradient-to-br from-accent-400/40 to-transparent -ml-6 -mt-6 animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(100% 100%, 0 0, 100% 0)' }}></div>

         <div className="absolute left-4 top-2 text-[8px] font-mono text-accent-500/70 tracking-widest">CATALOG_NET</div>
         <div className="absolute right-4 bottom-2 text-[8px] font-mono text-accent-400/50 flex items-center gap-1">
            <span className={`w-1 h-1 rounded-full ${netTelemetry.live === netTelemetry.total ? 'bg-green-500' : netTelemetry.live > 0 ? 'bg-amber-500' : 'bg-gray-500'} animate-pulse`}></span>
            {netLabel} LIVE
         </div>
      </div>

      <div className="flex-1 relative p-3">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none"></div>

          <div
            className="flex flex-col gap-2 font-mono text-[9px] text-accent-200/90 overflow-y-auto h-[120px] scrollbar-hide py-1"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-atomic="false"
            tabIndex={0}
          >
            {[...logs, ...userActivityLogs].sort((a, b) => a.time.localeCompare(b.time) || (a.id > b.id ? 1 : -1)).slice(-15).map((log) => {
              const isUserAction = userActivityLogs.some(u => u.id === log.id);
              return (
                <div key={log.id} className={`animate-slide-in-up flex gap-2 leading-tight ${isUserAction ? 'text-accent-300 font-bold' : ''}`}>
                  <span className="text-accent-500/50 shrink-0">[{log.time}]</span>
                  <span className={`${isUserAction ? 'text-accent-200' : 'text-gray-300'} break-words`}>
                    {isUserAction ? '> SYS_REQ: ' : '> '}{log.text}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
