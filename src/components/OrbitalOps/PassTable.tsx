import { compassPoint } from '../../ground';
import {
  MODEL_DISCLAIMER,
  formatApproxClock,
  formatApproxCountdown,
  formatDurationMinutes,
  type PassRow,
} from '../../lib/orbitalOps';

interface PassTableProps {
  rows: readonly PassRow[];
  now: number;
  stationName: string;
  onSelectProject?: (projectId: number) => void;
}

/**
 * The pass table is the one Orbital Ops surface that always renders — in
 * lite mode and when the constellation falls back from WebGL — so it is
 * plain DOM with no canvas, SVG, or animation.
 */
export default function PassTable({ rows, now, stationName, onSelectProject }: PassTableProps) {
  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 ? (
        <p className="text-[10px] font-mono text-gray-500 border border-white/5 rounded-lg bg-black/30 p-3">
          NO_PASSES — nothing clears the {stationName} horizon in the next 24h.
        </p>
      ) : (
        <div className="overflow-x-auto border border-white/5 rounded-lg bg-black/30">
          <table className="w-full text-left font-mono text-[11px]">
            <caption className="sr-only">Predicted passes over {stationName} in the next 24 hours</caption>
            <thead className="text-[9px] tracking-widest text-accent-400/70 uppercase">
              <tr>
                <th scope="col" className="px-2 py-1.5 font-normal">Node</th>
                <th scope="col" className="px-2 py-1.5 font-normal">AOS</th>
                <th scope="col" className="px-2 py-1.5 font-normal">ETA</th>
                <th scope="col" className="px-2 py-1.5 font-normal">Max El</th>
                <th scope="col" className="px-2 py-1.5 font-normal">Track</th>
                <th scope="col" className="px-2 py-1.5 font-normal">Dur</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isUp = row.start.getTime() <= now && row.end.getTime() > now;
                return (
                  <tr key={`${row.projectId}-${row.start.getTime()}`} className="border-t border-white/5 hover:bg-white/5">
                    <th scope="row" className="px-2 py-1.5 font-normal">
                      {onSelectProject ? (
                        <button
                          type="button"
                          onClick={() => onSelectProject(row.projectId)}
                          className="flex items-center gap-1.5 text-gray-200 hover:text-accent-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent-400 rounded"
                        >
                          <span aria-hidden="true">{row.icon}</span>
                          <span className="truncate max-w-[9rem]">{row.title}</span>
                        </button>
                      ) : (
                        <span className="flex items-center gap-1.5 text-gray-200">
                          <span aria-hidden="true">{row.icon}</span>
                          <span className="truncate max-w-[9rem]">{row.title}</span>
                        </span>
                      )}
                    </th>
                    <td className="px-2 py-1.5 whitespace-nowrap text-accent-200">{formatApproxClock(row.start)}</td>
                    <td className={`px-2 py-1.5 ${isUp ? 'text-green-400' : 'text-gray-400'}`}>
                      {isUp ? 'OVERHEAD' : formatApproxCountdown(row.start, now)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-gray-200">{Math.round(row.maxElevationDeg)}°</td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-gray-400">
                      {compassPoint(row.startAzimuthDeg)}→{compassPoint(row.endAzimuthDeg)}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-gray-400">{formatDurationMinutes(row.durationSec)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[9px] font-mono text-accent-500/50 tracking-wide">{MODEL_DISCLAIMER}</p>
    </div>
  );
}
