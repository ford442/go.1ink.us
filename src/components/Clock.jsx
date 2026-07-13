import React, { useState, useEffect } from 'react';

function formatSeconds(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatMilliseconds(date) {
  return `${date.toLocaleTimeString('en-US', { hour12: false })}.${date.getMilliseconds().toString().padStart(3, '0')}`;
}

// Single clock implementation backing both header clock displays:
// - precision="seconds" (1Hz, default): the labeled "SYS.TIME:" stat
// - precision="milliseconds" (50ms): the unlabeled ticker at the far right
//   of the header. The fast tick is intentional — it reads as a live
//   high-precision system readout, matching the dashboard's "everything is
//   always live" aesthetic (see also the 1Hz system-stats ticker elsewhere
//   in CommandHeader). It only re-renders this leaf component, not the
//   rest of the app, so the cost is bounded to one small DOM update 20x/sec.
export default function Clock({ precision = 'seconds', label }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const intervalMs = precision === 'milliseconds' ? 50 : 1000;
    const timer = setInterval(() => setTime(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [precision]);

  const formatted = precision === 'milliseconds' ? formatMilliseconds(time) : formatSeconds(time);

  if (label) {
    return (
      <div className="flex items-center gap-2 border-l border-accent-500/30 pl-4 text-accent-200/70">
        <span className="opacity-50">{label}</span>
        <span className="text-accent-100 font-bold tracking-wider">{formatted}</span>
      </div>
    );
  }

  return (
    <div className="text-accent-300 font-bold tracking-widest drop-shadow-[0_0_5px_rgba(var(--rgb-accent-400),0.8)] font-mono tabular-nums min-w-[110px] text-right">
      {formatted}
    </div>
  );
}
