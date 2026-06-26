import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";

// A small spinning copy of the project's actual planet, embedded in the card.
// The shader lights whatever faces the world origin (its "sun"), so the planet
// sits out on -Z (lit side facing +Z, toward the camera) and the camera is
// placed front-up-right of it — giving a properly lit 3/4 view with a soft
// terminator instead of the dark, muddy unlit hemisphere.
const POS = new THREE.Vector3(0, 0, -8);
const ORBIT_R = 1.95;
const ORBIT_TILT = [1.36, 0.16, 0]; // near edge-on so it reads as a flat ring plane

// A glowing orbit ring with a little moon tracing it — turns the card's stage
// from "a planet on a dark grid" into "this project's world in its own system".
function Orbit({ color }) {
  const moon = useRef();
  useFrame((_, delta) => {
    if (moon.current) moon.current.rotation.z += delta * 0.7;
  });
  return (
    <group position={POS} rotation={ORBIT_TILT}>
      {/* crisp orbit lane */}
      <mesh>
        <torusGeometry args={[ORBIT_R, 0.012, 12, 180]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* soft wider halo so the lane glows rather than reads as a hard wire */}
      <mesh>
        <torusGeometry args={[ORBIT_R, 0.05, 12, 180]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* the orbiting moon + its glow, swept around the lane each frame */}
      <group ref={moon}>
        <mesh position={[ORBIT_R, 0, 0]}>
          <sphereGeometry args={[0.085, 20, 20]} />
          <meshBasicMaterial color="#f4f8ff" />
        </mesh>
        <mesh position={[ORBIT_R, 0, 0]} scale={2.6}>
          <sphereGeometry args={[0.085, 14, 14]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

function Body({ visual }) {
  const ref = useRef();
  const material = useMemo(() => makePlanetMaterial(visual), [visual]);
  const { camera } = useThree();

  // Stepping Next/Prev between projects rebuilds this material; dispose the old
  // one (and on unmount) so GPU programs/uniforms don't accumulate over a
  // session of card-hopping.
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    // Slightly above + to the side, looking at the planet so it reads as a lit
    // 3/4 sphere — pulled back just enough (vs. the planet-only framing) that
    // the orbit ring clears the frame edges.
    camera.position.set(1.8, 1.15, -4.0);
    camera.lookAt(POS);
  }, [camera]);

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    if (ref.current) ref.current.rotation.y += delta * 0.45;
  });

  return (
    <>
      <Orbit color={visual.rimColor} />
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
    </>
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
