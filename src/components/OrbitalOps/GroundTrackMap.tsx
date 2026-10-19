import { useMemo } from 'react';
import { groundTrack, splitAtAntimeridian, trackFootprint, type OrbitalTrack } from '../../lib/orbitalOps';
import type { FootprintPoint, StationFrame } from '../../ground';

interface GroundTrackMapProps {
  frame: StationFrame;
  track: OrbitalTrack;
  now: number;
  className?: string;
}

// Equirectangular: x = lon + 180, y = 90 - lat in a 360×180 viewBox.
const toPoints = (points: readonly FootprintPoint[]) =>
  points.map((p) => `${(p.longitudeDeg + 180).toFixed(2)},${(90 - p.latitudeDeg).toFixed(2)}`).join(' ');

const GRATICULE_LON = [-120, -60, 0, 60, 120];
const GRATICULE_LAT = [-60, -30, 0, 30, 60];

/**
 * Flat-map overlay for one tracked node: the station pin, the sub-satellite
 * point, the coverage footprint ring (sized by the station's minimum
 * elevation) and the next ~95 minutes of ground track. CPU geometry from
 * lib/orbitalOps.ts drawn as SVG — no WebGL, no new physics.
 */
export default function GroundTrackMap({ frame, track, now, className = '' }: GroundTrackMapProps) {
  const footprint = useMemo(() => trackFootprint(frame, track, now), [frame, track, now]);
  // The ground track only needs refreshing about once a minute.
  const minuteBucket = Math.floor(now / 60000);
  const trackSegments = useMemo(
    () => groundTrack(track, minuteBucket * 60000),
    [track, minuteBucket],
  );
  const ringSegments = useMemo(() => (footprint ? splitAtAntimeridian(footprint.ring) : []), [footprint]);

  const stationX = frame.station.longitudeDeg + 180;
  const stationY = 90 - frame.station.latitudeDeg;
  const color = track.accent ?? 'rgb(var(--rgb-accent-400))';

  return (
    <svg
      viewBox="0 0 360 180"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={
        footprint
          ? `${track.title} sub-satellite point ${footprint.subSatellite.latitudeDeg.toFixed(1)}°, ${footprint.subSatellite.longitudeDeg.toFixed(1)}°; footprint radius ${Math.round(footprint.groundRadiusKm)} km`
          : `${track.title} position unavailable`
      }
      className={`w-full h-auto rounded-md border border-white/10 bg-black/40 ${className}`}
    >
      {GRATICULE_LON.map((lon) => (
        <line key={`lon${lon}`} x1={lon + 180} y1={0} x2={lon + 180} y2={180} stroke="rgba(var(--rgb-accent-400),0.12)" strokeWidth={0.5} />
      ))}
      {GRATICULE_LAT.map((lat) => (
        <line
          key={`lat${lat}`}
          x1={0}
          y1={90 - lat}
          x2={360}
          y2={90 - lat}
          stroke={lat === 0 ? 'rgba(var(--rgb-accent-400),0.25)' : 'rgba(var(--rgb-accent-400),0.12)'}
          strokeWidth={0.5}
        />
      ))}
      {trackSegments.map((segment, i) => (
        <polyline key={`t${i}`} points={toPoints(segment)} fill="none" stroke={color} strokeOpacity={0.45} strokeWidth={0.8} strokeDasharray="2 2" />
      ))}
      {ringSegments.map((segment, i) => (
        <polyline key={`r${i}`} points={toPoints(segment)} fill="none" stroke={color} strokeWidth={1} />
      ))}
      {footprint && (
        <circle
          cx={footprint.subSatellite.longitudeDeg + 180}
          cy={90 - footprint.subSatellite.latitudeDeg}
          r={2.5}
          fill={color}
        />
      )}
      <g>
        <title>{frame.station.name}</title>
        <path d={`M${stationX},${stationY - 4} L${stationX + 3},${stationY + 2} L${stationX - 3},${stationY + 2} Z`} fill="rgb(250,204,21)" />
      </g>
    </svg>
  );
}
