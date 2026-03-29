import React, { useRef, useEffect, useState } from 'react';

const TelemetryGraph = ({ value, max = 100, width = 60, height = 20 }) => {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState(Array(30).fill(0));
  const [lastValue, setLastValue] = useState(value);

  if (value !== lastValue) {
    setLastValue(value);
    setHistory(prev => [...prev.slice(1), value]);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get theme color
    const computedStyle = getComputedStyle(document.documentElement);
    const rgbAccent = computedStyle.getPropertyValue('--rgb-accent-400').trim() || '34, 211, 238'; // fallback cyan

    const color = `rgba(${rgbAccent}, 0.8)`;
    const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
    fillGradient.addColorStop(0, `rgba(${rgbAccent}, 0.5)`);
    fillGradient.addColorStop(1, `rgba(${rgbAccent}, 0.0)`);

    const points = history.length;
    const step = width / (points - 1);

    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < points; i++) {
      const val = history[i];
      const normalized = Math.min(Math.max(val / max, 0), 1);
      // Small padding so line doesn't clip top/bottom perfectly
      const paddedHeight = height - 2;
      const y = 1 + paddedHeight - (normalized * paddedHeight);
      const x = i * step;

      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.closePath();

    ctx.fillStyle = fillGradient;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const val = history[i];
      const normalized = Math.min(Math.max(val / max, 0), 1);
      const paddedHeight = height - 2;
      const y = 1 + paddedHeight - (normalized * paddedHeight);
      const x = i * step;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

  }, [history, max, width, height]);

  return (
    <div className="relative flex items-center" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
      />
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.25) 50%)',
          backgroundSize: '100% 4px'
        }}
      ></div>
    </div>
  );
};

export default TelemetryGraph;
