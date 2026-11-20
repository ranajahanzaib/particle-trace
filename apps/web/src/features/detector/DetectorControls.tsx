import { LayerVisibilityState } from "@/types";
import { Compass, Layers, RotateCcw } from "lucide-react";
import React from "react";

interface DetectorControlsProps {
  layers: LayerVisibilityState;
  onToggleLayer: (layerKey: keyof LayerVisibilityState) => void;
  onSetCameraView: (
    view: "isometric" | "transverse" | "longitudinal" | "reset",
  ) => void;
}

export const DetectorControls: React.FC<DetectorControlsProps> = ({
  layers,
  onToggleLayer,
  onSetCameraView,
}) => {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
      {/* Camera angle presets */}
      <div className="flex items-center gap-1 bg-science-surface/90 backdrop-blur border border-science-border rounded p-1 text-xs text-science-text">
        <span className="px-1.5 text-science-muted font-mono flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> View:
        </span>
        <button
          onClick={() => onSetCameraView("isometric")}
          className="px-2 py-0.5 rounded hover:bg-science-elevated transition"
          title="Isometric View"
        >
          Iso
        </button>
        <button
          onClick={() => onSetCameraView("transverse")}
          className="px-2 py-0.5 rounded hover:bg-science-elevated transition"
          title="Transverse (X-Y Beam Axis View)"
        >
          X-Y
        </button>
        <button
          onClick={() => onSetCameraView("longitudinal")}
          className="px-2 py-0.5 rounded hover:bg-science-elevated transition"
          title="Longitudinal (Z-Axis Side View)"
        >
          Side
        </button>
        <button
          onClick={() => onSetCameraView("reset")}
          className="p-1 rounded hover:bg-science-elevated text-science-muted hover:text-science-text transition"
          title="Reset Camera"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="bg-science-surface/90 backdrop-blur border border-science-border rounded p-2 text-xs flex flex-col gap-1.5 shadow-lg">
        <div className="text-[11px] font-semibold text-science-muted uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
          <Layers className="w-3.5 h-3.5 text-science-particle" /> Detector
          Layers
        </div>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span>Geometry Schematic</span>
          <input
            type="checkbox"
            checked={layers.detectorGeometry}
            onChange={() => onToggleLayer("detectorGeometry")}
            className="rounded bg-science-elevated border-science-border text-science-particle focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-science-tracker inline-block" />
            Selected Tracker Hits
          </span>
          <input
            type="checkbox"
            checked={layers.selectedTrackerHits}
            onChange={() => onToggleLayer("selectedTrackerHits")}
            className="rounded bg-science-elevated border-science-border text-science-tracker focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span className="flex items-center gap-1.5 text-science-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-800 inline-block" />
            Other Tracker Hits
          </span>
          <input
            type="checkbox"
            checked={layers.otherTrackerHits}
            onChange={() => onToggleLayer("otherTrackerHits")}
            className="rounded bg-science-elevated border-science-border text-science-tracker focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-science-trackerTrue inline-block" />
            True Positions Layer
          </span>
          <input
            type="checkbox"
            checked={layers.trueHitPositions}
            onChange={() => onToggleLayer("trueHitPositions")}
            className="rounded bg-science-elevated border-science-border text-science-trackerTrue focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-science-ecal inline-block" />
            Calorimeter Cells
          </span>
          <input
            type="checkbox"
            checked={layers.calorimeterCells}
            onChange={() => onToggleLayer("calorimeterCells")}
            className="rounded bg-science-elevated border-science-border text-science-ecal focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-science-vertex inline-block" />
            Vertex & Trajectory Guide
          </span>
          <input
            type="checkbox"
            checked={layers.trajectoryGuide}
            onChange={() => onToggleLayer("trajectoryGuide")}
            className="rounded bg-science-elevated border-science-border text-science-vertex focus:ring-0"
          />
        </label>

        <label className="flex items-center justify-between gap-3 text-science-text cursor-pointer hover:text-white">
          <span>Grid & Coordinate Axes</span>
          <input
            type="checkbox"
            checked={layers.axesGrid}
            onChange={() => onToggleLayer("axesGrid")}
            className="rounded bg-science-elevated border-science-border text-science-particle focus:ring-0"
          />
        </label>
      </div>
    </div>
  );
};
