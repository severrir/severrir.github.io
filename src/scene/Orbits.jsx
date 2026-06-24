import { useMemo } from "react";
import * as THREE from "three";

// Faint orbit guide-lines so each planet reads as travelling a real lane.
export default function Orbits({ projects }) {
  const rings = useMemo(
    () =>
      projects.map((p) => {
        const curve = new THREE.EllipseCurve(0, 0, p.orbit.radius, p.orbit.radius, 0, Math.PI * 2);
        const points = curve.getPoints(128);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        // `rimColor` is the planet's signature hue — tints its lane to match.
        return { id: p.id, geometry, tilt: p.orbit.tilt, color: p.visual.rimColor };
      }),
    [projects]
  );

  return (
    <group>
      {rings.map((r) => (
        <line key={r.id} geometry={r.geometry} rotation={[-Math.PI / 2 + r.tilt, 0, 0]}>
          <lineBasicMaterial
            color={r.color}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </line>
      ))}
    </group>
  );
}
