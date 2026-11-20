import {
  formatDistance,
  formatEnergy,
  formatNumber,
  formatTime,
} from "@/lib/formatters";
import { CaloCellRecord, TrackerHitRecord } from "@/types";
import React from "react";

interface DetectorTooltipProps {
  hit: TrackerHitRecord | null;
  cell: CaloCellRecord | null;
  contribEnergy?: number;
  position: { x: number; y: number } | null;
}

export const DetectorTooltip: React.FC<DetectorTooltipProps> = ({
  hit,
  cell,
  contribEnergy,
  position,
}) => {
  if (!position || (!hit && !cell)) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none bg-science-surface/95 backdrop-blur-md border border-science-border rounded p-2 text-xs text-science-text shadow-2xl min-w-[200px]"
      style={{
        left: `${position.x + 12}px`,
        top: `${position.y + 12}px`,
      }}
    >
      {hit && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between border-b border-science-border pb-1">
            <span className="font-semibold text-science-tracker flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-science-tracker" />
              Tracker Hit #{hit.hit_index}
            </span>
            <span className="font-mono text-science-muted">{hit.detector}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-mono">
            <span className="text-science-muted">Particle:</span>
            <span>{hit.particle_id}</span>
            <span className="text-science-muted">Measured:</span>
            <span>
              ({formatNumber(hit.x, 1)}, {formatNumber(hit.y, 1)},{" "}
              {formatNumber(hit.z, 1)}) mm
            </span>
            {hit.true_x !== null && hit.true_x !== undefined && (
              <>
                <span className="text-science-muted">True:</span>
                <span>
                  ({formatNumber(hit.true_x, 1)}, {formatNumber(hit.true_y, 1)},{" "}
                  {formatNumber(hit.true_z, 1)}) mm
                </span>
                <span className="text-science-muted">Residual:</span>
                <span className="text-science-trackerTrue">
                  {formatDistance(hit.dr)}
                </span>
              </>
            )}
            <span className="text-science-muted">Layer / Vol:</span>
            <span>
              {hit.layer_id} / {hit.volume_id}
            </span>
            <span className="text-science-muted">Time:</span>
            <span>{formatTime(hit.time)}</span>
          </div>
        </div>
      )}

      {cell && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between border-b border-science-border pb-1">
            <span className="font-semibold text-science-ecal flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-science-ecal" />
              Calo Cell #{cell.cell_index}
            </span>
            <span className="font-mono text-science-muted">
              {cell.detector}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] font-mono">
            <span className="text-science-muted">Total Energy:</span>
            <span className="font-semibold">
              {formatEnergy(cell.total_energy)}
            </span>
            {contribEnergy !== undefined && contribEnergy > 0 && (
              <>
                <span className="text-science-muted">Selected Contrib:</span>
                <span className="text-amber-400 font-semibold">
                  {formatEnergy(contribEnergy)}
                </span>
              </>
            )}
            <span className="text-science-muted">Position:</span>
            <span>
              ({formatNumber(cell.x, 0)}, {formatNumber(cell.y, 0)},{" "}
              {formatNumber(cell.z, 0)}) mm
            </span>
            <span className="text-science-muted">Contrib Particles:</span>
            <span>{cell.contrib_particle_ids.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
