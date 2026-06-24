import { createRef, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

import Starfield from "@/scene/Starfield.jsx";
import Sun from "@/scene/Sun.jsx";
import Planet from "@/scene/Planet.jsx";
import Orbits from "@/scene/Orbits.jsx";
import CameraRig from "@/scene/CameraRig.jsx";
import { projects } from "@/data/projects.js";

export default function Scene({ activeIndex, onSelect, onReady, hintActive, hintIntense, onInteract, interactive }) {
  const controlsRef = useRef();
  const anchorRefs = useRef(projects.map(() => createRef()));

  // Degrade gracefully on small screens / weak GPUs.
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768,
    []
  );
  const starCount = isMobile ? 700 : 1800;

  return (
    <Canvas
      className="scene-canvas"
      // r3f sets inline `position: relative; width/height: 100%` on its wrapper,
      // which beats the .scene-canvas class and collapses the canvas to a thin
      // strip. Override inline so the scene is a true full-viewport background.
      style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}
      // Cap pixel ratio so 4K/retina displays don't render at 2x and tank the
      // GPU. 1.75 is visually crisp but far cheaper than an uncapped 2–3x.
      dpr={isMobile ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      // Start at the Beat 1 wide shot so there's no jump when the loader fades.
      camera={{ position: [0, 26, 92], fov: 50, near: 0.1, far: 600 }}
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
      <fog attach="fog" args={["#05060a", 80, 290]} />

      <ambientLight intensity={0.18} color="#aab4d6" />
      <hemisphereLight args={["#3a3550", "#05060a", 0.32]} />

      <Starfield count={starCount} />
      <Sun />
      <Orbits projects={projects} />

      {projects.map((project, i) => (
        <Planet
          key={project.id}
          project={project}
          index={i}
          anchorRef={anchorRefs.current[i]}
          active={activeIndex === i}
          dimmed={activeIndex !== null && activeIndex !== i}
          hint={hintActive && i === 0}
          hintIntense={hintIntense}
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
        maxDistance={90}
        maxPolarAngle={Math.PI * 0.85}
        minPolarAngle={Math.PI * 0.12}
        onStart={onInteract}
      />

      <CameraRig
        controlsRef={controlsRef}
        anchorRefs={anchorRefs}
        activeIndex={activeIndex}
        projects={projects}
      />

      <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 2}>
        <Bloom
          intensity={isMobile ? 0.9 : 1.3}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.8}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    </Canvas>
  );
}
