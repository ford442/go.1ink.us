/** Feature-detect `OffscreenCanvas` + `transferControlToOffscreen` before ever spawning the visuals worker. */
export function supportsOffscreenCanvas(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof OffscreenCanvas === 'undefined') return false;
  return typeof HTMLCanvasElement !== 'undefined' && 'transferControlToOffscreen' in HTMLCanvasElement.prototype;
}
