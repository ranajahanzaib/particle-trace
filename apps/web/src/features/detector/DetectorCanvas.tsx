import {
  CaloCellRecord,
  EventBundle,
  LayerVisibilityState,
  ParticleRecord,
  TrackerHitRecord,
} from "@/types";
import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import React, { useEffect } from "react";
import { CalorimeterCellMesh } from "./CalorimeterCellMesh";
import { DetectorControls } from "./DetectorControls";
import { DetectorGeometry } from "./DetectorGeometry";
import { DetectorTooltip } from "./DetectorTooltip";
import { ParticleTrajectoryGuide } from "./ParticleTrajectoryGuide";
import { TrackerHitMesh } from "./TrackerHitMesh";

interface DetectorCanvasProps {
  bundle: EventBundle;
  selectedParticle: ParticleRecord | null;
  selectedHitIndex: number | null;
  selectedCellIndex: number | null;
  layers: LayerVisibilityState;
  onToggleLayer: (key: keyof LayerVisibilityState) => void;
  onSelectParticle: (particleId: string) => void;
  onSelectHit: (hitIndex: number) => void;
  onSelectCell: (cellIndex: number) => void;
}

const CameraManager: React.FC<{
  cameraView: "isometric" | "transverse" | "longitudinal" | "reset" | null;
  onViewApplied: () => void;
}> = ({ cameraView, onViewApplied }) => {
  const { camera } = useThree();

  useEffect(() => {
    if (!cameraView) return;

    if (cameraView === "isometric" || cameraView === "reset") {
      camera.position.set(24, 18, 24);
      camera.lookAt(0, 0, 0);
    } else if (cameraView === "transverse") {
      // Looking down z-axis (beam line): shows X-Y transverse plane
      camera.position.set(0, 0, 36);
      camera.lookAt(0, 0, 0);
    } else if (cameraView === "longitudinal") {
      // Side view: looking along Y-axis: shows R-Z plane
      camera.position.set(0, 36, 0);
      camera.lookAt(0, 0, 0);
    }

    camera.updateProjectionMatrix();
    onViewApplied();
  }, [cameraView, camera, onViewApplied]);

  return null;
};

export const DetectorCanvas: React.FC<DetectorCanvasProps> = ({
  bundle,
  selectedParticle,
  selectedHitIndex,
  selectedCellIndex,
  layers,
  onToggleLayer,
  onSelectParticle,
  onSelectHit,
  onSelectCell,
}) => {
  const [cameraView, setCameraView] = React.useState<
    "isometric" | "transverse" | "longitudinal" | "reset" | null
  >(null);
  const [hoveredHit, setHoveredHit] = React.useState<TrackerHitRecord | null>(
    null,
  );
  const [hoveredCell, setHoveredCell] = React.useState<CaloCellRecord | null>(
    null,
  );
  const [cellContribEnergy, setCellContribEnergy] = React.useState<
    number | undefined
  >(undefined);
  const [tooltipPos, setTooltipPos] = React.useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleHoverHit = (
    hit: TrackerHitRecord | null,
    pos?: { x: number; y: number },
  ) => {
    setHoveredHit(hit);
    setHoveredCell(null);
    setTooltipPos(pos || null);
  };

  const handleHoverCell = (
    cell: CaloCellRecord | null,
    contribE?: number,
    pos?: { x: number; y: number },
  ) => {
    setHoveredCell(cell);
    setCellContribEnergy(contribE);
    setHoveredHit(null);
    setTooltipPos(pos || null);
  };

  return (
    <div className="relative w-full h-full bg-science-bg overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [24, 18, 24], fov: 45, near: 0.1, far: 2000 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 20, 15]} intensity={0.8} />
        <directionalLight position={[-10, -10, -10]} intensity={0.3} />

        <CameraManager
          cameraView={cameraView}
          onViewApplied={() => setCameraView(null)}
        />

        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={2}
          maxDistance={120}
        />

        {/* Grid and Axes */}
        {layers.axesGrid && (
          <>
            <Grid
              infiniteGrid
              cellSize={2}
              sectionSize={10}
              fadeDistance={50}
              fadeStrength={1.5}
              cellColor="#1e293b"
              sectionColor="#334155"
            />
            <axesHelper args={[5]} />
          </>
        )}

        {/* 1. Geometry Schematic */}
        {layers.detectorGeometry && <DetectorGeometry />}

        {/* 2. Tracker Hits */}
        <TrackerHitMesh
          hits={bundle.trackerHits}
          selectedParticleId={selectedParticle?.particle_id || null}
          selectedHitIndex={selectedHitIndex}
          showSelectedOnly={!layers.otherTrackerHits}
          showOtherHits={layers.otherTrackerHits}
          showTruePositions={layers.trueHitPositions}
          onSelectParticle={onSelectParticle}
          onSelectHit={onSelectHit}
          onHoverHit={handleHoverHit}
        />

        {/* 3. Calorimeter Cells */}
        {layers.calorimeterCells && (
          <CalorimeterCellMesh
            cells={bundle.calorimeterCells}
            selectedParticleId={selectedParticle?.particle_id || null}
            selectedCellIndex={selectedCellIndex}
            onSelectCell={onSelectCell}
            onHoverCell={handleHoverCell}
          />
        )}

        {/* 4. Production Vertex & Trajectory Guide */}
        {layers.trajectoryGuide && (
          <ParticleTrajectoryGuide
            particle={selectedParticle}
            trackerHits={bundle.trackerHits}
          />
        )}
      </Canvas>

      {/* Floating HUD Controls */}
      <DetectorControls
        layers={layers}
        onToggleLayer={onToggleLayer}
        onSetCameraView={(view) => setCameraView(view)}
      />

      {/* Floating Tooltip */}
      <DetectorTooltip
        hit={hoveredHit}
        cell={hoveredCell}
        contribEnergy={cellContribEnergy}
        position={tooltipPos}
      />

      {/* Scientific Legend Footer */}
      <div className="absolute bottom-2 left-3 z-10 flex items-center gap-4 bg-science-surface/80 backdrop-blur border border-science-border px-3 py-1.5 rounded text-[11px] text-science-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-science-tracker" />
          <span>Tracker Hit (Meas)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-science-ecal" />
          <span>ECal Cell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-science-hcal" />
          <span>HCal Cell</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-science-vertex" />
          <span>Production Vertex</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-science-particle" />
          <span>Trajectory Guide</span>
        </div>
      </div>
    </div>
  );
};
