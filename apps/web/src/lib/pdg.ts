export interface PdgInfo {
  name: string;
  fullName: string;
  charge: number;
  class:
    | "lepton"
    | "quark"
    | "gauge_boson"
    | "higgs"
    | "meson"
    | "baryon"
    | "neutrino"
    | "unknown";
  color: string;
}

const PDG_DATA: Record<number, PdgInfo> = {
  // Quarks
  1: {
    name: "d",
    fullName: "Down quark",
    charge: -1 / 3,
    class: "quark",
    color: "#f97316",
  },
  "-1": {
    name: "d~",
    fullName: "Anti-down quark",
    charge: 1 / 3,
    class: "quark",
    color: "#ea580c",
  },
  2: {
    name: "u",
    fullName: "Up quark",
    charge: 2 / 3,
    class: "quark",
    color: "#f97316",
  },
  "-2": {
    name: "u~",
    fullName: "Anti-up quark",
    charge: -2 / 3,
    class: "quark",
    color: "#ea580c",
  },
  3: {
    name: "s",
    fullName: "Strange quark",
    charge: -1 / 3,
    class: "quark",
    color: "#f97316",
  },
  "-3": {
    name: "s~",
    fullName: "Anti-strange quark",
    charge: 1 / 3,
    class: "quark",
    color: "#ea580c",
  },
  4: {
    name: "c",
    fullName: "Charm quark",
    charge: 2 / 3,
    class: "quark",
    color: "#f97316",
  },
  "-4": {
    name: "c~",
    fullName: "Anti-charm quark",
    charge: -2 / 3,
    class: "quark",
    color: "#ea580c",
  },
  5: {
    name: "b",
    fullName: "Bottom quark",
    charge: -1 / 3,
    class: "quark",
    color: "#f97316",
  },
  "-5": {
    name: "b~",
    fullName: "Anti-bottom quark",
    charge: 1 / 3,
    class: "quark",
    color: "#ea580c",
  },
  6: {
    name: "t",
    fullName: "Top quark",
    charge: 2 / 3,
    class: "quark",
    color: "#ef4444",
  },
  "-6": {
    name: "t~",
    fullName: "Anti-top quark",
    charge: -2 / 3,
    class: "quark",
    color: "#dc2626",
  },

  // Leptons
  11: {
    name: "e-",
    fullName: "Electron",
    charge: -1.0,
    class: "lepton",
    color: "#38bdf8",
  },
  "-11": {
    name: "e+",
    fullName: "Positron",
    charge: 1.0,
    class: "lepton",
    color: "#0ea5e9",
  },
  12: {
    name: "ν_e",
    fullName: "Electron neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#94a3b8",
  },
  "-12": {
    name: "ν~_e",
    fullName: "Anti-electron neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#64748b",
  },
  13: {
    name: "μ-",
    fullName: "Muon",
    charge: -1.0,
    class: "lepton",
    color: "#22c55e",
  },
  "-13": {
    name: "μ+",
    fullName: "Anti-muon",
    charge: 1.0,
    class: "lepton",
    color: "#16a34a",
  },
  14: {
    name: "ν_μ",
    fullName: "Muon neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#94a3b8",
  },
  "-14": {
    name: "ν~_μ",
    fullName: "Anti-muon neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#64748b",
  },
  15: {
    name: "τ-",
    fullName: "Tau",
    charge: -1.0,
    class: "lepton",
    color: "#10b981",
  },
  "-15": {
    name: "τ+",
    fullName: "Anti-tau",
    charge: 1.0,
    class: "lepton",
    color: "#059669",
  },
  16: {
    name: "ν_τ",
    fullName: "Tau neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#94a3b8",
  },
  "-16": {
    name: "ν~_τ",
    fullName: "Anti-tau neutrino",
    charge: 0.0,
    class: "neutrino",
    color: "#64748b",
  },

  // Bosons
  21: {
    name: "g",
    fullName: "Gluon",
    charge: 0.0,
    class: "gauge_boson",
    color: "#eab308",
  },
  22: {
    name: "γ",
    fullName: "Photon",
    charge: 0.0,
    class: "gauge_boson",
    color: "#facc15",
  },
  23: {
    name: "Z⁰",
    fullName: "Z boson",
    charge: 0.0,
    class: "gauge_boson",
    color: "#a855f7",
  },
  24: {
    name: "W⁺",
    fullName: "W+ boson",
    charge: 1.0,
    class: "gauge_boson",
    color: "#c084fc",
  },
  "-24": {
    name: "W⁻",
    fullName: "W- boson",
    charge: -1.0,
    class: "gauge_boson",
    color: "#9333ea",
  },
  25: {
    name: "H⁰",
    fullName: "Higgs boson",
    charge: 0.0,
    class: "higgs",
    color: "#ec4899",
  },

  // Mesons
  111: {
    name: "π⁰",
    fullName: "Neutral pion",
    charge: 0.0,
    class: "meson",
    color: "#818cf8",
  },
  211: {
    name: "π⁺",
    fullName: "Positive pion",
    charge: 1.0,
    class: "meson",
    color: "#6366f1",
  },
  "-211": {
    name: "π⁻",
    fullName: "Negative pion",
    charge: -1.0,
    class: "meson",
    color: "#4f46e5",
  },
  130: {
    name: "K⁰_L",
    fullName: "K-long kaon",
    charge: 0.0,
    class: "meson",
    color: "#a78bfa",
  },
  310: {
    name: "K⁰_S",
    fullName: "K-short kaon",
    charge: 0.0,
    class: "meson",
    color: "#8b5cf6",
  },
  321: {
    name: "K⁺",
    fullName: "Positive kaon",
    charge: 1.0,
    class: "meson",
    color: "#7c3aed",
  },
  "-321": {
    name: "K⁻",
    fullName: "Negative kaon",
    charge: -1.0,
    class: "meson",
    color: "#6d28d9",
  },
  511: {
    name: "B⁰",
    fullName: "Neutral B meson",
    charge: 0.0,
    class: "meson",
    color: "#d946ef",
  },
  "-511": {
    name: "B~⁰",
    fullName: "Anti-neutral B meson",
    charge: 0.0,
    class: "meson",
    color: "#c026d3",
  },

  // Baryons
  2212: {
    name: "p",
    fullName: "Proton",
    charge: 1.0,
    class: "baryon",
    color: "#06b6d4",
  },
  "-2212": {
    name: "p~",
    fullName: "Anti-proton",
    charge: -1.0,
    class: "baryon",
    color: "#0891b2",
  },
  2112: {
    name: "n",
    fullName: "Neutron",
    charge: 0.0,
    class: "baryon",
    color: "#64748b",
  },
  "-2112": {
    name: "n~",
    fullName: "Anti-neutron",
    charge: 0.0,
    class: "baryon",
    color: "#475569",
  },
};

export function getPdgInfo(pdgId: number): PdgInfo {
  if (PDG_DATA[pdgId]) {
    return PDG_DATA[pdgId];
  }
  return {
    name: `PDG:${pdgId}`,
    fullName: `Particle (${pdgId})`,
    charge: 0.0,
    class: "unknown",
    color: "#94a3b8",
  };
}
