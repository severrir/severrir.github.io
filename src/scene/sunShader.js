import * as THREE from "three";

// Animated star-surface shader: churning granulation, darker sunspots and a
// brighter flare term. Deliberately kept around the same peak luminance as the
// old flat emissive core so it blooms the same and never blows the scene out.

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const noiseGLSL = /* glsl */ `
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  float fbm(vec3 p){
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 5; i++){ v += a * snoise(p); p *= 2.02; a *= 0.5; }
    return v;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform float uTime;
  uniform float uFlare;
  uniform vec3 uColorA; // deep ember
  uniform vec3 uColorB; // amber
  uniform vec3 uColorC; // white-gold

  ${noiseGLSL}

  void main() {
    vec3 d = vDir;

    // STYLIZED energy star (not photoreal granulation): large domain-warped
    // molten swirls flowing across the surface, a bright drifting hot core, and
    // a few glowing filaments — smooth, idealized, cinematic.
    float warp = fbm(d * 1.5 + vec3(0.0, uTime * 0.05, 0.0));
    float flow = fbm(d * 2.1 + vec3(warp) * 1.6 + vec3(0.0, 0.0, uTime * 0.07));

    // a hot pole that slowly drifts so the star always has a radiant centre
    vec3 hotDir = normalize(vec3(sin(uTime * 0.12) * 0.6, 0.5, cos(uTime * 0.12) * 0.6));
    float hot = smoothstep(0.1, 1.0, dot(d, hotDir));

    vec3 col = mix(uColorA, uColorB, smoothstep(-0.55, 0.6, flow));
    col = mix(col, uColorC, smoothstep(0.25, 0.9, flow * 0.55 + hot * 0.7));

    // glowing filaments — low-frequency so they read as energy ribbons, not grain
    float fil = smoothstep(0.55, 0.95, fbm(d * 3.2 + vec3(warp) * 2.2 - uTime * 0.09));
    col += uColorC * fil * 0.22;

    // gentle breathing + flare bursts
    col *= 0.9 + 0.1 * sin(uTime * 0.6);
    col += uColorC * uFlare * (0.4 + 0.6 * hot);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function makeSunMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFlare: { value: 0 },
      uColorA: { value: new THREE.Color("#ff7a1a") },
      uColorB: { value: new THREE.Color("#ffb84d") },
      uColorC: { value: new THREE.Color("#fff2d6") },
    },
    vertexShader,
    fragmentShader,
    toneMapped: false,
  });
}
