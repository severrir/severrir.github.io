import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";
import { useReducedMotion, pointer } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

// A cinematic ringed gas giant (Saturn-like) for the hero — warm, soft-lit, and
// glowing rather than the hard wireframe it replaced. It slowly rotates, leans
// toward the cursor for a living 3D feel, and on hover the rings open + brighten
// and the whole world swells a touch. High-poly sphere + additive atmosphere
// shells mean no faceted edges and no hard canvas box (the canvas is transparent
// and the glow bleeds past it via the CSS halo).
const SATURN = {
  pattern: "bands",
  // narrow A→B range keeps the bands smooth and golden (no dark cloud blobs)
  colorA: "#b08a4c",
  colorB: "#dcb878",
  colorC: "#f8edd2",
  rimColor: "#ffd98a",
  rimStrength: 0.8,
  rimPower: 2.6,
};

const RADIUS = 1.06;
// The planet shader lights whatever faces the world origin (its "sun"), so the
// planet must sit OFF origin or it renders fully dark. Park it out on -Z with the
// lit hemisphere facing the camera (which sits between it and the origin).
const POS = [0, 0, -7];

function Saturn({ hovered, pressedAt }) {
  const reduced = useReducedMotion();
  const { camera } = useThree();
  const size = useThree((s) => s.size); // re-frame whenever the canvas resizes
  const tilt = useRef(); // outer tilt group (parallax leans this)
  const spin = useRef(); // the rotating planet body
  const ringMat = useRef([]);
  const material = useMemo(() => makePlanetMaterial(SATURN), []);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 30);
    const t = state.clock.elapsedTime;

    // Lock the framing EVERY frame rather than only on a size effect. The canvas
    // container is square, but R3F can briefly measure a zero/thin size on the
    // first layout pass — which left the planet small + off-centre until a later
    // resize "fixed itself". Re-asserting the camera + a matching aspect each
    // frame removes that race for good (constant target → negligible cost).
    if (size.width > 0 && size.height > 0) {
      camera.position.set(0, 1.5, -1.0);
      camera.lookAt(POS[0], POS[1], POS[2]);
      const aspect = size.width / size.height;
      if (Math.abs(camera.aspect - aspect) > 0.0001) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }

    material.uniforms.uTime.value = t;
    material.uniforms.uHover.value = THREE.MathUtils.lerp(
      material.uniforms.uHover.value,
      hovered ? 1 : 0,
      0.1
    );

    // Body spin — eases faster on hover.
    if (spin.current && !reduced) spin.current.rotation.y += dt * (hovered ? 0.34 : 0.16);

    // Lean toward the pointer (parallax) layered on the base Saturn tilt.
    if (tilt.current) {
      const px = reduced ? 0 : pointer.x;
      const py = reduced ? 0 : pointer.y;
      const targetX = -0.52 + py * 0.16;
      const targetY = px * 0.26;
      tilt.current.rotation.x = THREE.MathUtils.lerp(tilt.current.rotation.x, targetX, 0.06);
      tilt.current.rotation.y = THREE.MathUtils.lerp(tilt.current.rotation.y, targetY, 0.06);
      tilt.current.rotation.z = 0.18;

      // hover swell + click punch
      const since = t - pressedAt.current;
      let s = THREE.MathUtils.lerp(tilt.current.scale.x, hovered ? 1.05 : 1, 0.1);
      if (since >= 0 && since < 0.4) s += Math.sin((since / 0.4) * Math.PI) * 0.06 * (1 - since / 0.4);
      tilt.current.scale.setScalar(s);
    }

    // Rings brighten on hover.
    const base = [0.55, 0.34, 0.2];
    ringMat.current.forEach((m, i) => {
      if (m) m.opacity = THREE.MathUtils.lerp(m.opacity, base[i] * (hovered ? 1.6 : 1), 0.1);
    });
  });

  return (
    <group ref={tilt} position={POS} rotation={[-0.52, 0, 0.18]}>
      <group ref={spin}>
        <mesh material={material}>
          <sphereGeometry args={[RADIUS, 96, 96]} />
        </mesh>
      </group>

      {/* atmosphere shells → soft volumetric glow, kept tight so the glow falls
          off well inside the canvas (no rectangular edge clip) */}
      <mesh scale={1.08}>
        <sphereGeometry args={[RADIUS, 48, 48]} />
        <meshBasicMaterial color={SATURN.rimColor} transparent opacity={0.16} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh scale={1.18}>
        <sphereGeometry args={[RADIUS, 32, 32]} />
        <meshBasicMaterial color={SATURN.rimColor} transparent opacity={0.05} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* ring system — flat in the planet's equatorial (XZ) plane */}
      <group>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.0, 160]} />
          <meshBasicMaterial ref={(m) => (ringMat.current[0] = m)} color="#ecd9a8" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.07, 2.22, 160]} />
          <meshBasicMaterial ref={(m) => (ringMat.current[1] = m)} color="#f6e8c6" transparent opacity={0.34} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.28, 1.43, 128]} />
          <meshBasicMaterial ref={(m) => (ringMat.current[2] = m)} color="#caa763" transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroPlanet() {
  const [hovered, setHovered] = useState(false);
  const [ready, setReady] = useState(false);
  const pressedAt = useRef(-10);

  // Ignore hover/press until the warp-in entrance has finished, so interacting
  // mid-animation can't fight the entrance transform and glitch.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const enter = () => {
    if (!ready) return;
    setHovered(true);
    audio.hover();
  };
  const press = () => {
    if (!ready) return;
    pressedAt.current = performance.now() / 1000;
    audio.click();
  };

  return (
    <div
      className="hero-planet"
      onPointerEnter={enter}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={press}
    >
      <div className={`hero-planet__halo ${hovered ? "is-hover" : ""}`} />
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 42, near: 0.1, far: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.32} color="#ffe9c8" />
        <Saturn hovered={hovered} pressedAt={pressedAt} />
      </Canvas>
    </div>
  );
}
