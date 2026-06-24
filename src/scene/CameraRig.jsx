import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STAGE, INTERACTIVE_AT, stageProgress, sampleStage } from "@/scene/cameraStages.js";

// Three behaviours, chosen per-frame:
//   1. FOCUS     — a planet is selected: damped fly-to spring (Beat 3 only).
//   2. RETURN    — a card just closed: spring back to the overview pose.
//   3. FREE      — Beat 3, no selection: OrbitControls owns the camera.
//   4. CINEMATIC — Beats 1–2: camera is driven directly by scroll position.
export default function CameraRig({ controlsRef, anchorRefs, activeIndex, projects }) {
  const { camera } = useThree();
  const focusOffset = useRef(new THREE.Vector3());
  const planetWorld = useRef(new THREE.Vector3());

  const desiredPos = useRef(new THREE.Vector3().copy(STAGE.wide.pos));
  const desiredTarget = useRef(new THREE.Vector3().copy(STAGE.wide.target));

  // spring state
  const posVel = useRef(new THREE.Vector3());
  const targetVel = useRef(new THREE.Vector3());
  const accel = useRef(new THREE.Vector3());

  const returning = useRef(false);
  const prevActive = useRef(null);

  useEffect(() => {
    posVel.current.set(0, 0, 0);
    targetVel.current.set(0, 0, 0);

    // Kill OrbitControls' own damping inertia for the duration of any
    // programmatic move so it doesn't fight our spring.
    const controls = controlsRef.current;
    if (controls) controls.enableDamping = false;

    if (activeIndex !== null) {
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
      returning.current = false;
    } else if (prevActive.current !== null) {
      // closed a card — fly back to overview before handing control over
      returning.current = true;
    }
    prevActive.current = activeIndex;
  }, [activeIndex, anchorRefs, projects, controlsRef]);

  function spring(pos, vel, to, dt, stiffness, damping) {
    accel.current.copy(to).sub(pos).multiplyScalar(stiffness);
    accel.current.addScaledVector(vel, -damping);
    vel.addScaledVector(accel.current, dt);
    pos.addScaledVector(vel, dt);
  }

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(delta, 1 / 30);
    const p = stageProgress();

    // 1. FOCUS — a planet is selected.
    if (activeIndex !== null) {
      const anchor = anchorRefs.current[activeIndex]?.current;
      if (anchor) {
        anchor.getWorldPosition(planetWorld.current);
        desiredTarget.current.copy(planetWorld.current);
        desiredPos.current.copy(planetWorld.current).add(focusOffset.current);
      }
      controls.enabled = false;
      controls.autoRotate = false;
      spring(camera.position, posVel.current, desiredPos.current, dt, 55, 14.6);
      spring(controls.target, targetVel.current, desiredTarget.current, dt, 70, 16.6);
      camera.lookAt(controls.target); // OrbitControls is off — re-aim ourselves
      return;
    }

    // 2. RETURN — fly back to the overview pose after a card closes.
    if (returning.current) {
      desiredPos.current.copy(STAGE.overview.pos);
      desiredTarget.current.copy(STAGE.overview.target);
      controls.enabled = false;
      controls.autoRotate = false;
      spring(camera.position, posVel.current, desiredPos.current, dt, 55, 14.6);
      spring(controls.target, targetVel.current, desiredTarget.current, dt, 70, 16.6);
      camera.lookAt(controls.target);
      if (
        camera.position.distanceTo(STAGE.overview.pos) < 0.4 &&
        controls.target.distanceTo(STAGE.overview.target) < 0.3
      ) {
        posVel.current.set(0, 0, 0);
        targetVel.current.set(0, 0, 0);
        returning.current = false;
      }
      return;
    }

    // 3. FREE — Beat 3 reached, no selection: hand the camera to OrbitControls.
    if (p >= INTERACTIVE_AT) {
      controls.enabled = true;
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      return;
    }

    // 4. CINEMATIC — Beats 1–2: drive the camera straight from scroll position.
    // Lenis already smooths the scroll input; an extra lerp removes any residual
    // step and a slow sway keeps the wide shots from feeling dead.
    controls.enabled = false;
    controls.autoRotate = false;
    sampleStage(p, desiredPos.current, desiredTarget.current);
    const sway = (1 - p) * 1.4; // strongest at the very top, fades toward Beat 3
    desiredPos.current.x += Math.sin(state.clock.elapsedTime * 0.12) * sway;
    desiredPos.current.y += Math.cos(state.clock.elapsedTime * 0.09) * sway * 0.4;
    camera.position.lerp(desiredPos.current, 0.12);
    controls.target.lerp(desiredTarget.current, 0.12);
    camera.lookAt(controls.target);
  });

  return null;
}
