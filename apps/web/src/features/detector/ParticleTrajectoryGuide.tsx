import { ParticleRecord, TrackerHitRecord } from "@/types";
import React, { useMemo } from "react";
import * as THREE from "three";
import { MM_TO_UNITS } from "./DetectorGeometry";

interface ParticleTrajectoryGuideProps {
  particle: ParticleRecord | null;
  trackerHits: TrackerHitRecord[];
}

export const ParticleTrajectoryGuide: React.FC<
  ParticleTrajectoryGuideProps
> = ({ particle, trackerHits }) => {
  const { points, vertexPos } = useMemo(() => {
    if (!particle) return { points: [], vertexPos: null };

    const vPos = new THREE.Vector3(
      particle.vx * MM_TO_UNITS,
      particle.vy * MM_TO_UNITS,
      particle.vz * MM_TO_UNITS,
    );

    // Filter hits belonging to this particle and sort by radius from beam axis
    const particleHits = trackerHits
      .filter((h) => h.particle_id === particle.particle_id)
      .sort((a, b) => {
        const rA = a.x * a.x + a.y * a.y;
        const rB = b.x * b.x + b.y * b.y;
        return rA - rB;
      });

    if (particleHits.length === 0) {
      return { points: [vPos], vertexPos: vPos };
    }

    const trajectoryPoints = [vPos];
    for (const h of particleHits) {
      trajectoryPoints.push(
        new THREE.Vector3(
          h.x * MM_TO_UNITS,
          h.y * MM_TO_UNITS,
          h.z * MM_TO_UNITS,
        ),
      );
    }

    // Extrapolate a tiny bit along final segment
    if (trajectoryPoints.length >= 2) {
      const last = trajectoryPoints[trajectoryPoints.length - 1];
      const prev = trajectoryPoints[trajectoryPoints.length - 2];
      const dir = last.clone().sub(prev).normalize().multiplyScalar(1.5);
      trajectoryPoints.push(last.clone().add(dir));
    }

    return { points: trajectoryPoints, vertexPos: vPos };
  }, [particle, trackerHits]);

  const lineMesh = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineDashedMaterial({
      color: "#38bdf8",
      dashSize: 0.4,
      gapSize: 0.2,
      linewidth: 2,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }, [points]);

  if (!particle) return null;

  return (
    <group name="particle-trajectory-guide">
      {/* Production Vertex */}
      {vertexPos && (
        <group position={vertexPos}>
          <mesh>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial
              color="#eab308"
              emissive="#eab308"
              emissiveIntensity={0.8}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[0.25, 0.38, 24]} />
            <meshBasicMaterial
              color="#facc15"
              side={THREE.DoubleSide}
              transparent
              opacity={0.6}
            />
          </mesh>
        </group>
      )}

      {/* Trajectory Guide Spline */}
      {lineMesh && <primitive object={lineMesh} />}
    </group>
  );
};
