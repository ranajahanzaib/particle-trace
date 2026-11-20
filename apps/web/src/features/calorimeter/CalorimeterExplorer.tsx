import { exportCaloContributionsCsv } from "@/lib/export";
import { formatEnergy, formatTime } from "@/lib/formatters";
import { CaloCellRecord } from "@/types";
import { Clock, Download, Zap } from "lucide-react";
import React, { useMemo } from "react";

interface CalorimeterExplorerProps {
  cells: CaloCellRecord[];
  particleId: string;
  selectedCellIndex: number | null;
  onSelectCell: (cellIndex: number) => void;
  eventId: number;
}

export const CalorimeterExplorer: React.FC<CalorimeterExplorerProps> = ({
  cells,
  particleId,
  selectedCellIndex,
  onSelectCell,
  eventId,
}) => {
  // Extract particle-specific contributions
  const contributions = useMemo(() => {
    const list: {
      cell: CaloCellRecord;
      contribEnergy: number;
      contribTime: number;
    }[] = [];
    for (const cell of cells) {
      const idx = cell.contrib_particle_ids.indexOf(particleId);
      if (idx !== -1) {
        list.push({
          cell,
          contribEnergy: cell.contrib_energies[idx] || 0,
          contribTime: cell.contrib_times[idx] || 0,
        });
      }
    }
    return list;
  }, [cells, particleId]);

  // Derived summaries
  const summaries = useMemo(() => {
    if (contributions.length === 0) return null;
    const totalE = contributions.reduce((acc, c) => acc + c.contribEnergy, 0);
    const times = contributions.map((c) => c.contribTime);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    let weightedTime = 0;
    if (totalE > 0) {
      weightedTime =
        contributions.reduce(
          (acc, c) => acc + c.contribEnergy * c.contribTime,
          0,
        ) / totalE;
    }

    return {
      totalEnergy: totalE,
      numCells: contributions.length,
      weightedTime,
      minTime,
      maxTime,
    };
  }, [contributions]);

  if (contributions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-science-muted">
        No calorimeter cell contributions recorded for this particle.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Header with Export */}
      <div className="p-2.5 bg-science-bg/60 border-b border-science-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white">Calorimeter Showers</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-science-ecal/15 text-science-ecal border border-science-ecal/30">
            {contributions.length} cells
          </span>
        </div>
        <button
          onClick={() =>
            exportCaloContributionsCsv(contributions, particleId, eventId)
          }
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-science-elevated hover:bg-science-highlight text-science-text border border-science-border transition text-[11px]"
          title="Export calorimeter contributions as CSV"
        >
          <Download className="w-3 h-3" />
          <span>CSV</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      {summaries && (
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-science-surface border-b border-science-border">
          <div className="p-2 rounded bg-science-bg border border-science-border">
            <div className="text-[10px] text-science-muted uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-science-ecal" /> Total Deposited
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {formatEnergy(summaries.totalEnergy)}
            </div>
          </div>
          <div className="p-2 rounded bg-science-bg border border-science-border">
            <div className="text-[10px] text-science-muted uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-science-particle" /> Weighted Time
            </div>
            <div className="text-sm font-bold font-mono text-white mt-0.5">
              {formatTime(summaries.weightedTime)}
            </div>
          </div>
          <div className="p-2 rounded bg-science-bg border border-science-border">
            <div className="text-[10px] text-science-muted uppercase tracking-wider flex items-center gap-1">
              Timing Span
            </div>
            <div className="text-xs font-mono text-science-text mt-1">
              {formatTime(summaries.minTime)} – {formatTime(summaries.maxTime)}
            </div>
          </div>
        </div>
      )}

      {/* Cell Contributions Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead className="bg-science-bg/80 sticky top-0 text-science-muted uppercase text-[10px] tracking-wider border-b border-science-border">
            <tr>
              <th className="py-1.5 px-2">Cell</th>
              <th className="py-1.5 px-2">Subsystem</th>
              <th className="py-1.5 px-2">Contrib Energy</th>
              <th className="py-1.5 px-2">Cell Total</th>
              <th className="py-1.5 px-2">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-science-border/30">
            {contributions.map(({ cell, contribEnergy, contribTime }) => {
              const isSelected = selectedCellIndex === cell.cell_index;
              const energyFraction =
                cell.total_energy > 0
                  ? (contribEnergy / cell.total_energy) * 100
                  : 0;

              return (
                <tr
                  key={`cell-row-${cell.cell_index}`}
                  onClick={() => onSelectCell(cell.cell_index)}
                  className={`cursor-pointer transition ${
                    isSelected
                      ? "bg-science-ecal/20 text-white font-medium"
                      : "hover:bg-science-elevated text-science-text"
                  }`}
                >
                  <td className="py-1.5 px-2 text-science-ecal">
                    #{cell.cell_index}
                  </td>
                  <td className="py-1.5 px-2 text-science-muted">
                    {cell.detector}
                  </td>
                  <td className="py-1.5 px-2 font-bold text-amber-400">
                    {formatEnergy(contribEnergy)}
                    <span className="text-[10px] text-science-muted ml-1 font-normal">
                      ({energyFraction.toFixed(0)}%)
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-science-muted">
                    {formatEnergy(cell.total_energy)}
                  </td>
                  <td className="py-1.5 px-2 text-science-muted">
                    {formatTime(contribTime)}
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
