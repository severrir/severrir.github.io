import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";
import { useReducedMotion, interaction } from "@/scene/sceneEnv.js";
import { audio } from "@/audio/audioEngine.js";

const tmpVec = new THREE.Vector3();

// One orbiting planet = one project. The pivot group spins around the sun;
// the inner `anchor` group holds the planet so its world position can be
// sampled by the CameraRig for fly-to focus.
export default function Planet({ project, index, anchorRef, active, dimmed, onSelect, interactive }) {
  const { camera, size, gl } = useThree();
  const reduced = useReducedMotion();
  const pivot = useRef();
  const body = useRef();
  const ringRef = useRef();
  const moonPivot = useRef();
  const scanFace = useRef(); // camera-facing group for the HUD scan ring
  const scanSpin = useRef(); // spinning child inside it
  const scanMat = useRef();
  const punchAt = useRef(-10);
  const punchPending = useRef(false);
  const phase = useRef(project.orbit.angle); // accumulated orbit angle (pausable)
  const [hovered, setHovered] = useState(false);
  const [labelMounted, setLabelMounted] = useState(false);
  const labelTimer = useRef();

  const v = project.visual;
  const { radius, speed, tilt, angle } = project.orbit;
  const material = useMemo(() => makePlanetMaterial(v), [v]);

  // Coarse pointer (touch) → mount an oversized invisible hit sphere so the
  // small, moving planets are easy to tap with a thumb.
  const coarse = useMemo(
    () => typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches,
    []
  );

  // Comet trail — a short arc of fading motes trailing the planet along its lane.
  // Built once in pivot space (so it rides with the planet) with per-mote colour
  // baked to fade toward the tail.
  const trail = useMemo(() => {
    const M = 18;
    const pos = new Float32Array(M * 3);
    const col = new Float32Array(M * 3);
    const c = new THREE.Color(v.colorC);
    for (let k = 0; k < M; k++) {
      const a = (k / (M - 1)) * 0.5; // radians behind the planet
      pos[k * 3] = Math.cos(a) * radius;
      pos[k * 3 + 1] = 0;
      pos[k * 3 + 2] = Math.sin(a) * radius;
      const f = 1 - k / (M - 1); // 1 at head → 0 at tail
      col[k * 3] = c.r * f;
      col[k * 3 + 1] = c.g * f;
      col[k * 3 + 2] = c.b * f;
    }
    return { pos, col, M };
  }, [v.colorC, radius]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 30);
    const frozen = reduced || interaction.touchPaused;

    // Accumulated orbit so it can pause/freeze cleanly (never derived from the
    // absolute clock, which couldn't be paused without a jump).
    if (!frozen) phase.current += dt * speed;
    if (pivot.current) {
      pivot.current.rotation.y = phase.current;
      // gentle precession + vertical bob so motion reads organic, not mechanical
      pivot.current.rotation.x = tilt + (reduced ? 0 : Math.sin(phase.current * 0.7 + angle) * 0.015);
      pivot.current.position.y = reduced ? 0 : Math.sin(phase.current * 1.6 + angle) * 0.35;
    }

    material.uniforms.uTime.value = t;

    if (punchPending.current) {
      punchAt.current = t;
      punchPending.current = false;
    }

    if (body.current) {
      if (!reduced) body.current.rotation.y += dt * 0.28;

      const punchActive = t - punchAt.current < 0.4;
      const hoverTarget = hovered || punchActive ? 1 : 0;
      material.uniforms.uHover.value = THREE.MathUtils.lerp(
        material.uniforms.uHover.value,
        hoverTarget,
        0.15
      );

      let target = active ? 1.28 : hovered ? 1.12 : dimmed ? 0.9 : 1;
      let s = THREE.MathUtils.lerp(body.current.scale.x, target, 0.12);
      const since = t - punchAt.current;
      if (since >= 0 && since < 0.4) {
        s += Math.sin((since / 0.4) * Math.PI) * 0.22 * (1 - since / 0.4);
      }
      body.current.scale.setScalar(s);

      // subtle hover lift toward the viewer
      const liftTarget = hovered && !active ? v.size * 0.35 : 0;
      body.current.position.y = THREE.MathUtils.lerp(body.current.position.y, liftTarget, 0.12);
    }

    if (ringRef.current && !reduced) ringRef.current.rotation.z += dt * 0.06;
    if (moonPivot.current && !reduced) moonPivot.current.rotation.y += dt * 0.9;

    // HUD scan ring: face the camera, spin, and fade in on hover.
    if (scanFace.current) {
      scanFace.current.lookAt(camera.position);
      const op = scanMat.current ? scanMat.current.opacity : 0;
      const targetOp = hovered && !active ? 0.65 : 0;
      if (scanMat.current) scanMat.current.opacity = THREE.MathUtils.lerp(op, targetOp, 0.18);
      scanFace.current.visible = (scanMat.current?.opacity ?? 0) > 0.012;
      if (scanSpin.current && !reduced) scanSpin.current.rotation.z += dt * 0.7;
    }
  });

  // Persistent name in the interactive overview (no card open) so a first-time
  // visitor immediately sees six *named* projects, not six dots. Hover layers
  // the blurb + HUD readout on top and brightens it.
  const overviewLabel = interactive && !active && !dimmed;
  const labelOn = overviewLabel || (hovered && !active);
  useEffect(() => {
    if (labelOn) {
      clearTimeout(labelTimer.current);
      setLabelMounted(true);
    } else if (labelMounted) {
      labelTimer.current = setTimeout(() => setLabelMounted(false), 240);
    }
    return () => clearTimeout(labelTimer.current);
  }, [labelOn, labelMounted]);

  const handleClick = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    punchPending.current = true;
    const anchor = anchorRef.current;
    let origin = null;
    if (anchor) {
      anchor.getWorldPosition(tmpVec).project(camera);
      origin = {
        x: (tmpVec.x * 0.5 + 0.5) * size.width,
        y: (-tmpVec.y * 0.5 + 0.5) * size.height,
      };
    }
    onSelect(index, origin);
  };

  const enter = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    setHovered(true);
    audio.hover();
    gl.domElement.style.cursor = "pointer";
  };
  const leave = (e) => {
    e.stopPropagation();
    setHovered(false);
    gl.domElement.style.cursor = "";
  };

  const ringColor = v.rimColor;

  return (
    <group ref={pivot} rotation={[tilt, 0, 0]}>
      {/* comet trail (in pivot space so it trails along the orbit) */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={trail.M} array={trail.pos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={trail.M} array={trail.col} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          size={0.55}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <group ref={anchorRef} position={[radius, 0, 0]}>
        <mesh
          ref={body}
          material={material}
          onClick={handleClick}
          onPointerOver={enter}
          onPointerOut={leave}
        >
          <sphereGeometry args={[v.size, 64, 64]} />
        </mesh>

        {/* oversized invisible tap target on touch devices */}
        {coarse && (
          <mesh onClick={handleClick} onPointerOver={enter} onPointerOut={leave}>
            <sphereGeometry args={[Math.max(v.size * 2.4, 2.4), 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}

        {/* outer atmosphere shell so the planet reads volumetric */}
        <mesh scale={1.22}>
          <sphereGeometry args={[v.size, 32, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={hovered || active ? 0.2 : 0.11}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* HUD scan ring — sci-fi highlight that faces the camera on hover */}
        <group ref={scanFace} visible={false}>
          <group ref={scanSpin}>
            <mesh>
              <ringGeometry args={[v.size * 1.5, v.size * 1.62, 64]} />
              <meshBasicMaterial
                ref={scanMat}
                color={ringColor}
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
            {/* a short bright arc that orbits the ring for the "scanning" read */}
            <mesh>
              <ringGeometry args={[v.size * 1.5, v.size * 1.66, 32, 1, 0, Math.PI * 0.5]} />
              <meshBasicMaterial
                color={v.colorC}
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
        {v.rings && (
          <group ref={ringRef} rotation={[Math.PI / 2.2, 0.2, 0]}>
            <mesh>
              <ringGeometry args={[v.size * 1.55, v.size * 2.05, 96]} />
              <meshBasicMaterial
                color={ringColor}
                transparent
                opacity={0.4}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <ringGeometry args={[v.size * 2.18, v.size * 2.45, 96]} />
              <meshBasicMaterial
                color={v.colorC}
                transparent
                opacity={0.28}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </group>
        )}

        {/* orbiting moon */}
        {v.moon && (
          <group ref={moonPivot} rotation={[0.4, 0, 0]}>
            <mesh position={[v.size * 2.1, 0, 0]}>
              <sphereGeometry args={[v.size * 0.22, 24, 24]} />
              <meshStandardMaterial color="#cfe8e5" roughness={0.7} metalness={0.2} />
            </mesh>
          </group>
        )}

        {/* hover / overview label — names the project, with a HUD readout on hover */}
        {labelMounted && (
          <Html center distanceFactor={26} position={[0, v.size + 1.3, 0]} zIndexRange={[5, 0]}>
            <div
              className={`planet-label ${labelOn ? "is-visible" : ""} ${hovered ? "is-hover" : ""}`}
            >
              <span className="planet-label__title">{project.title}</span>
              <span className="planet-label__sub">{project.blurb}</span>
              <span className="planet-label__hud">
                SYS 0{index + 1} · ORBIT R{Math.round(radius)}
              </span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
