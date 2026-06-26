import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";
import { useReducedMotion } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

// A single interactive planet placed at a fixed point inside a shared canvas
// (no orbit pivot — that's the homepage's solar-system motif). Same shader,
// rim glow and atmosphere shell as the project planets, so it reads as the same
// universe; the distinct arrangement is what keeps the Services scene from
// feeling like a duplicate of the homepage. Hover brightens + lifts, click
// selects. One material per planet, disposed on unmount so a session of
// hovering/navigating never leaks GPU programs.
export default function ScenePlanet({
  visual,
  position,
  title,
  sub,
  hud,
  selected = false,
  dimmed = false,
  onSelect,
  onHover,
  interactive = true,
  spin = 0.3,
  bob = 0.18,
}) {
  const { camera, gl } = useThree();
  const reduced = useReducedMotion();
  const group = useRef();
  const body = useRef();
  const ringRef = useRef();
  const moonPivot = useRef();
  const scanFace = useRef();
  const scanSpin = useRef();
  const scanMat = useRef();
  const punchAt = useRef(-10);
  const punchPending = useRef(false);
  const [hovered, setHovered] = useState(false);
  const seed = useMemo(() => Math.random() * 10, []);

  const material = useMemo(() => makePlanetMaterial(visual), [visual]);
  useEffect(() => () => material.dispose(), [material]);

  const size = visual.size ?? 1;
  const rim = visual.rimColor;

  const coarse = useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches,
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    material.uniforms.uTime.value = t;

    if (group.current && !reduced) {
      group.current.position.y = position[1] + Math.sin(t * 0.6 + seed) * bob;
    }

    if (punchPending.current) {
      punchAt.current = t;
      punchPending.current = false;
    }

    if (body.current) {
      if (!reduced) body.current.rotation.y += dt * spin;
      const punchActive = t - punchAt.current < 0.4;
      const hoverTarget = hovered || punchActive ? 1 : 0;
      material.uniforms.uHover.value = THREE.MathUtils.lerp(
        material.uniforms.uHover.value,
        hoverTarget,
        0.15
      );

      let target = selected ? 1.22 : hovered ? 1.12 : dimmed ? 0.82 : 1;
      let s = THREE.MathUtils.lerp(body.current.scale.x, target, 0.12);
      const since = t - punchAt.current;
      if (since >= 0 && since < 0.4) {
        s += Math.sin((since / 0.4) * Math.PI) * 0.2 * (1 - since / 0.4);
      }
      body.current.scale.setScalar(s);
    }

    if (ringRef.current && !reduced) ringRef.current.rotation.z += dt * 0.06;
    if (moonPivot.current && !reduced) moonPivot.current.rotation.y += dt * 0.9;

    if (scanFace.current) {
      scanFace.current.lookAt(camera.position);
      const op = scanMat.current ? scanMat.current.opacity : 0;
      const targetOp = hovered && !selected ? 0.6 : 0;
      if (scanMat.current) scanMat.current.opacity = THREE.MathUtils.lerp(op, targetOp, 0.18);
      scanFace.current.visible = (scanMat.current?.opacity ?? 0) > 0.012;
      if (scanSpin.current && !reduced) scanSpin.current.rotation.z += dt * 0.7;
    }
  });

  const enter = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    setHovered(true);
    audio.hover();
    onHover?.(true);
    gl.domElement.style.cursor = "pointer";
  };
  const leave = (e) => {
    e.stopPropagation();
    setHovered(false);
    onHover?.(false);
    gl.domElement.style.cursor = "";
  };
  const click = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    punchPending.current = true;
    onSelect?.();
  };

  const labelOn = !selected && (hovered || !dimmed);

  return (
    <group ref={group} position={position}>
      <mesh
        ref={body}
        material={material}
        onClick={click}
        onPointerOver={enter}
        onPointerOut={leave}
      >
        <sphereGeometry args={[size, 64, 64]} />
      </mesh>

      {/* oversized invisible tap target on touch devices */}
      {coarse && (
        <mesh onClick={click} onPointerOver={enter} onPointerOut={leave}>
          <sphereGeometry args={[Math.max(size * 2.2, 2.2), 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {/* atmosphere shell */}
      <mesh scale={1.22}>
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial
          color={rim}
          transparent
          opacity={hovered || selected ? 0.22 : 0.11}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* HUD scan ring on hover */}
      <group ref={scanFace} visible={false}>
        <group ref={scanSpin}>
          <mesh>
            <ringGeometry args={[size * 1.45, size * 1.57, 64]} />
            <meshBasicMaterial
              ref={scanMat}
              color={rim}
              transparent
              opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[size * 1.45, size * 1.62, 32, 1, 0, Math.PI * 0.5]} />
            <meshBasicMaterial
              color={visual.colorC}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>

      {/* gas-giant ring system */}
      {visual.rings && (
        <group ref={ringRef} rotation={[Math.PI / 2.2, 0.2, 0]}>
          <mesh>
            <ringGeometry args={[size * 1.55, size * 2.05, 96]} />
            <meshBasicMaterial
              color={rim}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[size * 2.18, size * 2.45, 96]} />
            <meshBasicMaterial
              color={visual.colorC}
              transparent
              opacity={0.28}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* orbiting moon */}
      {visual.moon && (
        <group ref={moonPivot} rotation={[0.4, 0, 0]}>
          <mesh position={[size * 2.0, 0, 0]}>
            <sphereGeometry args={[size * 0.22, 24, 24]} />
            <meshStandardMaterial color="#cfe8e5" roughness={0.7} metalness={0.2} />
          </mesh>
        </group>
      )}

      {/* name label — quiet by default, brightens + reveals blurb on hover.
          Skipped entirely for decorative background planets (no title). */}
      {title && (
        <Html center distanceFactor={18} position={[0, size + 1.15, 0]} zIndexRange={[5, 0]}>
          <div className={`planet-label ${labelOn ? "is-visible" : ""} ${hovered ? "is-hover" : ""}`}>
            <span className="planet-label__title">{title}</span>
            {sub && <span className="planet-label__sub">{sub}</span>}
            {hud && <span className="planet-label__hud">{hud}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
