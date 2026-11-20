import { CaloCellRecord } from "@/types";
import React, { useMemo } from "react";
import { MM_TO_UNITS } from "./DetectorGeometry";

interface CalorimeterCellMeshProps {
  cells: CaloCellRecord[];
  selectedParticleId: string | null;
  selectedCellIndex: number | null;
  onSelectCell: (cellIndex: number) => void;
  onHoverCell: (
    cell: CaloCellRecord | null,
    contribEnergy?: number,
    screenPos?: { x: number; y: number },
  ) => void;
}

export const CalorimeterCellMesh: React.FC<CalorimeterCellMeshProps> = ({
  cells,
  selectedParticleId,
  selectedCellIndex,
  onSelectCell,
  onHoverCell,
}) => {
  // Identify cells contributed by selected particle
  const cellDisplays = useMemo(() => {
    return cells.map((cell) => {
      let isContributed = false;
      let particleContribEnergy = 0;
      let particleContribTime = 0;

      if (selectedParticleId) {
        const idx = cell.contrib_particle_ids.indexOf(selectedParticleId);
        if (idx !== -1) {
          isContributed = true;
          particleContribEnergy = cell.contrib_energies[idx] || 0;
          particleContribTime = cell.contrib_times[idx] || 0;
        }
      }

      // Height/size scaling based on energy (logarithmic or linear clamped)
      const baseSize = 0.6;
      const energyScale = Math.min(
        Math.max(Math.log10(cell.total_energy + 1) * 0.8, 0.2),
        3.0,
      );

      return {
        cell,
        isContributed,
        particleContribEnergy,
        particleContribTime,
        size: baseSize * energyScale,
        isECal: cell.detector.toLowerCase().includes("ecal"),
      };
    });
  }, [cells, selectedParticleId]);

  return (
    <group name="calorimeter-cells">
      {cellDisplays.map(
        ({ cell, isContributed, particleContribEnergy, size, isECal }) => {
          const isSelected = selectedCellIndex === cell.cell_index;
          const color = isContributed
            ? isSelected
              ? "#f59e0b"
              : "#c084fc"
            : isECal
              ? "#7e22ce"
              : "#be123c";

          const opacity = isContributed ? (isSelected ? 1.0 : 0.85) : 0.25;

          return (
            <group
              key={`cell-${cell.cell_index}`}
              position={[
                cell.x * MM_TO_UNITS,
                cell.y * MM_TO_UNITS,
                cell.z * MM_TO_UNITS,
              ]}
            >
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCell(cell.cell_index);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  onHoverCell(cell, particleContribEnergy, {
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onPointerOut={() => onHoverCell(null)}
              >
                <boxGeometry args={[size, size, size]} />
                <meshStandardMaterial
                  color={color}
                  emissive={isContributed ? color : "#000000"}
                  emissiveIntensity={isContributed ? 0.7 : 0.0}
                  transparent
                  opacity={opacity}
                  wireframe={!isContributed}
                />
              </mesh>

              {isSelected && (
                <mesh>
                  <boxGeometry args={[size * 1.3, size * 1.3, size * 1.3]} />
                  <meshBasicMaterial color="#fbbf24" wireframe />
                </mesh>
              )}
            </group>
          );
        },
      )}
    </group>
  );
};
