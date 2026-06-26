import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { prefersReducedMotion } from "@/scene/sceneEnv.js";

const N = 46; // particle count
const DUR = 0.75; // seconds
const SPREAD = 3.6; // world units the puff expands to

// A brief sparkle/dust puff at a planet the moment its card opens — a small
// "you picked this" flourish. One reused Points cloud; it just resets its origin
// and life on each open. Skipped entirely under reduced motion.
export default function CardBurst({ anchorRefs, activeIndex }) {
  const ref = useRef();
  const matRef = useRef();
  const life = useRef(1); // 0 = just fired, 1 = finished
  const origin = useRef(new THREE.Vector3());
  const prev = useRef(null);

  // per-particle unit directions × random speed, fixed for the lifetime
  const dirs = useMemo(() => {
    const d = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
        .normalize()
        .multiplyScalar(0.4 + Math.random() * 0.6);
      d[i * 3] = v.x;
      d[i * 3 + 1] = v.y;
      d[i * 3 + 2] = v.z;
    }
    return d;
  }, []);
  const positions = useMemo(() => new Float32Array(N * 3), []);

  useEffect(() => {
    if (activeIndex !== null && activeIndex !== prev.current && !prefersReducedMotion()) {
      const anchor = anchorRefs.current[activeIndex]?.current;
      if (anchor) {
        anchor.getWorldPosition(origin.current);
        life.current = 0;
      }
    }
    prev.current = activeIndex;
  }, [activeIndex, anchorRefs]);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    if (life.current >= 1) {
      if (pts.visible) pts.visible = false;
      return;
    }
    life.current = Math.min(1, life.current + delta / DUR);
    const e = 1 - Math.pow(1 - life.current, 2); // easeOut expansion
    const o = origin.current;
    for (let i = 0; i < N; i++) {
      positions[i * 3] = o.x + dirs[i * 3] * SPREAD * e;
      positions[i * 3 + 1] = o.y + dirs[i * 3 + 1] * SPREAD * e;
      positions[i * 3 + 2] = o.z + dirs[i * 3 + 2] * SPREAD * e;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.visible = true;
    if (matRef.current) matRef.current.opacity = (1 - life.current) * 0.9;
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={N} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.22}
        color="#bfeeff"
        sizeAttenuation
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
