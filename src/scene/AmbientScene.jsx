import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import SpaceCanvas from "@/scene/SpaceCanvas.jsx";
import ScenePlanet from "@/scene/ScenePlanet.jsx";

// A calm, non-interactive backdrop for the content-heavy pages (Pricing,
// Booking): the shared starfield plus a couple of distant decorative planets
// drifting slowly. The canvas takes no pointer events, so the cards / form on
// top stay effortless to use — the brief's priority for these pages.
const DECOR = [
  {
    position: [-9, 3.4, -10],
    visual: {
      pattern: "ice",
      colorA: "#16384a",
      colorB: "#a8e8f0",
      colorC: "#ffffff",
      rimColor: "#a8e8f0",
      rimStrength: 0.7,
      rimPower: 2.2,
      size: 1.4,
    },
  },
  {
    position: [10.5, -2.2, -14],
    visual: {
      pattern: "bands",
      colorA: "#2b1e08",
      colorB: "#9a6f24",
      colorC: "#ffe6a8",
      rimColor: "#d9a24a",
      rimStrength: 0.55,
      rimPower: 3.0,
      size: 1.9,
      rings: true,
    },
  },
];

function Drift({ children, speed = 0.01 }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += Math.min(delta, 1 / 30) * speed;
  });
  return <group ref={ref}>{children}</group>;
}

export default function AmbientScene() {
  return (
    <SpaceCanvas
      camera={{ position: [0, 0.5, 13], fov: 52 }}
      stars={typeof window !== "undefined" && window.innerWidth < 768 ? 420 : 850}
      bloom={0.5}
      pointerEvents={false}
      className="scene-canvas scene-canvas--page scene-canvas--ambient"
    >
      <Drift speed={0.03}>
        {DECOR.map((d, i) => (
          <ScenePlanet
            key={i}
            visual={d.visual}
            position={d.position}
            interactive={false}
            spin={0.12}
            bob={0.3}
          />
        ))}
      </Drift>
    </SpaceCanvas>
  );
}
