"use strict";
// Alpenfestival Schweiz – ein kleines Open-World-Rennspiel in den Schweizer Alpen.
// Alles (Landschaft, Straßen, Bäume, Autos) wird per Code erzeugt – es gibt keine Bilddateien.
//
// Inhalt:
//   1. Hilfsfunktionen & Spielstand
//   2. Landschaft (Höhenfunktion)
//   3. Straßen
//   4. Szene, Licht, Himmel
//   5. Welt-Objekte (Gelände, Wasser, Bäume, Häuser, Festival)
//   6. Events (Rennen, Blitzer, Driftzone)
//   7. Spieler-Auto & Fahrphysik
//   8. KI-Fahrer
//   9. Skill-Ketten
//  10. Rennen
//  11. Kamera, Effekte, Ton
//  12. HUD & Menüs
//  13. Eingabe & Spielschleife

// =====================================================================
// 1. Hilfsfunktionen & Spielstand
// =====================================================================
const WORLD = 1600;          // Kantenlänge der Welt in Metern
const HALF = WORLD / 2;
const WATER = -6;            // Höhe des Wasserspiegels
const ROAD_W = 12;           // Straßenbreite
const GRAVITY = 25;          // etwas stärker als echt – fühlt sich besser an
const SRGB = THREE.SRGBColorSpace;

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function smoothstep(e0, e1, x) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}
function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
const fmt = (n) => Math.round(n).toLocaleString("de-CH");
const kmh = (ms) => ms * 3.6;
function fmtTime(t) {
  const m = Math.floor(t / 60);
  return `${m}:${(t - m * 60).toFixed(2).padStart(5, "0")}`;
}
// Zufallszahlen mit festem Startwert -> die Welt sieht jedes Mal gleich aus
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(1234);

function loadSave() {
  try { return JSON.parse(localStorage.getItem("alpenfestival") || "{}"); } catch { return {}; }
}
const save = Object.assign(
  { credits: 0, skillPoints: 0, wins: 0, races: 0, bestRace: null, traps: {}, bestDrift: 0, car: "dakar", tuning: {}, bonus: false },
  loadSave()
);
function storeSave() {
  try { localStorage.setItem("alpenfestival", JSON.stringify(save)); } catch { /* egal */ }
}

// =====================================================================
// 2. Landschaft
// =====================================================================
const LAKE = { x: 300, z: 120, r: 120 };

// Rauschen ("value noise"): gibt natürlich wirkende, zufällige Formen
function hash2(x, z) {
  let h = (Math.imul(x, 374761393) + Math.imul(z, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v) * 2 - 1;
}
// Mehrere Rausch-Schichten übereinander (grob + fein)
function fbm(x, z, octaves) {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { sum += amp * vnoise(x * f, z * f); f *= 2.03; amp *= 0.5; }
  return sum;
}
// Wie fbm, aber mit scharfen Graten – perfekt für Berge
function ridged(x, z, octaves) {
  let sum = 0, amp = 0.5, f = 1;
  for (let i = 0; i < octaves; i++) { const n = 1 - Math.abs(vnoise(x * f, z * f)); sum += amp * n * n; f *= 2.03; amp *= 0.5; }
  return sum;
}

// Grosse, sanfte Hügel + See + Alpen am Rand. Straßen folgen dieser Höhe.
function baseHeight(x, z) {
  let h = 6 + Math.sin(x * 0.0045 + 0.5) * Math.cos(z * 0.0042) * 18;
  const dl = (x - LAKE.x) ** 2 + (z - LAKE.z) ** 2;
  h -= 45 * Math.exp(-dl / (LAKE.r * LAKE.r));
  const d = Math.max(Math.abs(x), Math.abs(z)) / HALF;
  const m = Math.max(0, (d - 0.72) / 0.28);
  h += m * m * (140 + 260 * ridged(x * 0.005 + 7, z * 0.005 + 3, 4));
  return h;
}
// Kleine Unebenheiten – nur abseits der Straßen
function detailHeight(x, z) {
  return fbm(x * 0.009, z * 0.009, 4) * 16 + fbm(x * 0.06, z * 0.06, 2) * 1.2;
}
function roadHeight(x, z) {
  return Math.max(WATER + 1.5, baseHeight(x, z));
}
// Bodenhöhe an jeder Stelle: in Straßennähe wird das Gelände eingeebnet
function groundHeight(x, z, road = nearestRoad(x, z)) {
  const terrain = baseHeight(x, z) + detailHeight(x, z);
  if (!road) return terrain;
  const w = 1 - smoothstep(ROAD_W / 2 + 4, ROAD_W / 2 + 30, road.dist);
  return lerp(terrain, roadHeight(x, z), w);
}
// Höhe, auf der ein Auto steht (im Wasser sinkt es etwas ein)
function driveHeight(x, z) {
  return Math.max(groundHeight(x, z), WATER - 0.9);
}

// =====================================================================
// 3. Straßen
// =====================================================================
const ROAD_DEFS = [
  { name: "Seeländer Ring", closed: true, pts: [[-520, -470], [-150, -560], [250, -540], [560, -380], [600, -20], [520, 330], [260, 540], [-120, 500], [-420, 560], [-600, 260], [-610, -120]] },
  { name: "Seeuferstrasse", closed: true, pts: [[-250, -250], [60, -330], [330, -200], [420, 60], [300, 260], [80, 230], [-150, 320], [-330, 80]] },
  { name: "Waldstrasse", closed: false, pts: [[-610, -120], [-430, -185], [-250, -250]] },
  { name: "Gotthardpässli", closed: false, pts: [[300, 260], [330, 420], [260, 540]] },
];

const roads = ROAD_DEFS.map((def, id) => {
  const curve = new THREE.CatmullRomCurve3(def.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), def.closed, "centripetal");
  const length = curve.getLength();
  const segs = Math.round(length / 2);
  const pts = curve.getSpacedPoints(segs);
  if (def.closed) pts.pop();
  const n = pts.length;
  const samples = pts.map((p, i) => ({ x: p.x, z: p.z, tx: 0, tz: 1, road: id, i }));
  for (let i = 0; i < n; i++) {
    const a = samples[def.closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = samples[def.closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    samples[i].tx = (b.x - a.x) / len;
    samples[i].tz = (b.z - a.z) / len;
  }
  // Krümmung (für die KI: wie stark muss vor einer Kurve gebremst werden?)
  const curv = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = samples[def.closed ? (i - 3 + n) % n : Math.max(0, i - 3)];
    const b = samples[def.closed ? (i + 3) % n : Math.min(n - 1, i + 3)];
    curv[i] = Math.abs(angleDiff(Math.atan2(a.tx, a.tz), Math.atan2(b.tx, b.tz))) / (6 * length / segs);
  }
  return { id, name: def.name, closed: def.closed, samples, n, length, spacing: length / segs, curv };
});

// Raster, damit wir schnell den nächsten Straßenpunkt finden
const ROAD_CELL = 36;
const roadGrid = new Map();
const cellKey = (ix, iz) => ix * 10000 + iz;
for (const r of roads) for (const s of r.samples) {
  const k = cellKey(Math.floor(s.x / ROAD_CELL), Math.floor(s.z / ROAD_CELL));
  if (!roadGrid.has(k)) roadGrid.set(k, []);
  roadGrid.get(k).push(s);
}
function nearestRoad(x, z) {
  const cx = Math.floor(x / ROAD_CELL), cz = Math.floor(z / ROAD_CELL);
  let best = null, bd = Infinity;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const list = roadGrid.get(cellKey(cx + dx, cz + dz));
    if (!list) continue;
    for (const s of list) {
      const d = (s.x - x) ** 2 + (s.z - z) ** 2;
      if (d < bd) { bd = d; best = s; }
    }
  }
  if (!best) return null;
  // Abstand senkrecht zur Straße (genauer als der Abstand zum Punkt)
  const ox = x - best.x, oz = z - best.z;
  const along = ox * best.tx + oz * best.tz;
  const perp = Math.abs(ox * best.tz - oz * best.tx);
  const dist = Math.abs(along) <= 1.5 ? perp : Math.sqrt(bd);
  return { s: best, dist };
}
// Punkt auf einer Straße nach gefahrener Strecke s (in Metern)
function roadPointAt(road, s) {
  if (road.closed) s = ((s % road.length) + road.length) % road.length;
  else s = clamp(s, 0, road.length - 0.01);
  const f = s / road.spacing;
  const i = Math.floor(f) % road.n;
  const j = road.closed ? (i + 1) % road.n : Math.min(road.n - 1, i + 1);
  const t = f - Math.floor(f);
  const a = road.samples[i], b = road.samples[j];
  const tx = lerp(a.tx, b.tx, t), tz = lerp(a.tz, b.tz, t);
  const l = Math.hypot(tx, tz) || 1;
  const p = { x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t), tx: tx / l, tz: tz / l };
  p.lx = p.tz; p.lz = -p.tx;            // Vektor nach links
  p.yaw = Math.atan2(p.tx, p.tz);
  return p;
}

// =====================================================================
// 4. Szene, Licht, Himmel
// =====================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.58;
document.body.prepend(renderer.domElement);
const ANISO = renderer.capabilities.getMaxAnisotropy();

// Höhennebel: in Tälern dichter, in der Höhe dünner, und in Richtung Sonne
// warm aufgehellt (wie Dunst an einem Sommertag). Dafür ersetzen wir die
// Nebel-Bausteine (Shader-Chunks) von three.js durch eigene.
const FOG_DENSITY = 0.00038, FOG_FALLOFF = 0.0055;
const SUN_DIR = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 30), THREE.MathUtils.degToRad(145));
{
  const f = (v) => v.toFixed(6);
  THREE.ShaderChunk.fog_pars_vertex = "#ifdef USE_FOG\n varying vec3 vFogWorld;\n#endif";
  THREE.ShaderChunk.fog_vertex = "#ifdef USE_FOG\n vFogWorld = transpose(mat3(viewMatrix)) * (mvPosition.xyz - viewMatrix[3].xyz);\n#endif";
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor;
  varying vec3 vFogWorld;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
  vec3 fogRay = vFogWorld - cameraPosition;
  float fogDist = length(fogRay);
  float fogDy = fogRay.y;
  float fogBase = ${f(FOG_DENSITY)} * exp(-${f(FOG_FALLOFF)} * max(cameraPosition.y, -20.0));
  float fogInt = abs(fogDy) > 0.01 ? (1.0 - exp(-${f(FOG_FALLOFF)} * fogDy)) / (${f(FOG_FALLOFF)} * fogDy) : 1.0;
  float fogAmount = 1.0 - exp(-fogBase * fogDist * fogInt);
  float fogSun = pow(max(dot(fogRay / max(fogDist, 0.001), vec3(${f(SUN_DIR.x)}, ${f(SUN_DIR.y)}, ${f(SUN_DIR.z)})), 0.0), 6.0);
  vec3 fogCol = mix(fogColor, vec3(2.0, 1.7, 1.3), fogSun * 0.5);
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogCol, fogAmount);
#endif`;
}

// Dunst in der Ferne (Luftperspektive): weit entfernte Berge werden bläulich-hell
const HAZE = new THREE.Color(0xa9c6e6).multiplyScalar(1.5);
const scene = new THREE.Scene();
scene.background = HAZE.clone();
scene.fog = new THREE.Fog(HAZE, 450, 6500); // Nah/Fern werden vom Höhennebel oben nicht benutzt

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.3, 14000);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Physikalisch berechneter Himmel (Preetham-Modell) mit Sonne
const sky = new THREE.Sky();
sky.scale.setScalar(10000);
sky.material.uniforms.turbidity.value = 2.2;
sky.material.uniforms.rayleigh.value = 3;
sky.material.uniforms.mieCoefficient.value = 0.003;
sky.material.uniforms.mieDirectionalG.value = 0.85;
sky.material.uniforms.sunPosition.value.copy(SUN_DIR);

// Aus dem Himmel eine Umgebungs-Textur berechnen: daraus kommen weiches
// Umgebungslicht und die Spiegelungen in Lack, Glas und Wasser.
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(sky);
  // ein grünbrauner "Boden", damit die untere Hälfte nicht schwarz spiegelt
  const ground = new THREE.Mesh(new THREE.SphereGeometry(50, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4b5a3c, side: THREE.BackSide }));
  envScene.add(ground);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();
}
scene.add(sky);

scene.add(new THREE.HemisphereLight(0xc4dcff, 0x55603f, 0.45));
const sun = new THREE.DirectionalLight(0xfff1dc, 4.6);
const SUN_OFFSET = SUN_DIR.clone().multiplyScalar(400);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -75, right: 75, top: 75, bottom: -75, near: 50, far: 900 });
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);

// --- Prozedurale Texturen (werden beim Start in Canvas-Bilder gezeichnet) ---
// Kachelbares Rauschen: am rechten Rand passt es wieder an den linken
function pnoise(x, z, P) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const w = (a) => ((a % P) + P) % P;
  const x0 = w(xi), x1 = w(xi + 1), z0 = w(zi), z1 = w(zi + 1);
  return lerp(lerp(hash2(x0, z0), hash2(x1, z0), u), lerp(hash2(x0, z1), hash2(x1, z1), u), v) * 2 - 1;
}
function tnoise(u, v, period, octaves) {
  let sum = 0, amp = 0.5, p = period;
  for (let i = 0; i < octaves; i++) { sum += amp * pnoise(u * p, v * p, p); p *= 2; amp *= 0.5; }
  return sum;
}
function makeTexture(size, pixel, srgb) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, gg, b] = pixel(x / size, y / size, x, y);
    const i = (y * size + x) * 4;
    img.data[i] = clamp(r, 0, 1) * 255;
    img.data[i + 1] = clamp(gg, 0, 1) * 255;
    img.data[i + 2] = clamp(b, 0, 1) * 255;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = ANISO;
  if (srgb) t.colorSpace = SRGB;
  return t;
}
// Normal-Map aus einer Höhenfunktion (macht Oberflächen "plastisch")
function makeNormalTexture(size, height, strength) {
  const d = 1 / size;
  return makeTexture(size, (u, v) => {
    const nx = (height(u - d, v) - height(u + d, v)) * strength;
    const ny = (height(u, v - d) - height(u, v + d)) * strength;
    const l = Math.hypot(nx, ny, 1);
    return [nx / l * 0.5 + 0.5, ny / l * 0.5 + 0.5, 1 / l * 0.5 + 0.5];
  }, false);
}

const groundHeightTex = (u, v) => tnoise(u, v, 8, 5) + 0.35 * tnoise(u, v, 64, 2);
const groundTex = makeTexture(512, (u, v, x, y) => {
  const n = 0.86 + 0.16 * tnoise(u, v, 8, 5) + 0.08 * tnoise(u, v, 64, 2) + (hash2(x, y) - 0.5) * 0.08;
  return [n, n, n];
}, false);
const groundNormal = makeNormalTexture(512, groundHeightTex, 6);
groundTex.repeat.set(160, 160);
groundNormal.repeat.set(160, 160);

// Asphalt: feine Körnung, helle Steinchen und dunklere Fahrspuren der Reifen
const asphaltTex = makeTexture(512, (u, v, x, y) => {
  let n = 0.27 + 0.04 * tnoise(u, v, 16, 4) + (hash2(x * 7, y * 3) - 0.5) * 0.06;
  if (hash2(x, y * 13) > 0.988) n += 0.12;
  for (const t of [0.175, 0.325, 0.675, 0.825]) n -= 0.07 * Math.exp(-(((u - t) / 0.035) ** 2));
  n -= 0.06 * (smoothstep(0.04, 0, u) + smoothstep(0.96, 1, u));
  return [n, n, n * 1.02];
}, true);
const asphaltNormal = makeNormalTexture(256, (u, v) => tnoise(u, v, 32, 3), 3);

// Wasserwellen
const waterNormal = makeNormalTexture(256, (u, v) => tnoise(u, v, 6, 4) + 0.3 * tnoise(u, v, 24, 2), 4);
waterNormal.repeat.set(70, 70);

// =====================================================================
// 5. Welt-Objekte
// =====================================================================
const hub = roadPointAt(roads[0], 0); // Start/Ziel und Festival-Gelände

// --- Gelände ---
const TERRAIN_SEG = 320;
let terrainGridTex = null; // Höhe, Grasmenge und Trockenheit je Gitterpunkt (für das Gras)
(() => {
  const SEG = TERRAIN_SEG;
  const geo = new THREE.PlaneGeometry(WORLD, WORLD, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const roadDist = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = nearestRoad(x, z);
    pos.setY(i, groundHeight(x, z, r));
    roadDist[i] = r ? r.dist : 999;
  }
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const grid = new Float32Array(pos.count * 4);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i), ny = nrm.getY(i);
    const n1 = fbm(x * 0.03, z * 0.03, 3), n2 = fbm(x * 0.005 + 5, z * 0.005, 3);
    // Wiese: sattes Grün mit trockeneren und dunkleren Flecken, weiter oben alpiner
    const dry = clamp(smoothstep(0.05, 0.35, n2) * 0.6 + smoothstep(25, 60, h) * 0.5, 0, 1);
    let r = lerp(0.2, 0.42, dry) + n1 * 0.04;
    let g = lerp(0.37, 0.4, dry) + n1 * 0.05;
    let b = lerp(0.1, 0.2, dry) + n1 * 0.02;
    // Fels an steilen Hängen und weit oben
    const rock = Math.max(smoothstep(0.82, 0.62, ny), smoothstep(70, 110, h) * 0.8);
    r = lerp(r, 0.5 + n1 * 0.07, rock); g = lerp(g, 0.47 + n1 * 0.06, rock); b = lerp(b, 0.43 + n1 * 0.06, rock);
    // Schnee oberhalb der Schneegrenze, aber nicht an Steilwänden
    const snowLine = 110 + n2 * 35;
    const snow = smoothstep(snowLine - 8, snowLine + 8, h) * smoothstep(0.5, 0.72, ny);
    r = lerp(r, 0.93, snow); g = lerp(g, 0.95, snow); b = lerp(b, 0.99, snow);
    // Kiesstrand am Wasser und Schotter neben der Strasse
    const sand = smoothstep(WATER + 2.5, WATER + 0.6, h);
    r = lerp(r, 0.6, sand); g = lerp(g, 0.56, sand); b = lerp(b, 0.47, sand);
    const shoulder = smoothstep(ROAD_W / 2 + 3, ROAD_W / 2 + 1, roadDist[i]) * (h > WATER ? 1 : 0);
    r = lerp(r, 0.45, shoulder); g = lerp(g, 0.42, shoulder); b = lerp(b, 0.37, shoulder);
    const grassAmt = (1 - rock) * (1 - snow) * (1 - sand) * (1 - shoulder) * (h > WATER + 0.6 ? 1 : 0) * (roadDist[i] > ROAD_W / 2 + 2 ? 1 : 0);
    grid.set([h, grassAmt, dry, 0], i * 4);
    c.setRGB(r, g, b, SRGB);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  terrainGridTex = new THREE.DataTexture(grid, SEG + 1, SEG + 1, THREE.RGBAFormat, THREE.FloatType);
  terrainGridTex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true, map: groundTex, normalMap: groundNormal,
    normalScale: new THREE.Vector2(0.45, 0.45), roughness: 1, metalness: 0,
  });
  // Gegen sichtbare Wiederholungen: die Textur zusätzlich in viel grösserem
  // Massstab darüberlegen, so entstehen grossflächige hellere und dunklere Stellen.
  mat.onBeforeCompile = (sh) => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <map_fragment>", `
      vec4 tA = texture2D(map, vMapUv);
      vec4 tB = texture2D(map, vMapUv * 0.123 + vec2(0.31, 0.77));
      vec4 tC = texture2D(map, vMapUv * 0.0171 + vec2(0.53, 0.19));
      diffuseColor.rgb *= tA.rgb * (tB.r * 1.15) * (0.75 + tC.r * 0.35);`);
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
})();

// --- Wasser (spiegelt den Himmel, Wellen bewegen sich) ---
const water = new THREE.Mesh(
  new THREE.PlaneGeometry(WORLD * 3, WORLD * 3),
  new THREE.MeshStandardMaterial({
    color: 0x0b4f5c, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.92,
    normalMap: waterNormal, normalScale: new THREE.Vector2(0.06, 0.06), envMapIntensity: 0.9,
  })
);
water.rotation.x = -Math.PI / 2;
water.position.y = WATER;
scene.add(water);

// --- Strassen ---
(() => {
  asphaltTex.repeat.set(1, 1);
  const roadMat = new THREE.MeshStandardMaterial({
    map: asphaltTex, normalMap: asphaltNormal, normalScale: new THREE.Vector2(0.5, 0.5),
    roughness: 0.86, metalness: 0, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e2, roughness: 0.6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const yellowMat = lineMat.clone();
  yellowMat.color.set(0xf2bb30);

  // Ein Band entlang der Strasse zwischen den seitlichen Abständen o1 und o2.
  // u läuft quer über die Strasse (0..1), v entlang der Strasse (in Strassenbreiten).
  function ribbon(road, o1, o2, lift, keep) {
    const p = [], uv = [], idx = [];
    road.samples.forEach((s, i) => {
      const lx = s.tz, lz = -s.tx;
      const y = roadHeight(s.x, s.z) + lift;
      const v = (i * road.spacing) / ROAD_W;
      p.push(s.x + lx * o1, y, s.z + lz * o1, s.x + lx * o2, y, s.z + lz * o2);
      uv.push(0, v, 1, v);
    });
    const n = road.n;
    for (let i = 0; i < (road.closed ? n : n - 1); i++) {
      if (keep && !keep(i)) continue;
      const a = i * 2, b = ((i + 1) % n) * 2;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  roads.forEach((road, k) => {
    const lift = 0.12 + k * 0.01;
    const surf = new THREE.Mesh(ribbon(road, -ROAD_W / 2, ROAD_W / 2, lift), roadMat);
    surf.receiveShadow = true;
    scene.add(surf);
    const e = ROAD_W / 2 - 0.5;
    for (const [a, b, mat, keep] of [[e - 0.22, e, lineMat], [-e, -e + 0.22, lineMat], [-0.12, 0.12, yellowMat, (i) => i % 6 < 3]]) {
      const m = new THREE.Mesh(ribbon(road, a, b, lift + 0.02, keep), mat);
      m.receiveShadow = true;
      scene.add(m);
    }
  });
})();

// --- Hindernisse (für Kollisionen) ---
const OB_CELL = 20;
const obGrid = new Map();
function addObstacle(x, z, r) {
  const k = cellKey(Math.floor(x / OB_CELL), Math.floor(z / OB_CELL));
  if (!obGrid.has(k)) obGrid.set(k, []);
  const o = { x, z, r };
  obGrid.get(k).push(o);
  return o;
}
function forNearbyObstacles(x, z, fn) {
  const cx = Math.floor(x / OB_CELL), cz = Math.floor(z / OB_CELL);
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const list = obGrid.get(cellKey(cx + dx, cz + dz));
    if (list) for (const o of list) fn(o);
  }
}

// --- Mehrere Geometrien zu einer zusammenfügen (für InstancedMesh) ---
function mergeGeos(geos) {
  const parts = geos.map((g) => (g.index ? g.toNonIndexed() : g));
  let n = 0;
  for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (const p of parts) {
    pos.set(p.attributes.position.array, o * 3);
    nor.set(p.attributes.normal.array, o * 3);
    if (p.attributes.uv) uv.set(p.attributes.uv.array, o * 2);
    o += p.attributes.position.count;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return g;
}
// Steilheit des Geländes (0 = flach)
function slopeAt(x, z) {
  const d = 2;
  return Math.hypot(groundHeight(x + d, z) - groundHeight(x - d, z), groundHeight(x, z + d) - groundHeight(x, z - d)) / (2 * d);
}

// --- Bäume: Tannen (mehrere Äste-Etagen) und Laubbäume ---
(() => {
  const spruceCrown = mergeGeos([0, 1, 2, 3, 4].map((k) =>
    new THREE.ConeGeometry(2.7 - k * 0.48, 3.4, 9).translate(0, 3.2 + k * 1.75, 0)));
  const leafCrown = mergeGeos([[0, 6.2, 0, 2.6], [1.3, 5.4, 0.6, 1.9], [-1.1, 5.6, -0.8, 2.0], [0.2, 7.6, -0.3, 1.8]].map(([x, y, z, r]) =>
    new THREE.IcosahedronGeometry(r, 1).translate(x, y, z)));
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.38, 4.5, 7).translate(0, 2.25, 0);
  // Nadeln: viele kleine Striche, unten ausgefranst -> die Äste wirken buschig
  const foliage = (draw) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const g = cv.getContext("2d");
    draw(g);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = SRGB;
    t.wrapS = THREE.RepeatWrapping;
    t.anisotropy = ANISO;
    return t;
  };
  const needleTex = foliage((g) => {
    g.fillStyle = "#1f3a1c";
    g.fillRect(0, 0, 256, 170);
    for (let i = 0; i < 2600; i++) {
      const x = rng() * 256, y0 = rng() * 230, len = 12 + rng() * 34;
      g.strokeStyle = `hsl(${95 + rng() * 35}, ${35 + rng() * 25}%, ${12 + rng() * 22}%)`;
      g.lineWidth = 1 + rng() * 2.2;
      g.beginPath();
      g.moveTo(x, y0);
      g.lineTo(x + (rng() - 0.5) * 14, Math.min(254, y0 + len));
      g.stroke();
    }
  });
  needleTex.repeat.set(3, 1);
  const leafTex = foliage((g) => {
    for (let i = 0; i < 1800; i++) {
      const x = rng() * 256, y = rng() * 256, r = 3 + rng() * 6;
      g.fillStyle = `hsl(${75 + rng() * 40}, ${35 + rng() * 25}%, ${18 + rng() * 26}%)`;
      g.beginPath();
      g.ellipse(x, y, r, r * 0.55, rng() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
  });
  const crownMat = new THREE.MeshStandardMaterial({ map: needleTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3423, roughness: 1 });
  const MAX_S = 3600, MAX_L = 800;
  const sCrowns = new THREE.InstancedMesh(spruceCrown, crownMat, MAX_S);
  const lCrowns = new THREE.InstancedMesh(leafCrown, leafMat, MAX_L);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, MAX_S + MAX_L);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
  let ns = 0, nl = 0, nt = 0;
  for (let tries = 0; tries < 60000 && (ns < MAX_S || nl < MAX_L); tries++) {
    const x = (rng() * 2 - 1) * (HALF - 20), z = (rng() * 2 - 1) * (HALF - 20);
    const forest = fbm(x * 0.006 + 20, z * 0.006, 3);
    if (forest + rng() * 0.35 < 0.12) continue;                 // Wälder statt Gleichverteilung
    const r = nearestRoad(x, z);
    if (r && r.dist < ROAD_W / 2 + 5) continue;
    if (Math.hypot(x - hub.x, z - hub.z) < 90) continue;
    const h = groundHeight(x, z, r);
    if (h < WATER + 1.5 || h > 95 + rng() * 15) continue;        // Baumgrenze
    if (slopeAt(x, z) > 0.75) continue;
    const leafy = h < 25 && rng() < 0.35;
    if (leafy ? nl >= MAX_L : ns >= MAX_S) continue;
    const s = (0.65 + rng() * 0.75) * (h > 60 ? 0.75 : 1);
    m.compose(p.set(x, h - 0.4, z), q.setFromAxisAngle(up, rng() * 6.28), sc.set(s, s * (0.85 + rng() * 0.4), s));
    trunks.setMatrixAt(nt++, m);
    if (leafy) {
      lCrowns.setMatrixAt(nl, m);
      lCrowns.setColorAt(nl++, c.setHSL(0.18 + rng() * 0.1, 0.35, 0.7 + rng() * 0.25, SRGB));
    } else {
      sCrowns.setMatrixAt(ns, m);
      sCrowns.setColorAt(ns++, c.setHSL(0.22 + rng() * 0.12, 0.25, 0.6 + rng() * 0.3, SRGB));
    }
    addObstacle(x, z, 0.55 * s);
  }
  sCrowns.count = ns; lCrowns.count = nl; trunks.count = nt;
  for (const mesh of [sCrowns, lCrowns, trunks]) { mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); }
})();

// --- Felsbrocken ---
(() => {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 0.75 + hash2(Math.round(pos.getX(i) * 100), Math.round(pos.getY(i) * 100 + pos.getZ(i) * 37)) * 0.5;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i) * k * 0.75, pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  const N = 700;
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, flatShading: true }), N);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler(), c = new THREE.Color();
  let n = 0;
  for (let tries = 0; tries < 20000 && n < N; tries++) {
    const x = (rng() * 2 - 1) * (HALF - 10), z = (rng() * 2 - 1) * (HALF - 10);
    const r = nearestRoad(x, z);
    if (r && r.dist < ROAD_W / 2 + 4) continue;
    const h = groundHeight(x, z, r);
    const steep = slopeAt(x, z);
    if (steep < 0.4 && h < 60 && rng() > 0.12) continue;          // vor allem in steilem Gelände
    const s = 0.6 + rng() ** 2 * (steep > 0.4 ? 6 : 2.5);
    m.compose(p.set(x, h - s * 0.25, z), q.setFromEuler(e.set(rng(), rng() * 6.3, rng())), sc.set(s, s, s));
    mesh.setMatrixAt(n, m);
    const g = 0.42 + rng() * 0.18;
    mesh.setColorAt(n++, c.setRGB(g, g * 0.97, g * 0.93, SRGB));
    if (s > 1.2) addObstacle(x, z, s * 0.8);
  }
  mesh.count = n;
  mesh.castShadow = mesh.receiveShadow = true;
  scene.add(mesh);
})();

// --- Gras: zehntausende Halme rund um die Kamera, die im Wind wehen ---
// Die Halme liegen in einer Kachel, die mit der Kamera mitwandert. Höhe, Grasmenge
// und Trockenheit liest die Grafikkarte aus der Gelände-Textur (terrainGridTex).
const GRASS_MAX = 80000, GRASS_TILE = 84;
const grass = (() => {
  // Ein Büschel aus 5 schmalen, leicht gebogenen Halmen
  const pos = [], col = [], nor = [], idx = [];
  const cBase = new THREE.Color().setRGB(0.17, 0.28, 0.07, SRGB), cTip = new THREE.Color().setRGB(0.4, 0.58, 0.17, SRGB), c = new THREE.Color();
  for (let k = 0; k < 5; k++) {
    const a = k * 2.4, ox = Math.cos(a) * 0.09, oz = Math.sin(a) * 0.09;
    const h = 0.2 + (k % 3) * 0.07, w = 0.022;
    const dx = Math.cos(a + 1.3), dz = Math.sin(a + 1.3);     // Breite des Halms
    const lx = -dz * (k % 2 ? 0.08 : -0.08), lz = dx * (k % 2 ? 0.08 : -0.08); // Neigung
    const v0 = pos.length / 3;
    for (const [t, ww] of [[0, w], [0.5, w * 0.75], [1, 0]]) {
      const y = t * h, bend = t * t;
      const n = ww === 0 ? 1 : 2;
      for (let side = 0; side < n; side++) {
        const sw = n === 1 ? 0 : side ? ww : -ww;
        pos.push(ox + dx * sw + lx * bend, y, oz + dz * sw + lz * bend);
        c.copy(cBase).lerp(cTip, t);
        col.push(c.r, c.g, c.b);
        nor.push(0, 1, 0);
      }
    }
    idx.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2, v0 + 2, v0 + 3, v0 + 4);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  const off = new Float32Array(GRASS_MAX * 4);
  for (let i = 0; i < GRASS_MAX; i++) {
    off.set([(rng() - 0.5) * GRASS_TILE, (rng() - 0.5) * GRASS_TILE, rng() * Math.PI * 2, rng()], i * 4);
  }
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 4));
  geo.instanceCount = GRASS_MAX;

  const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const uniforms = { uHeight: { value: terrainGridTex }, uTime: { value: 0 } };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", `#include <common>
        attribute vec4 aOffset;
        uniform sampler2D uHeight;
        uniform float uTime;
        vec4 grassSample(vec2 xz) {
          vec2 g = (xz + ${HALF.toFixed(1)}) / ${(WORLD / TERRAIN_SEG).toFixed(4)};
          ivec2 i = clamp(ivec2(floor(g)), ivec2(0), ivec2(${TERRAIN_SEG - 1}));
          vec2 f = clamp(g - vec2(i), 0.0, 1.0);
          vec4 a = texelFetch(uHeight, i, 0), b = texelFetch(uHeight, i + ivec2(1, 0), 0);
          vec4 c = texelFetch(uHeight, i + ivec2(0, 1), 0), d = texelFetch(uHeight, i + ivec2(1, 1), 0);
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }`)
      .replace("void main() {", `void main() {
        vec2 gP = aOffset.xy + floor((cameraPosition.xz - aOffset.xy) / ${GRASS_TILE.toFixed(1)} + 0.5) * ${GRASS_TILE.toFixed(1)};
        vec4 gS = grassSample(gP);
        float gDist = length(gP - cameraPosition.xz);
        float gScale = step(aOffset.w, gS.g * 1.15 - 0.1) * smoothstep(${(GRASS_TILE * 0.5).toFixed(1)}, ${(GRASS_TILE * 0.3).toFixed(1)}, gDist)
                     * (0.6 + 0.8 * fract(aOffset.w * 7.31));
        float gC = cos(aOffset.z), gSn = sin(aOffset.z);`)
      .replace("#include <beginnormal_vertex>", "vec3 objectNormal = vec3(0.0, 1.0, 0.0);")
      .replace("#include <color_vertex>", `#include <color_vertex>
        vColor.rgb *= mix(vec3(1.0), vec3(1.3, 1.15, 0.8), gS.b) * (0.8 + 0.4 * fract(aOffset.w * 13.7));`)
      .replace("#include <begin_vertex>", `
        vec3 transformed = position * gScale;
        transformed.xz = mat2(gC, -gSn, gSn, gC) * transformed.xz;
        float gWind = sin(uTime * 1.6 + gP.x * 0.13 + gP.y * 0.07) * 0.6 + sin(uTime * 3.7 + gP.x * 0.9 + gP.y * 0.4) * 0.25;
        float gBend = position.y * position.y * gScale;
        transformed.x += gWind * gBend * 0.9;
        transformed.z += gWind * gBend * 0.4;
        transformed += vec3(gP.x, gS.r - 0.04, gP.y);`);
    // Halme sind dünn: beide Seiten gleich beleuchten (sonst ist die Rückseite schwarz)
    sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_begin>",
      THREE.ShaderChunk.normal_fragment_begin.replace("normal *= faceDirection;", ""));
  };
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return { mesh, uniforms };
})();

// --- Chalets entlang der Strassen ---
(() => {
  const stone = new THREE.MeshStandardMaterial({ color: 0xe9e4da });
  const woods = [0x7a4a26, 0x8a5a32, 0x6b3f22].map((c) => new THREE.MeshStandardMaterial({ color: c }));
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x4a3c34 });
  const winMat = new THREE.MeshStandardMaterial({ color: 0x26303d });
  const flowerMat = new THREE.MeshStandardMaterial({ color: 0xe0242f });
  // Giebel (Dreieck) als extrudierte Form
  const gableShape = new THREE.Shape([new THREE.Vector2(-4.5, 0), new THREE.Vector2(4.5, 0), new THREE.Vector2(0, 3.2)]);
  const gableGeo = new THREE.ExtrudeGeometry(gableShape, { depth: 8, bevelEnabled: false }).translate(0, 0, -4);
  const slope = Math.atan2(3.2, 4.5);
  let built = 0;
  for (let tries = 0; tries < 500 && built < 50; tries++) {
    const road = roads[Math.floor(rng() * 2)];
    const s = road.samples[Math.floor(rng() * road.n)];
    const side = rng() < 0.5 ? -1 : 1;
    const off = ROAD_W / 2 + 12 + rng() * 10;
    const x = s.x + s.tz * off * side, z = s.z - s.tx * off * side;
    const r = nearestRoad(x, z);
    if (!r || r.dist < ROAD_W / 2 + 8) continue;
    if (Math.hypot(x - hub.x, z - hub.z) < 110) continue;
    const h = groundHeight(x, z, r);
    if (h < WATER + 2) continue;
    let blocked = false;
    forNearbyObstacles(x, z, (o) => { if (o.r > 3 && Math.hypot(o.x - x, o.z - z) < 16) blocked = true; });
    if (blocked) continue;

    const g = new THREE.Group();
    const add = (geo, mat, px, py, pz) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(px, py, pz);
      m.castShadow = m.receiveShadow = true;
      g.add(m);
      return m;
    };
    const wood = woods[Math.floor(rng() * woods.length)];
    add(new THREE.BoxGeometry(9, 5.5, 8), stone, 0, -0.25, 0);        // gemauerter Sockel (reicht in den Hang)
    add(new THREE.BoxGeometry(9, 3.5, 8), wood, 0, 4.25, 0);          // Holzgeschoss
    add(gableGeo, wood, 0, 6, 0);                                     // Giebel
    const roofGeo = new THREE.BoxGeometry(6.6, 0.35, 10);
    add(roofGeo, roofMat, -2.3, 7.75, 0).rotation.z = slope;          // Dach links
    add(roofGeo, roofMat, 2.3, 7.75, 0).rotation.z = -slope;          // Dach rechts
    // Fenster mit roten Geranien
    for (const sx of [-1, 1]) for (const wz of [-2, 2]) {
      add(new THREE.BoxGeometry(0.1, 1.2, 1.2), winMat, sx * 4.52, 4.4, wz);
      add(new THREE.BoxGeometry(0.4, 0.35, 1.4), flowerMat, sx * 4.65, 3.6, wz);
    }
    g.position.set(x, h, z);
    g.rotation.y = Math.atan2(s.tx, s.tz);
    scene.add(g);
    addObstacle(x, z, 5.2);
    built++;
  }
})();

// --- Kühe auf der Alpwiese ---
const cows = [];
(() => {
  const white = new THREE.MeshStandardMaterial({ color: 0xf4f1ea });
  const brown = new THREE.MeshStandardMaterial({ color: 0x6b3a1e });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a2420 });
  const bell = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.8, roughness: 0.3 });
  const body = new THREE.BoxGeometry(0.95, 0.9, 1.9);
  const patch = new THREE.BoxGeometry(0.98, 0.5, 0.6);
  const head = new THREE.BoxGeometry(0.5, 0.55, 0.65);
  const leg = new THREE.BoxGeometry(0.18, 0.8, 0.18);
  const bellGeo = new THREE.SphereGeometry(0.12, 8, 6);
  for (let tries = 0; tries < 3000 && cows.length < 45; tries++) {
    // Kühe stehen in kleinen Herden
    const hx = (rng() * 2 - 1) * (HALF - 150), hz = (rng() * 2 - 1) * (HALF - 150);
    for (let k = 0; k < 5 && cows.length < 45; k++) {
      const x = hx + (rng() - 0.5) * 40, z = hz + (rng() - 0.5) * 40;
      const r = nearestRoad(x, z);
      if (r && r.dist < ROAD_W / 2 + 10) continue;
      if (Math.hypot(x - hub.x, z - hub.z) < 100) continue;
      const h = groundHeight(x, z, r);
      if (h < WATER + 2 || h > 40) continue;
      const g = new THREE.Group();
      const add = (geo, mat, px, py, pz) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(px, py, pz);
        m.castShadow = true;
        g.add(m);
      };
      add(body, white, 0, 1.15, 0);
      add(patch, rng() < 0.5 ? brown : dark, 0, 1.3, rng() - 0.5);
      add(head, white, 0, 1.35, 1.15);
      add(bellGeo, bell, 0, 0.92, 1.0);
      for (const lx of [-0.3, 0.3]) for (const lz of [-0.7, 0.7]) add(leg, dark, lx, 0.4, lz);
      g.position.set(x, h, z);
      g.rotation.y = rng() * Math.PI * 2;
      scene.add(g);
      addObstacle(x, z, 1.1).cow = true;
      cows.push(g);
    }
  }
})();

// --- Alpenpanorama rund um die Welt (inkl. Matterhorn) ---
(() => {
  const geo = new THREE.RingGeometry(760, 4200, 420, 46);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
    const t = smoothstep(760, 1500, r);
    let h = (110 + 650 * ridged(x * 0.0011 + 11, z * 0.0011 - 4, 6)) * (0.3 + 0.7 * t);
    h *= 1 - 0.7 * smoothstep(3200, 4200, r);
    const dm = Math.hypot(x - 250, z + 1700);
    h += 1300 * Math.max(0, 1 - dm / 430) ** 1.4;          // Matterhorn: eine steile Pyramide
    pos.setY(i, h - 10);
  }
  geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = pos.getY(i), ny = nrm.getY(i);
    const n = fbm(x * 0.004, z * 0.004, 3);
    let rr = 0.5 + n * 0.06, gg = 0.48 + n * 0.05, bb = 0.45 + n * 0.05;          // Fels
    const forest = smoothstep(180, 120, h) * smoothstep(0.6, 0.8, ny);
    rr = lerp(rr, 0.13, forest); gg = lerp(gg, 0.22, forest); bb = lerp(bb, 0.12, forest);
    const snow = smoothstep(260 + n * 90, 320 + n * 90, h) * smoothstep(0.45, 0.65, ny);
    rr = lerp(rr, 0.94, snow); gg = lerp(gg, 0.96, snow); bb = lerp(bb, 1, snow);
    c.setRGB(rr, gg, bb, SRGB);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 })));
})();

// --- Wolken: weiche, halbtransparente Bilder hoch am Himmel ---
(() => {
  const tex = (() => {
    const cv = document.createElement("canvas");
    cv.width = 512; cv.height = 256;
    const g = cv.getContext("2d");
    for (let i = 0; i < 70; i++) {
      const x = 256 + (rng() - 0.5) * 340, y = 140 + (rng() - 0.5) * 70 - Math.abs(x - 256) * 0.1;
      const r = 30 + rng() * 60;
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      const shade = 235 + Math.round(rng() * 20) - (y > 150 ? 25 : 0);
      grad.addColorStop(0, `rgba(${shade},${shade},${shade + 5},0.22)`);
      grad.addColorStop(1, `rgba(${shade},${shade},${shade + 5},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 256);
    }
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = SRGB;
    return t;
  })();
  for (let i = 0; i < 40; i++) {
    const a = rng() * Math.PI * 2, d = 400 + rng() * 3200;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
    const w = 600 + rng() * 900;
    sp.scale.set(w, w * 0.45, 1);
    sp.position.set(Math.cos(a) * d, 700 + rng() * 500, Math.sin(a) * d);
    scene.add(sp);
  }
})();

// --- Schrift auf Bannern ---
function labelTexture(text, bg, fg) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 1024, 0);
  grad.addColorStop(0, bg[0]); grad.addColorStop(1, bg[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, 1024, 128);
  g.fillStyle = fg;
  let size = 80;
  do g.font = `italic 900 ${size}px system-ui, sans-serif`; while (g.measureText(text).width > 960 && size-- > 20);
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 512, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = SRGB;
  return t;
}

// Schweizer Fahne: rotes Quadrat mit weissem Kreuz
const swissFlagMat = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#da291c";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#ffffff";
  g.fillRect(26, 13, 12, 38);
  g.fillRect(13, 26, 38, 12);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = SRGB;
  return new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide });
})();

// Torbogen über der Strasse
function makeArch(p, text, colors) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x20232b, roughness: 0.5 });
  const span = ROAD_W + 4;
  for (const sx of [-1, 1]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 9, 0.9), mat);
    pillar.position.set(sx * span / 2, 4.5, 0);
    pillar.castShadow = true;
    g.add(pillar);
  }
  const tex = labelTexture(text, colors, "#ffffff");
  const banner = new THREE.Mesh(new THREE.BoxGeometry(span + 1, 1.8, 0.4), [
    mat, mat, mat, mat,
    new THREE.MeshBasicMaterial({ map: tex }),
    new THREE.MeshBasicMaterial({ map: tex }),
  ]);
  banner.position.y = 8.6;
  banner.castShadow = true;
  g.add(banner);
  g.position.set(p.x, roadHeight(p.x, p.z), p.z);
  g.rotation.y = p.yaw;
  scene.add(g);
  for (const sx of [-1, 1]) addObstacle(p.x + p.lx * sx * span / 2, p.z + p.lz * sx * span / 2, 0.7);
  return g;
}

// --- Festival-Gelände ---
(() => {
  makeArch(hub, "ALPENFESTIVAL SCHWEIZ", ["#ff2e88", "#ff8a00"]);
  const tentCols = [0xff2e88, 0xffd23f, 0x19c3ff, 0xff8a00, 0x8a5cff, 0xffffff];
  let k = 0;
  for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) {
    const along = -60 + i * 26 + row * 13;
    const off = ROAD_W / 2 + 22 + row * 20;
    const x = hub.x + hub.tx * along + hub.lx * off;
    const z = hub.z + hub.tz * along + hub.lz * off;
    const h = groundHeight(x, z);
    const col = tentCols[k++ % tentCols.length];
    const base = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 3.5, 10), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 4.5, 10), new THREE.MeshStandardMaterial({ color: col }));
    base.position.set(x, h + 1.5, z);
    roof.position.set(x, h + 5.5, z);
    base.castShadow = roof.castShadow = true;
    scene.add(base, roof);
    addObstacle(x, z, 6);
    // Fahne
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd }));
    pole.position.set(x, h + 10, z);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), swissFlagMat);
    flag.position.set(x + 0.9, h + 12.1, z);
    scene.add(pole, flag);
  }
})();

// =====================================================================
// 6. Events: Rennen, Blitzer, Driftzone
// =====================================================================
// Lichtstrahl als Event-Markierung (wie bei Festival-Spielen)
function makeBeam(x, z, color) {
  const g = new THREE.Group();
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(4, 4, 220, 24, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false, fog: false })
  );
  beam.position.y = 110;
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(6, 7.2, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.4;
  g.add(beam, ring);
  g.position.set(x, groundHeight(x, z), z);
  scene.add(g);
  return g;
}

const RACE_START_S = -70;
const raceMarkerPos = roadPointAt(roads[0], RACE_START_S);
const raceBeam = makeBeam(raceMarkerPos.x, raceMarkerPos.z, 0x19a8ff);

// Blitzer
const traps = [
  { road: 0, s: roads[0].length * 0.2, name: "Blitzer Seeland" },
  { road: 0, s: roads[0].length * 0.57, name: "Blitzer Alpweg" },
  { road: 1, s: roads[1].length * 0.72, name: "Blitzer Seeufer" },
].map((t) => {
  const p = roadPointAt(roads[t.road], t.s);
  const sx = p.x - p.lx * (ROAD_W / 2 + 2.5), sz = p.z - p.lz * (ROAD_W / 2 + 2.5);
  const h = groundHeight(sx, sz);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 4), new THREE.MeshStandardMaterial({ color: 0x888888 }));
  pole.position.set(sx, h + 2, sz);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a5cff, emissive: 0x8a5cff, emissiveIntensity: 0.6 }));
  head.position.set(sx, h + 4.2, sz);
  head.rotation.y = p.yaw;
  pole.castShadow = head.castShadow = true;
  scene.add(pole, head);
  addObstacle(sx, sz, 0.4);
  return { ...t, x: p.x, z: p.z, cooldown: 0, head };
});

// Driftzone auf dem Seeuferweg
const driftZone = (() => {
  const road = roads[1];
  const i0 = Math.floor(road.n * 0.06), i1 = Math.floor(road.n * 0.32);
  const a = roadPointAt(road, i0 * road.spacing), b = roadPointAt(road, i1 * road.spacing);
  makeArch(a, "DRIFTZONE", ["#ff8a00", "#ffd23f"]);
  makeArch(b, "DRIFTZONE", ["#ffd23f", "#ff8a00"]);
  return { road: 1, i0, i1, x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, ax: a.x, az: a.z, active: false, score: 0 };
})();

// =====================================================================
// 7. Spieler-Auto & Fahrphysik
// =====================================================================
let carBase = CARS.find((c) => c.id === save.car) || CARS[0]; // Auto ohne Tuning
let carSpec = carBase;                                            // Auto mit Tuning (damit wird gefahren)
let playerMesh = null;
function tuningOf(id) {
  save.tuning[id] = save.tuning[id] || {};
  return save.tuning[id];
}

const car = {
  x: 0, y: 0, z: 0, yaw: 0, vx: 0, vz: 0, vy: 0,
  vF: 0, vS: 0, steer: 0, onGround: true, airTime: 0, lastG: 0,
  pitch: 0, roll: 0, slope: 0, surface: "road", roadName: "",
  wheelSpin: 0, throttle: 0, braking: false,
};

function setPlayerCar(base) {
  carBase = base;
  carSpec = tunedSpec(base, tuningOf(base.id));
  save.car = base.id;
  storeSave();
  showCarMesh(carSpec);
}
// Nur das Aussehen tauschen (z. B. Farbvorschau in der Werkstatt)
function showCarMesh(spec) {
  if (playerMesh) scene.remove(playerMesh.group);
  playerMesh = makeCarMesh(spec);
  scene.add(playerMesh.group);
}
setPlayerCar(carBase);

function placeCar(roadId, s, lane) {
  const p = roadPointAt(roads[roadId], s);
  car.x = p.x + p.lx * lane;
  car.z = p.z + p.lz * lane;
  car.yaw = p.yaw;
  car.vx = car.vz = car.vy = car.vF = car.vS = car.steer = 0;
  car.y = car.lastG = driveHeight(car.x, car.z);
  car.onGround = true;
  car.airTime = 0;
}

// Zurück auf die nächste Strasse (Taste R)
function resetToRoad() {
  let best = null, bd = Infinity;
  for (const r of roads) for (const s of r.samples) {
    const d = (s.x - car.x) ** 2 + (s.z - car.z) ** 2;
    if (d < bd) { bd = d; best = s; }
  }
  const road = roads[best.road];
  const dir = Math.cos(angleDiff(car.yaw, Math.atan2(best.tx, best.tz))) >= 0 ? 1 : -1;
  placeCar(best.road, best.i * road.spacing, -3 * dir);
  if (dir < 0) car.yaw += Math.PI;
  breakChain("Zurückgesetzt");
}

// Fahrwerte je nach Untergrund
function surfaceParams() {
  const o = carSpec.off;
  if (car.surface === "water") return { top: 10, accel: 4, grip: 2 };
  if (car.surface === "grass") return { top: carSpec.top * o, accel: carSpec.accel * (0.5 + 0.5 * o), grip: carSpec.grip * (0.45 + 0.5 * o) };
  return { top: carSpec.top, accel: carSpec.accel, grip: carSpec.grip };
}

// Ein kleiner Physik-Schritt (wird mehrmals pro Bild aufgerufen, damit alles stabil bleibt)
function stepCar(h, inp) {
  const S = surfaceParams();
  if (car.onGround) {
    const sp = Math.abs(car.vF);
    const rate = 2.3 / (1 + sp * 0.03) * Math.min(1, sp / 3);
    car.yaw += car.steer * rate * Math.sign(car.vF || 1) * (inp.handbrake ? 1.45 : 1) * h;
  }
  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  const lx = fz, lz = -fx;
  // Geschwindigkeit aufteilen in "vorwärts" und "seitwärts"
  let vF = car.vx * fx + car.vz * fz;
  let vS = car.vx * lx + car.vz * lz;

  if (car.onGround) {
    if (inp.throttle) {
      if (vF < -0.5) vF += 25 * h;
      else if (vF < S.top) vF += S.accel * (1 - (vF / S.top) ** 2) * h;
    }
    if (vF > S.top) vF -= (vF - S.top) * 1.3 * h;
    if (inp.brake) {
      if (vF > 0.5) vF -= 30 * h;
      else if (vF > -14) vF -= 9 * h;
    }
    if (!inp.throttle && !inp.brake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), (2 + Math.abs(vF) * 0.02) * h);
    if (inp.handbrake) vF -= Math.sign(vF) * Math.min(Math.abs(vF), 7 * h);
    vF -= GRAVITY * car.slope * 0.8 * h;             // bergauf langsamer, bergab schneller
    vS *= Math.exp(-(inp.handbrake ? 1.0 : S.grip) * h); // Reifen-Grip baut Seitwärtsrutschen ab
  } else {
    vF *= 1 - 0.05 * h;
  }

  car.vF = vF; car.vS = vS;
  car.vx = fx * vF + lx * vS;
  car.vz = fz * vF + lz * vS;
  car.x += car.vx * h;
  car.z += car.vz * h;

  // Höhe: Schwerkraft, Bodenkontakt und Sprünge
  car.vy -= GRAVITY * h;
  car.y += car.vy * h;
  const g = driveHeight(car.x, car.z);
  if (car.y <= g) {
    if (!car.onGround) onLanding(-car.vy);
    car.y = g;
    car.vy = Math.max(car.vy, clamp((g - car.lastG) / h, -40, 14));
    car.onGround = true;
  } else if (car.y > g + 0.3) {
    car.onGround = false;
  }
  car.lastG = g;
}

function onLanding(impact) {
  if (car.airTime > 0.45) {
    const pts = car.airTime * 1400;
    completeSkill(car.airTime > 1.1 ? "Grosser Sprung" : "Sprung", pts);
  }
  car.airTime = 0;
  cam.shake = Math.max(cam.shake, clamp(impact / 25, 0, 0.8));
}

function collideCar() {
  // Bäume, Häuser, Zelte …
  forNearbyObstacles(car.x, car.z, (o) => {
    const dx = car.x - o.x, dz = car.z - o.z;
    const d = Math.hypot(dx, dz), min = o.r + 1.3;
    if (d >= min || d === 0) return;
    const nx = dx / d, nz = dz / d;
    car.x += nx * (min - d);
    car.z += nz * (min - d);
    const rel = car.vx * nx + car.vz * nz;
    if (rel < 0) {
      car.vx -= nx * rel * 1.5;
      car.vz -= nz * rel * 1.5;
      car.vx *= 0.7; car.vz *= 0.7;
      if (o.cow && -rel > 2) notify("Muuh! 🐄 Pass auf die Kühe auf!", "red");
      if (-rel > 7) crash(-rel);
    }
  });
  // Weltgrenze
  const lim = HALF - 25;
  if (Math.abs(car.x) > lim) { car.x = Math.sign(car.x) * lim; car.vx *= -0.3; }
  if (Math.abs(car.z) > lim) { car.z = Math.sign(car.z) * lim; car.vz *= -0.3; }
}

function crash(impact) {
  cam.shake = Math.max(cam.shake, clamp(impact / 20, 0.3, 1));
  breakChain("Crash!");
}

// =====================================================================
// 8. KI-Fahrer
// =====================================================================
const AI_SETUP = [
  { name: "Lena", car: "blitz", skill: 0.97 },
  { name: "Luca", car: "donner", skill: 0.95 },
  { name: "Noah", car: "wuestenfuchs", skill: 0.96 },
  { name: "Mia", car: "falke", skill: 0.9 },
  { name: "Elias", car: "nordwind", skill: 0.99 },
];
const aiCars = AI_SETUP.map((a, i) => {
  const spec = CARS.find((c) => c.id === a.car);
  const mesh = makeCarMesh(spec);
  scene.add(mesh.group);
  return {
    ...a, spec, mesh,
    s: roads[0].length * (i + 0.5) / AI_SETUP.length,
    lane: -3, laneTarget: -3, speed: 20, racing: false, finished: false, finishTime: 0,
    x: 0, y: 0, z: 0, yaw: 0, nearCd: 0, wheelSpin: 0,
  };
});

function updateAI(ai, dt, frozen) {
  const road = roads[0];
  const L = road.length;
  const idx = Math.floor((((ai.s % L) + L) % L) / road.spacing);
  // Wunschtempo: Höchsttempo, aber vor Kurven rechtzeitig bremsen
  const lat = 7.5 + ai.spec.grip * 0.3;
  // Im Rennen fahren die Gegner ungefähr so schnell wie dein Auto OHNE Tuning –
  // so bringt Tuning einen echten Vorteil.
  let target = ai.racing ? Math.min(ai.spec.top, carBase.top * 1.02) * ai.skill : ai.spec.top * 0.55;
  if (ai.racing && race.state === "running") {
    // Gummiband: wer weit zurück liegt, gibt etwas mehr Gas
    const gap = playerRaceProgress() - ai.s;
    target *= gap > 150 ? 1.08 : gap < -250 ? 0.92 : 1;
  }
  for (let k = 2; k < 90; k += 2) {
    const j = (idx + k) % road.n;
    const vc = Math.sqrt(lat / Math.max(road.curv[j], 1e-4));
    target = Math.min(target, Math.sqrt(vc * vc + 2 * 11 * k * road.spacing));
  }
  if (frozen) target = 0;
  if (ai.speed < target) ai.speed = Math.min(target, ai.speed + ai.spec.accel * 0.75 * dt);
  else ai.speed = Math.max(target, ai.speed - 16 * dt);
  ai.s += ai.speed * dt;

  // Spurwechsel, wenn ein anderes KI-Auto im Weg ist
  if (ai.racing) {
    for (const o of aiCars) {
      if (o === ai) continue;
      const ds = o.s - ai.s;
      if (ds > 0 && ds < 14 && Math.abs(o.lane - ai.lane) < 2.5 && o.speed < ai.speed) ai.laneTarget = -ai.laneTarget;
    }
  }
  ai.lane += clamp(ai.laneTarget - ai.lane, -2 * dt, 2 * dt);

  const p = roadPointAt(road, ai.s);
  ai.x = p.x + p.lx * ai.lane;
  ai.z = p.z + p.lz * ai.lane;
  ai.yaw = p.yaw;
  ai.y = roadHeight(ai.x, ai.z) + 0.12;
  const pitch = Math.atan2(roadHeight(p.x + p.tx * 2, p.z + p.tz * 2) - roadHeight(p.x - p.tx * 2, p.z - p.tz * 2), 4);
  ai.mesh.group.position.set(ai.x, ai.y, ai.z);
  ai.mesh.group.rotation.set(-pitch, ai.yaw, 0, "YXZ");
  ai.wheelSpin += ai.speed * dt / ai.mesh.radius;
  for (const w of ai.mesh.wheels) w.spin.rotation.x = ai.wheelSpin;

  if (ai.racing && !ai.finished && ai.s >= L) {
    ai.finished = true;
    ai.finishTime = race.time;
  }

  // Zusammenstoß mit dem Spieler
  const dx = car.x - ai.x, dz = car.z - ai.z;
  const d = Math.hypot(dx, dz);
  ai.nearCd -= dt;
  if (d < 2.9 && d > 0 && Math.abs(car.y - ai.y) < 2) {
    const nx = dx / d, nz = dz / d;
    car.x += nx * (2.9 - d);
    car.z += nz * (2.9 - d);
    const avx = Math.sin(ai.yaw) * ai.speed, avz = Math.cos(ai.yaw) * ai.speed;
    const rel = (car.vx - avx) * nx + (car.vz - avz) * nz;
    if (rel < 0) {
      car.vx -= nx * rel * 1.2;
      car.vz -= nz * rel * 1.2;
      ai.speed *= 0.93;
      if (-rel > 9) crash(-rel);
    }
    ai.nearCd = 2;
  } else if (d < 5 && ai.nearCd <= 0 && Math.hypot(car.vx, car.vz) > 15 && mode === "drive") {
    // knapp vorbei!
    ai.nearCd = 3;
    completeSkill("Knapp vorbei", 350);
  }
}

// =====================================================================
// 9. Skill-Ketten
// =====================================================================
const skill = { chain: 0, mult: 1, timer: 0, active: null, activePts: 0, grace: 0 };
const CHAIN_TIME = 4;

function completeSkill(name, pts) {
  pts = Math.round(pts);
  if (pts <= 0) return;
  skill.chain += pts;
  skill.mult = Math.min(10, skill.mult + 1);
  skill.timer = CHAIN_TIME;
  skill.lastName = `${name} +${fmt(pts)}`;
  skill.lastShow = 1.6;
}
function breakChain(reason) {
  if (skill.chain > 0 || skill.activePts > 0) notify(`${reason} Skill-Kette verloren`, "red");
  skill.chain = 0; skill.mult = 1; skill.timer = 0; skill.active = null; skill.activePts = 0;
  if (driftZone.active) driftZone.score = 0;
}
function bankChain() {
  const total = skill.chain * skill.mult;
  save.skillPoints += total;
  const cr = Math.round(total / 5);
  save.credits += cr;
  storeSave();
  notify(`+${fmt(total)} Skillpunkte  ·  +${fmt(cr)} CHF`, "");
  skill.chain = 0; skill.mult = 1;
}

function updateSkills(dt) {
  const speed = Math.hypot(car.vx, car.vz);
  let current = null, rate = 0;
  if (car.onGround && Math.abs(car.vS) > 3 && Math.abs(car.vF) > 8 && car.surface !== "water") {
    current = "Drift";
    rate = Math.abs(car.vS) * Math.abs(car.vF) * 2.6;
  } else if (car.onGround && speed > 56) {
    current = "Raser";
    rate = 280;
  }
  if (!car.onGround) car.airTime += dt;

  if (current) {
    if (skill.active && skill.active !== current) finishActive();
    skill.active = current;
    skill.activePts += rate * dt;
    skill.grace = 0.35;
    skill.timer = CHAIN_TIME;
    if (current === "Drift" && driftZone.active) driftZone.score += rate * dt;
  } else if (skill.active) {
    skill.grace -= dt;
    if (skill.grace <= 0) finishActive();
  } else if (skill.chain > 0 && car.onGround) {
    skill.timer -= dt;
    if (skill.timer <= 0) bankChain();
  }
}
function finishActive() {
  if (skill.activePts > 80) completeSkill(skill.active, skill.activePts);
  skill.active = null;
  skill.activePts = 0;
}

// Blitzer und Driftzone prüfen
function updateEvents(dt, road) {
  const speedKmh = kmh(Math.hypot(car.vx, car.vz));
  for (const t of traps) {
    t.cooldown -= dt;
    t.head.material.emissiveIntensity = t.cooldown > 1.5 ? 3 : 0.6;
    if (t.cooldown <= 0 && Math.hypot(car.x - t.x, car.z - t.z) < ROAD_W / 2 + 2) {
      t.cooldown = 2.5;
      const v = Math.round(speedKmh);
      const best = save.traps[t.name] || 0;
      const stars = v >= 220 ? 3 : v >= 170 ? 2 : v >= 120 ? 1 : 0;
      let msg = `${t.name}: ${v} km/h ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
      if (v > best) {
        save.traps[t.name] = v;
        const reward = 300 + stars * 700;
        save.credits += reward;
        storeSave();
        msg += `  Neuer Rekord! +${fmt(reward)} CHF`;
      }
      notify(msg, "gold");
    }
  }

  const inZone = road && road.s.road === driftZone.road && road.s.i >= driftZone.i0 && road.s.i <= driftZone.i1 && road.dist < ROAD_W;
  if (inZone && !driftZone.active) {
    driftZone.active = true;
    driftZone.score = 0;
    notify("Driftzone! ★ 2.500  ★★ 6.000  ★★★ 10.000", "gold");
  } else if (!inZone && driftZone.active) {
    driftZone.active = false;
    const sc = Math.round(driftZone.score);
    const stars = sc >= 10000 ? 3 : sc >= 6000 ? 2 : sc >= 2500 ? 1 : 0;
    let msg = `Driftzone: ${fmt(sc)} Punkte ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`;
    if (sc > save.bestDrift) {
      const reward = 500 + stars * 1500;
      save.bestDrift = sc;
      save.credits += reward;
      storeSave();
      msg += `  Rekord! +${fmt(reward)} CHF`;
    }
    notify(msg, "gold");
  }
}

// =====================================================================
// 10. Rennen
// =====================================================================
const race = { state: "none", t: 0, time: 0, next: 0, cps: [], flash: 0 };
{
  const L = roads[0].length;
  for (let s = 300; s < L - 150; s += 300) race.cps.push({ s, ...roadPointAt(roads[0], s) });
  race.cps.push({ s: L, ...roadPointAt(roads[0], L) });
}
const cpRing = new THREE.Mesh(
  new THREE.TorusGeometry(ROAD_W * 0.62, 0.45, 8, 48),
  new THREE.MeshBasicMaterial({ color: 0x19c3ff, transparent: true, opacity: 0.85 })
);
cpRing.visible = false;
scene.add(cpRing);

function playerRaceProgress() {
  const cp = race.cps[Math.min(race.next, race.cps.length - 1)];
  return cp.s - Math.hypot(car.x - cp.x, car.z - cp.z);
}

function startRace() {
  race.state = "countdown";
  race.t = 3;
  race.time = 0;
  race.next = 0;
  placeCar(0, -22, -3);
  const grid = [[-22, 3], [-36, -3], [-36, 3], [-50, -3], [-50, 3]];
  aiCars.forEach((ai, i) => {
    ai.s = grid[i][0];
    ai.lane = ai.laneTarget = grid[i][1];
    ai.speed = 0;
    ai.racing = true;
    ai.finished = false;
  });
  cam.yaw = car.yaw;
  notify("Seeland-Sprint · 1 Runde · 6 Fahrer", "blue");
}

function endRaceCruise() {
  race.state = "none";
  cpRing.visible = false;
  for (const ai of aiCars) { ai.racing = false; ai.laneTarget = -3; }
}

function abortRace() {
  if (race.state === "none") return;
  endRaceCruise();
  notify("Rennen abgebrochen", "red");
}

function updateRace(dt) {
  if (race.state === "none") return;
  if (race.state === "countdown") {
    race.t -= dt;
    if (race.t <= 0) {
      race.state = "running";
      race.flash = 1;
    }
  } else if (race.state === "running") {
    race.time += dt;
    const cp = race.cps[race.next];
    if (Math.hypot(car.x - cp.x, car.z - cp.z) < ROAD_W + 3) {
      race.next++;
      if (race.next >= race.cps.length) return finishRace();
      notify(`Checkpoint ${race.next}/${race.cps.length - 1}  ·  ${fmtTime(race.time)}`, "blue");
    }
  }
  race.flash -= dt;
  const cp = race.cps[race.next];
  cpRing.visible = true;
  cpRing.position.set(cp.x, roadHeight(cp.x, cp.z) + 4, cp.z);
  cpRing.rotation.set(0, cp.yaw, 0);
  cpRing.material.color.set(race.next === race.cps.length - 1 ? 0xffd23f : 0x19c3ff);
}

function racePosition() {
  const me = playerRaceProgress();
  return 1 + aiCars.filter((a) => (a.finished ? Infinity : a.s) > me).length;
}

function finishRace() {
  const time = race.time;
  const place = 1 + aiCars.filter((a) => a.finished).length;
  const reward = [25000, 16000, 11000, 7000, 5000, 3000][place - 1];
  save.credits += reward;
  save.races++;
  if (place === 1) save.wins++;
  const newBest = !save.bestRace || time < save.bestRace;
  if (newBest) save.bestRace = time;
  storeSave();

  // Ergebnistabelle: noch fahrende KI-Autos bekommen eine geschätzte Zeit
  const L = roads[0].length;
  const rows = aiCars.map((a) => ({
    name: `${a.name} (${a.spec.name})`,
    time: a.finished ? a.finishTime : time + (L - a.s) / Math.max(a.speed, 10),
  }));
  rows.push({ name: `Du (${carSpec.name})`, time, me: true });
  rows.sort((a, b) => a.time - b.time);
  $("results-title").textContent = place === 1 ? "🏆 Sieg!" : `Platz ${place} von ${rows.length}`;
  $("results-table").innerHTML = rows.map((r, i) =>
    `<tr class="${r.me ? "me" : ""}"><td>${i + 1}.</td><td>${r.name}</td><td>${fmtTime(r.time)}</td></tr>`).join("");
  $("results-reward").textContent = `+${fmt(reward)} CHF` + (newBest ? " · Neue Bestzeit!" : "");
  endRaceCruise();
  setMode("results");
}

// =====================================================================
// 11. Kamera, Effekte, Ton
// =====================================================================
const cam = { yaw: 0, mode: 0, shake: 0, pos: new THREE.Vector3(), orbit: 0 };

function updateCamera(dt) {
  const speed = Math.hypot(car.vx, car.vz);
  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  if (mode === "title" || mode === "garage" || mode === "tuning") {
    const menu = mode !== "title";
    cam.orbit += dt * 0.25;
    const r = menu ? 7.5 : 11;
    camera.position.set(car.x + Math.sin(cam.orbit) * r, car.y + (menu ? 2.2 : 3.5), car.z + Math.cos(cam.orbit) * r);
    // in Garage/Werkstatt das Auto etwas nach rechts schieben, weil links die Liste ist
    const side = menu ? 1.6 : 0;
    camera.lookAt(car.x - Math.cos(cam.orbit) * side, car.y + 0.9, car.z + Math.sin(cam.orbit) * side);
    camera.fov = 55;
  } else if (cam.mode === 0) {
    cam.yaw += angleDiff(cam.yaw, car.yaw) * (1 - Math.exp(-5 * dt));
    const dist = 7.2 + speed * 0.035, height = 2.5 + speed * 0.01;
    const want = new THREE.Vector3(car.x - Math.sin(cam.yaw) * dist, car.y + height, car.z - Math.cos(cam.yaw) * dist);
    want.y = Math.max(want.y, driveHeight(want.x, want.z) + 1.2);
    cam.pos.lerp(want, 1 - Math.exp(-18 * dt));
    camera.position.copy(cam.pos);
    camera.lookAt(car.x + fx * 3, car.y + 1.3, car.z + fz * 3);
    camera.fov = lerp(camera.fov, Math.min(90, 62 + speed * 0.32), 1 - Math.exp(-3 * dt));
  } else {
    // Motorhauben-Kamera
    const b = carSpec.body;
    camera.position.set(car.x + fx * 0.6, car.y + b.ride + b.h + b.ch + 0.15, car.z + fz * 0.6);
    camera.lookAt(car.x + fx * 30, car.y + 1.2 + car.slope * 30, car.z + fz * 30);
    camera.fov = lerp(camera.fov, Math.min(95, 68 + speed * 0.32), 1 - Math.exp(-3 * dt));
    cam.pos.copy(camera.position);
  }
  if (cam.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * cam.shake;
    camera.position.y += (Math.random() - 0.5) * cam.shake;
    cam.shake = Math.max(0, cam.shake - dt * 1.5);
  }
  camera.updateProjectionMatrix();
  sky.position.copy(camera.position);
  sun.position.set(car.x + SUN_OFFSET.x, car.y + SUN_OFFSET.y, car.z + SUN_OFFSET.z);
  sun.target.position.set(car.x, car.y, car.z);
}

// Reifenqualm
const smokeTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const smoke = Array.from({ length: 70 }, () => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0, fog: false }));
  s.visible = false;
  scene.add(s);
  return { s, life: 0, max: 1 };
});
let smokeIdx = 0, smokeAcc = 0;
function updateSmoke(dt, amount, color) {
  smokeAcc += amount * dt * 40;
  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  const b = carSpec.body;
  while (smokeAcc > 1) {
    smokeAcc--;
    const p = smoke[smokeIdx++ % smoke.length];
    const side = Math.random() < 0.5 ? -1 : 1;
    p.s.position.set(car.x - fx * b.wb / 2 + fz * side * b.w * 0.45, car.y + 0.4, car.z - fz * b.wb / 2 - fx * side * b.w * 0.45);
    p.s.material.color.set(color);
    p.life = p.max = 0.8 + Math.random() * 0.6;
    p.s.visible = true;
  }
  for (const p of smoke) {
    if (p.life <= 0) continue;
    p.life -= dt;
    const t = 1 - p.life / p.max;
    p.s.scale.setScalar(1 + t * 4);
    p.s.position.y += dt * 1.2;
    p.s.material.opacity = 0.45 * (1 - t);
    if (p.life <= 0) p.s.visible = false;
  }
}

// Motorsound mit der Web Audio API (keine Sounddateien nötig)
let audio = null, muted = false;
function initAudio() {
  if (audio) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    o1.type = "sawtooth"; o2.type = "square";
    const filt = ctx.createBiquadFilter();
    filt.type = "lowpass";
    const eg = ctx.createGain();
    eg.gain.value = 0;
    o1.connect(filt); o2.connect(filt); filt.connect(eg); eg.connect(master);
    o1.start(); o2.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1700; bp.Q.value = 2.5;
    const sg = ctx.createGain();
    sg.gain.value = 0;
    noise.connect(bp); bp.connect(sg); sg.connect(master);
    noise.start();
    audio = { ctx, o1, o2, filt, eg, sg };
  } catch { /* kein Ton verfügbar */ }
}
function updateAudio(rpm, throttle, skid, on) {
  if (!audio) return;
  const t = audio.ctx.currentTime;
  const f = rpm / 30;
  audio.o1.frequency.setTargetAtTime(f, t, 0.04);
  audio.o2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
  audio.filt.frequency.setTargetAtTime(350 + throttle * 1100 + rpm * 0.08, t, 0.08);
  const live = on && !muted;
  audio.eg.gain.setTargetAtTime(live ? 0.05 + throttle * 0.06 : 0, t, 0.05);
  audio.sg.gain.setTargetAtTime(live ? skid * 0.1 : 0, t, 0.05);
}

// Gang und Drehzahl (nur für Anzeige und Sound)
function gearInfo() {
  const v = Math.abs(car.vF);
  if (car.vF < -0.5) return { gear: "R", rpm: 1500 + v * 250 };
  const ratios = [0.2, 0.34, 0.49, 0.65, 0.82, 1.01];
  let lo = 0;
  for (let i = 0; i < ratios.length; i++) {
    const hi = carSpec.top * ratios[i];
    if (v < hi || i === ratios.length - 1) {
      return { gear: String(i + 1), rpm: clamp(1100 + (v - lo) / (hi - lo) * 6200, 900, 7600) };
    }
    lo = hi * 0.72;
  }
}

// =====================================================================
// 12. HUD & Menüs
// =====================================================================
let mode = "title"; // title | drive | pause | results | garage | tuning
let garageBack = "title";

function setMode(m) {
  mode = m;
  $("title").classList.toggle("hidden", m !== "title");
  $("pause").classList.toggle("hidden", m !== "pause");
  $("results").classList.toggle("hidden", m !== "results");
  $("garage").classList.toggle("hidden", m !== "garage");
  $("tuning").classList.toggle("hidden", m !== "tuning");
  $("hud").classList.toggle("hidden", m === "title" || m === "garage" || m === "tuning");
  if (m === "pause") renderStats();
  if (m === "garage") renderGarage();
  if (m === "tuning") renderTuning();
}

function notify(text, cls) {
  const d = document.createElement("div");
  d.className = "note " + (cls || "");
  d.textContent = text;
  $("notes").appendChild(d);
  setTimeout(() => d.remove(), 3200);
  while ($("notes").children.length > 4) $("notes").firstChild.remove();
}

function renderStats() {
  const rows = [
    ["Credits", `${fmt(save.credits)} CHF`],
    ["Skillpunkte", fmt(save.skillPoints)],
    ["Rennen / Siege", `${save.races} / ${save.wins}`],
    ["Bestzeit Seeland-Sprint", save.bestRace ? fmtTime(save.bestRace) : "–"],
    ["Beste Driftzone", fmt(save.bestDrift)],
    ...traps.map((t) => [t.name, save.traps[t.name] ? `${save.traps[t.name]} km/h` : "–"]),
    ["Auto", carSpec.name],
    ["Grafik (Q)", QUALITY[quality].name],
  ];
  $("stats").innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join("");
}

// --- Garage ---
let garageSel = 0;
function renderGarage() {
  const list = $("car-list");
  list.innerHTML = CARS.map((base, i) => {
    const c = tunedSpec(base, tuningOf(base.id));
    const cl = carClass(c);
    const col = "#" + c.color.toString(16).padStart(6, "0");
    const tuned = carRating(c) !== carRating(base);
    return `<div class="car-item ${i === garageSel ? "sel" : ""}" data-i="${i}">
      <div class="swatch" style="background:${col}"></div>
      <div class="name">${c.name}<br><small style="opacity:.7;font-weight:400">${c.kind}${tuned ? " · getunt" : ""}${c.id === carSpec.id ? " · gewählt" : ""}</small></div>
      <div class="pi" style="background:${cl.color}">${cl.name} ${carRating(c)}</div>
    </div>`;
  }).join("");
  const c = tunedSpec(CARS[garageSel], tuningOf(CARS[garageSel].id));
  const bar = (label, v) => `<div class="bar"><span>${label}</span><div><i style="width:${clamp(v, 0.05, 1) * 100}%"></i></div></div>`;
  $("car-bars").innerHTML =
    bar(`Tempo ${Math.round(kmh(c.top))} km/h`, (c.top - 40) / 55) +
    bar("Beschleunigung", (c.accel - 6) / 10) +
    bar("Grip", (c.grip - 4) / 4.5) +
    bar("Gelände", c.off);
  $("car-desc").textContent = c.desc;
  list.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
}
$("car-list").addEventListener("click", (e) => {
  const item = e.target.closest(".car-item");
  if (!item) return;
  garageSel = Number(item.dataset.i);
  previewCar();
});
$("car-list").addEventListener("dblclick", () => chooseCar());
function previewCar() {
  setPlayerCar(CARS[garageSel]);
  renderGarage();
}
function openGarage() {
  if (race.state !== "none") { notify("Während eines Rennens geht das nicht", "red"); return; }
  garageBack = mode === "title" ? "title" : "drive";
  garageSel = CARS.indexOf(carBase);
  car.vx = car.vz = car.vF = car.vS = 0;
  setMode("garage");
}
function chooseCar() {
  setPlayerCar(CARS[garageSel]);
  notify(`${carSpec.name} ausgewählt`, "gold");
  if (garageBack === "title") startDriving();
  else setMode(garageBack);
}

// --- Tuning-Werkstatt ---
// Zeilen: zuerst die Leistungsteile, dann Optik, ganz unten die Lackierung
let tuneSel = 0, paintSel = 0, tuneBack = "drive";
const TUNE_ROWS = UPGRADES.length + OPTICS.length + 1;
const PAINT_ROW = TUNE_ROWS - 1;
const hex = (c) => "#" + c.toString(16).padStart(6, "0");

function openTuning(back) {
  if (race.state !== "none") { notify("Während eines Rennens geht das nicht", "red"); return; }
  tuneBack = back || (mode === "garage" ? "garage" : "drive");
  car.vx = car.vz = car.vF = car.vS = 0;
  const t = tuningOf(carBase.id);
  paintSel = Math.max(0, PAINTS.findIndex(([c]) => c === (t.paint ?? null)));
  setMode("tuning");
}
function closeTuning() {
  setPlayerCar(carBase); // Farbvorschau zurücksetzen
  setMode(tuneBack);
}

// Wie sähe das Auto aus, wenn die gewählte Zeile gekauft würde?
function tunePreview() {
  const t = tuningOf(carBase.id);
  if (tuneSel < UPGRADES.length) {
    const u = UPGRADES[tuneSel];
    return tunedSpec(carBase, { ...t, [u.key]: Math.min(3, (t[u.key] || 0) + 1) });
  }
  if (tuneSel < PAINT_ROW) {
    const o = OPTICS[tuneSel - UPGRADES.length];
    const on = !!t[o.key] && t[o.key + "On"] !== false;
    return tunedSpec(carBase, { ...t, [o.key]: true, [o.key + "On"]: !on });
  }
  return tunedSpec(carBase, { ...t, paint: PAINTS[paintSel][0] });
}

function renderTuning() {
  const t = tuningOf(carBase.id);
  const cl = carClass(carSpec);
  $("tune-head").innerHTML = `${carBase.name} <span class="pi" style="background:${cl.color}">${cl.name} ${carRating(carSpec)}</span>`;
  $("tune-money").textContent = `${fmt(save.credits)} CHF`;
  const row = (i, name, sub, right, cls = "") =>
    `<div class="tune-row ${i === tuneSel ? "sel" : ""} ${cls}" data-i="${i}"><div class="name">${name}<small>${sub}</small></div>${right}</div>`;
  let html = '<div class="tune-label">Leistung</div>';
  UPGRADES.forEach((u, i) => {
    const lvl = t[u.key] || 0;
    const pips = `<div class="pips">${[1, 2, 3].map((k) => `<i class="${k <= lvl ? "on" : ""}"></i>`).join("")}</div>`;
    const price = lvl >= 3 ? '<div class="price max">MAX</div>'
      : `<div class="price ${save.credits >= TUNE_PRICES[lvl + 1] ? "" : "no"}">${fmt(TUNE_PRICES[lvl + 1])} CHF</div>`;
    html += row(i, u.name, `${TUNE_LEVELS[lvl]}${lvl < 3 ? " → " + TUNE_LEVELS[lvl + 1] : ""}`, pips + price);
  });
  html += '<div class="tune-label">Optik</div>';
  OPTICS.forEach((o, k) => {
    if (o.extra && carBase.body.extras.includes(o.extra)) {
      html += row(UPGRADES.length + k, o.name, "schon serienmässig dabei", '<div class="price max">Serie</div>');
      return;
    }
    const owned = !!t[o.key], on = owned && t[o.key + "On"] !== false;
    const right = owned ? `<div class="price">${on ? "Ausbauen" : "Einbauen"}</div>`
      : `<div class="price ${save.credits >= o.price ? "" : "no"}">${fmt(o.price)} CHF</div>`;
    html += row(UPGRADES.length + k, o.name, owned ? (on ? "eingebaut" : "gekauft") : "nicht gekauft", right);
  });
  html += '<div class="tune-label">Lackierung</div>';
  const sw = PAINTS.map(([c, name], k) =>
    `<span class="sw ${k === paintSel ? "sel" : ""}" data-p="${k}" title="${name}" style="background:${hex(c ?? carBase.color)}"></span>`).join("");
  const current = (t.paint ?? null) === PAINTS[paintSel][0];
  const paintInfo = current ? "aktuelle Farbe" : paintSel === 0 ? "gratis" : `${fmt(PAINT_PRICE)} CHF`;
  html += row(PAINT_ROW, PAINTS[paintSel][1], `${paintInfo} · ← → Farbe wählen`,
    "", "paint") + `<div class="swatches">${sw}</div>`;
  $("tune-list").innerHTML = html;

  // Balken: jetzt (gelb) und nach dem Kauf (grün)
  const prev = tunePreview();
  const bar = (label, a, b) => `<div class="bar"><span>${label}</span><div><b style="width:${clamp(b, 0.03, 1) * 100}%"></b><i style="width:${clamp(a, 0.03, 1) * 100}%"></i></div></div>`;
  $("tune-bars").innerHTML =
    bar(`Tempo ${Math.round(kmh(carSpec.top))} km/h`, (carSpec.top - 40) / 70, (prev.top - 40) / 70) +
    bar("Beschleunigung", (carSpec.accel - 6) / 18, (prev.accel - 6) / 18) +
    bar("Grip", (carSpec.grip - 4) / 7, (prev.grip - 4) / 7) +
    bar("Gelände", carSpec.off, prev.off);
  const pc = carClass(prev);
  const desc = tuneSel < UPGRADES.length ? UPGRADES[tuneSel].desc
    : tuneSel < PAINT_ROW ? OPTICS[tuneSel - UPGRADES.length].desc : "Neue Farbe für dein Auto.";
  $("tune-desc").innerHTML = `${desc}<br><span style="opacity:.75">Danach: Klasse ${pc.name} ${carRating(prev)}</span>`;
  $("tune-list").querySelector(tuneSel === PAINT_ROW ? ".swatches" : ".sel")?.scrollIntoView({ block: "nearest" });

  // In der Lackier-Zeile die Farbe gleich am Auto zeigen
  showCarMesh(tuneSel === PAINT_ROW ? prev : carSpec);
}

function buyTuning() {
  const t = tuningOf(carBase.id);
  let price, apply, label;
  if (tuneSel < UPGRADES.length) {
    const u = UPGRADES[tuneSel], lvl = t[u.key] || 0;
    if (lvl >= 3) { notify(`${u.name} ist schon auf Maximum`, ""); return; }
    price = TUNE_PRICES[lvl + 1];
    apply = () => { t[u.key] = lvl + 1; };
    label = `${u.name}: ${TUNE_LEVELS[lvl + 1]} eingebaut!`;
  } else if (tuneSel < PAINT_ROW) {
    const o = OPTICS[tuneSel - UPGRADES.length];
    if (o.extra && carBase.body.extras.includes(o.extra)) { notify(`${o.name}: hat dieses Auto schon ab Werk`, ""); return; }
    if (t[o.key]) {
      // schon gekauft: gratis ein- oder ausbauen
      const on = t[o.key + "On"] !== false;
      t[o.key + "On"] = !on;
      setPlayerCar(carBase);
      notify(`${o.name} ${on ? "ausgebaut" : "eingebaut"}`, "");
      renderTuning();
      return;
    }
    price = o.price;
    apply = () => { t[o.key] = true; t[o.key + "On"] = true; };
    label = `${o.name} eingebaut!`;
  } else {
    const [c, name] = PAINTS[paintSel];
    if ((t.paint ?? null) === c) { notify("Das Auto hat schon diese Farbe", ""); return; }
    price = paintSel === 0 ? 0 : PAINT_PRICE;
    apply = () => { t.paint = c; };
    label = `Neu lackiert: ${name}!`;
  }
  if (save.credits < price) {
    notify(`Zu wenig Geld: Dir fehlen noch ${fmt(price - save.credits)} CHF`, "red");
    return;
  }
  const before = carClass(carSpec).name;
  save.credits -= price;
  apply();
  setPlayerCar(carBase); // speichert auch
  const after = carClass(carSpec).name;
  notify(`${label}${price ? `  −${fmt(price)} CHF` : ""}${after !== before ? `  ·  Klasse ${before} → ${after}` : ""}`, "gold");
  renderTuning();
}

$("tune-list").addEventListener("click", (e) => {
  const swatch = e.target.closest(".sw");
  if (swatch) { tuneSel = PAINT_ROW; paintSel = Number(swatch.dataset.p); renderTuning(); return; }
  const r = e.target.closest(".tune-row");
  if (!r) return;
  const i = Number(r.dataset.i);
  if (i === tuneSel) buyTuning();
  else { tuneSel = i; renderTuning(); }
});
$("tune-buy").addEventListener("click", () => buyTuning());

// Startbonus, damit man die Werkstatt gleich ausprobieren kann
function startDriving() {
  setMode("drive");
  notify("Grüezi! Willkommen beim Alpenfestival!", "");
  if (!save.bonus) {
    save.bonus = true;
    save.credits += 25000;
    storeSave();
    notify("Startbonus: 25'000 CHF für die Tuning-Werkstatt (Taste T)", "gold");
  }
}

// --- Speedometer ---
const speedoCtx = $("speedo").getContext("2d");
function drawSpeedo(speed, rpm, gear) {
  const c = speedoCtx, cx = 110, cy = 112, r = 88;
  c.clearRect(0, 0, 220, 220);
  c.beginPath();
  c.arc(cx, cy, r + 10, 0, Math.PI * 2);
  c.fillStyle = "rgba(10,15,35,0.55)";
  c.fill();
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  c.lineCap = "round";
  c.lineWidth = 10;
  c.strokeStyle = "rgba(255,255,255,0.15)";
  c.beginPath(); c.arc(cx, cy, r - 4, a0, a1); c.stroke();
  const f = clamp((rpm - 800) / 6900, 0, 1);
  c.strokeStyle = f > 0.85 ? "#ff4b4b" : "#ffd23f";
  c.beginPath(); c.arc(cx, cy, r - 4, a0, a0 + (a1 - a0) * f); c.stroke();
  c.fillStyle = "#fff";
  c.textAlign = "center";
  c.font = "italic 900 56px system-ui, sans-serif";
  c.fillText(Math.round(speed), cx, cy + 14);
  c.font = "700 13px system-ui, sans-serif";
  c.fillStyle = "rgba(255,255,255,0.7)";
  c.fillText("KM/H", cx, cy + 34);
  c.font = "italic 900 26px system-ui, sans-serif";
  c.fillStyle = "#19c3ff";
  c.fillText(gear, cx, cy + 72);
}

// --- Minimap ---
const MAP_PX = 800; // 2 m pro Pixel
const mapImg = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = MAP_PX;
  const g = c.getContext("2d");
  const img = g.createImageData(MAP_PX, MAP_PX);
  for (let py = 0; py < MAP_PX; py++) for (let px = 0; px < MAP_PX; px++) {
    const x = px * 2 - HALF, z = py * 2 - HALF;
    const h = baseHeight(x, z) + detailHeight(x, z);
    const i = (py * MAP_PX + px) * 4;
    let col;
    if (h < WATER) col = [40, 130, 200];
    else if (h > 36) col = [120, 125, 110];
    else col = [70 + h, 120 + h * 0.8, 60];
    img.data.set([col[0], col[1], col[2], 255], i);
  }
  g.putImageData(img, 0, 0);
  g.lineCap = g.lineJoin = "round";
  for (const [w, col] of [[9, "#2a2d33"], [5, "#e9edf2"]]) {
    g.lineWidth = w;
    g.strokeStyle = col;
    for (const r of roads) {
      g.beginPath();
      r.samples.forEach((s, i) => {
        const x = (s.x + HALF) / 2, y = (s.z + HALF) / 2;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      });
      if (r.closed) g.closePath();
      g.stroke();
    }
  }
  return c;
})();
const mapCtx = $("minimap").getContext("2d");
function drawMinimap() {
  const g = mapCtx, R = 100, scale = 0.8; // 0.8 Pixel pro Map-Pixel -> ca. 250 m Radius
  g.save();
  g.clearRect(0, 0, 200, 200);
  g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#4a7a3a";
  g.fillRect(0, 0, 200, 200);
  g.translate(R, R);
  // Karte so drehen, dass die Fahrtrichtung oben ist
  const phi = Math.atan2(Math.cos(car.yaw), Math.sin(car.yaw));
  g.rotate(-Math.PI / 2 - phi);
  g.scale(scale, scale);
  const px = (car.x + HALF) / 2, py = (car.z + HALF) / 2;
  g.translate(-px, -py);
  g.drawImage(mapImg, 0, 0);
  const dot = (x, z, col, r) => {
    g.beginPath();
    g.arc((x + HALF) / 2, (z + HALF) / 2, r / scale, 0, Math.PI * 2);
    g.fillStyle = col; g.fill();
    g.lineWidth = 1.5 / scale; g.strokeStyle = "#fff"; g.stroke();
  };
  if (race.state === "none") dot(raceMarkerPos.x, raceMarkerPos.z, "#19a8ff", 7);
  for (const t of traps) dot(t.x, t.z, "#8a5cff", 5);
  dot(driftZone.ax, driftZone.az, "#ff8a00", 6);
  if (race.state !== "none") { const cp = race.cps[race.next]; dot(cp.x, cp.z, "#ffd23f", 7); }
  for (const ai of aiCars) dot(ai.x, ai.z, "#" + ai.spec.color.toString(16).padStart(6, "0"), 4);
  g.restore();
  // Spielerpfeil
  g.fillStyle = "#ff2e88";
  g.strokeStyle = "#fff";
  g.lineWidth = 2;
  g.beginPath(); g.moveTo(R, R - 9); g.lineTo(R + 7, R + 7); g.lineTo(R, R + 3); g.lineTo(R - 7, R + 7); g.closePath();
  g.fill(); g.stroke();
}

let promptText = "";
function updateHUD(speedKmh, gear, rpm) {
  drawSpeedo(speedKmh, rpm, gear);
  drawMinimap();
  $("carname").textContent = `${carClass(carSpec).name} · ${carSpec.name}`;
  $("location").textContent = car.surface === "water" ? "Im Wasser!" : car.roadName || "Gelände";
  $("wallet").innerHTML = `<div class="cr">${fmt(save.credits)} CHF</div><div class="sp">${fmt(save.skillPoints)} Skillpunkte</div>`;

  const ri = $("race-info");
  if (race.state !== "none") {
    ri.classList.remove("hidden");
    ri.innerHTML = `<div class="pos">${racePosition()}<small>/${aiCars.length + 1}</small></div>
      <div class="row">⏱ ${fmtTime(race.time)}</div>
      <div class="row">Checkpoint ${race.next}/${race.cps.length - 1}</div>`;
  } else ri.classList.add("hidden");

  const cd = $("countdown");
  if (race.state === "countdown") { cd.classList.remove("hidden"); cd.textContent = Math.ceil(race.t); }
  else if (race.flash > 0 && race.state === "running") { cd.classList.remove("hidden"); cd.textContent = "LOS!"; }
  else cd.classList.add("hidden");

  const sk = $("skill");
  const show = skill.active || skill.chain > 0;
  sk.classList.toggle("hidden", !show);
  if (show) {
    $("skill-current").textContent = skill.active
      ? `${skill.active.toUpperCase()} ${fmt(skill.activePts)}`
      : skill.lastShow > 0 ? skill.lastName : "";
    $("skill-chain").textContent = skill.chain > 0 ? `${fmt(skill.chain)} ×${skill.mult}` : "";
    $("skill-bar").firstElementChild.style.width = `${(skill.timer / CHAIN_TIME) * 100}%`;
  }

  const pr = $("prompt");
  pr.classList.toggle("hidden", !promptText);
  pr.textContent = promptText;
}

// =====================================================================
// 13. Eingabe & Spielschleife
// =====================================================================
const keys = {};
addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Backspace"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  initAudio();
  if (audio && audio.ctx.state === "suspended") audio.ctx.resume();

  if (mode === "title") {
    if (e.code === "Enter") startDriving();
    if (e.code === "KeyG") openGarage();
  } else if (mode === "tuning") {
    if (e.code === "ArrowUp" || e.code === "KeyW") { tuneSel = (tuneSel - 1 + TUNE_ROWS) % TUNE_ROWS; renderTuning(); }
    if (e.code === "ArrowDown" || e.code === "KeyS") { tuneSel = (tuneSel + 1) % TUNE_ROWS; renderTuning(); }
    if ((e.code === "ArrowLeft" || e.code === "KeyA" || e.code === "ArrowRight" || e.code === "KeyD")) {
      tuneSel = PAINT_ROW;
      const d = e.code === "ArrowLeft" || e.code === "KeyA" ? -1 : 1;
      paintSel = (paintSel + d + PAINTS.length) % PAINTS.length;
      renderTuning();
    }
    if (e.code === "Enter" || e.code === "Space") buyTuning();
    if (e.code === "Escape" || e.code === "KeyT") closeTuning();
  } else if (mode === "garage") {
    if (e.code === "KeyT") { setPlayerCar(CARS[garageSel]); openTuning("garage"); }
    if (e.code === "ArrowUp" || e.code === "KeyW") { garageSel = (garageSel - 1 + CARS.length) % CARS.length; previewCar(); }
    if (e.code === "ArrowDown" || e.code === "KeyS") { garageSel = (garageSel + 1) % CARS.length; previewCar(); }
    if (e.code === "Enter") chooseCar();
    if (e.code === "Escape") setMode(garageBack === "title" ? "title" : "drive");
  } else if (mode === "results") {
    if (e.code === "Enter") setMode("drive");
  } else if (mode === "pause") {
    if (e.code === "Escape") setMode("drive");
    if (e.code === "KeyG") openGarage();
    if (e.code === "KeyT") openTuning("drive");
    if (e.code === "KeyQ") { setQuality((quality + 1) % QUALITY.length, true); notify(`Grafik: ${QUALITY[quality].name}`, ""); renderStats(); }
    if (e.code === "Backspace") { abortRace(); setMode("drive"); }
  } else if (mode === "drive") {
    if (e.code === "Escape") setMode("pause");
    if (e.code === "KeyC") cam.mode = 1 - cam.mode;
    if (e.code === "KeyM") muted = !muted;
    if (e.code === "KeyR" && race.state !== "countdown") resetToRoad();
    if (e.code === "KeyG") openGarage();
    if (e.code === "KeyT") openTuning("drive");
    if (e.code === "KeyQ") { setQuality((quality + 1) % QUALITY.length, true); notify(`Grafik: ${QUALITY[quality].name}`, ""); }
    if (e.code === "Backspace") abortRace();
    if (e.code === "Enter" && race.state === "none" && nearRaceStart() && Math.hypot(car.vx, car.vz) < 8) startRace();
  }
});
addEventListener("keyup", (e) => { keys[e.code] = false; });
// Klick auf das Titelbild startet ebenfalls (und gibt dem Spiel den Tastatur-Fokus)
$("title").addEventListener("click", () => {
  window.focus();
  initAudio();
  startDriving();
});
addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

function nearRaceStart() {
  return Math.hypot(car.x - raceMarkerPos.x, car.z - raceMarkerPos.z) < 12;
}

function readInput() {
  const locked = mode !== "drive" || race.state === "countdown";
  if (locked) return { throttle: false, brake: false, handbrake: mode !== "drive", steer: 0 };
  return {
    throttle: !!(keys.KeyW || keys.ArrowUp),
    brake: !!(keys.KeyS || keys.ArrowDown),
    handbrake: !!keys.Space,
    steer: (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0),
  };
}

function update(dt) {
  const inp = readInput();
  if (race.state === "countdown") { car.vx = car.vz = 0; }

  // Lenkung weich nachführen
  const steerSpeed = inp.steer === 0 ? 6 : 4;
  car.steer += clamp(inp.steer - car.steer, -steerSpeed * dt, steerSpeed * dt);

  // Untergrund und Hangneigung bestimmen
  const road = nearestRoad(car.x, car.z);
  const gh = groundHeight(car.x, car.z, road);
  car.surface = gh < WATER - 0.3 ? "water" : road && road.dist < ROAD_W / 2 + 0.8 ? "road" : "grass";
  car.roadName = road && road.dist < ROAD_W ? roads[road.s.road].name : "";
  const fx = Math.sin(car.yaw), fz = Math.cos(car.yaw);
  const hf = driveHeight(car.x + fx * 1.6, car.z + fz * 1.6), hb = driveHeight(car.x - fx * 1.6, car.z - fz * 1.6);
  const hl = driveHeight(car.x + fz * 1, car.z - fx * 1), hr = driveHeight(car.x - fz * 1, car.z + fx * 1);
  car.slope = (hf - hb) / 3.2;

  // Physik in kleinen Schritten
  const steps = Math.ceil(dt / (1 / 120));
  for (let i = 0; i < steps; i++) stepCar(dt / steps, inp);
  collideCar();

  // Neigung des Autos an den Boden anpassen
  if (car.onGround) {
    car.pitch = lerp(car.pitch, Math.atan2(hf - hb, 3.2), 1 - Math.exp(-12 * dt));
    car.roll = lerp(car.roll, Math.atan2(hl - hr, 2), 1 - Math.exp(-12 * dt));
  }
  const lean = clamp(car.vS * 0.012 - car.steer * Math.abs(car.vF) * 0.0015, -0.08, 0.08);
  playerMesh.group.position.set(car.x, car.y, car.z);
  playerMesh.group.rotation.set(-car.pitch, car.yaw, car.roll + lean, "YXZ");
  car.wheelSpin += car.vF * dt / playerMesh.radius;
  for (const w of playerMesh.wheels) {
    w.spin.rotation.x = car.wheelSpin;
    if (w.front) w.pivot.rotation.y = car.steer * 0.45;
  }
  playerMesh.tail.emissiveIntensity = inp.brake && car.vF > 0.5 ? 2.5 : 0.4;

  // KI, Rennen, Events, Skills
  for (const ai of aiCars) updateAI(ai, dt, race.state === "countdown" || mode !== "drive");
  if (mode === "drive") {
    updateRace(dt);
    updateEvents(dt, road);
    updateSkills(dt);
  }
  skill.lastShow -= dt;

  // Hinweistext
  promptText = "";
  if (mode === "drive" && race.state === "none" && nearRaceStart()) {
    promptText = Math.hypot(car.vx, car.vz) < 8
      ? "ENTER – Rennen starten: Seeland-Sprint (6 Fahrer)"
      : "Langsamer werden, um das Rennen zu starten";
  }
  raceBeam.visible = race.state === "none";

  // Effekte und Ton
  const drifting = car.onGround && Math.abs(car.vS) > 3 && Math.abs(car.vF) > 5;
  const skid = drifting ? clamp(Math.abs(car.vS) / 10, 0.2, 1) : 0;
  const dusty = car.surface === "grass" && car.onGround && Math.hypot(car.vx, car.vz) > 10;
  updateSmoke(dt, drifting ? skid : dusty ? 0.4 : 0, car.surface === "road" ? 0xdddddd : 0xb59a6a);
  const gi = gearInfo();
  updateAudio(gi.rpm, inp.throttle ? 1 : 0, car.surface === "road" ? skid : 0, mode === "drive");
  water.material.normalMap.offset.x += dt * 0.004;
  water.material.normalMap.offset.y += dt * 0.0025;
  updateCamera(dt);
  if (mode !== "title" && mode !== "garage" && mode !== "tuning") updateHUD(kmh(Math.abs(car.vF)), gi.gear, gi.rpm);
}

// =====================================================================
// Grafik-Qualität, Nachbearbeitung (Bloom, Farbabstimmung) und Lensflare
// =====================================================================
const QUALITY = [
  { name: "Niedrig", ratio: 0.8, shadow: 1024, range: 55, grass: 0, post: false },
  { name: "Mittel", ratio: 1, shadow: 2048, range: 80, grass: 30000, post: true },
  { name: "Hoch", ratio: 1.5, shadow: 4096, range: 110, grass: GRASS_MAX, post: true },
];
let quality = clamp(save.quality ?? 2, 0, QUALITY.length - 1);

// Bild erst in eine Zwischen-Textur rendern (mit Kantenglättung), dann Effekte darüber
const composer = new THREE.EffectComposer(renderer,
  new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 }));
composer.addPass(new THREE.RenderPass(scene, camera));
const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.25, 0.6, 1.5);
composer.addPass(bloomPass);
composer.addPass(new THREE.OutputPass());
// Farbabstimmung wie bei einer Filmkamera: etwas mehr Kontrast und Sättigung,
// warme Lichter, kühle Schatten, Vignette, feines Korn und Tempo-Unschärfe am Rand
const gradePass = new THREE.ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSpeed: { value: 0 } },
  vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uSpeed; varying vec2 vUv;
    void main() {
      vec2 d = vUv - 0.5;
      float blur = uSpeed * 0.02 * smoothstep(0.15, 0.6, length(d));
      vec3 col = vec3(0.0);
      for (int i = 0; i < 6; i++) col += texture2D(tDiffuse, vUv - d * blur * float(i) / 6.0).rgb;
      col /= 6.0;
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(l), col, 1.1);
      col = (col - 0.5) * 1.05 + 0.5;
      col *= mix(vec3(0.97, 0.99, 1.04), vec3(1.03, 1.0, 0.96), smoothstep(0.2, 0.8, l));
      col *= mix(0.8, 1.0, smoothstep(0.9, 0.3, length(d * vec2(1.0, 0.75))));
      float n = fract(sin(dot(vUv * 913.0 + fract(uTime) * 37.0, vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * 0.012;
      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`,
});
composer.addPass(gradePass);

// Lichtreflex der Sonne in der Kameralinse
const flareLight = (() => {
  const tex = (draw) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    draw(c.getContext("2d"));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = SRGB;
    return t;
  };
  const glow = tex((g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,250,235,1)"); gr.addColorStop(0.15, "rgba(255,230,180,0.6)"); gr.addColorStop(1, "rgba(255,200,140,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const ring = tex((g) => {
    const gr = g.createRadialGradient(64, 64, 30, 64, 64, 64);
    gr.addColorStop(0, "rgba(160,200,255,0)"); gr.addColorStop(0.8, "rgba(170,210,255,0.25)"); gr.addColorStop(1, "rgba(170,210,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const light = new THREE.PointLight(0xffffff, 0, 1); // leuchtet nicht, trägt nur den Linsenreflex
  const lf = new THREE.Lensflare();
  lf.addElement(new THREE.LensflareElement(glow, 420, 0, new THREE.Color(1, 0.95, 0.85)));
  lf.addElement(new THREE.LensflareElement(ring, 70, 0.55));
  lf.addElement(new THREE.LensflareElement(ring, 110, 0.75));
  lf.addElement(new THREE.LensflareElement(glow, 60, 0.9, new THREE.Color(0.6, 0.8, 1)));
  lf.addElement(new THREE.LensflareElement(ring, 160, 1.05));
  light.add(lf);
  scene.add(light);
  return light;
})();

function applyQuality() {
  const q = QUALITY[quality];
  renderer.setPixelRatio(Math.min(devicePixelRatio, q.ratio));
  renderer.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(Math.min(devicePixelRatio, q.ratio));
  composer.setSize(innerWidth, innerHeight);
  sun.shadow.mapSize.set(q.shadow, q.shadow);
  if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
  Object.assign(sun.shadow.camera, { left: -q.range, right: q.range, top: q.range, bottom: -q.range });
  sun.shadow.camera.updateProjectionMatrix();
  grass.mesh.visible = q.grass > 0;
  grass.mesh.geometry.instanceCount = Math.max(1, q.grass);
}
addEventListener("resize", () => applyQuality());

function setQuality(level, manual) {
  quality = level;
  save.quality = level;
  if (manual) save.qualityManual = true;
  storeSave();
  applyQuality();
}

function renderFrame(dt) {
  grass.uniforms.uTime.value += dt;
  flareLight.position.copy(camera.position).addScaledVector(SUN_DIR, 9000);
  if (QUALITY[quality].post) {
    gradePass.uniforms.uTime.value += dt;
    const sp = Math.hypot(car.vx, car.vz);
    gradePass.uniforms.uSpeed.value = mode === "drive" && cam.mode === 0 ? clamp((sp - 35) / 40, 0, 1) : 0;
    composer.render(dt);
  } else {
    renderer.render(scene, camera);
  }
}

// Läuft es zu langsam? Dann automatisch eine Stufe herunter (nur einmal pro Stufe,
// und nicht, wenn man die Qualität selbst mit Q eingestellt hat).
const perf = { t: 0, frames: 0, slow: 0 };
function checkPerformance(raw) {
  if (mode !== "drive" || save.qualityManual || quality === 0 || raw > 0.25) return;
  perf.t += raw;
  perf.frames++;
  if (perf.t < 2) return;
  const fps = perf.frames / perf.t;
  perf.slow = fps < 32 ? perf.slow + 1 : 0;
  perf.t = perf.frames = 0;
  if (perf.slow >= 2) {
    perf.slow = 0;
    setQuality(quality - 1, false);
    notify(`Grafik automatisch auf „${QUALITY[quality].name}“ gestellt, damit es flüssig läuft (Q zum Ändern)`, "");
  }
}
applyQuality();

placeCar(0, -40, -3);
cam.yaw = car.yaw;
cam.pos.set(car.x, car.y + 3, car.z);
setMode("title");

let last = performance.now();
function frame(now) {
  const raw = (now - last) / 1000;
  const dt = clamp(raw, 0, 0.05); // nie negativ (erstes Bild!) und nie zu gross
  last = now;
  if (mode !== "pause" && mode !== "results") update(dt);
  else updateAudio(1000, 0, 0, false);
  renderFrame(dt);
  checkPerformance(raw);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Für Tests in der Browser-Konsole
window.game = { car, race, aiCars, save, roads, setMode, startRace, CARS, keys, update, cam, openTuning, buyTuning, setQuality, get quality() { return quality; }, get carSpec() { return carSpec; } };
