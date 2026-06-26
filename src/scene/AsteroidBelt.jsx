import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/scene/sceneEnv.js";

// A thin debris ring sitting in a gap between two planet orbits, drifting slowly
// the same way the planets do — cheap instanced points, no lighting, so it adds
// richness for almost nothing. Frozen under reduced motion.
export default function AsteroidBelt({ radius = 18.7, count = 300, width = 1.8 }) {
  const ref = useRef();
  const reduced = useReducedMotion();

  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * width;
      a[i * 3] = Math.cos(ang) * r;
      a[i * 3 + 1] = (Math.random() - 0.5) * 0.7;
      a[i * 3 + 2] = Math.sin(ang) * r;
    }
    return a;
  }, [radius, count, width]);

  useFrame((_, delta) => {
    if (ref.current && !reduced) ref.current.rotation.y += delta * 0.045;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.17}
        color="#8d96a8"
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}
