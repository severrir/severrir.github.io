import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";
import { useReducedMotion, pointer } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

// Fixed Saturn configuration — no variations
const SATURN_CONFIG = {
  pattern: "bands",
  colorA: "#b08a4c",
  colorB: "#dcb878",
  colorC: "#f8edd2",
  rimColor: "#ffd98a",
  rimStrength: 0.8,
  rimPower: 2.6,
};

const SPHERE_RADIUS = 1.06;
const PLANET_POS = [0, 0, -7];
const PLANET_ROTATION = [-0.52, 0, 0.18];

// Fixed camera setup — ZERO computation.
// Pulled back from the planet (vs the old [0,1.5,-1]) so the full ring system +
// atmosphere glow sit comfortably inside the canvas with margin to spare — even
// at max parallax tilt nothing reaches the canvas edge, so no hard ring cut-off.
const CAMERA_POS = [0, 1.95, 0.8];
const CAMERA_FOV = 42;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 50;

function SaturnMesh({ hovered, pressedAt }) {
  const reduced = useReducedMotion();
  const { camera } = useThree();
  const tilt = useRef();
  const spin = useRef();
  const ringMat = useRef([]);
  const material = useMemo(() => makePlanetMaterial(SATURN_CONFIG), []);
  const setupDone = useRef(false);

  // ONE-TIME camera setup — happens exactly once, never recalculated
  useEffect(() => {
    if (setupDone.current) return;
    camera.position.set(...CAMERA_POS);
    camera.lookAt(...PLANET_POS);
    camera.fov = CAMERA_FOV;
    camera.near = CAMERA_NEAR;
    camera.far = CAMERA_FAR;
    // Force aspect to container's current ratio
    const w = camera.getWorldDirection(new THREE.Vector3()).length();
    // Match the canvas container's aspect ratio directly
    setTimeout(() => {
      const container = document.querySelector(".hero-planet");
      if (container) {
        const rect = container.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
      setupDone.current = true;
    }, 0);
  }, [camera]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    // Lock camera EVERY frame to absolute values — no drift, no variance
    camera.position.set(...CAMERA_POS);
    camera.lookAt(...PLANET_POS);

    // Update material uniforms
    material.uniforms.uTime.value = t;
    material.uniforms.uHover.value = THREE.MathUtils.lerp(
      material.uniforms.uHover.value,
      hovered ? 1 : 0,
      0.1
    );

    // Rotation
    if (spin.current && !reduced) {
      spin.current.rotation.y += dt * (hovered ? 0.34 : 0.16);
    }

    // Parallax tilt toward cursor
    if (tilt.current) {
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      const targetX = -0.52 + py * 0.16;
      const targetY = px * 0.26;
      tilt.current.rotation.x = THREE.MathUtils.lerp(tilt.current.rotation.x, targetX, 0.06);
      tilt.current.rotation.y = THREE.MathUtils.lerp(tilt.current.rotation.y, targetY, 0.06);
      tilt.current.rotation.z = 0.18;

      // Hover swell + click punch
      const since = t - pressedAt.current;
      let s = THREE.MathUtils.lerp(tilt.current.scale.x, hovered ? 1.05 : 1, 0.1);
      if (since >= 0 && since < 0.4) {
        s += Math.sin((since / 0.4) * Math.PI) * 0.06 * (1 - since / 0.4);
      }
      tilt.current.scale.setScalar(s);
    }

    // Ring opacity on hover
    const baseOpacities = [0.55, 0.34, 0.2];
    ringMat.current.forEach((mat, i) => {
      if (mat) {
        mat.opacity = THREE.MathUtils.lerp(
          mat.opacity,
          baseOpacities[i] * (hovered ? 1.6 : 1),
          0.1
        );
      }
    });
  });

  return (
    <group ref={tilt} position={PLANET_POS} rotation={PLANET_ROTATION}>
      <group ref={spin}>
        <mesh material={material}>
          <sphereGeometry args={[SPHERE_RADIUS, 96, 96]} />
        </mesh>
      </group>

      {/* Glow shells */}
      <mesh scale={1.08}>
        <sphereGeometry args={[SPHERE_RADIUS, 48, 48]} />
        <meshBasicMaterial
          color={SATURN_CONFIG.rimColor}
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[SPHERE_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color={SATURN_CONFIG.rimColor}
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Rings */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.0, 160]} />
          <meshBasicMaterial
            ref={(m) => (ringMat.current[0] = m)}
            color="#ecd9a8"
            transparent
            opacity={0.55}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.07, 2.22, 160]} />
          <meshBasicMaterial
            ref={(m) => (ringMat.current[1] = m)}
            color="#f6e8c6"
            transparent
            opacity={0.34}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.28, 1.43, 128]} />
          <meshBasicMaterial
            ref={(m) => (ringMat.current[2] = m)}
            color="#caa763"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroPlanet() {
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);
  const pressedAt = useRef(-10);
  const containerRef = useRef();

  // Fixed entrance delay — no variance
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleEnter = () => {
    if (!ready) return;
    setHovered(true);
    audio.hover();
  };

  const handleLeave = () => {
    setHovered(false);
  };

  const handlePress = () => {
    if (!ready) return;
    pressedAt.current = performance.now() / 1000;
    audio.click();
  };

  return (
    <div
      ref={containerRef}
      className="hero-planet"
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onPointerDown={handlePress}
      style={{
        position: "relative",
        width: "400px",
        height: "400px",
        cursor: "pointer",
      }}
    >
      <div className={`hero-planet__halo ${hovered ? "is-hover" : ""}`} />
      <Canvas
        dpr={1}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "low-power",
        }}
        camera={{
          position: CAMERA_POS,
          fov: CAMERA_FOV,
          near: CAMERA_NEAR,
          far: CAMERA_FAR,
        }}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <ambientLight intensity={0.32} color="#ffe9c8" />
        <SaturnMesh hovered={hovered} pressedAt={pressedAt} />
      </Canvas>
    </div>
  );
}
