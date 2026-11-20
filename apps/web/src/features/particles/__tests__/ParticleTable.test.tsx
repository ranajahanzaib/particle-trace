import { ParticleRecord } from "@/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ParticleTable } from "../ParticleTable";

describe("ParticleTable", () => {
  const dummyParticles: ParticleRecord[] = [
    {
      particle_id: "1000000000000001",
      pdg_id: 13,
      name: "mu-",
      full_name: "muon",
      particle_class: "lepton",
      mass: 0.105,
      energy: 90.0,
      charge: -1.0,
      px: 40.0,
      py: 30.0,
      pz: 50.0,
      vx: 0.0,
      vy: 0.0,
      vz: 0.0,
      time: 0.0,
      num_tracker_hits: 10,
      num_calo_hits: 2,
      primary: true,
      parent_id: "-1",
      p: 70.71,
      pt: 50.0,
      phi: 0.643,
      eta: 0.881,
    },
    {
      particle_id: "1000000000000002",
      pdg_id: 22,
      name: "gamma",
      full_name: "photon",
      particle_class: "gauge_boson",
      mass: 0.0,
      energy: 35.0,
      charge: 0.0,
      px: 10.0,
      py: 20.0,
      pz: 25.0,
      vx: 0.0,
      vy: 0.0,
      vz: 0.0,
      time: 0.0,
      num_tracker_hits: 0,
      num_calo_hits: 4,
      primary: false,
      parent_id: "1000000000000001",
      p: 33.54,
      pt: 22.36,
      phi: 1.107,
      eta: 0.985,
    },
  ];

  it("renders particles and responds to selection", () => {
    const handleSelect = vi.fn();
    render(
      <ParticleTable
        particles={dummyParticles}
        selectedParticleId={null}
        onSelectParticle={handleSelect}
        counts={{
          particles: 2,
          trackerHits: 10,
          calorimeterCells: 6,
          tracks: 1,
        }}
      />,
    );

    expect(screen.getByText("muon")).toBeInTheDocument();
    expect(screen.getByText("photon")).toBeInTheDocument();

    fireEvent.click(screen.getByText("muon"));
    expect(handleSelect).toHaveBeenCalledWith("1000000000000001");
  });

  it("filters particles by search query", () => {
    render(
      <ParticleTable
        particles={dummyParticles}
        selectedParticleId={null}
        onSelectParticle={() => {}}
        counts={{
          particles: 2,
          trackerHits: 10,
          calorimeterCells: 6,
          tracks: 1,
        }}
      />,
    );

    const searchInput = screen.getByPlaceholderText(/search by id/i);
    fireEvent.change(searchInput, { target: { value: "photon" } });

    expect(screen.queryByText("muon")).not.toBeInTheDocument();
    expect(screen.getByText("photon")).toBeInTheDocument();
  });
});
