import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import Starfield from "@/scene/Starfield.jsx";
import ShootingStars from "@/scene/ShootingStars.jsx";

// Shared background canvas for the subpages. Same starfield, nebula, lighting
// and bloom vocabulary as the homepage scene — so every page reads as one
// universe — but tuned lighter (fewer stars, no chromatic aberration, gentler
// bloom) because subpages layer real content on top and only need atmosphere.
// One WebGL context per page; the heavy homepage scene is unmounted by the
// router before any of these mount.
export default function SpaceCanvas({
  children,
  camera = { position: [0, 0.6, 14], fov: 50 },
  stars,
  shootingStars = true,
  bloom = 0.6,
  className = "scene-canvas scene-canvas--page",
  pointerEvents = true,
}) {
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768,
    []
  );
  const starCount = stars ?? (isMobile ? 500 : 1100);
  const [dpr, setDpr] = useState(isMobile ? 1.1 : 1.6);

  return (
    <Canvas
      className={className}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: pointerEvents ? "auto" : "none",
      }}
      dpr={dpr}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      camera={{ ...camera, near: 0.1, far: 700 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        const canvas = gl.domElement;
        canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
      }}
    >
      <color attach="background" args={["#05060a"]} />
      <fog attach="fog" args={["#05060a", 30, 240]} />

      <ambientLight intensity={0.2} color="#aab4d6" />
      <hemisphereLight args={["#3a3550", "#05060a", 0.32]} />

      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(isMobile ? 0.8 : 1, d - 0.25))}
        onIncline={() => setDpr((d) => Math.min(isMobile ? 1.1 : 1.6, d + 0.25))}
      />

      <Starfield count={starCount} />
      {shootingStars && <ShootingStars />}

      {children}

      <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 2}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={0.62}
          luminanceSmoothing={0.5}
          mipmapBlur
          radius={0.62}
        />
        <Vignette eskil={false} offset={0.24} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
