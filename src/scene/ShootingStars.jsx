import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/scene/sceneEnv.js";

// One reused comet streak that launches across the field every few seconds, so
// the scene feels inhabited and rewards just watching. Frozen under reduced
// motion. A single additive box (thin + long) oriented along its velocity.
export default function ShootingStars() {
  const ref = useRef();
  const matRef = useRef();
  const reduced = useReducedMotion();
  const st = useRef({
    active: false,
    next: 3,
    t: 0,
    dur: 1.1,
    start: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    tip: new THREE.Vector3(),
  });

  useFrame((state, delta) => {
    const s = st.current;
    const mesh = ref.current;
    if (!mesh || reduced) return;
    const time = state.clock.elapsedTime;

    if (!s.active && time > s.next) {
      const r = 110;
      const ang = Math.random() * Math.PI * 2;
      s.start.set(Math.cos(ang) * r * 0.7, 35 + Math.random() * 45, Math.sin(ang) * r * 0.7);
      s.vel
        .set(-Math.cos(ang), -0.4 - Math.random() * 0.5, -Math.sin(ang))
        .normalize()
        .multiplyScalar(150);
      s.active = true;
      s.t = 0;
      s.dur = 0.9 + Math.random() * 0.6;
      mesh.visible = true;
    }

    if (s.active) {
      s.t += delta;
      const k = s.t / s.dur;
      mesh.position.copy(s.start).addScaledVector(s.vel, s.t);
      s.tip.copy(mesh.position).add(s.vel);
      mesh.lookAt(s.tip);
      if (matRef.current) matRef.current.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.9;
      if (k >= 1) {
        s.active = false;
        mesh.visible = false;
        s.next = time + 5 + Math.random() * 9;
      }
    }
  });

  return (
    <mesh ref={ref} visible={false}>
      <boxGeometry args={[0.07, 0.07, 6]} />
      <meshBasicMaterial
        ref={matRef}
        color="#dff0ff"
        transparent
        opacity={0}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}
