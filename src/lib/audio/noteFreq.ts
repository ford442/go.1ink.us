/** Equal-tempered A4 = 440 Hz reference. */
export const A4_HZ = 440;

/** Named note frequencies (4th octave) for procedural SFX composition. */
export const NOTE_FREQ: Record<string, number> = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
};

/** Parse note like `A4`, `C#5`, or `Bb3` to Hz. Returns NaN when invalid. */
export function noteToFreq(note: string): number {
  const match = /^([A-Ga-g])(#{1}|b{1})?(-?\d+)$/.exec(note.trim());
  if (!match) return Number.NaN;

  const letter = match[1].toUpperCase();
  const accidental = match[2] ?? '';
  const octave = Number(match[3]);

  const semitoneMap: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };

  let semitone = semitoneMap[letter];
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;

  const midi = (octave + 1) * 12 + semitone;
  return midiToFreq(midi);
}

/** MIDI note number (69 = A4) to frequency in Hz. */
export function midiToFreq(midi: number): number {
  return A4_HZ * 2 ** ((midi - 69) / 12);
}

/** Exponential sweep multiplier at normalized time t ∈ [0, 1]. */
export function sweepRatio(startHz: number, endHz: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  const start = Math.max(startHz, 1);
  const end = Math.max(endHz, 1);
  return start * (end / start) ** clamped;
}
