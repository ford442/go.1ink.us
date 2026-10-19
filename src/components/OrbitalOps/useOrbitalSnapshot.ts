import { useMemo } from 'react';
import { lookAngleRows, predictTrackPasses, type PassTableOptions } from '../../lib/orbitalOps';
import type { StationFrame } from '../../ground';
import { ORBITAL_TRACKS } from './tracks';

/**
 * Look angles for every tracked node at `now`, plus the merged pass table.
 * The pass search is the expensive half (a 24h scan per track), so it only
 * re-runs when the station changes or the clock crosses a minute boundary.
 */
export default function useOrbitalSnapshot(frame: StationFrame, now: number, passOptions: PassTableOptions = {}) {
  const { durationHours, maxRows, maxPerTrack } = passOptions;
  const minuteBucket = Math.floor(now / 60000);

  const passes = useMemo(
    () => predictTrackPasses(frame, ORBITAL_TRACKS, minuteBucket * 60000, { durationHours, maxRows, maxPerTrack }),
    [frame, minuteBucket, durationHours, maxRows, maxPerTrack],
  );
  const looks = useMemo(() => lookAngleRows(frame, ORBITAL_TRACKS, now), [frame, now]);

  return { tracks: ORBITAL_TRACKS, passes, looks };
}
