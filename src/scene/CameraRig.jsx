import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { INTERACTIVE_AT, stageProgress, sampleStage, stagesFor } from "@/scene/cameraStages.js";
import { pointer, activity, useReducedMotion } from "@/scene/sceneEnv.js";

const IDLE_MS = 30000; // ambient auto-orbit kicks in after this much true idle

// Three behaviours, chosen per-frame:
//   1. FOCUS     — a planet is selected: damped fly-to spring (Beat 3 only).
//   2. RETURN    — a card just closed: spring back to the overview pose.
//   3. FREE      — Beat 3, no selection: OrbitControls owns the camera.
//   4. CINEMATIC — Beats 1–2: camera is driven directly by scroll position.
export default function CameraRig({ controlsRef, anchorRefs, activeIndex, projects, playIntro }) {
  const { camera, size } = useThree();
  const reduced = useReducedMotion();
  const focusOffset = useRef(new THREE.Vector3());
  const planetWorld = useRef(new THREE.Vector3());
  const parallax = useRef(new THREE.Vector3());

  // Desktop vs. phone keyframe set, re-picked if the viewport crosses 768px.
  const stages = useMemo(() => stagesFor(size.width), [size.width]);

  const desiredPos = useRef(new THREE.Vector3().copy(stages.wide.pos));
  const desiredTarget = useRef(new THREE.Vector3().copy(stages.wide.target));

  // spring state
  const posVel = useRef(new THREE.Vector3());
  const targetVel = useRef(new THREE.Vector3());
  const accel = useRef(new THREE.Vector3());

  const returning = useRef(false);
  const prevActive = useRef(null);
  const shake = useRef(0); // brief camera impact when a planet is selected

  // One-time cinematic push-in from deep space into the Beat-1 wide pose.
  const INTRO_DUR = 3.2; // seconds
  const introT = useRef(0);
  const introDone = useRef(false);
  const introStart = useRef(new THREE.Vector3());
  const introTarget = useRef(new THREE.Vector3());
  useEffect(() => {
    // Start low and deep *inside* the star shell looking up at the plane, then
    // sweep up & push in to the wide shot as the wordmark resolves — stars
    // parallax outward and the sun rises from below the wordmark.
    introStart.current.set(stages.wide.pos.x, -8, stages.wide.pos.z * 1.9);
    introTarget.current.set(stages.wide.target.x * 0.3, -4, 0);
  }, [stages]);

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
      if (!reduced) shake.current = 1; // impact pop on arrival
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

    // Ease the smoothed pointer toward the raw pointer every frame so the
    // parallax lean glides instead of snapping. Frozen under reduced motion.
    if (reduced) {
      pointer.tx = 0;
      pointer.ty = 0;
    } else {
      pointer.tx += (pointer.x - pointer.tx) * 0.045;
      pointer.ty += (pointer.y - pointer.ty) * 0.045;
    }

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
      if (shake.current > 0) {
        const s = shake.current * shake.current * 0.5; // decays fast, eases out
        camera.position.x += (Math.random() - 0.5) * s;
        camera.position.y += (Math.random() - 0.5) * s;
        shake.current = Math.max(0, shake.current - dt * 4.5);
      }
      camera.lookAt(controls.target); // OrbitControls is off — re-aim ourselves
      return;
    }

    // 2. RETURN — fly back to the overview pose after a card closes.
    if (returning.current) {
      desiredPos.current.copy(stages.overview.pos);
      desiredTarget.current.copy(stages.overview.target);
      controls.enabled = false;
      controls.autoRotate = false;
      spring(camera.position, posVel.current, desiredPos.current, dt, 55, 14.6);
      spring(controls.target, targetVel.current, desiredTarget.current, dt, 70, 16.6);
      camera.lookAt(controls.target);
      if (
        camera.position.distanceTo(stages.overview.pos) < 0.4 &&
        controls.target.distanceTo(stages.overview.target) < 0.3
      ) {
        posVel.current.set(0, 0, 0);
        targetVel.current.set(0, 0, 0);
        returning.current = false;
      }
      return;
    }

    // 2.5 INTRO — one-time push-in from deep space on first load. Aborts the
    // moment the user scrolls so it never fights manual input.
    if (!introDone.current && !reduced) {
      if (p > 0.04) {
        introDone.current = true; // user scrolled — hand straight to cinematic
      } else {
        // Hold far back while the loader is still up; only advance the push-in
        // once the scene is revealed, so the whole move plays on-screen.
        if (playIntro) introT.current = Math.min(1, introT.current + dt / INTRO_DUR);
        const e = 1 - Math.pow(1 - introT.current, 3); // easeOutCubic
        sampleStage(0, desiredPos.current, desiredTarget.current, stages); // wide pose
        controls.enabled = false;
        controls.autoRotate = false;
        camera.position.copy(introStart.current).lerp(desiredPos.current, e);
        controls.target.copy(introTarget.current).lerp(desiredTarget.current, e);
        camera.lookAt(controls.target);
        if (introT.current >= 1) introDone.current = true;
        return;
      }
    }

    // 3. FREE — Beat 3 reached, no selection: hand the camera to OrbitControls.
    if (p >= INTERACTIVE_AT) {
      controls.enabled = true;
      controls.enableDamping = true;
      // Ambient auto-orbit only after a long idle, so the system never feels
      // dead but also never fights an active visitor. Off under reduced motion.
      const idle = performance.now() - activity.last > IDLE_MS;
      controls.autoRotate = !reduced && idle;
      controls.autoRotateSpeed = 0.25;
      return;
    }

    // 4. CINEMATIC — Beats 1–2: drive the camera straight from scroll position.
    // Lenis already smooths the scroll input; an extra lerp removes any residual
    // step and a slow sway keeps the wide shots from feeling dead.
    controls.enabled = false;
    controls.autoRotate = false;
    sampleStage(p, desiredPos.current, desiredTarget.current, stages);
    if (!reduced) {
      const sway = (1 - p) * 1.4; // strongest at the very top, fades toward Beat 3
      desiredPos.current.x += Math.sin(state.clock.elapsedTime * 0.12) * sway;
      desiredPos.current.y += Math.cos(state.clock.elapsedTime * 0.09) * sway * 0.4;
      // Pointer parallax — the system leans opposite the cursor for depth. Fades
      // out toward Beat 3 so it never disturbs the interactive framing.
      const lean = (1 - p) * 6;
      desiredPos.current.x -= pointer.tx * lean;
      desiredPos.current.y += pointer.ty * lean * 0.6;
    }
    camera.position.lerp(desiredPos.current, 0.12);
    controls.target.lerp(desiredTarget.current, 0.12);
    camera.lookAt(controls.target);
  });

  return null;
}
