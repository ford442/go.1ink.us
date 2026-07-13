import React, { useRef } from 'react';
import { useSettingsContext } from '../../app/context/SettingsContext';
import useAudioWaveform from '../../hooks/useAudioWaveform';

// Larger waveform panel shown inside the floating holo-terminal. See also
// AudioVisualizer.jsx (CommandHeader's compact meter) — both share their
// drawing logic via hooks/useAudioWaveform.
const AudioVisualizer = () => {
  const canvasRef = useRef(null);
  const { isSoundEnabled } = useSettingsContext();

  useAudioWaveform(canvasRef, { color: '#22d3ee', responsive: true }); // accent-400 cyan

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
