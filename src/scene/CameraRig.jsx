import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const OVERVIEW_POS = new THREE.Vector3(0, 17, 46);
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, 0);

// Drives cinematic fly-to-planet moves with a damped spring (slight overshoot
// then settle). While focused, OrbitControls input is disabled; at rest the
// controls take over and slowly auto-rotate so the system never sits frozen.
export default function CameraRig({ controlsRef, anchorRefs, activeIndex, projects }) {
  const { camera } = useThree();
  const mode = useRef("free"); // 'focus' | 'return' | 'free'
  const focusOffset = useRef(new THREE.Vector3());

  const desiredPos = useRef(new THREE.Vector3().copy(OVERVIEW_POS));
  const desiredTarget = useRef(new THREE.Vector3().copy(OVERVIEW_TARGET));
  const planetWorld = useRef(new THREE.Vector3());

  // spring state
  const posVel = useRef(new THREE.Vector3());
  const targetVel = useRef(new THREE.Vector3());
  const accel = useRef(new THREE.Vector3());

  useEffect(() => {
    posVel.current.set(0, 0, 0);
    targetVel.current.set(0, 0, 0);

    // OrbitControls keeps decaying its own damping inertia every update()
    // call regardless of `enabled` — if the user was mid-drag right before
    // clicking, that leftover momentum gets added on top of our spring and
    // shows up as a stutter/fight. Killing damping for the duration of the
    // programmatic move makes OrbitControls zero that inertia instantly.
    const controls = controlsRef.current;
    if (controls) controls.enableDamping = false;

    if (activeIndex !== null) {
      mode.current = "focus";
      const anchor = anchorRefs.current[activeIndex]?.current;
      const sizeV = projects[activeIndex].visual.size;
      if (anchor) {
        anchor.getWorldPosition(planetWorld.current);
        const dir = planetWorld.current.clone();
        if (dir.lengthSq() < 0.001) dir.set(1, 0, 0);
        dir.normalize();
        focusOffset.current
          .copy(dir)
          .multiplyScalar(sizeV * 4.2 + 6)
          .add(new THREE.Vector3(0, sizeV * 2 + 2.2, 0));
      }
    } else {
      mode.current = "return";
    }
  }, [activeIndex, anchorRefs, projects, controlsRef]);

  // semi-implicit damped-spring step toward `to`
  function spring(pos, vel, to, dt, stiffness, damping) {
    accel.current.copy(to).sub(pos).multiplyScalar(stiffness);
    accel.current.addScaledVector(vel, -damping);
    vel.addScaledVector(accel.current, dt);
    pos.addScaledVector(vel, dt);
  }

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(delta, 1 / 30);

    if (mode.current === "focus" && activeIndex !== null) {
      const anchor = anchorRefs.current[activeIndex]?.current;
      if (anchor) {
        anchor.getWorldPosition(planetWorld.current);
        desiredTarget.current.copy(planetWorld.current);
        desiredPos.current.copy(planetWorld.current).add(focusOffset.current);
      }
      controls.enabled = false;
      controls.autoRotate = false;
    } else if (mode.current === "return") {
      desiredPos.current.copy(OVERVIEW_POS);
      desiredTarget.current.copy(OVERVIEW_TARGET);
      controls.enabled = false;
      controls.autoRotate = false;
      if (
        camera.position.distanceTo(OVERVIEW_POS) < 0.5 &&
        controls.target.distanceTo(OVERVIEW_TARGET) < 0.5
      ) {
        mode.current = "free";
      }
    } else {
      // free: user owns the camera; slow ambient drift keeps it alive.
      // Re-enable damping only now that the programmatic move is over, so
      // OrbitControls doesn't carry stale inertia into the handoff.
      controls.enabled = true;
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      return;
    }

    // underdamped position spring => overshoot + settle; target a touch stiffer
    spring(camera.position, posVel.current, desiredPos.current, dt, 55, 12.5);
    spring(controls.target, targetVel.current, desiredTarget.current, dt, 72, 17);
  });

  return null;
}
