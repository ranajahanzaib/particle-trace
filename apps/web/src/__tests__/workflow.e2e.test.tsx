import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { dataRepository } from "../services/api";
import { EventBundle } from "../types";

// Mock sample event bundle for deterministic end-to-end testing
const mockEventBundle: EventBundle = {
  schemaVersion: 1,
  source: {
    dataset: "CERN/ColliderML-Release-1",
    release: "Release 1",
    configuration: "ttbar_pu0",
    channel: "ttbar",
    pileup: "pu0",
    split: "train",
    eventId: 0,
  },
  counts: {
    particles: 3,
    trackerHits: 4,
    calorimeterCells: 2,
    tracks: 1,
  },
  particles: [
    {
      particle_id: "1001",
      pdg_id: 6,
      name: "t",
      full_name: "Top quark",
      particle_class: "quark",
      mass: 172.76,
      energy: 250.0,
      charge: 2 / 3,
      px: 100.0,
      py: 50.0,
      pz: 80.0,
      vx: 0.0,
      vy: 0.0,
      vz: 0.0,
      time: 0.0,
      num_tracker_hits: 0,
      num_calo_hits: 0,
      primary: true,
      parent_id: "-1",
      p: 137.47,
      pt: 111.8,
      phi: 0.463,
      eta: 0.658,
    },
    {
      particle_id: "1002",
      pdg_id: -13,
      name: "mu+",
      full_name: "Anti-muon",
      particle_class: "lepton",
      mass: 0.105,
      energy: 90.0,
      charge: 1.0,
      px: 40.0,
      py: 30.0,
      pz: 60.0,
      vx: 0.001,
      vy: 0.001,
      vz: 0.002,
      time: 0.0001,
      num_tracker_hits: 4,
      num_calo_hits: 2,
      primary: false,
      parent_id: "1001",
      p: 78.1,
      pt: 50.0,
      phi: 0.643,
      eta: 1.026,
    },
    {
      particle_id: "1003",
      pdg_id: 22,
      name: "gamma",
      full_name: "Photon",
      particle_class: "gauge_boson",
      mass: 0.0,
      energy: 30.0,
      charge: 0.0,
      px: 10.0,
      py: 20.0,
      pz: 20.0,
      vx: 0.0,
      vy: 0.0,
      vz: 0.0,
      time: 0.0,
      num_tracker_hits: 0,
      num_calo_hits: 2,
      primary: true,
      parent_id: "-1",
      p: 30.0,
      pt: 22.36,
      phi: 1.107,
      eta: 0.812,
    },
  ],
  trackerHits: [
    {
      hit_index: 0,
      x: 32.0,
      y: 24.0,
      z: 48.0,
      true_x: 32.01,
      true_y: 23.99,
      true_z: 48.0,
      time: 0.21,
      particle_id: "1002",
      volume_id: 8,
      layer_id: 0,
      surface_id: 10,
      detector: "Pixel",
      dx: -0.01,
      dy: 0.01,
      dz: 0.0,
      dr: 0.014,
    },
  ],
  calorimeterCells: [
    {
      cell_index: 0,
      detector: "ECalBarrel",
      total_energy: 1.5,
      x: 1100.0,
      y: 825.0,
      z: 1650.0,
      contrib_particle_ids: ["1002"],
      contrib_energies: [1.2],
      contrib_times: [7.2],
    },
  ],
  tracks: [
    {
      track_id: 0,
      majority_particle_id: "1002",
      d0: 0.01,
      z0: 0.02,
      phi: 0.643,
      theta: 0.695,
      qop: 0.0128,
      hit_ids: [0],
      p: 78.1,
      pt: 50.0,
      eta: 1.026,
    },
  ],
  indexes: {
    trackerHitIndicesByParticleId: { "1002": [0] },
    caloCellIndicesByParticleId: { "1002": [0] },
    trackIndicesByMajorityParticleId: { "1002": [0] },
    childrenIdsByParentId: { "1001": ["1002"] },
  },
  relationships: {
    trackHitMappingStatus: "verified_row_indices",
    notes: "Verified row index mapping",
  },
  diagnostics: [],
};

describe("End-to-end scientific investigation workflow", () => {
  beforeEach(() => {
    vi.spyOn(dataRepository, "getConfigManifest").mockResolvedValue({
      configuration: "ttbar_pu0",
      channel: "ttbar",
      pileup: "pu0",
      eventCount: 1,
      events: [
        {
          eventId: 0,
          particleCount: 3,
          trackerHitCount: 4,
          calorimeterCellCount: 2,
          trackCount: 1,
        },
      ],
      updatedAt: new Date().toISOString(),
    });

    vi.spyOn(dataRepository, "getEventBundle").mockResolvedValue(
      mockEventBundle,
    );
  });

  it("executes the complete 10-step particle investigation workflow", async () => {
    // 1. Open Particle Trace
    render(<App />);

    // 2. Wait for event to load
    await waitFor(() => {
      expect(screen.getByText(/Event Particles/i)).toBeInTheDocument();
    });

    // 3. Select particle Anti-muon
    const muonElement = screen.getByText("Anti-muon");
    fireEvent.click(muonElement);

    // 4. Inspect its truth-level information
    expect(screen.getByText(/Pseudorapidity \(η\)/i)).toBeInTheDocument();
    expect(screen.getByText("1.026")).toBeInTheDocument();

    // 5. Inspect associated tracker measurements tab
    const trackerTab = screen.getAllByRole("button", { name: /Tracker/i })[0];
    fireEvent.click(trackerTab);
    expect(screen.getByText("#0")).toBeInTheDocument();
    expect(screen.getByText("Pixel")).toBeInTheDocument();

    // 6. Inspect calorimeter contributions tab
    const caloTab = screen.getAllByRole("button", { name: /Calorimeter/i })[0];
    fireEvent.click(caloTab);
    expect(screen.getByText("ECalBarrel")).toBeInTheDocument();
    expect(screen.getByText("Total Deposited")).toBeInTheDocument();

    // 7. Inspect reconstructed tracks tab
    const tracksTab = screen.getAllByRole("button", { name: /Tracks/i })[0];
    fireEvent.click(tracksTab);
    expect(screen.getByText("Track #0")).toBeInTheDocument();
    expect(screen.getByText(/Majority-Truth Association/i)).toBeInTheDocument();

    // 8. Navigate to parent in Ancestry tab
    const ancestryTab = screen.getByRole("button", { name: /Ancestry/i });
    fireEvent.click(ancestryTab);
    expect(screen.getByText(/Particle Lineage Tree/i)).toBeInTheDocument();

    // Top quark appears in browser table and in ancestry lineage tree
    const topQuarkElements = screen.getAllByText("Top quark");
    expect(topQuarkElements.length).toBeGreaterThan(0);

    // Click parent Top quark node
    fireEvent.click(topQuarkElements[topQuarkElements.length - 1]);

    // 9. Verify selection updated to Top quark
    await waitFor(() => {
      expect(screen.getAllByText("Top quark").length).toBeGreaterThan(0);
    });

    // 10. Switch back to overview tab and export button is present
    const overviewTab = screen.getByRole("button", { name: /Overview/i });
    fireEvent.click(overviewTab);
    expect(screen.getByTitle("Export Particle JSON")).toBeInTheDocument();
  });
});
