import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

// The central star — the SEVERRIR anchor. Emissive core + layered corona shells
// give it volume and a soft breathing pulse; bloom (in Scene) does the glow.
export default function Sun() {
  const core = useRef();
  const corona = useRef();
  const halo = useRef();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) core.current.rotation.y += delta * 0.05;
    const pulse = 1 + Math.sin(t * 0.8) * 0.015;
    if (corona.current) {
      corona.current.scale.setScalar(pulse);
      corona.current.rotation.y -= delta * 0.03;
    }
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.02);
  });

  return (
    <group>
      {/* light cast onto the planets — cool teal-white starlight */}
      <pointLight intensity={3.8} distance={140} decay={1.35} color="#d6fffb" />

      {/* hot core — near-white teal */}
      <Sphere ref={core} args={[3.3, 64, 64]}>
        <meshBasicMaterial color="#eafffd" toneMapped={false} />
      </Sphere>

      {/* corona shell — bright teal */}
      <Sphere ref={corona} args={[3.8, 48, 48]}>
        <meshBasicMaterial
          color="#3aafa9"
          transparent
          opacity={0.38}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* outer atmospheric halo — deeper teal */}
      <Sphere ref={halo} args={[4.9, 32, 32]}>
        <meshBasicMaterial
          color="#2b7a78"
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}
