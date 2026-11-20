import { TrackerHitRecord } from "@/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TrackerExplorer } from "../TrackerExplorer";

describe("TrackerExplorer", () => {
  const dummyHits: TrackerHitRecord[] = [
    {
      hit_index: 0,
      x: 10.5,
      y: 20.2,
      z: 30.1,
      true_x: 10.51,
      true_y: 20.19,
      true_z: 30.1,
      time: 0.12,
      particle_id: "1001",
      volume_id: 8,
      layer_id: 0,
      surface_id: 100,
      detector: "Pixel",
      dx: -0.01,
      dy: 0.01,
      dz: 0.0,
      dr: 0.014,
    },
  ];

  it("renders hit rows and handles selection", () => {
    const handleSelect = vi.fn();
    render(
      <TrackerExplorer
        hits={dummyHits}
        selectedHitIndex={null}
        onSelectHit={handleSelect}
        particleId="1001"
        eventId={0}
      />,
    );

    expect(screen.getByText("#0")).toBeInTheDocument();
    expect(screen.getByText("Pixel")).toBeInTheDocument();

    fireEvent.click(screen.getByText("#0"));
    expect(handleSelect).toHaveBeenCalledWith(0);
  });

  it("renders empty state when no hits exist", () => {
    render(
      <TrackerExplorer
        hits={[]}
        selectedHitIndex={null}
        onSelectHit={() => {}}
        particleId="1001"
        eventId={0}
      />,
    );

    expect(
      screen.getByText(/no tracker measurements recorded/i),
    ).toBeInTheDocument();
  });
});
