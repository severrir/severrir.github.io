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

export default function Scene({ activeIndex, onSelect, onReady, hintActive, hintIntense, onInteract }) {
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
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 17, 46], fov: 50, near: 0.1, far: 600 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        // Fire ready on the next frame so the first paint is complete.
        requestAnimationFrame(() => onReady?.());
      }}
    >
      <color attach="background" args={["#0a1316"]} />
      <fog attach="fog" args={["#0a1316", 72, 270]} />

      <ambientLight intensity={0.2} color="#a9e6e2" />
      <hemisphereLight args={["#1f5c58", "#0a1316", 0.3]} />

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

      <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 4}>
        <Bloom
          intensity={isMobile ? 0.95 : 1.4}
          luminanceThreshold={0.48}
          luminanceSmoothing={0.9}
          mipmapBlur
          radius={0.82}
        />
        <Vignette eskil={false} offset={0.22} darkness={0.78} />
      </EffectComposer>
    </Canvas>
  );
}
