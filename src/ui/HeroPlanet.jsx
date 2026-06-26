import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";
import { useReducedMotion } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

// Signature cyan world for the hero — ties to the site's --accent. Purely
// atmospheric: it slowly rotates, and brightens + swells a touch on hover.
const HERO_VISUAL = {
  pattern: "circuit",
  colorA: "#07201f",
  colorB: "#146b78",
  colorC: "#5ee6e0",
  rimColor: "#6fe3ff",
  rimStrength: 0.7,
  rimPower: 2.4,
};

const POS = new THREE.Vector3(0, 0, 0);

function Body({ hovered }) {
  const ref = useRef();
  const material = useMemo(() => makePlanetMaterial(HERO_VISUAL), []);
  const reduced = useReducedMotion();
  const { camera } = useThree();

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    camera.position.set(1.5, 0.9, 3.4);
    camera.lookAt(POS);
  }, [camera]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    if (ref.current && !reduced) ref.current.rotation.y += dt * 0.16;
    material.uniforms.uHover.value = THREE.MathUtils.lerp(
      material.uniforms.uHover.value,
      hovered ? 1 : 0,
      0.12
    );
    if (ref.current) {
      const target = hovered ? 1.06 : 1;
      const s = THREE.MathUtils.lerp(ref.current.scale.x, target, 0.1);
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <mesh ref={ref} material={material}>
        <sphereGeometry args={[1, 64, 64]} />
      </mesh>
      {/* atmosphere shell */}
      <mesh scale={1.26}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={HERO_VISUAL.rimColor}
          transparent
          opacity={hovered ? 0.22 : 0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function HeroPlanet() {
  const [hovered, setHovered] = useState(false);

  const enter = () => {
    setHovered(true);
    audio.hover();
  };

  return (
    <div
      className="hero-planet"
      onPointerEnter={enter}
      onPointerLeave={() => setHovered(false)}
      aria-hidden="true"
    >
      <div className={`hero-planet__halo ${hovered ? "is-hover" : ""}`} />
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 34, near: 0.1, far: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.28} color="#cdd6ee" />
        <Body hovered={hovered} />
      </Canvas>
    </div>
  );
}
