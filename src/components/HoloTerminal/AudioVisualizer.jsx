import React, { useRef, useEffect } from 'react';
import soundSystem from '../../SoundSystem';
import { useAppContext } from '../../AppContext';

const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const { isSoundEnabled } = useAppContext();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Only draw visualization if sound is enabled and initialized
      if (!isSoundEnabled || !soundSystem.initialized || !soundSystem.analyser) {
        // Draw idle state (flat line)
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const dataArray = soundSystem.getAudioData();
      if (!dataArray) return;

      const bufferLength = dataArray.length;
      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'; // accent-400
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(34, 211, 238, 1)';
      ctx.beginPath();

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Reset shadow for next frame
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isSoundEnabled]);

  return (
    <div className="w-full h-16 bg-black/40 border border-accent-500/30 rounded relative overflow-hidden flex flex-col justify-end">
      <div className="absolute top-1 left-2 text-[8px] font-mono text-accent-400/70 tracking-widest uppercase pointer-events-none">
        AUDIO.WFM // {isSoundEnabled ? 'ACTIVE' : 'STANDBY'}
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default AudioVisualizer;
