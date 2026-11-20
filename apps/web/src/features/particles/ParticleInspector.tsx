import { exportParticleDetails } from "@/lib/export";
import {
  formatAngle,
  formatEnergy,
  formatMomentum,
  formatNumber,
  formatTime,
} from "@/lib/formatters";
import { getPdgInfo } from "@/lib/pdg";
import {
  CaloCellRecord,
  ParticleRecord,
  RelationshipMetadata,
  TrackerHitRecord,
  TrackRecord,
} from "@/types";
import { BarChart2, Clock, Compass, Download } from "lucide-react";
import React, { useState } from "react";
import { AncestryExplorer } from "../ancestry/AncestryExplorer";
import { CalorimeterExplorer } from "../calorimeter/CalorimeterExplorer";
import { ScientificCharts } from "../charts/ScientificCharts";
import { TrackerExplorer } from "../tracker/TrackerExplorer";
import { TracksExplorer } from "../tracks/TracksExplorer";

interface ParticleInspectorProps {
  particle: ParticleRecord | null;
  allParticles: ParticleRecord[];
  trackerHits: TrackerHitRecord[];
  caloCells: CaloCellRecord[];
  tracks: TrackRecord[];
  relationships: RelationshipMetadata;
  selectedHitIndex: number | null;
  selectedCellIndex: number | null;
  onSelectParticle: (particleId: string) => void;
  onSelectHit: (hitIndex: number) => void;
  onSelectCell: (cellIndex: number) => void;
  eventId: number;
}

export const ParticleInspector: React.FC<ParticleInspectorProps> = ({
  particle,
  allParticles,
  trackerHits,
  caloCells,
  tracks,
  relationships,
  selectedHitIndex,
  selectedCellIndex,
  onSelectParticle,
  onSelectHit,
  onSelectCell,
  eventId,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "tracker" | "calorimeter" | "tracks" | "ancestry" | "charts"
  >("overview");

  if (!particle) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-science-surface border-l border-science-border text-science-muted">
        <Compass className="w-10 h-10 stroke-1 text-science-border mb-3" />
        <h3 className="text-sm font-semibold text-science-text">
          No Particle Selected
        </h3>
        <p className="text-xs mt-1 max-w-[220px]">
          Select a particle from the browser or click a measurement in the 3D
          detector view to trace its interactions.
        </p>
      </div>
    );
  }

  const pdg = getPdgInfo(particle.pdg_id);

  // Associated tracker hits
  const associatedHits = trackerHits.filter(
    (h) => h.particle_id === particle.particle_id,
  );

  // Associated calo cells
  const associatedCells = caloCells.filter((c) =>
    c.contrib_particle_ids.includes(particle.particle_id),
  );

  // Associated tracks (majority truth match)
  const associatedTracks = tracks.filter(
    (t) => t.majority_particle_id === particle.particle_id,
  );

  return (
    <div className="flex flex-col h-full bg-science-surface border-l border-science-border overflow-hidden select-none">
      {/* Particle Header Card */}
      <div className="p-3 bg-science-bg/60 border-b border-science-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-9 h-9 rounded flex items-center justify-center font-bold font-mono text-sm shadow-md flex-shrink-0"
            style={{
              backgroundColor: `${pdg.color}20`,
              color: pdg.color,
              border: `1px solid ${pdg.color}50`,
            }}
          >
            {particle.name}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white truncate">
                {particle.full_name}
              </h2>
              {particle.primary && (
                <span className="text-[9px] uppercase px-1 rounded bg-science-vertex/20 text-science-vertex border border-science-vertex/30">
                  Primary
                </span>
              )}
            </div>
            <div className="font-mono text-[11px] text-science-muted truncate">
              ID: {particle.particle_id} · PDG: {particle.pdg_id}
            </div>
          </div>
        </div>

        <button
          onClick={() => exportParticleDetails(particle, eventId)}
          className="p-1.5 rounded bg-science-elevated hover:bg-science-highlight text-science-muted hover:text-white border border-science-border transition"
          title="Export Particle JSON"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-science-border bg-science-surface text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "overview"
              ? "border-science-particle text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("tracker")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "tracker"
              ? "border-science-tracker text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          Tracker
          <span className="text-[10px] px-1 rounded bg-science-tracker/20 text-science-tracker">
            {associatedHits.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("calorimeter")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "calorimeter"
              ? "border-science-ecal text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          Calorimeter
          <span className="text-[10px] px-1 rounded bg-science-ecal/20 text-science-ecal">
            {associatedCells.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("tracks")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "tracks"
              ? "border-science-track text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          Tracks
          <span className="text-[10px] px-1 rounded bg-science-track/20 text-science-track">
            {associatedTracks.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("ancestry")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
            activeTab === "ancestry"
              ? "border-amber-400 text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          Ancestry
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap flex items-center gap-1 ${
            activeTab === "charts"
              ? "border-science-particle text-white bg-science-elevated/40"
              : "border-transparent text-science-muted hover:text-science-text"
          }`}
        >
          <BarChart2 className="w-3 h-3" /> Charts
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && (
          <div className="p-3 flex flex-col gap-4 text-xs font-mono">
            {/* Kinematics Section */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider">
                Kinematics & Momentum
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded bg-science-bg border border-science-border">
                  <span className="text-[10px] text-science-muted block">
                    Total Energy (E)
                  </span>
                  <span className="font-bold text-white text-xs">
                    {formatEnergy(particle.energy)}
                  </span>
                </div>
                <div className="p-2 rounded bg-science-bg border border-science-border">
                  <span className="text-[10px] text-science-muted block">
                    Transverse pT
                  </span>
                  <span className="font-bold text-science-particle text-xs">
                    {formatMomentum(particle.pt)}
                  </span>
                </div>
                <div className="p-2 rounded bg-science-bg border border-science-border">
                  <span className="text-[10px] text-science-muted block">
                    Total Momentum |p|
                  </span>
                  <span className="font-bold text-white text-xs">
                    {formatMomentum(particle.p)}
                  </span>
                </div>
                <div className="p-2 rounded bg-science-bg border border-science-border">
                  <span className="text-[10px] text-science-muted block">
                    Pseudorapidity (η)
                  </span>
                  <span className="font-bold text-white text-xs">
                    {formatNumber(particle.eta, 3)}
                  </span>
                </div>
              </div>

              {/* Momentum Vector breakdown */}
              <div className="p-2 rounded bg-science-bg border border-science-border flex justify-between text-[11px]">
                <span className="text-science-muted">Vector (px, py, pz):</span>
                <span>
                  ({formatNumber(particle.px, 2)},{" "}
                  {formatNumber(particle.py, 2)}, {formatNumber(particle.pz, 2)}
                  ) GeV/c
                </span>
              </div>
              <div className="p-2 rounded bg-science-bg border border-science-border flex justify-between text-[11px]">
                <span className="text-science-muted">Azimuthal Angle (φ):</span>
                <span>{formatAngle(particle.phi)}</span>
              </div>
            </div>

            {/* Production Vertex */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider">
                Production Vertex
              </span>
              <div className="p-2 rounded bg-science-bg border border-science-border flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-science-muted">
                    Coordinates (vx, vy, vz):
                  </span>
                  <span>
                    ({formatNumber(particle.vx, 3)},{" "}
                    {formatNumber(particle.vy, 3)},{" "}
                    {formatNumber(particle.vz, 3)}) mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-science-muted">Production Time:</span>
                  <span>{formatTime(particle.time)}</span>
                </div>
              </div>
            </div>

            {/* Detector Summary Overview */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider">
                Detector Interactions Summary
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab("tracker")}
                  className="p-2 rounded bg-science-bg hover:bg-science-elevated border border-science-border text-left transition"
                >
                  <span className="text-[10px] text-science-tracker block">
                    Tracker
                  </span>
                  <span className="text-sm font-bold text-white">
                    {associatedHits.length}
                  </span>
                  <span className="text-[10px] text-science-muted block">
                    hits
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("calorimeter")}
                  className="p-2 rounded bg-science-bg hover:bg-science-elevated border border-science-border text-left transition"
                >
                  <span className="text-[10px] text-science-ecal block">
                    Calorimeter
                  </span>
                  <span className="text-sm font-bold text-white">
                    {associatedCells.length}
                  </span>
                  <span className="text-[10px] text-science-muted block">
                    cells
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("tracks")}
                  className="p-2 rounded bg-science-bg hover:bg-science-elevated border border-science-border text-left transition"
                >
                  <span className="text-[10px] text-science-track block">
                    Tracks
                  </span>
                  <span className="text-sm font-bold text-white">
                    {associatedTracks.length}
                  </span>
                  <span className="text-[10px] text-science-muted block">
                    matches
                  </span>
                </button>
              </div>
            </div>

            {/* Investigation Sequence / History */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-bold text-science-muted tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-science-particle" />{" "}
                Investigation Sequence & Timing
              </span>
              <div className="flex flex-col gap-2 p-2.5 rounded bg-science-bg border border-science-border text-[11px]">
                {/* 1. Production */}
                <div className="flex items-start gap-2 border-l-2 border-science-vertex pl-2">
                  <div>
                    <span className="font-semibold text-science-vertex block">
                      1. Production Vertex
                    </span>
                    <span className="text-science-muted text-[10px]">
                      Registered at {formatTime(particle.time)} (
                      {particle.primary
                        ? "Primary collision vertex"
                        : `Decayed from ${particle.parent_id}`}
                      )
                    </span>
                  </div>
                </div>
                {/* 2. Tracker */}
                <div className="flex items-start gap-2 border-l-2 border-science-tracker pl-2">
                  <div>
                    <span className="font-semibold text-science-tracker block">
                      2. Tracker Traversal
                    </span>
                    <span className="text-science-muted text-[10px]">
                      {associatedHits.length > 0
                        ? `${associatedHits.length} measurements registered between ${formatTime(Math.min(...associatedHits.map((h) => h.time)))} – ${formatTime(Math.max(...associatedHits.map((h) => h.time)))}`
                        : "No ionizing measurements in tracker"}
                    </span>
                  </div>
                </div>
                {/* 3. Reconstructed Track */}
                <div className="flex items-start gap-2 border-l-2 border-science-track pl-2">
                  <div>
                    <span className="font-semibold text-science-track block">
                      3. Reconstructed Track
                    </span>
                    <span className="text-science-muted text-[10px]">
                      {associatedTracks.length > 0
                        ? `${associatedTracks.length} track(s) matched via majority truth`
                        : "No reconstructed track association"}
                    </span>
                  </div>
                </div>
                {/* 4. Calorimeter */}
                <div className="flex items-start gap-2 border-l-2 border-science-ecal pl-2">
                  <div>
                    <span className="font-semibold text-science-ecal block">
                      4. Calorimeter Shower
                    </span>
                    <span className="text-science-muted text-[10px]">
                      {associatedCells.length > 0
                        ? `Deposited energy across ${associatedCells.length} cells`
                        : "No calorimetric shower deposits"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tracker" && (
          <TrackerExplorer
            hits={associatedHits}
            selectedHitIndex={selectedHitIndex}
            onSelectHit={onSelectHit}
            particleId={particle.particle_id}
            eventId={eventId}
          />
        )}

        {activeTab === "calorimeter" && (
          <CalorimeterExplorer
            cells={associatedCells}
            particleId={particle.particle_id}
            selectedCellIndex={selectedCellIndex}
            onSelectCell={onSelectCell}
            eventId={eventId}
          />
        )}

        {activeTab === "tracks" && (
          <TracksExplorer
            tracks={associatedTracks}
            particleId={particle.particle_id}
            relationships={relationships}
          />
        )}

        {activeTab === "ancestry" && (
          <AncestryExplorer
            selectedParticle={particle}
            allParticles={allParticles}
            onSelectParticle={onSelectParticle}
          />
        )}

        {activeTab === "charts" && (
          <ScientificCharts
            particle={particle}
            trackerHits={trackerHits}
            caloCells={caloCells}
            onSelectHit={onSelectHit}
            onSelectCell={onSelectCell}
          />
        )}
      </div>
    </div>
  );
};
