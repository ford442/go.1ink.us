import React, { useState, useEffect } from 'react';

const SystemMonitor = () => {
  const [stats, setStats] = useState({ cpu: 0, ram: 0, net: 0 });

  useEffect(() => {
    // Simulate system stats updates
    const interval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 40) + 10,
        ram: Math.floor(Math.random() * 20) + 40,
        net: Math.floor(Math.random() * 100) + 50,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const renderBar = (value, color) => (
    <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1 overflow-hidden relative">
      <div
        className={`h-full ${color} transition-all duration-500 ease-out`}
        style={{ width: `${value}%` }}
      />
      <div className="absolute top-0 left-0 right-0 bottom-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none mix-blend-overlay"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 font-mono text-[10px] uppercase text-accent-300">
      <div className="flex justify-between items-end border-b border-accent-500/30 pb-1 mb-1">
        <span className="font-bold tracking-widest">SYS.MONITOR</span>
        <span className="animate-pulse">🟢 ONLINE</span>
      </div>

      <div>
        <div className="flex justify-between">
          <span>CPU.LOAD</span>
          <span>{stats.cpu}%</span>
        </div>
        {renderBar(stats.cpu, 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]')}
      </div>

      <div>
        <div className="flex justify-between">
          <span>MEM.ALLOC</span>
          <span>{stats.ram}%</span>
        </div>
        {renderBar(stats.ram, 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]')}
      </div>

      <div>
        <div className="flex justify-between">
          <span>NET.UPLINK</span>
          <span>{stats.net} MB/s</span>
        </div>
        {renderBar(Math.min(stats.net, 100), 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]')}
      </div>

      {/* Decorative hex grid or subtle line graph could go here */}
      <div className="h-8 mt-2 border border-accent-500/20 bg-accent-500/5 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
           <polyline points={`0,30 20,${30 - stats.cpu/2} 40,${30 - stats.ram/2} 60,${30 - stats.net/4} 80,10 100,20`} fill="none" stroke="currentColor" strokeWidth="1" className="text-accent-400 drop-shadow-[0_0_2px_rgba(var(--rgb-accent-400),1)]" />
        </svg>
      </div>
    </div>
  );
};

export default SystemMonitor;
