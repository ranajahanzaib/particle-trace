import { TrackerHitRecord } from "@/types";
import React, { useMemo } from "react";
import * as THREE from "three";
import { MM_TO_UNITS } from "./DetectorGeometry";

interface TrackerHitMeshProps {
  hits: TrackerHitRecord[];
  selectedParticleId: string | null;
  selectedHitIndex: number | null;
  showSelectedOnly: boolean;
  showOtherHits: boolean;
  showTruePositions: boolean;
  onSelectParticle: (particleId: string) => void;
  onSelectHit: (hitIndex: number) => void;
  onHoverHit: (
    hit: TrackerHitRecord | null,
    screenPos?: { x: number; y: number },
  ) => void;
}

export const TrackerHitMesh: React.FC<TrackerHitMeshProps> = ({
  hits,
  selectedParticleId,
  selectedHitIndex,
  showSelectedOnly,
  showOtherHits,
  showTruePositions,
  onSelectParticle,
  onSelectHit,
  onHoverHit,
}) => {
  // Partition hits into selected particle hits and other hits
  const { selectedHits, otherHits } = useMemo(() => {
    const sel: TrackerHitRecord[] = [];
    const oth: TrackerHitRecord[] = [];
    for (const h of hits) {
      if (selectedParticleId && h.particle_id === selectedParticleId) {
        sel.push(h);
      } else {
        oth.push(h);
      }
    }
    return { selectedHits: sel, otherHits: oth };
  }, [hits, selectedParticleId]);

  return (
    <group name="tracker-hits">
      {/* Other hits (dimmed) */}
      {showOtherHits && !showSelectedOnly && (
        <group name="other-hits">
          {otherHits.map((h) => (
            <mesh
              key={`hit-${h.hit_index}`}
              position={[
                h.x * MM_TO_UNITS,
                h.y * MM_TO_UNITS,
                h.z * MM_TO_UNITS,
              ]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectParticle(h.particle_id);
                onSelectHit(h.hit_index);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHoverHit(h, { x: e.clientX, y: e.clientY });
              }}
              onPointerOut={() => onHoverHit(null)}
            >
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color="#059669" transparent opacity={0.35} />
            </mesh>
          ))}
        </group>
      )}

      {/* Selected particle hits (prominent, vibrant emerald with active ring) */}
      {selectedHits.map((h) => {
        const isCurrentHit = selectedHitIndex === h.hit_index;
        return (
          <group
            key={`sel-hit-${h.hit_index}`}
            position={[h.x * MM_TO_UNITS, h.y * MM_TO_UNITS, h.z * MM_TO_UNITS]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectHit(h.hit_index);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              onHoverHit(h, { x: e.clientX, y: e.clientY });
            }}
            onPointerOut={() => onHoverHit(null)}
          >
            {/* Center sphere */}
            <mesh>
              <sphereGeometry args={[isCurrentHit ? 0.22 : 0.16, 16, 16]} />
              <meshStandardMaterial
                color={isCurrentHit ? "#34d399" : "#10b981"}
                emissive={isCurrentHit ? "#10b981" : "#059669"}
                emissiveIntensity={isCurrentHit ? 1.0 : 0.6}
              />
            </mesh>

            {/* Glowing selection ring */}
            {isCurrentHit && (
              <mesh>
                <ringGeometry args={[0.3, 0.42, 24]} />
                <meshBasicMaterial
                  color="#6ee7b7"
                  side={THREE.DoubleSide}
                  transparent
                  opacity={0.9}
                />
              </mesh>
            )}

            {/* True position comparison line and ghost marker if toggled */}
            {showTruePositions &&
              h.true_x != null &&
              h.true_y != null &&
              h.true_z != null &&
              (() => {
                const tx = h.true_x;
                const ty = h.true_y;
                const tz = h.true_z;
                return (
                  <group>
                    <line>
                      <bufferGeometry>
                        <bufferAttribute
                          attach="attributes-position"
                          args={[
                            new Float32Array([
                              0,
                              0,
                              0,
                              (tx - h.x) * MM_TO_UNITS,
                              (ty - h.y) * MM_TO_UNITS,
                              (tz - h.z) * MM_TO_UNITS,
                            ]),
                            3,
                          ]}
                        />
                      </bufferGeometry>
                      <lineBasicMaterial
                        color="#14b8a6"
                        transparent
                        opacity={0.8}
                      />
                    </line>
                    <mesh
                      position={[
                        (tx - h.x) * MM_TO_UNITS,
                        (ty - h.y) * MM_TO_UNITS,
                        (tz - h.z) * MM_TO_UNITS,
                      ]}
                    >
                      <boxGeometry args={[0.08, 0.08, 0.08]} />
                      <meshBasicMaterial color="#14b8a6" wireframe />
                    </mesh>
                  </group>
                );
              })()}
          </group>
        );
      })}
    </group>
  );
};
