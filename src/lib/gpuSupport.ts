import { probeWebGL } from './webglSupport';

export type GpuCapability = 'webgpu' | 'webgl' | 'software' | 'none';

interface GpuNavigator {
  gpu?: {
    requestAdapter(): Promise<{ isFallbackAdapter?: boolean } | null>;
  };
}

export async function probeGpu(): Promise<GpuCapability> {
  try {
    const gpu = typeof navigator === 'undefined' ? undefined : (navigator as GpuNavigator).gpu;
    const adapter = await gpu?.requestAdapter();
    if (adapter && !adapter.isFallbackAdapter) return 'webgpu';
  } catch {
    // Continue to the WebGL probe if access to an adapter is denied.
  }
  const gl = probeWebGL();
  return gl.supported ? (gl.isSoftware ? 'software' : 'webgl') : 'none';
}
