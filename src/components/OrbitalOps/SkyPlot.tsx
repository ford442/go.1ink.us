import type { LookRow } from '../../lib/orbitalOps';

interface SkyPlotProps {
  looks: readonly LookRow[];
  minElevationDeg: number;
  selectedId: number | null;
  accentById: ReadonlyMap<number, string | null>;
  onSelect?: (projectId: number) => void;
  size?: number;
}

const DEG = Math.PI / 180;
const FALLBACK_ACCENT = 'rgb(var(--rgb-accent-400))';

/**
 * Polar sky plot: zenith at the centre, horizon on the rim, north up and
 * azimuth clockwise — the compass/elevation readout for everything currently
 * above the horizon. Static SVG redrawn on the parent's clock tick.
 */
export default function SkyPlot({ looks, minElevationDeg, selectedId, accentById, onSelect, size = 200 }: SkyPlotProps) {
  const c = size / 2;
  const r = c - 14;
  const radiusFor = (elevationDeg: number) => ((90 - elevationDeg) / 90) * r;
  const above = looks.filter((look) => look.elevationDeg >= 0);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      role="img"
      aria-label={`Sky plot: ${above.length} of ${looks.length} tracked nodes above the horizon`}
      className="shrink-0"
    >
      <circle cx={c} cy={c} r={r} fill="rgba(0,0,0,0.35)" stroke="rgba(var(--rgb-accent-400),0.4)" />
      {[30, 60].map((el) => (
        <circle key={el} cx={c} cy={c} r={radiusFor(el)} fill="none" stroke="rgba(var(--rgb-accent-400),0.15)" />
      ))}
      <circle
        cx={c}
        cy={c}
        r={radiusFor(minElevationDeg)}
        fill="none"
        stroke="rgba(250,204,21,0.45)"
        strokeDasharray="3 3"
      />
      <line x1={c} y1={c - r} x2={c} y2={c + r} stroke="rgba(var(--rgb-accent-400),0.12)" />
      <line x1={c - r} y1={c} x2={c + r} y2={c} stroke="rgba(var(--rgb-accent-400),0.12)" />
      {(['N', 'E', 'S', 'W'] as const).map((label, i) => {
        const angle = i * 90 * DEG;
        return (
          <text
            key={label}
            x={c + Math.sin(angle) * (r + 8)}
            y={c - Math.cos(angle) * (r + 8) + 3}
            textAnchor="middle"
            className="font-mono"
            fontSize="9"
            fill="rgba(var(--rgb-accent-400),0.7)"
          >
            {label}
          </text>
        );
      })}
      {above.map((look) => {
        const radius = radiusFor(look.elevationDeg);
        const x = c + Math.sin(look.azimuthDeg * DEG) * radius;
        const y = c - Math.cos(look.azimuthDeg * DEG) * radius;
        const color = accentById.get(look.projectId) ?? FALLBACK_ACCENT;
        const isSelected = look.projectId === selectedId;
        return (
          <g
            key={look.projectId}
            onClick={onSelect ? () => onSelect(look.projectId) : undefined}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          >
            <title>{`${look.title}: EL ${look.elevationDeg.toFixed(0)}°, AZ ${look.azimuthDeg.toFixed(0)}°`}</title>
            {isSelected && <circle cx={x} cy={y} r={8} fill="none" stroke={color} strokeOpacity={0.7} />}
            <circle cx={x} cy={y} r={look.visible ? 4 : 3} fill={color} fillOpacity={look.visible ? 1 : 0.45} />
          </g>
        );
      })}
    </svg>
  );
}
