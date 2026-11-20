import React from "react";
import * as THREE from "three";

// Scale factor: 1 Three.js unit = 100 mm (0.1 meter)
export const MM_TO_UNITS = 0.01;

export const DetectorGeometry: React.FC = () => {
  // Common material properties for non-intrusive detector outlines
  const beamPipeColor = "#334155";
  const pixelColor = "#0284c7";
  const stripColor = "#0f766e";
  const ecalColor = "#6b21a8";
  const hcalColor = "#881337";

  return (
    <group name="detector-geometry">
      {/* Central Beam Pipe */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[
            20 * MM_TO_UNITS,
            20 * MM_TO_UNITS,
            3600 * MM_TO_UNITS,
            32,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={beamPipeColor}
          wireframe
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Pixel Detector Barrel Layers */}
      {[32, 72, 116, 172].map((r, i) => (
        <mesh key={`pixel-${i}`} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry
            args={[
              r * MM_TO_UNITS,
              r * MM_TO_UNITS,
              1100 * MM_TO_UNITS,
              32,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            color={pixelColor}
            wireframe
            transparent
            opacity={0.12}
          />
        </mesh>
      ))}

      {/* Short Strip Detector Barrel Layers */}
      {[260, 360, 500].map((r, i) => (
        <mesh key={`s-strip-${i}`} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry
            args={[
              r * MM_TO_UNITS,
              r * MM_TO_UNITS,
              1900 * MM_TO_UNITS,
              36,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            color={stripColor}
            wireframe
            transparent
            opacity={0.1}
          />
        </mesh>
      ))}

      {/* Long Strip Detector Barrel Layers */}
      {[660, 820, 1020].map((r, i) => (
        <mesh key={`l-strip-${i}`} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry
            args={[
              r * MM_TO_UNITS,
              r * MM_TO_UNITS,
              2400 * MM_TO_UNITS,
              40,
              1,
              true,
            ]}
          />
          <meshBasicMaterial
            color={stripColor}
            wireframe
            transparent
            opacity={0.08}
          />
        </mesh>
      ))}

      {/* Electromagnetic Calorimeter (ECal) Barrel */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[
            1150 * MM_TO_UNITS,
            1400 * MM_TO_UNITS,
            2800 * MM_TO_UNITS,
            32,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={ecalColor}
          wireframe
          transparent
          opacity={0.06}
        />
      </mesh>

      {/* Hadronic Calorimeter (HCal) Barrel */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry
          args={[
            1500 * MM_TO_UNITS,
            2300 * MM_TO_UNITS,
            3600 * MM_TO_UNITS,
            32,
            1,
            true,
          ]}
        />
        <meshBasicMaterial
          color={hcalColor}
          wireframe
          transparent
          opacity={0.05}
        />
      </mesh>

      {/* Endcap Disks for ECal and HCal */}
      {[-1400, 1400].map((z, i) => (
        <mesh key={`ecal-endcap-${i}`} position={[0, 0, z * MM_TO_UNITS]}>
          <ringGeometry args={[200 * MM_TO_UNITS, 1400 * MM_TO_UNITS, 32]} />
          <meshBasicMaterial
            color={ecalColor}
            wireframe
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      {[-1800, 1800].map((z, i) => (
        <mesh key={`hcal-endcap-${i}`} position={[0, 0, z * MM_TO_UNITS]}>
          <ringGeometry args={[400 * MM_TO_UNITS, 2300 * MM_TO_UNITS, 32]} />
          <meshBasicMaterial
            color={hcalColor}
            wireframe
            transparent
            opacity={0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};
