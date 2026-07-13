import React, { useMemo, useRef } from 'react';
import soundSystem from '../lib/SoundSystem';
import useAudioWaveform from '../hooks/useAudioWaveform';

const THEME_COLORS = {
  purple: '#d946ef', // fuchsia-500
  emerald: '#10b981', // emerald-500
  gold: '#fbbf24', // amber-400
  cyan: '#06b6d4' // cyan-500
};

// Compact waveform meter shown in CommandHeader. See also
// components/HoloTerminal/AudioVisualizer.jsx, the larger panel used
// inside the floating holo-terminal — both share their drawing logic via
// hooks/useAudioWaveform.
const AudioVisualizer = ({ theme }) => {
  const canvasRef = useRef(null);
  const color = useMemo(() => THEME_COLORS[theme] || THEME_COLORS.cyan, [theme]);

  useAudioWaveform(canvasRef, { color });

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
