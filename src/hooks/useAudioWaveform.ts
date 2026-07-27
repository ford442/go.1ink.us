import { useEffect, type RefObject } from 'react';
import soundSystem from '../lib/SoundSystem';

interface AudioWaveformOptions {
  color: string;
  responsive?: boolean;
}

function drawFlatline(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.strokeStyle = `${color}40`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawWaveform(ctx: CanvasRenderingContext2D, dataArray: Uint8Array, width: number, height: number, color: string) {
  const bufferLength = dataArray.length;
  const sliceWidth = width / bufferLength;
  let x = 0;

  ctx.beginPath();
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0;
    const y = (v * height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.lineTo(width, height / 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.shadowBlur = 6;
  ctx.shadowColor = color;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

// Shared analyser consumer for CommandHeader + HoloTerminal visualizers.
// One SoundSystem rAF loop feeds identical time-domain frames to every subscriber.
export default function useAudioWaveform(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { color, responsive = false }: AudioWaveformOptions,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let resizeCanvas: (() => void) | undefined;

    if (responsive) {
      resizeCanvas = () => {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }

    const unsubscribe = soundSystem.subscribe(({ timeDomain }: { timeDomain: Uint8Array | null }) => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (!timeDomain) {
        drawFlatline(ctx, width, height, color);
        return;
      }

      drawWaveform(ctx, timeDomain, width, height, color);
    });

    return () => {
      unsubscribe();
      if (resizeCanvas) window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef, color, responsive]);
}
