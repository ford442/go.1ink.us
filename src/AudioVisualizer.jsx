import React, { useRef, useEffect } from 'react';
import soundSystem from './SoundSystem';

const AudioVisualizer = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    // Theme colors mapping
    const getThemeColor = () => {
      switch (theme) {
        case 'purple': return '#d946ef'; // fuchsia-500
        case 'emerald': return '#10b981'; // emerald-500
        case 'gold': return '#fbbf24'; // amber-400
        case 'cyan':
        default: return '#06b6d4'; // cyan-500
      }
    };

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const dataArray = soundSystem.getAudioData();

      if (!dataArray || !soundSystem.isEnabled) {
        // Draw flatline if audio is disabled or no data
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = `${getThemeColor()}40`; // 25% opacity
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const bufferLength = dataArray.length;
      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      ctx.beginPath();

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // normalize 0-255 to 0-2
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = getThemeColor();
      ctx.lineWidth = 1.5;

      // Add glow effect
      ctx.shadowBlur = 4;
      ctx.shadowColor = getThemeColor();

      ctx.stroke();

      // Reset shadow for next frame
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="flex flex-col items-center justify-center border-l border-accent-500/30 pl-4 ml-2">
      <div className="flex justify-between w-full mb-1">
        <span className="opacity-50 text-xs font-mono text-accent-200/70 mr-2">AUDIO:</span>
        {!soundSystem.isEnabled && <span className="text-[8px] text-red-400 tracking-wider">OFFLINE</span>}
      </div>
      <div className="h-4 w-16 border border-accent-500/30 rounded overflow-hidden bg-black/40 flex items-center justify-center relative">
        <canvas
          ref={canvasRef}
          width={64}
          height={16}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    </div>
  );
};

export default AudioVisualizer;
