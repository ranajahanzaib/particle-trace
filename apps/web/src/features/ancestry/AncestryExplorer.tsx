import { formatMomentum } from "@/lib/formatters";
import { getPdgInfo } from "@/lib/pdg";
import { ParticleRecord } from "@/types";
import { ArrowDown, GitBranch } from "lucide-react";
import React, { useMemo } from "react";

interface AncestryExplorerProps {
  selectedParticle: ParticleRecord;
  allParticles: ParticleRecord[];
  onSelectParticle: (particleId: string) => void;
}

export const AncestryExplorer: React.FC<AncestryExplorerProps> = ({
  selectedParticle,
  allParticles,
  onSelectParticle,
}) => {
  const particlesMap = useMemo(() => {
    return new Map<string, ParticleRecord>(
      allParticles.map((p) => [p.particle_id, p]),
    );
  }, [allParticles]);

  // Find parent and grandparent
  const parent = useMemo(() => {
    if (selectedParticle.parent_id in ["-1", "", "null", "None"]) return null;
    return particlesMap.get(selectedParticle.parent_id) || null;
  }, [selectedParticle, particlesMap]);

  const grandparent = useMemo(() => {
    if (!parent || parent.parent_id in ["-1", "", "null", "None"]) return null;
    return particlesMap.get(parent.parent_id) || null;
  }, [parent, particlesMap]);

  // Find immediate children
  const children = useMemo(() => {
    return allParticles.filter(
      (p) => p.parent_id === selectedParticle.particle_id,
    );
  }, [allParticles, selectedParticle]);

  const renderNode = (
    p: ParticleRecord | null,
    role: string,
    isTarget: boolean = false,
  ) => {
    if (!p) {
      return (
        <div className="p-2 rounded border border-dashed border-science-border text-science-muted text-center text-xs">
          None (Root or Initial Parton)
        </div>
      );
    }

    const pdg = getPdgInfo(p.pdg_id);

    return (
      <div
        onClick={() => onSelectParticle(p.particle_id)}
        className={`p-2.5 rounded border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
          isTarget
            ? "bg-science-particle/20 border-science-particle text-white shadow-lg shadow-science-particle/10"
            : "bg-science-bg border-science-border hover:bg-science-elevated text-science-text"
        }`}
      >
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
              <span className="text-[10px] uppercase font-mono px-1 rounded bg-science-surface text-science-muted">
                {role}
              </span>
            </div>
            <div className="font-mono text-[10px] text-science-muted truncate">
              ID: {p.particle_id} · pT: {formatMomentum(p.pt)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full text-xs p-3 overflow-y-auto gap-3">
      {/* Overview header */}
      <div className="flex items-center justify-between text-science-muted border-b border-science-border pb-1.5">
        <span className="font-semibold text-white flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-science-particle" /> Particle
          Lineage Tree
        </span>
        <span className="text-[10px] font-mono">
          {children.length} direct decay children
        </span>
      </div>

      {/* Tree Visualization */}
      <div className="flex flex-col gap-2 relative">
        {/* Grandparent */}
        {grandparent && (
          <>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-science-muted font-mono tracking-wider">
                Grandparent
              </span>
              {renderNode(grandparent, "Grandparent")}
            </div>
            <div className="flex justify-center text-science-border">
              <ArrowDown className="w-4 h-4 text-science-muted/60" />
            </div>
          </>
        )}

        {/* Parent */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-science-muted font-mono tracking-wider">
            Parent
          </span>
          {renderNode(parent, "Parent")}
        </div>

        <div className="flex justify-center text-science-border">
          <ArrowDown className="w-4 h-4 text-science-particle" />
        </div>

        {/* Target Selected Particle */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase text-science-particle font-bold font-mono tracking-wider">
            Selected Particle
          </span>
          {renderNode(selectedParticle, "Target", true)}
        </div>

        {/* Children */}
        {children.length > 0 && (
          <>
            <div className="flex justify-center text-science-border">
              <ArrowDown className="w-4 h-4 text-science-muted/60" />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase text-science-muted font-mono tracking-wider">
                Direct Children ({children.length})
              </span>
              <div className="flex flex-col gap-1.5 pl-3 border-l-2 border-science-border/60">
                {children.map((c) => (
                  <div key={`child-${c.particle_id}`}>
                    {renderNode(c, "Child")}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
