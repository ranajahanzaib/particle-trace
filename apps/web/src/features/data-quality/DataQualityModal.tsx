import { EventBundle } from "@/types";
import {
  AlertTriangle,
  BookOpen,
  ExternalLink,
  Info,
  ShieldCheck,
  X,
} from "lucide-react";
import React from "react";

interface DataQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
  bundle: EventBundle | null;
}

export const DataQualityModal: React.FC<DataQualityModalProps> = ({
  isOpen,
  onClose,
  bundle,
}) => {
  if (!isOpen || !bundle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-science-surface border border-science-border rounded-lg shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-xs text-science-text">
        {/* Header */}
        <div className="p-4 bg-science-bg border-b border-science-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-science-particle" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Data Quality & Provenance
              </h3>
              <p className="text-[11px] text-science-muted">
                Event {bundle.source.eventId} · Configuration:{" "}
                {bundle.source.configuration}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-science-elevated text-science-muted hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex flex-col gap-4 font-mono">
          {/* Dataset Attribution */}
          <div className="p-3 rounded bg-science-bg border border-science-border flex flex-col gap-2 font-sans">
            <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider flex items-center gap-1.5 font-mono">
              <BookOpen className="w-3.5 h-3.5 text-science-particle" /> Dataset
              Source & Attribution
            </span>
            <p className="text-xs text-science-text leading-relaxed">
              Based on the official{" "}
              <strong className="text-white">CERN ColliderML Release 1</strong>{" "}
              dataset. Contains simulated collision events produced using
              Pythia8 and the Open Data Detector (ODD) in Acts.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-science-elevated border border-science-border text-science-muted">
                License: CC-BY-4.0
              </span>
              <a
                href="https://huggingface.co/datasets/CERN/ColliderML-Release-1"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-science-particle hover:underline"
              >
                Hugging Face Repository <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Relationship Semantics */}
          <div className="p-3 rounded bg-science-bg border border-science-border flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider">
              Scientific Relationship Semantics
            </span>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <p>
                <strong className="text-white">Tracker Measurements:</strong>{" "}
                Direct truth association via{" "}
                <code className="text-science-tracker">
                  tracker_hits.particle_id == particles.particle_id
                </code>
                .
              </p>
              <p>
                <strong className="text-white">Calorimeter Cells:</strong>{" "}
                Multi-particle contributions aligned via nested arrays{" "}
                <code className="text-science-ecal">contrib_particle_ids</code>{" "}
                and <code className="text-science-ecal">contrib_energies</code>.
              </p>
              <p>
                <strong className="text-white">Reconstructed Tracks:</strong>{" "}
                Majority-truth association via{" "}
                <code className="text-science-track">majority_particle_id</code>
                . Not a one-to-one match.
              </p>
              <p>
                <strong className="text-white">Track-Hit Status:</strong>{" "}
                <span className="text-amber-400">
                  {bundle.relationships.trackHitMappingStatus}
                </span>
                .{" "}
                <span className="text-science-muted">
                  {bundle.relationships.notes}
                </span>
              </p>
            </div>
          </div>

          {/* Diagnostic Messages */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider">
              Validation Diagnostics ({bundle.diagnostics.length})
            </span>
            {bundle.diagnostics.length === 0 ? (
              <div className="p-3 rounded bg-science-bg border border-science-border text-emerald-400 text-xs">
                All validation checks passed with zero issues.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {bundle.diagnostics.map((diag, idx) => (
                  <div
                    key={`diag-${idx}`}
                    className={`p-2.5 rounded border flex items-start gap-2 text-[11px] leading-relaxed ${
                      diag.severity === "error"
                        ? "bg-rose-950/30 border-rose-800 text-rose-300"
                        : diag.severity === "warning"
                          ? "bg-amber-950/30 border-amber-800 text-amber-300"
                          : "bg-science-bg border-science-border text-science-muted"
                    }`}
                  >
                    {diag.severity === "error" ||
                    diag.severity === "warning" ? (
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-science-particle" />
                    )}
                    <div>
                      <span className="font-bold mr-1">[{diag.code}]</span>
                      <span>{diag.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-science-bg border-t border-science-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-science-elevated hover:bg-science-highlight text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
