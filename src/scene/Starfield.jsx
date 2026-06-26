import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/scene/sceneEnv.js";

// A soft round sprite for each star. Without a map, three's pointsMaterial
// renders every point as a hard square (the default gl_PointCoord quad), which
// reads as stray grey boxes against the starfield. This radial-alpha texture
// turns each point into a soft circular dot.
function makeStarTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.85)");
  g.addColorStop(0.7, "rgba(255,255,255,0.18)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A faint, all-directions nebula painted onto an inverted skydome. Soft teal +
// warm blobs on a transparent field, blended additively so it only ever adds a
// whisper of colour to the void — never darkens it — and reads as deep galactic
// haze rather than flat black behind the system.
function makeNebulaTexture() {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  const blob = (x, y, r, color, alpha) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace(")", `,${alpha})`).replace("rgb", "rgba"));
    g.addColorStop(1, color.replace(")", ",0)").replace("rgb", "rgba"));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // a diagonal teal-dominant band with warm accents — a loose galactic streak
  const teal = "rgb(70,150,180)";
  const warm = "rgb(150,90,45)";
  const violet = "rgb(110,80,160)";
  blob(220, 300, 280, teal, 0.5);
  blob(420, 230, 240, violet, 0.32);
  blob(560, 280, 300, teal, 0.42);
  blob(720, 200, 220, warm, 0.3);
  blob(860, 300, 260, teal, 0.36);
  blob(120, 160, 200, violet, 0.24);
  blob(960, 120, 180, warm, 0.22);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// One instanced point layer. `near` layers use fewer, larger, brighter stars
// and rotate faster, so against the dim far layer they parallax as the scene
// turns — the void gains depth instead of reading as one flat shell.
function StarLayer({ count, rMin, rMax, size, opacity, rotSpeed, bright, tex }) {
  const ref = useRef();
  const matRef = useRef();
  const reduced = useReducedMotion();

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#cfe0ff"),
      new THREE.Color("#6fe3ff"),
      new THREE.Color("#ffd9a0"),
    ];
    for (let i = 0; i < count; i++) {
      const r = rMin + Math.random() * (rMax - rMin);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.6; // flatten vertically a touch
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const c = palette[Math.floor(Math.random() * palette.length)];
      const intensity = (bright ? 0.85 : 0.5) + Math.random() * (bright ? 0.6 : 0.5);
      colors[i * 3] = c.r * intensity;
      colors[i * 3 + 1] = c.g * intensity;
      colors[i * 3 + 2] = c.b * intensity;
    }
    return { positions, colors };
  }, [count, rMin, rMax, bright]);

  useFrame((state, delta) => {
    if (reduced) return;
    if (ref.current) ref.current.rotation.y += delta * rotSpeed;
    // bright layer shimmers gently so the foreground stars feel alive
    if (bright && matRef.current) {
      matRef.current.opacity = opacity * (0.82 + 0.18 * Math.sin(state.clock.elapsedTime * 1.6));
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        map={tex}
        alphaMap={tex}
        size={size}
        sizeAttenuation
        vertexColors
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Layered point starfield + nebula skydome. `count` is the total star budget
// (capped on small screens); it's split across a dim far field and a brighter,
// faster-parallaxing near field.
export default function Starfield({ count = 1800 }) {
  const starTexture = useMemo(() => makeStarTexture(), []);
  const nebulaTexture = useMemo(() => makeNebulaTexture(), []);
  const nebulaRef = useRef();
  const reduced = useReducedMotion();

  useEffect(() => {
    return () => {
      starTexture.dispose();
      nebulaTexture.dispose();
    };
  }, [starTexture, nebulaTexture]);

  useFrame((_, delta) => {
    if (nebulaRef.current && !reduced) nebulaRef.current.rotation.y += delta * 0.004;
  });

  const far = Math.round(count * 0.78);
  const near = Math.round(count * 0.22);

  return (
    <group>
      {/* nebula haze — all directions. Normal blending (not additive) so it can
          only ever tint the void with colour, never stack toward white or feed
          the bloom pass into a screen-wide blowout on real GPUs. */}
      <mesh ref={nebulaRef} rotation={[0, 0, 0.4]}>
        <sphereGeometry args={[320, 32, 32]} />
        <meshBasicMaterial
          map={nebulaTexture}
          side={THREE.BackSide}
          transparent
          opacity={0.32}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <StarLayer
        count={far}
        rMin={120}
        rMax={260}
        size={0.6}
        opacity={0.8}
        rotSpeed={0.006}
        bright={false}
        tex={starTexture}
      />
      <StarLayer
        count={near}
        rMin={60}
        rMax={110}
        size={1.4}
        opacity={0.95}
        rotSpeed={0.014}
        bright
        tex={starTexture}
      />
    </group>
  );
}
