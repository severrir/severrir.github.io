import * as THREE from "three";

// Pattern ids — keep in sync with the `pattern` field in data/projects.js.
export const PATTERN = {
  bands: 0, // gas-giant latitude bands (Modular Simulator)
  lava: 1, // cracked molten rock (Advanced Combat)
  circuit: 2, // dark surface w/ glowing circuit traces (AI Chatbot)
  ice: 3, // frosted crystalline blue-white (Penguin Game)
  marble: 4, // chaotic swirling multi-colour (Brainrot)
  shield: 5, // brushed steel + shield scanlines (Anticheat)
};

const vertexShader = /* glsl */ `
  varying vec3 vDir;       // unit-sphere surface direction (pattern domain)
  varying vec3 vNormalW;   // world-space normal (lighting)
  varying vec3 vWorldPos;  // world-space position (lighting)

  void main() {
    vDir = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// Ashima 3D simplex noise (public domain) + fbm.
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
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
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
    for(int i = 0; i < 5; i++){ v += a * snoise(p); p *= 2.03; a *= 0.5; }
    return v;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  varying vec3 vNormalW;
  varying vec3 vWorldPos;

  uniform float uTime;
  uniform float uHover;
  uniform int   uPattern;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorC;
  uniform vec3  uRimColor;
  uniform float uRimStrength;
  uniform float uRimPower;

  ${noiseGLSL}

  void main() {
    vec3 d = vDir;
    vec3 col = uColorA;
    vec3 emissive = vec3(0.0);

    if (uPattern == 0) {
      // BANDS — gas giant, with a faint quantized step so the latitude bands
      // read as discrete "progression tiers" rather than one smooth gradient
      float warp = fbm(d * 1.6 + vec3(0.0, 0.0, uTime * 0.04)) * 0.55;
      float band = sin((d.y * 9.0) + warp * 4.0);
      float t = smoothstep(-0.6, 0.6, band);
      float tiered = floor(t * 6.0) / 6.0;
      col = mix(uColorA, uColorB, mix(t, tiered, 0.4));
      float storm = smoothstep(0.55, 0.95, fbm(d * 3.0 + warp));
      col = mix(col, uColorC, storm * 0.7);
    } else if (uPattern == 1) {
      // LAVA — cracked molten rock with long dark battle-scar gouges
      float n = fbm(d * 3.2 + uTime * 0.03);
      col = mix(uColorA, uColorB, smoothstep(-0.4, 0.5, n));
      float crack = pow(smoothstep(0.30, 0.62, fbm(d * 5.5 - uTime * 0.06)), 1.6);
      float pulse = 0.65 + 0.35 * sin(uTime * 2.2 + n * 6.0);
      emissive += uColorC * crack * pulse * 1.4;
      float scar = smoothstep(0.86, 0.97, fbm(d * 8.5 + 4.1));
      col = mix(col, uColorA * 0.45, scar * 0.55);
    } else if (uPattern == 2) {
      // CIRCUIT — dark board w/ glowing traces + nodes
      vec3 q = d * 5.0;
      float lx = smoothstep(0.06, 0.0, abs(fract(q.x) - 0.5));
      float ly = smoothstep(0.06, 0.0, abs(fract(q.y) - 0.5));
      float lz = smoothstep(0.06, 0.0, abs(fract(q.z) - 0.5));
      float lines = clamp(lx + ly + lz, 0.0, 1.0);
      float region = smoothstep(0.30, 0.62, fbm(d * 2.2) * 0.5 + 0.5);
      lines *= 0.45 + 0.55 * region;
      float flow = 0.6 + 0.4 * sin(uTime * 3.0 + q.x * 2.0 + q.y);
      float node = clamp(lx * ly + ly * lz + lz * lx, 0.0, 1.0);
      col = mix(uColorA, uColorB, fbm(d * 5.0) * 0.5 + 0.5) + uColorB * 0.4;
      emissive += uColorC * lines * flow * 2.6;
      emissive += uColorC * node * 2.2;
    } else if (uPattern == 3) {
      // ICE — frosted crystalline shards (sharper facet edges than before)
      float n = fbm(d * 3.6);
      col = mix(uColorA, uColorB, smoothstep(0.0, 0.7, n));
      float facet = pow(abs(snoise(d * 7.0)), 0.3);
      col += uColorC * pow(facet, 5.5) * 1.0;
      float shardEdge = smoothstep(0.94, 1.0, facet);
      emissive += uColorC * shardEdge * 0.6;
      float sparkle = step(0.86, fbm(d * 14.0 + uTime * 0.2));
      emissive += uColorC * sparkle * 0.5;
    } else if (uPattern == 4) {
      // MARBLE — chaotic swirl
      float t1 = fbm(d * 2.2 + uTime * 0.05);
      float t2 = fbm(d * 3.4 + vec3(t1) * 1.8 - uTime * 0.04);
      col = mix(uColorA, uColorB, smoothstep(-0.4, 0.5, t1));
      col = mix(col, uColorC, smoothstep(0.0, 0.7, t2));
      emissive += col * 0.06 * (0.5 + 0.5 * sin(uTime * 1.5 + t2 * 8.0));
    } else {
      // SHIELD — brushed steel plates + faceting + one sweeping energy scan
      float plate = fbm(d * 3.0);
      col = mix(uColorA, uColorB, smoothstep(0.2, 0.7, plate));
      col *= 0.92 + 0.08 * sin(d.y * 120.0 + plate * 4.0); // fine brushed grain
      float facet = smoothstep(0.32, 0.0, abs(snoise(d * 6.0)));
      col = mix(col, uColorB * 1.35, facet * 0.35);        // angular steel facets
      // a single thin shield scan band sweeping pole-to-pole
      float sweep = smoothstep(0.05, 0.0, abs(fract(d.y * 1.5 - uTime * 0.22) - 0.5));
      emissive += uColorC * sweep * 0.7;
      emissive += uColorC * facet * 0.12;                  // faint edge energy
      // faint lat/long scanning-grid HUD overlay (coarser & calmer than the
      // AI Chatbot's dense circuit grid, reading as "armor diagnostics")
      float lon = atan(d.z, d.x);
      float lat = acos(clamp(d.y, -1.0, 1.0));
      float gx = smoothstep(0.965, 1.0, abs(sin(lon * 9.0)));
      float gy = smoothstep(0.965, 1.0, abs(sin(lat * 9.0)));
      emissive += uColorC * clamp(gx + gy, 0.0, 1.0) * 0.3;
    }

    // --- lighting (sun at world origin) ---
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(-vWorldPos);
    float diff = clamp(dot(N, L), 0.0, 1.0);
    float wrap = diff * 0.85 + 0.15; // soft terminator
    vec3 V = normalize(cameraPosition - vWorldPos);
    float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uRimPower);

    vec3 lit = col * (0.12 + wrap) + emissive;
    float rimPulse = 0.85 + 0.15 * sin(uTime * 1.6);
    lit += rim * uRimColor * uRimStrength * rimPulse;       // atmospheric rim
    lit += rim * diff * uRimColor * 0.25;                   // brighter sun-side rim

    // hover brighten + extra rim glow
    lit *= mix(1.0, 1.18, uHover);
    lit += rim * uRimColor * uHover * 0.5;

    gl_FragColor = vec4(lit, 1.0);
  }
`;

export function makePlanetUniforms(visual) {
  return {
    uTime: { value: Math.random() * 100 },
    uHover: { value: 0 },
    uPattern: { value: PATTERN[visual.pattern] ?? 0 },
    uColorA: { value: new THREE.Color(visual.colorA) },
    uColorB: { value: new THREE.Color(visual.colorB) },
    uColorC: { value: new THREE.Color(visual.colorC) },
    uRimColor: { value: new THREE.Color(visual.rimColor) },
    uRimStrength: { value: visual.rimStrength ?? 0.6 },
    uRimPower: { value: visual.rimPower ?? 2.5 },
  };
}

export function makePlanetMaterial(visual) {
  return new THREE.ShaderMaterial({
    uniforms: makePlanetUniforms(visual),
    vertexShader,
    fragmentShader,
  });
}

export { vertexShader as planetVertexShader, fragmentShader as planetFragmentShader };
