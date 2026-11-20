import { formatMomentum } from "@/lib/formatters";
import { getPdgInfo } from "@/lib/pdg";
import { EventCounts, ParticleFiltersState, ParticleRecord } from "@/types";
import React, { useMemo } from "react";
import { ParticleFilters } from "./ParticleFilters";

interface ParticleTableProps {
  particles: ParticleRecord[];
  selectedParticleId: string | null;
  onSelectParticle: (particleId: string) => void;
  counts: EventCounts;
}

export const ParticleTable: React.FC<ParticleTableProps> = ({
  particles,
  selectedParticleId,
  onSelectParticle,
  counts,
}) => {
  const [filters, setFilters] = React.useState<ParticleFiltersState>({
    searchQuery: "",
    pdgClass: "all",
    primaryOnly: null,
    hasTrackerHits: false,
    hasCaloHits: false,
    hasTracks: false,
    minPt: 0,
    sortBy: "pt",
    sortOrder: "desc",
  });

  const handleFilterChange = (updated: Partial<ParticleFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updated }));
  };

  const filteredParticles = useMemo(() => {
    return particles
      .filter((p) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          const matchId = p.particle_id.toLowerCase().includes(q);
          const matchName = p.name.toLowerCase().includes(q);
          const matchFullName = p.full_name.toLowerCase().includes(q);
          const matchPdg = String(p.pdg_id).includes(q);
          if (!matchId && !matchName && !matchFullName && !matchPdg) {
            return false;
          }
        }

        // PDG class
        if (
          filters.pdgClass !== "all" &&
          p.particle_class !== filters.pdgClass
        ) {
          return false;
        }

        // Primary filter
        if (filters.primaryOnly !== null && p.primary !== filters.primaryOnly) {
          return false;
        }

        // Tracker hits
        if (filters.hasTrackerHits && p.num_tracker_hits === 0) {
          return false;
        }

        // Calo hits
        if (filters.hasCaloHits && p.num_calo_hits === 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (filters.sortBy === "pt") {
          cmp = a.pt - b.pt;
        } else if (filters.sortBy === "energy") {
          cmp = a.energy - b.energy;
        } else if (filters.sortBy === "num_tracker_hits") {
          cmp = a.num_tracker_hits - b.num_tracker_hits;
        } else if (filters.sortBy === "particle_id") {
          cmp = a.particle_id.localeCompare(b.particle_id, undefined, {
            numeric: true,
          });
        } else {
          cmp = a.name.localeCompare(b.name);
        }
        return filters.sortOrder === "desc" ? -cmp : cmp;
      });
  }, [particles, filters]);

  return (
    <div className="flex flex-col h-full bg-science-surface border-r border-science-border overflow-hidden">
      {/* Event Overview Summary Banner */}
      <div className="p-2.5 bg-science-bg/60 border-b border-science-border text-xs flex items-center justify-between">
        <span className="font-semibold text-white">Event Particles</span>
        <div className="flex items-center gap-2 text-[11px] font-mono text-science-muted">
          <span>{counts.particles} particles</span>
          <span>·</span>
          <span>{counts.trackerHits} hits</span>
          <span>·</span>
          <span>{counts.tracks} tracks</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <ParticleFilters
        filters={filters}
        onChange={handleFilterChange}
        totalParticles={particles.length}
        filteredCount={filteredParticles.length}
      />

      {/* Table List */}
      <div className="flex-1 overflow-y-auto">
        {filteredParticles.length === 0 ? (
          <div className="p-6 text-center text-xs text-science-muted">
            No particles matching active filters.
          </div>
        ) : (
          <div className="divide-y divide-science-border/40">
            {filteredParticles.map((p) => {
              const isSelected = selectedParticleId === p.particle_id;
              const pdg = getPdgInfo(p.pdg_id);

              return (
                <div
                  key={p.particle_id}
                  onClick={() => onSelectParticle(p.particle_id)}
                  className={`px-3 py-2 cursor-pointer transition flex items-center justify-between gap-2 text-xs select-none ${
                    isSelected
                      ? "bg-science-particle/15 border-l-2 border-science-particle"
                      : "hover:bg-science-elevated border-l-2 border-transparent"
                  }`}
                >
                  {/* Left: Identity & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-7 h-7 rounded flex items-center justify-center font-bold font-mono text-xs shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: `${pdg.color}20`,
                        color: pdg.color,
                        border: `1px solid ${pdg.color}40`,
                      }}
                    >
                      {p.name}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white truncate text-xs">
                          {p.full_name}
                        </span>
                        {p.primary && (
                          <span className="text-[9px] uppercase px-1 rounded bg-science-vertex/20 text-science-vertex border border-science-vertex/30">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-science-muted truncate">
                        ID: {p.particle_id}
                      </div>
                    </div>
                  </div>

                  {/* Right: Kinematics & Detector Hits Count */}
                  <div className="text-right flex-shrink-0 font-mono text-[11px]">
                    <div className="text-science-text font-medium">
                      {formatMomentum(p.pt)}
                    </div>
                    <div className="flex items-center justify-end gap-1.5 text-[10px] text-science-muted">
                      {p.num_tracker_hits > 0 && (
                        <span
                          className="text-science-tracker"
                          title="Tracker Hits"
                        >
                          {p.num_tracker_hits}h
                        </span>
                      )}
                      {p.num_calo_hits > 0 && (
                        <span
                          className="text-science-ecal"
                          title="Calorimeter Cells"
                        >
                          {p.num_calo_hits}c
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
