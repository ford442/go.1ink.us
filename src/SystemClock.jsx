import React, { useState, useEffect } from 'react';

const SystemClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <div className="flex items-center gap-2 border-l border-accent-500/30 pl-4 text-accent-200/70">
      <span className="opacity-50">SYS.TIME:</span>
      <span className="text-accent-100 font-bold tracking-wider">{formatTime(time)}</span>
    </div>
  );
};

export default SystemClock;
