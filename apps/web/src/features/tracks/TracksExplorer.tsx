import {
  formatAngle,
  formatDistance,
  formatMomentum,
  formatNumber,
} from "@/lib/formatters";
import { RelationshipMetadata, TrackRecord } from "@/types";
import { HelpCircle, Info } from "lucide-react";
import React from "react";

interface TracksExplorerProps {
  tracks: TrackRecord[];
  particleId: string;
  relationships: RelationshipMetadata;
}

export const TracksExplorer: React.FC<TracksExplorerProps> = ({
  tracks,
  particleId,
  relationships,
}) => {
  if (tracks.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-science-muted">
        <p>No reconstructed tracks associated with this truth particle.</p>
        <p className="mt-2 text-[11px] text-science-muted/80">
          In collider reconstruction, neutral particles or particles below
          tracking thresholds typically do not yield reconstructed tracks.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs overflow-y-auto p-3 gap-3">
      {/* Association explanation callout */}
      <div className="p-2.5 rounded bg-science-bg border border-science-border text-science-text flex items-start gap-2">
        <Info className="w-4 h-4 text-science-track flex-shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <span className="font-semibold text-white">
            Majority-Truth Association:
          </span>{" "}
          Tracks are matched when this particle has the largest fraction of hits
          on the reconstructed track (
          <code className="text-science-track">
            majority_particle_id == {particleId}
          </code>
          ). This is an association rather than a strict 1-to-1 physical
          identity.
        </div>
      </div>

      {/* Tracks list */}
      <div className="flex flex-col gap-3">
        {tracks.map((t) => (
          <div
            key={`track-${t.track_id}`}
            className="p-3 rounded bg-science-bg border border-science-border flex flex-col gap-2"
          >
            <div className="flex items-center justify-between border-b border-science-border pb-1.5">
              <span className="font-semibold text-science-track flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-science-track" />
                Track #{t.track_id}
              </span>
              <span className="font-mono text-[11px] text-science-muted">
                {t.hit_ids.length} hit IDs
              </span>
            </div>

            {/* Derived Track Kinematics */}
            <div className="grid grid-cols-3 gap-2 py-1 text-[11px] font-mono">
              <div className="p-1.5 rounded bg-science-surface border border-science-border">
                <span className="text-science-muted text-[10px] block">
                  Track p
                </span>
                <span className="font-bold text-white">
                  {formatMomentum(t.p)}
                </span>
              </div>
              <div className="p-1.5 rounded bg-science-surface border border-science-border">
                <span className="text-science-muted text-[10px] block">
                  Track pT
                </span>
                <span className="font-bold text-white">
                  {formatMomentum(t.pt)}
                </span>
              </div>
              <div className="p-1.5 rounded bg-science-surface border border-science-border">
                <span className="text-science-muted text-[10px] block">
                  Pseudorapidity η
                </span>
                <span className="font-bold text-white">
                  {formatNumber(t.eta, 3)}
                </span>
              </div>
            </div>

            {/* Track Parameters Table */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono bg-science-surface/40 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-science-muted">Transverse d0:</span>
                <span>{formatDistance(t.d0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-science-muted">Longitudinal z0:</span>
                <span>{formatDistance(t.z0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-science-muted">Azimuthal phi (φ):</span>
                <span>{formatAngle(t.phi)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-science-muted">Polar theta (θ):</span>
                <span>{formatAngle(t.theta)}</span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-science-muted">q/p:</span>
                <span>{formatNumber(t.qop, 6)} e/GeV</span>
              </div>
            </div>

            {/* Mapping Semantics note */}
            <div className="text-[10px] text-science-muted font-mono flex items-center gap-1 mt-1">
              <HelpCircle className="w-3 h-3 text-science-muted flex-shrink-0" />
              <span>Mapping Status: {relationships.trackHitMappingStatus}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
