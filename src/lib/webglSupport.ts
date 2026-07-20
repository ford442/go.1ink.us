export interface WebGLCapabilities {
  supported: boolean;
  renderer: string | null;
  isSoftware: boolean;
}

/** Conservative WebGL probe — used to fall back to the 2D neural map. */
export function probeWebGL(): WebGLCapabilities {
  if (typeof document === 'undefined') {
    return { supported: false, renderer: null, isSoftware: true };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ??
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true });

    if (!gl) {
      return { supported: false, renderer: null, isSoftware: true };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
      : null;

    const isSoftware =
      !renderer ||
      /swiftshader|llvmpipe|software|basic render/i.test(renderer);

    return { supported: true, renderer, isSoftware };
  } catch {
    return { supported: false, renderer: null, isSoftware: true };
  }
}

export function canUseConstellation3d(constellationFlag: boolean): boolean {
  if (!constellationFlag) return false;
  const caps = probeWebGL();
  if (!caps.supported) return false;
  if (caps.isSoftware) return false;
  return true;
}
