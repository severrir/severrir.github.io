import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { makePlanetMaterial } from "@/scene/planetShader.js";

const tmpVec = new THREE.Vector3();

// One orbiting planet = one project. The pivot group spins around the sun;
// the inner `anchor` group holds the planet so its world position can be
// sampled by the CameraRig for fly-to focus.
export default function Planet({ project, index, anchorRef, active, dimmed, hint, hintIntense, onSelect }) {
  const { camera, size, gl } = useThree();
  const pivot = useRef();
  const body = useRef();
  const ringRef = useRef();
  const moonPivot = useRef();
  const trailPivot = useRef();
  const punchAt = useRef(-10);
  const punchPending = useRef(false);
  const [hovered, setHovered] = useState(false);

  const v = project.visual;
  const { radius, speed, tilt, angle } = project.orbit;
  const material = useMemo(() => makePlanetMaterial(v), [v]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // smooth circular orbit + a gentle vertical bob so motion never feels robotic
    if (pivot.current) {
      pivot.current.rotation.y = angle + t * speed;
      pivot.current.position.y = Math.sin(t * speed * 1.6 + angle) * 0.35;
    }

    material.uniforms.uTime.value = t;

    if (punchPending.current) {
      punchAt.current = t;
      punchPending.current = false;
    }

    if (body.current) {
      body.current.rotation.y += delta * 0.28;

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
    }

    if (ringRef.current) ringRef.current.rotation.z += delta * 0.06;
    if (moonPivot.current) moonPivot.current.rotation.y += delta * 0.9;
    if (trailPivot.current) trailPivot.current.rotation.y -= delta * 1.4;
  });

  const handleClick = (e) => {
    e.stopPropagation();
    punchPending.current = true; // recorded in clock-time on next frame
    // project the planet to screen space so the card can grow out of it
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
    e.stopPropagation();
    setHovered(true);
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

        {/* outer atmosphere shell so the planet reads volumetric */}
        <mesh scale={1.22}>
          <sphereGeometry args={[v.size, 32, 32]} />
          <meshBasicMaterial
            color={ringColor}
            transparent
            opacity={hovered || active ? 0.18 : 0.1}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

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

        {/* particle trail — a small ring of orbiting emissive motes */}
        {v.trail && (
          <group ref={trailPivot}>
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k / 5) * Math.PI * 2;
              const r = v.size * 1.9;
              return (
                <mesh key={k} position={[Math.cos(a) * r, Math.sin(a) * 0.3, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.06 + 0.02 * (k % 2), 10, 10]} />
                  <meshBasicMaterial color={v.colorC} toneMapped={false} />
                </mesh>
              );
            })}
          </group>
        )}

        {/* onboarding cue — dual sonar-ping rings so a first-time visitor
            cannot miss that this object is clickable */}
        {hint && !active && (
          <Html center distanceFactor={22} position={[0, 0, 0]} zIndexRange={[3, 0]}>
            <div className="planet-hint-rings">
              <div className={`planet-hint-ring ${hintIntense ? "is-intense" : ""}`} />
              <div className={`planet-hint-ring planet-hint-ring--echo ${hintIntense ? "is-intense" : ""}`} />
            </div>
          </Html>
        )}

        {/* hover label */}
        {hovered && !active && (
          <Html center distanceFactor={26} position={[0, v.size + 1.3, 0]} zIndexRange={[5, 0]}>
            <div className="planet-label">
              <span className="planet-label__title">{project.title}</span>
              <span className="planet-label__sub">{project.blurb}</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
