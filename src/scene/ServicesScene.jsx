import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import SpaceCanvas from "@/scene/SpaceCanvas.jsx";
import ScenePlanet from "@/scene/ScenePlanet.jsx";
import { services } from "@/data/services.js";

// A distinct arrangement from the homepage's flat orbital ring: the six service
// planets sit as a hub-and-spoke constellation in front of the camera, with
// Full-Stack at the hub (it touches every other discipline) and faint lines
// linking each specialism back to it. Same materials and motion language as the
// homepage — different geography.
const LAYOUT = {
  fullstack: [0, 0.2, -4], // hub
  frontend: [-6.2, 2.7, -2],
  backend: [6.0, 3.0, -3.5],
  ui: [-4.0, -3.0, -1.5],
  pm: [5.0, -2.8, -2.5],
  gamedesign: [-6.8, -0.5, -4],
};

const HUB = "fullstack";

// Faint additive lines from the hub to each specialism.
function Spokes({ pulse }) {
  const matRef = useRef();
  const positions = useMemo(() => {
    const hub = LAYOUT[HUB];
    const segs = [];
    services.forEach((s) => {
      if (s.id === HUB) return;
      const p = LAYOUT[s.id];
      segs.push(hub[0], hub[1], hub[2], p[0], p[1], p[2]);
    });
    return new Float32Array(segs);
  }, []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.opacity = 0.12 + 0.06 * Math.sin(state.clock.elapsedTime * 0.8);
    }
  });

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        color="#6fe3ff"
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </lineSegments>
  );
}

export default function ServicesScene({ selectedId, onSelect, onHover }) {
  return (
    <SpaceCanvas
      camera={{ position: [0, 0.4, 10.5], fov: 50 }}
      stars={typeof window !== "undefined" && window.innerWidth < 768 ? 450 : 950}
      bloom={0.62}
    >
      <Spokes />

      {services.map((s, i) => (
        <ScenePlanet
          key={s.id}
          visual={s.visual}
          position={LAYOUT[s.id]}
          title={s.title}
          sub={s.blurb}
          hud="↗ click to open"
          selected={selectedId === s.id}
          dimmed={selectedId !== null && selectedId !== s.id}
          onSelect={() => onSelect(s.id)}
          onHover={(h) => onHover?.(h ? s.id : null)}
          invite
        />
      ))}

      <OrbitControls
        target={[0, 0, -4]}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={0.4}
        autoRotate
        autoRotateSpeed={0.28}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
      />
    </SpaceCanvas>
  );
}
