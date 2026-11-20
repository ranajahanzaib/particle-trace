import { exportTrackerHitsCsv } from "@/lib/export";
import { formatDistance, formatNumber, formatTime } from "@/lib/formatters";
import { TrackerHitRecord } from "@/types";
import { Download } from "lucide-react";
import React from "react";

interface TrackerExplorerProps {
  hits: TrackerHitRecord[];
  selectedHitIndex: number | null;
  onSelectHit: (hitIndex: number) => void;
  particleId: string;
  eventId: number;
}

export const TrackerExplorer: React.FC<TrackerExplorerProps> = ({
  hits,
  selectedHitIndex,
  onSelectHit,
  particleId,
  eventId,
}) => {
  if (hits.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-science-muted">
        No tracker measurements recorded for this particle.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header with Export */}
      <div className="p-2.5 bg-science-bg/60 border-b border-science-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Tracker Hits</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-science-tracker/15 text-science-tracker border border-science-tracker/30">
            {hits.length} measurements
          </span>
        </div>
        <button
          onClick={() => exportTrackerHitsCsv(hits, particleId, eventId)}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-science-elevated hover:bg-science-highlight text-science-text border border-science-border transition text-[11px]"
          title="Export tracker measurements as CSV"
        >
          <Download className="w-3 h-3" />
          <span>CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead className="bg-science-bg/80 sticky top-0 text-science-muted uppercase text-[10px] tracking-wider border-b border-science-border">
            <tr>
              <th className="py-1.5 px-2">#</th>
              <th className="py-1.5 px-2">Detector</th>
              <th className="py-1.5 px-2">Measured (x, y, z) mm</th>
              <th className="py-1.5 px-2">Residual Δr</th>
              <th className="py-1.5 px-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-science-border/30">
            {hits.map((h) => {
              const isSelected = selectedHitIndex === h.hit_index;
              return (
                <tr
                  key={`hit-row-${h.hit_index}`}
                  onClick={() => onSelectHit(h.hit_index)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? "bg-science-tracker/20 text-white font-medium"
                      : "hover:bg-science-elevated text-science-text"
                  }`}
                >
                  <td className="py-1.5 px-2 text-science-tracker">
                    #{h.hit_index}
                  </td>
                  <td className="py-1.5 px-2 text-science-muted">
                    {h.detector}
                  </td>
                  <td className="py-1.5 px-2">
                    ({formatNumber(h.x, 1)}, {formatNumber(h.y, 1)},{" "}
                    {formatNumber(h.z, 1)})
                  </td>
                  <td className="py-1.5 px-2">
                    {h.dr !== null && h.dr !== undefined ? (
                      <span className="text-science-trackerTrue">
                        {formatDistance(h.dr)}
                      </span>
                    ) : (
                      <span className="text-science-muted">—</span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 text-science-muted">
                    {formatTime(h.time)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
