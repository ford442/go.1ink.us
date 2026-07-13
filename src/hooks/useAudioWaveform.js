import { useEffect } from 'react';
import soundSystem from '../lib/SoundSystem';

// Shared waveform-drawing loop for the two AudioVisualizer components
// (CommandHeader's compact meter and HoloTerminal's larger panel), which
// otherwise differed only in canvas sizing and stroke color.
// soundSystem.getAudioData() already returns null unless sound is enabled,
// initialized, and the analyser exists, so no extra enabled-check is needed
// here — a null result just draws the idle flatline.
export default function useAudioWaveform(canvasRef, { color, responsive = false }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let resizeCanvas;

    if (responsive) {
      resizeCanvas = () => {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const dataArray = soundSystem.getAudioData();

      if (!dataArray) {
        // Draw flatline if audio is disabled or no data
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = `${color}40`; // 25% opacity
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      const bufferLength = dataArray.length;
      const sliceWidth = width / bufferLength;
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
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      // Add glow effect
      ctx.shadowBlur = 6;
      ctx.shadowColor = color;

      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeCanvas) window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef, color, responsive]);
}
