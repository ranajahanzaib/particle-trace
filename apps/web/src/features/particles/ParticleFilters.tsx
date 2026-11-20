import { ParticleFiltersState } from "@/types";
import { ArrowUpDown, Search } from "lucide-react";
import React from "react";

interface ParticleFiltersProps {
  filters: ParticleFiltersState;
  onChange: (updated: Partial<ParticleFiltersState>) => void;
  totalParticles: number;
  filteredCount: number;
}

export const ParticleFilters: React.FC<ParticleFiltersProps> = ({
  filters,
  onChange,
  totalParticles,
  filteredCount,
}) => {
  const classes = [
    { id: "all", label: "All" },
    { id: "lepton", label: "Leptons" },
    { id: "quark", label: "Quarks" },
    { id: "gauge_boson", label: "Bosons" },
    { id: "meson", label: "Mesons" },
    { id: "baryon", label: "Baryons" },
  ];

  return (
    <div className="flex flex-col gap-2 p-2.5 bg-science-surface border-b border-science-border text-xs">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-science-muted" />
        <input
          type="text"
          placeholder="Search by ID, name, or PDG..."
          value={filters.searchQuery}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          className="w-full bg-science-bg border border-science-border rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-science-muted focus:outline-none focus:border-science-particle"
        />
      </div>

      {/* Class Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => onChange({ pdgClass: c.id })}
            className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition ${
              filters.pdgClass === c.id
                ? "bg-science-particle/20 text-science-particle border border-science-particle/40 font-semibold"
                : "bg-science-bg text-science-muted border border-science-border hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Feature Toggles & Sort */}
      <div className="flex items-center justify-between text-[11px] text-science-muted pt-1 border-t border-science-border/50">
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={filters.primaryOnly === true}
              onChange={(e) =>
                onChange({ primaryOnly: e.target.checked ? true : null })
              }
              className="rounded bg-science-bg border-science-border text-science-particle text-xs"
            />
            <span>Primary</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={filters.hasTrackerHits}
              onChange={(e) => onChange({ hasTrackerHits: e.target.checked })}
              className="rounded bg-science-bg border-science-border text-science-tracker text-xs"
            />
            <span>Has Hits</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={filters.hasTracks}
              onChange={(e) => onChange({ hasTracks: e.target.checked })}
              className="rounded bg-science-bg border-science-border text-science-track text-xs"
            />
            <span>Has Track</span>
          </label>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="w-3 h-3 text-science-muted" />
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-") as [any, any];
              onChange({ sortBy: by, sortOrder: order });
            }}
            className="bg-transparent text-science-muted hover:text-white text-[11px] focus:outline-none cursor-pointer"
          >
            <option value="pt-desc">pT (High → Low)</option>
            <option value="pt-asc">pT (Low → High)</option>
            <option value="energy-desc">Energy (High → Low)</option>
            <option value="num_tracker_hits-desc">Hits (Most)</option>
            <option value="particle_id-asc">ID (Ascending)</option>
          </select>
        </div>
      </div>

      {/* Filtered Count */}
      <div className="text-[10px] text-science-muted font-mono flex items-center justify-between">
        <span>
          Showing {filteredCount} of {totalParticles} particles
        </span>
      </div>
    </div>
  );
};
