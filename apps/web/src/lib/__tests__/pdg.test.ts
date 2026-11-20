import { describe, expect, it } from "vitest";
import { getPdgInfo } from "../pdg";

describe("pdg table lookup", () => {
  it("resolves fundamental leptons and quarks", () => {
    const electron = getPdgInfo(11);
    expect(electron.name).toBe("e-");
    expect(electron.class).toBe("lepton");
    expect(electron.charge).toBe(-1);

    const muon = getPdgInfo(13);
    expect(muon.name).toBe("μ-");
    expect(muon.class).toBe("lepton");

    const top = getPdgInfo(6);
    expect(top.name).toBe("t");
    expect(top.class).toBe("quark");
  });

  it("handles unknown PDG codes gracefully", () => {
    const unknown = getPdgInfo(9999999);
    expect(unknown.name).toBe("PDG:9999999");
    expect(unknown.class).toBe("unknown");
  });
});
