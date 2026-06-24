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
      {/* light cast onto the planets — warm golden starlight */}
      <pointLight intensity={4.0} distance={150} decay={1.3} color="#ffd9a0" />

      {/* hot core — white-gold */}
      <Sphere ref={core} args={[3.3, 64, 64]}>
        <meshBasicMaterial color="#fff2d6" toneMapped={false} />
      </Sphere>

      {/* corona shell — bright amber */}
      <Sphere ref={corona} args={[3.8, 48, 48]}>
        <meshBasicMaterial
          color="#ffb84d"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* outer atmospheric halo — deep ember */}
      <Sphere ref={halo} args={[5.1, 32, 32]}>
        <meshBasicMaterial
          color="#ff7a1a"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>
    </group>
  );
}
