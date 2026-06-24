import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";

// A small spinning copy of the project's actual planet, embedded in the card.
// Offset from the world origin so the shader's "sun at origin" lighting model
// produces a proper lit side + terminator instead of a flat disc.
const POS = new THREE.Vector3(6, 2.4, 5);

function Body({ visual }) {
  const ref = useRef();
  const material = useMemo(() => makePlanetMaterial(visual), [visual]);
  const { camera } = useThree();

  // Stepping Next/Prev between projects rebuilds this material; dispose the old
  // one (and on unmount) so GPU programs/uniforms don't accumulate over a
  // session of card-hopping.
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    camera.position.set(POS.x, POS.y + 0.3, POS.z + 3.2);
    camera.lookAt(POS);
  }, [camera]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y += delta * 0.45;
  });

  return (
    <group position={POS}>
      <mesh ref={ref} material={material}>
        <sphereGeometry args={[1.15, 64, 64]} />
      </mesh>
      <mesh scale={1.28}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color={visual.rimColor}
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function MiniPlanet({ visual }) {
  return (
    <Canvas
      // Small card-embedded canvas: low DPR cap + low-power GPU hint so it
      // doesn't contend with the main scene's context.
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      camera={{ fov: 32, near: 0.1, far: 50 }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.24} color="#cdd6ee" />
      <Body visual={visual} />
    </Canvas>
  );
}
