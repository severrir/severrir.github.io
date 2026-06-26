import { createRef, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

import Starfield from "@/scene/Starfield.jsx";
import Sun from "@/scene/Sun.jsx";
import Planet from "@/scene/Planet.jsx";
import Orbits from "@/scene/Orbits.jsx";
import AsteroidBelt from "@/scene/AsteroidBelt.jsx";
import CardBurst from "@/scene/CardBurst.jsx";
import ShootingStars from "@/scene/ShootingStars.jsx";
import Constellation from "@/scene/Constellation.jsx";
import CameraRig from "@/scene/CameraRig.jsx";
import { camShake } from "@/scene/sceneEnv.js";
import { projects } from "@/data/projects.js";

// Applies the global shake impulse to the camera each frame, decaying fast.
// Runs last so it offsets whatever the rig / OrbitControls just set.
function CameraShake() {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (camShake.amp <= 0.0015) return;
    const a = camShake.amp;
    camera.position.x += (Math.random() - 0.5) * a;
    camera.position.y += (Math.random() - 0.5) * a;
    camera.position.z += (Math.random() - 0.5) * a * 0.5;
    camShake.amp *= Math.exp(-6 * delta);
  });
  return null;
}

// Eases bloom up a touch while a planet is focused, for a cinematic "arrival"
// pop, then back down — fully owned per-frame so React re-renders can't reset it.
function BloomController({ bloomRef, activeIndex, base }) {
  useFrame(() => {
    const b = bloomRef.current;
    if (!b) return;
    const target = activeIndex !== null ? base * 1.4 : base;
    b.intensity += (target - b.intensity) * 0.06;
  });
  return null;
}

// Washes the fog/background a touch toward the focused project's colour, so each
// project "owns" the scene while its card is open. Stays subtle (mostly void).
const VOID = new THREE.Color("#05060a");
const RIMS = projects.map((p) => new THREE.Color(p.visual.rimColor));
function FogWash({ activeIndex }) {
  const { scene } = useThree();
  const target = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    target.copy(VOID);
    if (activeIndex !== null) target.lerp(RIMS[activeIndex], 0.16);
    if (scene.fog) scene.fog.color.lerp(target, 0.05);
    if (scene.background?.isColor) scene.background.lerp(target, 0.05);
  });
  return null;
}

export default function Scene({ activeIndex, onSelect, onReady, onInteract, interactive, playIntro, onBlackHole }) {
  const controlsRef = useRef();
  const anchorRefs = useRef(projects.map(() => createRef()));
  const bloomRef = useRef();
  const aberration = useMemo(() => new THREE.Vector2(0.00028, 0.0004), []);

  // Degrade gracefully on small screens / weak GPUs.
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768,
    []
  );
  const starCount = isMobile ? 700 : 1800;
  const baseBloom = isMobile ? 0.7 : 0.85;

  // Adaptive resolution: drop the pixel ratio if the GPU can't keep up, so weak
  // devices stay smooth instead of dropping frames at full res.
  const [dpr, setDpr] = useState(isMobile ? 1.25 : 1.75);

  return (
    <Canvas
      className="scene-canvas"
      // r3f sets inline `position: relative; width/height: 100%` on its wrapper,
      // which beats the .scene-canvas class and collapses the canvas to a thin
      // strip. Override inline so the scene is a true full-viewport background.
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
      // Pixel ratio is driven adaptively (see PerformanceMonitor below): crisp
      // when the GPU can afford it, lower when it can't.
      dpr={dpr}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // Start at the Beat 1 wide shot so there's no jump when the loader fades.
      // Keep in sync with STAGE(_MOBILE).wide.pos in cameraStages.js. Phones use
      // a wider FOV + a much further dolly so the flat, wide system fits a
      // portrait frame instead of cropping to a giant sun.
      camera={{
        position: isMobile ? [-3, 47, 172] : [-3, 34, 112],
        fov: isMobile ? 72 : 50,
        near: 0.1,
        far: 700,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;

        // WebGL context loss (driver hiccup, GPU reset, long idle on some
        // machines) otherwise leaves a permanently blank canvas. preventDefault
        // lets the browser fire `webglcontextrestored`, and r3f rebuilds the
        // scene from the React tree on restore — so it recovers instead of
        // staying white.
        const canvas = gl.domElement;
        const onLost = (e) => e.preventDefault();
        canvas.addEventListener("webglcontextlost", onLost, false);

        // Fire ready on the next frame so the first paint is complete.
        requestAnimationFrame(() => onReady?.());
      }}
    >
      <color attach="background" args={["#05060a"]} />
      {/* Phones dolly much further back, so push fog out to match or the whole
          system would sit inside the fog and wash to the background colour. */}
      <fog attach="fog" args={isMobile ? ["#05060a", 150, 470] : ["#05060a", 80, 290]} />

      <ambientLight intensity={0.18} color="#aab4d6" />
      <hemisphereLight args={["#3a3550", "#05060a", 0.32]} />

      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(isMobile ? 0.85 : 1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(isMobile ? 1.25 : 1.75, d + 0.25))}
      />

      <Starfield count={starCount} />
      <ShootingStars />
      <Sun interactive={interactive} onBlackHole={onBlackHole} />
      <Orbits projects={projects} />
      <AsteroidBelt radius={18.7} count={isMobile ? 130 : 320} />
      <Constellation anchorRefs={anchorRefs} interactive={interactive} />
      <CardBurst anchorRefs={anchorRefs} activeIndex={activeIndex} />
      <FogWash activeIndex={activeIndex} />

      {projects.map((project, i) => (
        <Planet
          key={project.id}
          project={project}
          index={i}
          anchorRef={anchorRefs.current[i]}
          active={activeIndex === i}
          dimmed={activeIndex !== null && activeIndex !== i}
          onSelect={onSelect}
          interactive={interactive}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.55}
        zoomSpeed={0.7}
        minDistance={10}
        maxDistance={isMobile ? 190 : 90}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.12}
        onStart={onInteract}
      />

      <CameraRig
        controlsRef={controlsRef}
        anchorRefs={anchorRefs}
        activeIndex={activeIndex}
        projects={projects}
        playIntro={playIntro}
      />

      <BloomController bloomRef={bloomRef} activeIndex={activeIndex} base={baseBloom} />
      <CameraShake />

      <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 2}>
        {/* Conservative bloom: a high luminance threshold means only the very
            brightest pixels (the sun core) bloom, so the additive nebula, stars
            and planet rims never push the whole frame to white on real GPUs. */}
        <Bloom
          ref={bloomRef}
          intensity={baseBloom}
          luminanceThreshold={0.78}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.6}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={aberration}
          radialModulation
          modulationOffset={0.4}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    </Canvas>
  );
}
