import React, { useState, useEffect, useRef } from 'react';
import projectData from './projectData';

const LOG_TEMPLATES = [
  "INCOMING TCP_CONN FROM [IP]",
  "DOWNLOADING ASSET [PROJECT] ... OK",
  "SYS_SCAN: SECTOR [NUM] CLEAR",
  "DECRYPTING PROTOCOL [PROJECT] ...",
  "USER AUTHENTICATED: GUEST_[NUM]",
  "ROUTING TRAFFIC TO [PROJECT]",
  "PING [IP] ... 12ms",
  "ANOMALY DETECTED IN NODE [NUM]",
  "SYNCING DATABASE WITH CLUSTER_[NUM]",
  "UPDATING REGISTRY FOR [PROJECT]",
  "HANDSHAKE ESTABLISHED [IP]",
  "OPTIMIZING DATA_STREAM ... 100%"
];

const generateLog = () => {
  const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
  const ip = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const project = projectData[Math.floor(Math.random() * projectData.length)].title.toUpperCase();
  const num = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

  return template.replace('[IP]', ip).replace('[PROJECT]', project).replace('[NUM]', num);
};

const ActivityFeed = () => {
  const [logs, setLogs] = useState(() => {
    return Array.from({ length: 8 }, () => ({
      id: Math.random().toString(36).substr(2, 9),
      text: generateLog(),
      time: new Date().toLocaleTimeString('en-US', { hour12: false })
    }));
  });

  const bottomRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = {
          id: Math.random().toString(36).substr(2, 9),
          text: generateLog(),
          time: new Date().toLocaleTimeString('en-US', { hour12: false })
        };
        // keep last 15 logs
        return [...prev.slice(-14), newLog];
      });
    }, Math.random() * 2000 + 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      // Scroll within the activity feed container without affecting page scroll
      const feedContainer = bottomRef.current.parentElement;
      if (feedContainer) {
        feedContainer.scrollTop = feedContainer.scrollHeight;
      }
    }
  }, [logs]);

  return (
    <div className="flex flex-col h-full tinted-glass shifting-glass border border-white/5 rounded-lg overflow-hidden relative group">
      {/* Radar Scanner Visual */}
      <div className="h-16 border-b border-white/5 relative overflow-hidden bg-accent-900/10 flex items-center justify-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--rgb-accent-400),0.1)_0,transparent_70%)]"></div>
         <div className="absolute inset-0 border border-accent-500/10 rounded-lg m-2"></div>
         {/* Radar circles */}
         <div className="w-12 h-12 rounded-full border border-accent-500/20 absolute"></div>
         <div className="w-8 h-8 rounded-full border border-accent-500/30 absolute"></div>
         <div className="w-4 h-4 rounded-full border border-accent-500/40 absolute"></div>
         <div className="w-1 h-1 rounded-full bg-accent-400 absolute animate-pulse"></div>
         {/* Sweeping line */}
         <div className="w-6 h-6 absolute origin-bottom-right rounded-tl-full bg-gradient-to-br from-accent-400/40 to-transparent -ml-6 -mt-6 animate-[spin_3s_linear_infinite]" style={{ clipPath: 'polygon(100% 100%, 0 0, 100% 0)' }}></div>

         <div className="absolute left-4 top-2 text-[8px] font-mono text-accent-500/70 tracking-widest">LOCAL_NET</div>
         <div className="absolute right-4 bottom-2 text-[8px] font-mono text-accent-400/50 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
            ACTIVE
         </div>
      </div>

      {/* Logs Feed */}
      <div className="flex-1 relative p-3">
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/60 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/60 to-transparent z-10 pointer-events-none"></div>

          <div className="flex flex-col gap-2 font-mono text-[9px] text-accent-200/70 overflow-y-auto h-[120px] scrollbar-hide py-1">
            {logs.map((log) => (
              <div key={log.id} className="animate-slide-in-up flex gap-2 leading-tight">
                <span className="text-accent-500/50 shrink-0">[{log.time}]</span>
                <span className="text-gray-400 break-words">{log.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
      </div>
    </div>
  );
};

export default ActivityFeed;
