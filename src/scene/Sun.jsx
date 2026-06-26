import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion, shake } from "@/scene/sceneEnv.js";
import { makeSunMaterial } from "@/scene/sunShader.js";
import { audio } from "@/audio/audioEngine.js";

const PCOUNT = 90;
const EXPLODE_DUR = 2.4;
const SPREAD = 34;

// The central star — a live plasma-surface shader + layered corona/halo +
// prominences. Click it (in the interactive overview) and it detonates: a bright
// flash, a blast of embers, a screen-shake + boom, then it re-ignites.
export default function Sun({ interactive, onBlackHole }) {
  const core = useRef();
  const corona = useRef();
  const halo = useRef();
  const prominences = useRef();
  const flash = useRef();
  const flashMat = useRef();
  const particles = useRef();
  const pMat = useRef();
  const reduced = useReducedMotion();

  const sunMat = useMemo(() => makeSunMaterial(), []);
  useEffect(() => () => sunMat.dispose(), [sunMat]);

  const nextFlare = useRef(4);
  const flareUntil = useRef(-1);
  const explodeAt = useRef(-100);
  const explodePending = useRef(false);
  const clicks = useRef(0);
  const bigPending = useRef(false); // next explosion is the supernova → black hole
  const bigActive = useRef(false);

  // ember directions + warm colours, baked once
  const burst = useMemo(() => {
    const dirs = new Float32Array(PCOUNT * 3);
    const colors = new Float32Array(PCOUNT * 3);
    const pal = ["#fff2d6", "#ffd27a", "#ffb84d", "#ff7a1a", "#ff5a2a"].map((c) => new THREE.Color(c));
    for (let i = 0; i < PCOUNT; i++) {
      const v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .normalize()
        .multiplyScalar(0.45 + Math.random() * 0.55);
      dirs[i * 3] = v.x;
      dirs[i * 3 + 1] = v.y;
      dirs[i * 3 + 2] = v.z;
      const c = pal[(Math.random() * pal.length) | 0];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { dirs, colors };
  }, []);
  const ppos = useMemo(() => new Float32Array(PCOUNT * 3), []);

  const onCoreClick = (e) => {
    if (!interactive) return;
    e.stopPropagation();
    explodePending.current = true;
    audio.explode();
    clicks.current += 1;
    // Third strike: the star goes supernova and collapses — the whole site gets
    // pulled into the singularity (the page-level cinematic runs via onBlackHole).
    if (clicks.current >= 3) {
      clicks.current = 0;
      bigPending.current = true;
      shake(2.8);
      onBlackHole?.();
    } else {
      shake(1.4);
    }
  };

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    sunMat.uniforms.uTime.value = reduced ? 12.0 : t;

    // ── explosion (runs regardless of reduced motion — it's user-triggered) ──
    if (explodePending.current) {
      explodeAt.current = t;
      explodePending.current = false;
      bigActive.current = bigPending.current;
      bigPending.current = false;
    }
    const since = t - explodeAt.current;
    const exploding = since >= 0 && since < EXPLODE_DUR;
    const bigMul = bigActive.current ? 1.9 : 1;

    let cs = 1;
    if (exploding) {
      if (since < 0.12) cs = 1 + (since / 0.12) * 0.7; // swell
      else if (since < 0.45) cs = 1.7 - ((since - 0.12) / 0.33) * 1.62; // collapse → 0.08
      else cs = 0.08 + (1 - Math.pow(1 - (since - 0.45) / 1.95, 3)) * 0.92; // re-ignite → 1
    }
    if (core.current) core.current.scale.setScalar(cs);

    if (flash.current) {
      if (exploding && since < 0.7) {
        flash.current.visible = true;
        const k = since / (bigActive.current ? 0.7 : 0.55);
        flash.current.scale.setScalar((3 + k * 15) * bigMul);
        if (flashMat.current) flashMat.current.opacity = (1 - k) * (bigActive.current ? 0.7 : 0.4);
      } else if (flash.current.visible) flash.current.visible = false;
    }

    if (particles.current) {
      if (exploding) {
        particles.current.visible = true;
        const e = 1 - Math.pow(1 - Math.min(1, since / 1.7), 2);
        for (let i = 0; i < PCOUNT; i++) {
          ppos[i * 3] = burst.dirs[i * 3] * SPREAD * bigMul * e;
          ppos[i * 3 + 1] = burst.dirs[i * 3 + 1] * SPREAD * bigMul * e;
          ppos[i * 3 + 2] = burst.dirs[i * 3 + 2] * SPREAD * bigMul * e;
        }
        particles.current.geometry.attributes.position.needsUpdate = true;
        if (pMat.current) pMat.current.opacity = 1 - Math.min(1, since / 2.2);
      } else if (particles.current.visible) particles.current.visible = false;
    }

    if (reduced) {
      sunMat.uniforms.uFlare.value = 0;
      return;
    }

    if (core.current) core.current.rotation.y += delta * 0.04;
    if (corona.current) {
      const flare = 1 + Math.sin(t * 0.8) * 0.02 + Math.sin(t * 2.7 + 1.3) * 0.012;
      corona.current.scale.setScalar(flare);
      corona.current.rotation.y -= delta * 0.05;
      corona.current.rotation.x += delta * 0.02;
    }
    if (halo.current) halo.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.025);
    if (prominences.current) {
      prominences.current.rotation.z += delta * 0.12;
      prominences.current.rotation.y += delta * 0.05;
    }

    if (t > nextFlare.current && flareUntil.current < 0) flareUntil.current = t + 1.6;
    if (flareUntil.current > 0) {
      const remain = flareUntil.current - t;
      const k = 1 - Math.abs(remain / 0.8 - 1);
      sunMat.uniforms.uFlare.value = Math.max(0, k) * 0.5;
      if (remain <= 0) {
        flareUntil.current = -1;
        nextFlare.current = t + 7 + Math.random() * 8;
      }
    }
  });

  return (
    <group>
      <pointLight intensity={4.0} distance={150} decay={1.3} color="#ffd9a0" />

      {/* hot core — live plasma surface, clickable to detonate */}
      <Sphere ref={core} args={[3.3, 96, 96]} material={sunMat} onClick={onCoreClick} />

      {/* corona shell */}
      <Sphere ref={corona} args={[3.8, 48, 48]}>
        <meshBasicMaterial
          color="#ffb84d"
          transparent
          opacity={0.4}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* outer atmospheric halo */}
      <Sphere ref={halo} args={[5.1, 32, 32]}>
        <meshBasicMaterial
          color="#ff7a1a"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </Sphere>

      {/* solar prominences */}
      <group ref={prominences}>
        {[
          [0, 0, 0],
          [1.1, 0.4, 0.6],
          [-0.7, 1.2, 2.1],
        ].map((rot, k) => (
          <mesh key={k} rotation={rot}>
            <torusGeometry args={[3.7 + k * 0.18, 0.05, 12, 64, Math.PI * (0.5 + k * 0.18)]} />
            <meshBasicMaterial
              color={k === 1 ? "#ffd27a" : "#ff9a3c"}
              transparent
              opacity={0.32}
              toneMapped={false}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* explosion flash */}
      <Sphere ref={flash} args={[1, 24, 24]} visible={false}>
        <meshBasicMaterial
          ref={flashMat}
          color="#fff2d6"
          transparent
          opacity={0}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      {/* explosion embers */}
      <points ref={particles} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PCOUNT} array={ppos} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={PCOUNT} array={burst.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial
          ref={pMat}
          size={0.5}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
