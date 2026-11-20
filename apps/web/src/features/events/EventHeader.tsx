import { EventBundle, EventSummary } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Share2,
} from "lucide-react";
import React, { useState } from "react";

interface EventHeaderProps {
  bundle: EventBundle | null;
  eventsList: EventSummary[];
  currentEventId: number;
  currentConfig: string;
  onSelectEvent: (eventId: number) => void;
  onSelectConfig: (config: string) => void;
  onOpenQualityModal: () => void;
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  bundle,
  eventsList,
  currentEventId,
  currentConfig,
  onSelectEvent,
  onSelectConfig,
  onOpenQualityModal,
}) => {
  const [jumpInput, setJumpInput] = useState(String(currentEventId));
  const [copied, setCopied] = useState(false);

  const eventIndex = eventsList.findIndex((e) => e.eventId === currentEventId);
  const hasPrev = eventIndex > 0;
  const hasNext = eventIndex !== -1 && eventIndex < eventsList.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      const prevId = eventsList[eventIndex - 1].eventId;
      onSelectEvent(prevId);
      setJumpInput(String(prevId));
    }
  };

  const handleNext = () => {
    if (hasNext) {
      const nextId = eventsList[eventIndex + 1].eventId;
      onSelectEvent(nextId);
      setJumpInput(String(nextId));
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(jumpInput, 10);
    if (!isNaN(id)) {
      onSelectEvent(id);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Diagnostic counts
  const errorCount =
    bundle?.diagnostics.filter((d) => d.severity === "error").length || 0;
  const warningCount =
    bundle?.diagnostics.filter((d) => d.severity === "warning").length || 0;

  return (
    <header className="h-14 bg-science-surface border-b border-science-border px-4 flex items-center justify-between gap-4 select-none flex-shrink-0 z-20">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded bg-science-particle/10 border border-science-particle/30 flex items-center justify-center text-science-particle shadow-sm">
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3" />
            <circle cx="12" cy="12" r="8" strokeDasharray="3 3" opacity="0.6" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Particle Trace
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-science-elevated text-science-particle border border-science-border">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-science-muted">
            Collider event investigation · CERN ColliderML Release 1
          </p>
        </div>
      </div>

      {/* Center: Dataset Configuration & Event Navigator */}
      <div className="flex items-center gap-2">
        {/* Configuration selector */}
        <div className="flex items-center gap-1.5 bg-science-bg border border-science-border rounded px-2.5 py-1 text-xs">
          <Database className="w-3.5 h-3.5 text-science-muted" />
          <span className="text-science-muted font-mono">Config:</span>
          <select
            value={currentConfig}
            onChange={(e) => onSelectConfig(e.target.value)}
            className="bg-transparent text-science-text font-mono text-xs focus:outline-none cursor-pointer"
          >
            <option value="ttbar_pu0">ttbar_pu0</option>
          </select>
        </div>

        {/* Event Navigation */}
        <div className="flex items-center gap-1 bg-science-bg border border-science-border rounded p-0.5 text-xs">
          <button
            onClick={handlePrev}
            disabled={!hasPrev}
            className="p-1 rounded hover:bg-science-elevated disabled:opacity-30 disabled:hover:bg-transparent transition text-science-muted hover:text-white"
            title="Previous Event"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handleJumpSubmit} className="flex items-center px-1">
            <span className="text-science-muted font-mono text-xs mr-1">
              Event
            </span>
            <input
              type="text"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="w-12 bg-science-elevated text-center font-mono text-xs text-white rounded px-1 py-0.5 border border-transparent focus:border-science-particle focus:outline-none"
            />
          </form>

          <button
            onClick={handleNext}
            disabled={!hasNext}
            className="p-1 rounded hover:bg-science-elevated disabled:opacity-30 disabled:hover:bg-transparent transition text-science-muted hover:text-white"
            title="Next Event"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Right: Data Quality, Provenance & Share */}
      <div className="flex items-center gap-2">
        {/* Diagnostics Button */}
        <button
          onClick={onOpenQualityModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border transition ${
            errorCount > 0
              ? "bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-950/60"
              : warningCount > 0
                ? "bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-950/60"
                : "bg-science-bg border-science-border text-science-muted hover:text-science-text"
          }`}
          title="Inspect Data Quality and Diagnostics"
        >
          {errorCount > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          ) : warningCount > 0 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="font-mono">
            {errorCount > 0
              ? `${errorCount} Issues`
              : warningCount > 0
                ? `${warningCount} Warnings`
                : "Quality OK"}
          </span>
        </button>

        {/* Share link button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-science-bg border border-science-border hover:bg-science-elevated text-science-muted hover:text-white transition"
          title="Copy shareable URL"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? "Copied!" : "Share"}</span>
        </button>
      </div>
    </header>
  );
};
