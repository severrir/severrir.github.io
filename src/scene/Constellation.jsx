import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const tmp = new THREE.Vector3();

// Faint lines linking the planets into a shifting ring — literally draws the
// "six systems" as a constellation. Updated each frame from the live planet
// world positions; opacity eases up in the interactive overview and fades out
// during the cinematic beats so it never clutters the hero.
export default function Constellation({ anchorRefs, interactive }) {
  const ref = useRef();
  const matRef = useRef();
  const n = anchorRefs.current.length;
  const positions = useMemo(() => new Float32Array(n * 2 * 3), [n]);
  // pre-allocated scratch vectors — reused each frame, no per-frame GC
  const worlds = useMemo(() => Array.from({ length: n }, () => new THREE.Vector3()), [n]);

  useFrame(() => {
    const geo = ref.current?.geometry;
    if (!geo) return;
    for (let i = 0; i < n; i++) anchorRefs.current[i].current?.getWorldPosition(worlds[i]);
    let idx = 0;
    for (let i = 0; i < n; i++) {
      const a = worlds[i];
      const b = worlds[(i + 1) % n];
      positions[idx++] = a.x;
      positions[idx++] = a.y;
      positions[idx++] = a.z;
      positions[idx++] = b.x;
      positions[idx++] = b.y;
      positions[idx++] = b.z;
    }
    geo.attributes.position.needsUpdate = true;

    if (matRef.current) {
      const target = interactive ? 0.1 : 0;
      matRef.current.opacity += (target - matRef.current.opacity) * 0.05;
    }
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={n * 2} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        color="#6fe3ff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}
