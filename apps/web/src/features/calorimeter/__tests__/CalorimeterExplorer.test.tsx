import { CaloCellRecord } from "@/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalorimeterExplorer } from "../CalorimeterExplorer";

describe("CalorimeterExplorer", () => {
  const dummyCells: CaloCellRecord[] = [
    {
      cell_index: 4,
      detector: "ECalBarrel",
      total_energy: 15.0,
      x: 1100.0,
      y: 200.0,
      z: 500.0,
      contrib_particle_ids: ["1001", "1002"],
      contrib_energies: [12.0, 3.0],
      contrib_times: [3.8, 3.9],
    },
  ];

  it("extracts particle contribution and calculates summary", () => {
    const handleSelectCell = vi.fn();
    render(
      <CalorimeterExplorer
        cells={dummyCells}
        particleId="1001"
        selectedCellIndex={null}
        onSelectCell={handleSelectCell}
        eventId={0}
      />,
    );

    expect(screen.getByText("#4")).toBeInTheDocument();
    expect(screen.getByText("ECalBarrel")).toBeInTheDocument();
    expect(screen.getAllByText(/12.000 GeV/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText("#4"));
    expect(handleSelectCell).toHaveBeenCalledWith(4);
  });
});
