import { EARTH_RADIUS_KM, evaluateConstellationVisibility, footprintFromEcef, footprintRingVectors } from '../ground';
import type { StationFrame, Vec3 } from '../ground';
import type { OrbitalTrack } from './orbitalOps';

export const GLOBE_RADIUS = 6;

/** ECEF (north = z) to Three.js (north = y), keeping the globe Earth-fixed. */
export function globePosition(v: Vec3, scale = GLOBE_RADIUS / EARTH_RADIUS_KM): [number, number, number] {
  return [v.x * scale, v.z * scale, -v.y * scale];
}

export function globeSnapshot(frame: StationFrame, tracks: readonly OrbitalTrack[], at: number) {
  return evaluateConstellationVisibility(frame, tracks.map((track) => track.propagator), at).map((visibility) => ({
    projectId: Number(visibility.id),
    position: globePosition(visibility.ecef),
    visible: visibility.visible,
    ring: footprintRingVectors(footprintFromEcef(visibility.ecef, frame.minElevation))
      .map((point) => globePosition(point, GLOBE_RADIUS * 1.005)),
  }));
}
