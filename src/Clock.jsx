import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(`${now.toLocaleTimeString('en-US', { hour12: false })}.${now.getMilliseconds().toString().padStart(3, '0')}`);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-accent-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)] font-mono tabular-nums min-w-[110px] text-right">
      {time}
    </div>
  );
};

export default Clock;
