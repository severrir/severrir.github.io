import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import SpaceCanvas from "@/scene/SpaceCanvas.jsx";
import ScenePlanet from "@/scene/ScenePlanet.jsx";

const PLANET_DATA = [
  {
    position: [-10, 3.6, -10],
    visual: { pattern: "ice", colorA: "#16384a", colorB: "#a8e8f0", colorC: "#ffffff", rimColor: "#a8e8f0", rimStrength: 0.7, rimPower: 2.2, size: 1.5 },
  },
  {
    position: [2.2, 0.8, -14],
    visual: { pattern: "bands", colorA: "#2b1e08", colorB: "#9a6f24", colorC: "#ffe6a8", rimColor: "#d9a24a", rimStrength: 0.55, rimPower: 3.0, size: 1.4, rings: true },
  },
  {
    position: [-14, -4.6, -22],
    visual: { pattern: "marble", colorA: "#2a0e3a", colorB: "#b45ee0", colorC: "#e05eaf", rimColor: "#b45ee0", rimStrength: 0.6, rimPower: 2.4, size: 1.3 },
  },
  {
    position: [15, 5.4, -26],
    visual: { pattern: "circuit", colorA: "#07201f", colorB: "#146b78", colorC: "#5ee6e0", rimColor: "#5ee6e0", rimStrength: 0.6, rimPower: 3.0, size: 1.1 },
  },
  {
    position: [3, 7.2, -30],
    visual: { pattern: "lava", colorA: "#2b0e0a", colorB: "#7a2218", colorC: "#ff8a3d", rimColor: "#e8453c", rimStrength: 0.7, rimPower: 3.0, size: 0.95 },
  },
];

function PlanetRotation({ children, speed = 0.03 }) {
  const ref = useRef();
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += Math.min(delta, 1 / 30) * speed;
  });
  return <group ref={ref}>{children}</group>;
}

export default function AmbientScene() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <SpaceCanvas
      camera={{ position: [0, 0.5, 13], fov: 52 }}
      stars={isMobile ? 650 : 1400}
      bloom={0.55}
      pointerEvents={false}
      className="scene-canvas scene-canvas--page scene-canvas--ambient"
    >
      <PlanetRotation speed={0.03}>
        {PLANET_DATA.map((p, i) => (
          <ScenePlanet key={i} visual={p.visual} position={p.position} interactive={false} spin={0.12} bob={0.3} />
        ))}
      </PlanetRotation>
    </SpaceCanvas>
  );
}
