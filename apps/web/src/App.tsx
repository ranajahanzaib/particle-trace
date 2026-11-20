import { DataQualityModal } from "@/features/data-quality/DataQualityModal";
import { DetectorCanvas } from "@/features/detector/DetectorCanvas";
import { EventHeader } from "@/features/events/EventHeader";
import { ParticleInspector } from "@/features/particles/ParticleInspector";
import { ParticleTable } from "@/features/particles/ParticleTable";
import { dataRepository } from "@/services/api";
import { EventBundle, EventSummary, LayerVisibilityState } from "@/types";
import {
  AlertCircle,
  Compass,
  Layers,
  ListFilter,
  Loader2,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export const App: React.FC = () => {
  // Navigation and Selection State
  const [currentConfig, setCurrentConfig] = useState<string>("ttbar_pu0");
  const [currentEventId, setCurrentEventId] = useState<number>(0);
  const [selectedParticleId, setSelectedParticleId] = useState<string | null>(
    null,
  );
  const [selectedHitIndex, setSelectedHitIndex] = useState<number | null>(null);
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(
    null,
  );

  // Data State
  const [eventsList, setEventsList] = useState<EventSummary[]>([]);
  const [bundle, setBundle] = useState<EventBundle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [mobileTab, setMobileTab] = useState<
    "particles" | "detector" | "inspector"
  >("detector");
  const [isQualityModalOpen, setIsQualityModalOpen] = useState<boolean>(false);

  // 3D Layer Visibility
  const [layers, setLayers] = useState<LayerVisibilityState>({
    detectorGeometry: true,
    selectedTrackerHits: true,
    otherTrackerHits: true,
    trueHitPositions: false,
    calorimeterCells: true,
    reconstructedTracks: true,
    productionVertex: true,
    trajectoryGuide: true,
    axesGrid: true,
  });

  const handleToggleLayer = (key: keyof LayerVisibilityState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. Initial URL param parse
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfg = params.get("config");
    const ev = params.get("event");
    const p = params.get("particle");

    if (cfg) setCurrentConfig(cfg);
    if (ev !== null && !isNaN(Number(ev))) setCurrentEventId(Number(ev));
    if (p) setSelectedParticleId(p);
  }, []);

  // 2. Synchronize URL on state change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("config", currentConfig);
    params.set("event", String(currentEventId));
    if (selectedParticleId) {
      params.set("particle", selectedParticleId);
    }
    const newRelativePathQuery =
      window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newRelativePathQuery);
  }, [currentConfig, currentEventId, selectedParticleId]);

  // 3. Load configuration manifest (list of events)
  useEffect(() => {
    let isMounted = true;
    dataRepository
      .getConfigManifest(currentConfig)
      .then((manifest) => {
        if (isMounted) {
          setEventsList(manifest.events);
          if (manifest.events.length > 0) {
            // Check if currentEventId exists
            const exists = manifest.events.some(
              (e) => e.eventId === currentEventId,
            );
            if (!exists) {
              setCurrentEventId(manifest.events[0].eventId);
            }
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, [currentConfig]);

  // 4. Load event bundle
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    dataRepository
      .getEventBundle(currentConfig, currentEventId)
      .then((loadedBundle) => {
        if (isMounted) {
          setBundle(loadedBundle);
          setLoading(false);

          // If no particle selected or selected particle not in this event, select the highest pT primary particle
          if (
            !selectedParticleId ||
            !loadedBundle.particles.some(
              (p) => p.particle_id === selectedParticleId,
            )
          ) {
            const primaries = loadedBundle.particles.filter((p) => p.primary);
            const candidates =
              primaries.length > 0 ? primaries : loadedBundle.particles;
            if (candidates.length > 0) {
              // Sort by pT descending
              const highestPt = [...candidates].sort((a, b) => b.pt - a.pt)[0];
              setSelectedParticleId(highestPt.particle_id);
            } else {
              setSelectedParticleId(null);
            }
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentConfig, currentEventId]);

  // Currently selected particle record
  const selectedParticle = useMemo(() => {
    if (!bundle || !selectedParticleId) return null;
    return (
      bundle.particles.find((p) => p.particle_id === selectedParticleId) || null
    );
  }, [bundle, selectedParticleId]);

  const handleSelectParticle = useCallback((pid: string) => {
    setSelectedParticleId(pid);
    setSelectedHitIndex(null);
    setSelectedCellIndex(null);
  }, []);

  const handleSelectHit = useCallback((hitIdx: number) => {
    setSelectedHitIndex(hitIdx);
  }, []);

  const handleSelectCell = useCallback((cellIdx: number) => {
    setSelectedCellIndex(cellIdx);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-science-bg text-science-text">
      {/* Global Header */}
      <EventHeader
        bundle={bundle}
        eventsList={eventsList}
        currentEventId={currentEventId}
        currentConfig={currentConfig}
        onSelectEvent={(id) => setCurrentEventId(id)}
        onSelectConfig={(cfg) => setCurrentConfig(cfg)}
        onOpenQualityModal={() => setIsQualityModalOpen(true)}
      />

      {/* Main Investigation Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-science-particle animate-spin" />
            <span className="font-mono text-xs text-science-muted">
              Loading collision event {currentEventId} ({currentConfig})...
            </span>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
            <AlertCircle className="w-10 h-10 text-rose-500" />
            <h2 className="text-base font-bold text-white">
              Event Loading Error
            </h2>
            <p className="text-xs text-science-muted max-w-md font-mono">
              {error}
            </p>
            <button
              onClick={() => setCurrentEventId(0)}
              className="mt-2 px-3 py-1.5 rounded bg-science-elevated hover:bg-science-highlight text-white text-xs transition"
            >
              Reset to Event 0
            </button>
          </div>
        ) : bundle ? (
          <>
            {/* Desktop Three-Part Layout */}
            {/* Left Panel: Particle Explorer (Hidden on mobile if not active tab) */}
            <div
              className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
                mobileTab === "particles" ? "block z-30" : "hidden md:block"
              }`}
            >
              <ParticleTable
                particles={bundle.particles}
                selectedParticleId={selectedParticleId}
                onSelectParticle={(pid) => {
                  handleSelectParticle(pid);
                  setMobileTab("detector");
                }}
                counts={bundle.counts}
              />
            </div>

            {/* Center Panel: Interactive 3D Detector */}
            <div
              className={`flex-1 h-full relative ${
                mobileTab === "detector" ? "block" : "hidden md:block"
              }`}
            >
              <DetectorCanvas
                bundle={bundle}
                selectedParticle={selectedParticle}
                selectedHitIndex={selectedHitIndex}
                selectedCellIndex={selectedCellIndex}
                layers={layers}
                onToggleLayer={handleToggleLayer}
                onSelectParticle={handleSelectParticle}
                onSelectHit={handleSelectHit}
                onSelectCell={handleSelectCell}
              />
            </div>

            {/* Right Panel: Particle Inspector */}
            <div
              className={`w-full md:w-96 lg:w-[420px] flex-shrink-0 h-full ${
                mobileTab === "inspector" ? "block z-30" : "hidden md:block"
              }`}
            >
              <ParticleInspector
                particle={selectedParticle}
                allParticles={bundle.particles}
                trackerHits={bundle.trackerHits}
                caloCells={bundle.calorimeterCells}
                tracks={bundle.tracks}
                relationships={bundle.relationships}
                selectedHitIndex={selectedHitIndex}
                selectedCellIndex={selectedCellIndex}
                onSelectParticle={handleSelectParticle}
                onSelectHit={handleSelectHit}
                onSelectCell={handleSelectCell}
                eventId={currentEventId}
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Mobile / Tablet Responsive Tab Switcher */}
      <div className="md:hidden flex items-center justify-around h-12 bg-science-surface border-t border-science-border text-xs z-40">
        <button
          onClick={() => setMobileTab("particles")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
            mobileTab === "particles"
              ? "text-science-particle font-semibold"
              : "text-science-muted"
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Particles</span>
        </button>
        <button
          onClick={() => setMobileTab("detector")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
            mobileTab === "detector"
              ? "text-science-particle font-semibold"
              : "text-science-muted"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>3D Detector</span>
        </button>
        <button
          onClick={() => setMobileTab("inspector")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition ${
            mobileTab === "inspector"
              ? "text-science-particle font-semibold"
              : "text-science-muted"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Inspector</span>
        </button>
      </div>

      {/* Provenance & Data Quality Modal */}
      <DataQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        bundle={bundle}
      />
    </div>
  );
};
