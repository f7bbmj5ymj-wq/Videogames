// Alle Autos des Spiels: Fahrwerte und Aussehen.
//
// Fahrwerte:
//   top    Höchstgeschwindigkeit auf Asphalt in m/s (× 3,6 = km/h)
//   accel  Beschleunigung in m/s²
//   grip   Seitenhaftung (niedrig = driftet leichter)
//   off    Geländetauglichkeit 0..1 (wie viel Tempo/Grip auf Gras übrig bleibt)
//
// Aussehen (body):
//   w, l    Breite und Länge der Karosserie
//   h       Höhe des unteren Teils
//   ride    Bodenfreiheit
//   ch, cl, cz  Höhe, Länge und Position (vorne/hinten) der Fahrgastzelle
//   wr, ww, wb  Radradius, Radbreite, Radstand
//   extras  Zusatzteile, siehe makeCarMesh()

const CARS = [
  {
    id: "dakar",
    name: "Porsche 911 Dakar",
    kind: "Gelände-Sportwagen",
    color: 0xf4f4f0,
    accent: 0x1c5bd6,
    rim: 0xf2f2f0,            // weisse Felgen (Rallye-Paket)
    offroadTires: true,       // grobstollige Geländereifen
    desc: "Höhergelegter 911 mit Dachträger und Zusatzscheinwerfern. Schnell auf der Strasse – und abseits davon unschlagbar.",
    top: 67, accel: 12.5, grip: 7, off: 0.95,
    body: { w: 1.8, l: 4.53, h: 0.5, ride: 0.26, ch: 0.47, cl: 1.2, cz: -0.12, wr: 0.36, ww: 0.3, wb: 2.45, rake: 1.9,
      nose: 0.4,                                   // niedrige Nase, lange abfallende Haube
      humps: 0.17, flareF: 0.035, flareR: 0.09,    // Kotflügel vorne höher als die Haube, breite "Hüften" hinten
      extras: ["fastback", "flyline", "rack", "lightbar", "cladding", "roundLights", "rallye", "ducktail", "engineGrille", "towHooks", "porscheBadge"] },
  },
  {
    id: "impreza22b",
    name: "Subaru Impreza 22B STi",
    kind: "Rallye-Legende",
    color: 0x1d3b8f,          // "Sonic Blue Mica"
    accent: 0x1d3b8f,
    rim: 0xc9a23a,            // goldene Felgen
    spokes: 8,                // viele feine Speichen
    caliper: 0xc0262d,        // rote Bremssättel
    desc: "Die Rallye-Legende von 1998: Allradantrieb, breite Kotflügel, goldene Felgen und grosser Heckflügel. Auf Schotter und Gras kaum zu schlagen.",
    top: 69, accel: 13.6, grip: 6.8, off: 0.9,
    body: { w: 1.64, l: 4.37, h: 0.58, ride: 0.2, ch: 0.56, cl: 1.3, cz: -0.28, wr: 0.315, ww: 0.25, wb: 2.52, rake: 1.6, rrake: 1.25,
      flareF: 0.085, flareR: 0.085,              // stark ausgestellte Kotflügel
      extras: ["tallWing", "hoodScoop", "fogLights", "airDam", "rectLights", "mudflaps", "exhaust", "badge22b", "skirts"] },
  },
  {
    id: "falke",
    name: "Falke GT",
    kind: "Supersportwagen",
    color: 0xff3b30,
    desc: "Flach, breit, brutal schnell. Auf Gras allerdings ziemlich hilflos.",
    top: 92, accel: 15, grip: 8.2, off: 0.45,
    body: { w: 2.05, l: 4.6, h: 0.5, ride: 0.18, ch: 0.42, cl: 1.3, cz: -0.35, rake: 2.6, wr: 0.36, ww: 0.38, wb: 2.7,
      extras: ["wing", "fastback"] },
  },
  {
    id: "blitz",
    name: "Blitz RS",
    kind: "Sportcoupé",
    color: 0x2f80ed,
    desc: "Ausgewogener Sportwagen, gut für Anfänger und Rennen.",
    top: 80, accel: 13, grip: 7.8, off: 0.55,
    body: { w: 1.95, l: 4.4, h: 0.55, ride: 0.22, ch: 0.48, cl: 1.7, cz: -0.25, rake: 1.8, wr: 0.37, ww: 0.32, wb: 2.6,
      extras: ["spoiler", "fastback"] },
  },
  {
    id: "donner",
    name: "Donner V8",
    kind: "Muscle-Car",
    color: 0xffb000,
    accent: 0x111111,
    desc: "Viel Kraft, wenig Grip. Perfekt für Drifts – aber Vorsicht in Kurven!",
    top: 79, accel: 13.5, grip: 5.4, off: 0.55,
    body: { w: 2.0, l: 4.8, h: 0.6, ride: 0.24, ch: 0.48, cl: 1.9, cz: -0.45, wr: 0.38, ww: 0.36, wb: 2.8,
      extras: ["hoodStripes", "spoiler"] },
  },
  {
    id: "kobold",
    name: "Kobold",
    kind: "Kleinwagen",
    color: 0x7bd389,
    desc: "Klein, wendig und langsam. Macht trotzdem Spass!",
    top: 52, accel: 9, grip: 7.2, off: 0.65,
    body: { w: 1.7, l: 3.7, h: 0.6, ride: 0.25, ch: 0.62, cl: 2.0, cz: -0.35, wr: 0.33, ww: 0.26, wb: 2.3,
      extras: ["roundLights"] },
  },
  {
    id: "bergziege",
    name: "Bergziege",
    kind: "Pick-up",
    color: 0x8b5a2b,
    desc: "Robuster Pick-up mit grosser Bodenfreiheit. Kommt fast überall hin.",
    top: 55, accel: 9.5, grip: 5.6, off: 0.9,
    body: { w: 2.05, l: 5.2, h: 0.75, ride: 0.55, ch: 0.62, cl: 1.6, cz: 0.6, wr: 0.48, ww: 0.38, wb: 3.1,
      extras: ["bed", "bullbar", "cladding"] },
  },
  {
    id: "wuestenfuchs",
    name: "Wüstenfuchs",
    kind: "Rallyeauto",
    color: 0x00a6a6,
    accent: 0xffffff,
    desc: "Echtes Rallyeauto. Driftet schön und liebt Schotter und Gras.",
    top: 64, accel: 12.5, grip: 6.2, off: 0.93,
    body: { w: 1.85, l: 4.1, h: 0.6, ride: 0.38, ch: 0.55, cl: 1.9, cz: -0.25, wr: 0.38, ww: 0.3, wb: 2.5,
      extras: ["wing", "lightbar", "stripe", "cladding"] },
  },
  {
    id: "nordwind",
    name: "Nordwind Kombi",
    kind: "Kombi",
    color: 0x5b6b82,
    desc: "Schneller Familienkombi. Unauffällig – bis er überholt.",
    top: 68, accel: 11, grip: 6.8, off: 0.68,
    body: { w: 1.9, l: 4.8, h: 0.6, ride: 0.25, ch: 0.55, cl: 2.8, cz: -0.45, wr: 0.36, ww: 0.3, wb: 2.85,
      extras: ["rack"] },
  },
  {
    id: "oldtimer",
    name: "Roadster 1965",
    kind: "Oldtimer",
    color: 0xb3122e,
    accent: 0xf2efe6,
    desc: "Klassischer Roadster ohne Dach. Langsam, aber mit Stil.",
    top: 50, accel: 8, grip: 5.2, off: 0.6,
    body: { w: 1.7, l: 4.1, h: 0.55, ride: 0.24, ch: 0.25, cl: 0.4, cz: 0.15, wr: 0.36, ww: 0.24, wb: 2.4,
      extras: ["roundLights", "convertible", "hoodStripes"] },
  },
  {
    id: "titan",
    name: "Titan SUV",
    kind: "SUV",
    color: 0x1f2a24,
    desc: "Grosser Geländewagen. Schwer, aber im Gelände sehr stark.",
    top: 60, accel: 9.8, grip: 5.8, off: 0.88,
    body: { w: 2.05, l: 4.9, h: 0.8, ride: 0.5, ch: 0.7, cl: 2.9, cz: -0.35, wr: 0.46, ww: 0.36, wb: 2.95,
      extras: ["rack", "bullbar", "cladding"] },
  },
  {
    id: "driftkoenig",
    name: "Drift-König",
    kind: "Drift-Coupé",
    color: 0xff4fd8,
    accent: 0x111111,
    desc: "Für Driftzonen gebaut: wenig Grip, viel Leistung, grosser Heckflügel.",
    top: 72, accel: 13, grip: 4.6, off: 0.55,
    body: { w: 1.9, l: 4.4, h: 0.52, ride: 0.18, ch: 0.48, cl: 1.7, cz: -0.25, rake: 1.7, wr: 0.36, ww: 0.34, wb: 2.55,
      extras: ["wing", "stripe"] },
  },
];

// ---------- Tuning ----------
// Jedes Teil hat 3 Stufen. Preis für Stufe 1, 2, 3 (Stufe 0 = Serie):
const TUNE_PRICES = [0, 8000, 18000, 35000];
const TUNE_LEVELS = ["Serie", "Sport", "Rennsport", "Pro"];
const UPGRADES = [
  { key: "engine", name: "Motor", desc: "Mehr PS: höhere Höchstgeschwindigkeit und bessere Beschleunigung.",
    apply: (s, l) => { s.top *= 1 + 0.04 * l; s.accel *= 1 + 0.06 * l; } },
  { key: "turbo", name: "Turbo", desc: "Mehr Ladedruck: vor allem bessere Beschleunigung.",
    apply: (s, l) => { s.accel *= 1 + 0.06 * l; s.top *= 1 + 0.02 * l; } },
  { key: "tires", name: "Reifen", desc: "Weichere Gummimischung: mehr Grip in Kurven.",
    apply: (s, l) => { s.grip *= 1 + 0.07 * l; } },
  { key: "suspension", name: "Fahrwerk", desc: "Bessere Federn und Dämpfer: mehr Grip und besser im Gelände.",
    apply: (s, l) => { s.grip *= 1 + 0.035 * l; s.off = Math.min(1, s.off + 0.03 * l); } },
  { key: "weight", name: "Leichtbau", desc: "Weniger Gewicht: spritziger und wendiger.",
    apply: (s, l) => { s.accel *= 1 + 0.04 * l; s.grip *= 1 + 0.025 * l; } },
];
// Optik-Teile: einmal kaufen, danach gratis ein- und ausbauen
const OPTICS = [
  { key: "wing", extra: "wing", name: "Heckflügel", price: 5000, desc: "Mehr Abtrieb: etwas mehr Grip.",
    apply: (s) => { s.grip *= 1.03; s.body.extras.push("wing"); } },
  { key: "lowered", name: "Tieferlegung", price: 3000, desc: "Tiefer und sportlicher: mehr Grip, aber schlechter im Gelände.",
    apply: (s) => { s.body.drop = 0.05; s.grip *= 1.03; s.off = Math.max(0.3, s.off - 0.1); } },
  { key: "lightbar", extra: "lightbar", name: "Zusatzscheinwerfer", price: 2000, desc: "Vier Scheinwerfer auf dem Dach (nur Optik).",
    apply: (s) => { s.body.extras.push("lightbar"); } },
];
const PAINT_PRICE = 1000;
const PAINTS = [
  [null, "Werkslack"], [0xf4f4f0, "Weiss"], [0x111214, "Schwarz"], [0x9aa3ad, "Silber"],
  [0xd0101e, "Rot"], [0xff7a00, "Orange"], [0xffcc00, "Gelb"], [0x2fbf4a, "Grün"],
  [0x0f5c36, "Racing-Grün"], [0x1c5bd6, "Blau"], [0x0aa6c9, "Türkis"], [0x7a3cff, "Violett"], [0xff4fd8, "Pink"],
];

// Fahrwerte und Aussehen eines Autos mit seinem Tuning
// (t = { engine: 2, tires: 1, wing: true, wingOn: true, paint: 0xff0000, ... })
function tunedSpec(base, t = {}) {
  const s = { ...base, body: { ...base.body, extras: [...(base.body.extras || [])] } };
  for (const u of UPGRADES) if (t[u.key]) u.apply(s, t[u.key]);
  for (const o of OPTICS) if (t[o.key] && t[o.key + "On"] !== false) o.apply(s);
  if (t.paint != null) s.color = t.paint;
  s.body.extras = [...new Set(s.body.extras)];
  return s;
}

// Leistungsklasse wie bei Festival-Rennspielen (D bis S2) aus den Fahrwerten.
function carRating(c) {
  return Math.round(100 + c.top * 7 + c.accel * 18 + c.grip * 22);
}
function carClass(c) {
  const r = carRating(c);
  if (r >= 1100) return { name: "S2", color: "#4fc3ff" };
  if (r >= 1000) return { name: "S1", color: "#b47bff" };
  if (r >= 920) return { name: "A", color: "#ff5a5a" };
  if (r >= 850) return { name: "B", color: "#ff9a3c" };
  if (r >= 770) return { name: "C", color: "#ffd23f" };
  return { name: "D", color: "#7bd389" };
}

// Weiche Schattierung: Normalen von Nachbardreiecken mitteln, aber nur wenn
// sie in ähnliche Richtung zeigen (scharfe Kanten bleiben scharf).
function smoothNormals(geo, maxAngle = 0.7) {
  const pos = geo.attributes.position, n = pos.count;
  const face = new Float32Array(n * 3);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i + 2 < n; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    c.sub(b); a.sub(b); c.cross(a);
    const l = c.length() || 1;
    for (let k = 0; k < 3; k++) face.set([c.x / l, c.y / l, c.z / l], (i + k) * 3);
  }
  const groups = new Map();
  for (let i = 0; i < n; i++) {
    const key = `${Math.round(pos.getX(i) * 500)},${Math.round(pos.getY(i) * 500)},${Math.round(pos.getZ(i) * 500)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(i);
  }
  const out = new Float32Array(n * 3), cosMax = Math.cos(maxAngle);
  for (const list of groups.values()) for (const i of list) {
    let x = 0, y = 0, z = 0;
    for (const j of list) {
      const d = face[i * 3] * face[j * 3] + face[i * 3 + 1] * face[j * 3 + 1] + face[i * 3 + 2] * face[j * 3 + 2];
      if (d >= cosMax) { x += face[j * 3]; y += face[j * 3 + 1]; z += face[j * 3 + 2]; }
    }
    const l = Math.hypot(x, y, z) || 1;
    out.set([x / l, y / l, z / l], i * 3);
  }
  geo.setAttribute("normal", new THREE.BufferAttribute(out, 3));
}

// Weicher Schatten direkt unter dem Auto (wirkt wie "Bodenkontakt")
const CAR_BLOB = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.75)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();

// Reifenprofil: Strassenreifen mit Längsrillen, Geländereifen mit groben Stollen
const TREAD_TEX = {};
function treadTexture(offroad) {
  const key = offroad ? "off" : "road";
  if (TREAD_TEX[key]) return TREAD_TEX[key];
  const c = document.createElement("canvas");
  c.width = 256; c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#1b1b1b";
  g.fillRect(0, 0, 256, 64);
  if (offroad) {
    // Stollen, versetzt angeordnet (v = quer über den Reifen)
    for (let i = 0; i < 16; i++) {
      const x = i * 16;
      g.fillStyle = "#2c2c2c";
      g.fillRect(x + 2, (i % 2) ? 14 : 20, 11, 12);
      g.fillRect(x + 2, (i % 2) ? 36 : 30, 11, 12);
      g.fillStyle = "#0b0b0b";
      g.fillRect(x, 0, 2, 64);
    }
  } else {
    g.fillStyle = "#0c0c0c";
    for (const y of [22, 30, 38]) g.fillRect(0, y, 256, 2);
    for (let x = 0; x < 256; x += 8) g.fillRect(x, 20, 1, 22);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(offroad ? 6 : 10, 1);
  TREAD_TEX[key] = t;
  return t;
}

// Baut das 3D-Modell eines Autos.
// Die Karosserie ist ein Seitenprofil (mit Radläufen), das in die Breite gezogen
// und an den Kanten abgerundet wird. Das Auto schaut in +z-Richtung, der Ursprung liegt auf dem Boden.
function makeCarMesh(spec) {
  const b = spec.body;
  const ex = new Set(b.extras || []);
  const group = new THREE.Group();

  const col = new THREE.Color(spec.color);
  const bright = (col.r + col.g + col.b) / 3;
  const paint = new THREE.MeshPhysicalMaterial({
    color: spec.color, metalness: bright > 0.6 ? 0.15 : 0.55, roughness: 0.3,
    clearcoat: 1, clearcoatRoughness: 0.03,
  });
  const accent = new THREE.MeshPhysicalMaterial({ color: spec.accent ?? 0x16181c, metalness: 0.3, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05 });
  const trim = new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.6, metalness: 0.1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0c1218, metalness: 0.9, roughness: 0.03, clearcoat: 1, envMapIntensity: 1.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dde3, metalness: 1, roughness: 0.18 });
  // Felgenfarbe (z. B. Gold beim Impreza), sonst Chrom
  const rimMat = spec.rim ? new THREE.MeshStandardMaterial({ color: spec.rim, metalness: 0.9, roughness: 0.28 }) : chrome;
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff3d6, emissiveIntensity: 1.6, roughness: 0.1 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x3a0000, emissive: 0xff1010, emissiveIntensity: 0.5, roughness: 0.2 });
  const plate = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.5 });

  const add = (geo, mat, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return m;
  };
  const box = (w, h, l, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, l), mat, x, y, z);
  const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const flareF = b.flareF ?? 0.02, flareR = b.flareR ?? 0.02;
  // Formt die gerade gezogene Karosserie wie ein echtes Auto um
  const deform = (geo) => {
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i);
      const z = p.getZ(i), az = Math.abs(z) / L;
      // Draufsicht: vorne und hinten abgerundete Ecken
      let k = 1 - 0.14 * smooth(0.5, 1.03, az) ** 2;
      // Fensterbereich wird nach oben schmaler
      k *= 1 - Math.min(1.3, Math.max(0, (y - y1) / Math.max(b.ch, 0.1))) * 0.14;
      // Kotflügel über den Rädern nach aussen wölben
      const low = smooth(y1 + 0.04, y1 - 0.2, y);
      k += flareF * Math.exp(-(((z - b.wb / 2) / 0.75) ** 2)) * low;
      k += flareR * Math.exp(-(((z + b.wb / 2) / 0.75) ** 2)) * low;
      x *= k;
      // 911: vordere Kotflügel liegen höher als die Motorhaube
      if (b.humps) {
        y += b.humps * smooth(0.16, 0.36, Math.abs(x) / b.w) * smooth(zf - 0.5, zf + 0.15, z)
          * smooth(y1 - 0.35, y1 - 0.02, y) * smooth(L + 0.1, L - 0.35, z) * (y < y1 + 0.02 ? 1 : 0);
      }
      p.setXYZ(i, x, y, z);
    }
  };
  // Seitenprofil (u = Länge, v = Höhe) in die Breite ziehen und Kanten abrunden
  const extrude = (shape, width, mat, bevel, shapeIt = false) => {
    const t = Math.min(bevel, width / 4);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, width - 2 * t), bevelEnabled: t > 0, bevelThickness: t,
      bevelSize: t * 0.8, bevelSegments: 4, curveSegments: 16,
    });
    geo.translate(0, 0, -(width - 2 * t) / 2);
    geo.rotateY(-Math.PI / 2);
    if (shapeIt) deform(geo);
    smoothNormals(geo);
    return add(geo, mat);
  };

  const L = b.l / 2;
  const FZ = L + 0.08, RZ = -L - 0.08; // echte Front- und Heckfläche (inkl. abgerundeter Kanten)
  const y0 = b.ride;                                   // Unterkante
  const y1 = Math.max(b.ride + b.h, 2 * b.wr + 0.16);  // Gürtellinie (Unterkante der Fenster)
  const top = y1;
  const noseY = y0 + (y1 - y0) * (b.nose ?? 0.68);
  const ar = b.wr + 0.07;                              // Radius der Radläufe
  const cf = b.cz + b.cl / 2, cr = b.cz - b.cl / 2;    // Dach vorne / hinten
  const zf = Math.min(L - 0.7, cf + b.ch * (b.rake ?? 1.25)); // Fuss der Windschutzscheibe (rake = wie flach sie ist)
  const zr = ex.has("fastback") ? -L + 0.9 : Math.max(-L + 0.3, cr - b.ch * (b.rrake ?? 0.6));

  // --- Karosserie ---
  const s = new THREE.Shape();
  s.moveTo(-L, y0 + 0.14);
  s.quadraticCurveTo(-L, y0, -L + 0.18, y0);
  for (const cz of [-b.wb / 2, b.wb / 2]) {
    const a = Math.asin(Math.min(0.9, Math.max(0, (y0 - b.wr) / ar)));
    s.lineTo(cz - ar * Math.cos(a), y0);
    s.absarc(cz, b.wr, ar, Math.PI - a, a, true);
    s.lineTo(cz + ar * Math.cos(a), y0);
  }
  s.lineTo(L - 0.22, y0);
  s.quadraticCurveTo(L, y0, L, y0 + 0.16);
  s.lineTo(L, noseY - 0.12);
  // Nase + Motorhaube als EINE Kurve: beginnt senkrecht an der Front und läuft
  // flach in die Windschutzscheibe aus – so gibt es keinen Knick.
  s.bezierCurveTo(L, noseY + 0.1, L - (L - zf) * 0.45, y1, zf, y1);
  if (ex.has("fastback")) {
    // Motorhaube hinten (beim 911 sitzt der Motor im Heck) fällt bis zum Wagenende ab
    s.lineTo(zr, y1);
    if (ex.has("flyline")) s.bezierCurveTo(zr - 0.3, y1 - 0.07, -L + 0.12, y1 - 0.14, -L, y1 - 0.26);
    else s.quadraticCurveTo(-L + 0.15, y1 - 0.06, -L, y1 - 0.28);
  } else {
    s.lineTo(-L + 0.3, y1 + 0.01);
    s.quadraticCurveTo(-L, y1, -L, y1 - 0.2);
  }
  s.closePath();
  const bodyMesh = extrude(s, b.w, paint, 0.1, true);
  // Wo liegt die Seitenwand wirklich? Ein Messstrahl von aussen findet die Oberfläche,
  // damit Aufkleber, Türfugen und Griffe genau darauf sitzen.
  const ray = new THREE.Raycaster();
  const sideX = (y, z) => {
    ray.set(new THREE.Vector3(5, y, z), new THREE.Vector3(-1, 0, 0));
    const hit = ray.intersectObject(bodyMesh)[0];
    return hit ? hit.point.x : b.w / 2;
  };
  const frontZ = (x, y) => {
    ray.set(new THREE.Vector3(x, y, 10), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(bodyMesh)[0];
    return hit ? hit.point.z : L;
  };

  // --- Fahrgastzelle ---
  if (ex.has("convertible")) {
    const ws = box(b.w * 0.82, 0.36, 0.05, glass, 0, y1 + 0.16, zf - 0.12);
    ws.rotation.x = -0.45;
    box(b.w * 0.78, 0.1, 1.5, trim, 0, y1 - 0.02, b.cz - 0.45);               // Innenraum
    for (const x of [-0.38, 0.38]) box(0.45, 0.55, 0.12, trim, x * b.w * 0.6, y1 + 0.2, b.cz - 0.75); // Sitzlehnen
  } else if (ex.has("flyline")) {
    // Ein durchgehender Bogen von der Windschutzscheibe über das Dach bis zum Heck.
    // Die Kabine ist in Wagenfarbe; Fenster und Scheiben liegen als Glas darauf.
    const ch = b.ch, top = y1 + ch, apex = b.cz + b.cl * 0.2;
    const V = (z, y) => new THREE.Vector2(z, y);
    const front = new THREE.CubicBezierCurve(V(zf, y1), V(zf - (zf - apex) * 0.42, y1 + ch * 0.72), V(apex + (zf - apex) * 0.3, top), V(apex, top));
    const back = new THREE.CubicBezierCurve(V(apex, top), V(apex - (apex - zr) * 0.4, top), V(zr + (apex - zr) * 0.32, y1 + ch * 0.33), V(zr, y1));
    const cab = new THREE.Shape();
    cab.moveTo(zr, y1 - 0.03);
    cab.lineTo(zf, y1 - 0.03);
    cab.lineTo(zf, y1);
    for (const p of front.getPoints(24).slice(1)) cab.lineTo(p.x, p.y);
    for (const p of back.getPoints(24).slice(1)) cab.lineTo(p.x, p.y);
    cab.closePath();
    const cabW = b.w * 0.86;
    extrude(cab, cabW, paint, 0.06, true);
    // Glasstreifen, der einem Stück der Kurve folgt (Windschutz- und Heckscheibe)
    const glassAlong = (curve, t0, t1, width) => {
      const pts = [], n = 16;
      for (let i = 0; i <= n; i++) pts.push(curve.getPoint(t0 + (t1 - t0) * i / n));
      const sh = new THREE.Shape();
      const out = pts.map((p, i) => {
        const q = pts[Math.min(n, i + 1)], o = pts[Math.max(0, i - 1)];
        const dz = q.x - o.x, dy = q.y - o.y, l = Math.hypot(dz, dy) || 1;
        return V(p.x - dy / l * 0.014, p.y + dz / l * 0.014);
      });
      sh.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) sh.lineTo(p.x, p.y);
      for (const p of out.reverse()) sh.lineTo(p.x, p.y);
      sh.closePath();
      extrude(sh, width, glass, 0.01, true);
    };
    glassAlong(front, 0.0, 0.62, cabW * 0.86);    // Windschutzscheibe
    glassAlong(back, 0.42, 0.94, cabW * 0.7);     // Heckscheibe
    // Seitenfenster: etwas kleiner als die Kabine, aber breiter -> ragt seitlich als Glas heraus
    const win = new THREE.Shape();
    const wf = front.getPoint(0.12), wt1 = front.getPoint(0.8), wt2 = back.getPoint(0.3), wr2 = back.getPoint(0.78);
    win.moveTo(wf.x - 0.12, y1 + 0.04);
    win.lineTo(wt1.x - 0.08, wt1.y - 0.06);
    win.quadraticCurveTo(apex, top - 0.05, wt2.x, wt2.y - 0.07);
    win.quadraticCurveTo(wr2.x + 0.25, wr2.y + 0.02, wr2.x + 0.12, y1 + 0.05);
    win.closePath();
    extrude(win, cabW + 0.03, glass, 0.01, true);
    // Säule zwischen Tür- und hinterem Seitenfenster (wie beim 911)
    for (const sx of [-1, 1]) {
      const bp = box(0.03, ch * 0.75, 0.07, paint, sx * (cabW / 2 + 0.006) * 0.95, y1 + ch * 0.38, b.cz - b.cl * 0.32);
      bp.rotation.z = sx * 0.12;
    }
  } else {
    const ch = b.ch;
    const g = new THREE.Shape();
    g.moveTo(zr, y1 - 0.04);
    g.lineTo(zf, y1 - 0.04);
    g.lineTo(cf + 0.06, y1 + ch - 0.06);
    g.quadraticCurveTo(cf, y1 + ch, cf - 0.12, y1 + ch);
    g.quadraticCurveTo((cf + cr) / 2, y1 + ch + 0.03, cr + 0.12, y1 + ch);   // leicht gewölbtes Dach
    g.quadraticCurveTo(cr, y1 + ch, cr - 0.06, y1 + ch - 0.06);
    g.closePath();
    extrude(g, b.w * 0.86, glass, 0.07, true);
    // Dach
    const r = new THREE.Shape();
    r.moveTo(cr - 0.02, y1 + ch - 0.03);
    r.lineTo(cf + 0.02, y1 + ch - 0.03);
    r.quadraticCurveTo(cf, y1 + ch + 0.05, cf - 0.15, y1 + ch + 0.05);
    r.lineTo(cr + 0.15, y1 + ch + 0.05);
    r.quadraticCurveTo(cr, y1 + ch + 0.05, cr - 0.02, y1 + ch - 0.03);
    extrude(r, b.w * 0.88, paint, 0.05, true);
    // Mittelsäule (B-Säule), passend zum nach oben schmaler werdenden Fensterbereich
    for (const sx of [-1, 1]) {
      if (b.cl > 1.2) {
        const bp = box(0.06, ch * 0.98, 0.1, paint, sx * b.w * 0.43 * 0.93, y1 + ch / 2, b.cz + 0.05);
        bp.rotation.z = sx * 0.13;
      }
    }
  }

  // --- Details: Spiegel, Türfugen, Grill, Stossstangen, Nummernschilder ---
  const seam = new THREE.MeshStandardMaterial({ color: 0x0a0b0d, roughness: 0.8 });
  for (const sx of [-1, 1]) {
    box(0.16, 0.1, 0.2, paint, sx * (b.w / 2 + 0.08), y1 + 0.1, zf - 0.2);
    if (!ex.has("convertible")) {
      const doorF = zf - 0.12, doorR = Math.max(cr + 0.1, doorF - 1.25), ym = y0 + (y1 - y0) / 2 + 0.05;
      for (const z of [doorF, doorR]) box(0.012, y1 - y0 - 0.2, 0.012, seam, sx * (sideX(ym, z) + 0.002), ym, z);
      box(0.025, 0.035, 0.16, chrome, sx * (sideX(y1 - 0.12, doorR + 0.22) + 0.01), y1 - 0.12, doorR + 0.22);   // Türgriff
    }
  }
  if (ex.has("airDam")) {
    // grosser Frontspoiler mit Lufteinlass (Rallye-Look)
    box(b.w * 0.6, 0.15, 0.06, trim, 0, y0 + 0.2, FZ + 0.01);
    for (const sx of [-1, 1]) box(0.24, 0.13, 0.05, trim, sx * b.w * 0.37, y0 + 0.12, FZ - 0.01);   // Gehäuse Nebelscheinwerfer
    box(b.w * 0.42, 0.07, 0.05, trim, 0, y0 + 0.38, FZ);          // kleiner Grill oben
  } else if (b.humps) {
    // 911: kein Kühlergrill (Motor hinten), nur drei Lufteinlässe unten
    box(b.w * 0.34, 0.09, 0.04, trim, 0, y0 + 0.17, FZ);
    for (const sx of [-1, 1]) box(b.w * 0.2, 0.08, 0.04, trim, sx * b.w * 0.33, y0 + 0.17, FZ - 0.01);
  } else {
    box(b.w * 0.5, 0.16, 0.04, trim, 0, y0 + 0.28, FZ);         // Kühlergrill
  }
  box(b.w * 0.96, 0.09, 0.25, trim, 0, y0 + 0.05, L - 0.08);          // Frontlippe
  box(b.w * 0.9, 0.1, 0.25, trim, 0, y0 + 0.06, -L + 0.1);            // Diffusor
  box(0.52, 0.12, 0.02, plate, 0, y0 + 0.4, FZ + 0.01);
  box(0.52, 0.12, 0.02, plate, 0, y0 + 0.42, RZ - 0.01);

  // Scheinwerfer und Rücklichter
  for (const sx of [-1, 1]) {
    if (ex.has("roundLights")) {
      // grosse, runde Scheinwerfer vorne in den Kotflügeln (beim 911 typisch "Froschaugen")
      const hr = b.humps ? 0.16 : 0.15, tilt = b.humps ? 0.55 : 0.3;
      const hx = sx * b.w * 0.33, hy = noseY - 0.02 + (b.humps || 0) * 0.55;
      const hz = frontZ(hx, hy) - 0.06;
      const l = add(new THREE.CylinderGeometry(hr, hr, 0.24, 24), head, hx, hy, hz);
      l.rotation.x = Math.PI / 2 - tilt;
      const ring = add(new THREE.TorusGeometry(hr + 0.005, 0.025, 8, 28), chrome, hx, hy + 0.12 * Math.sin(tilt), hz + 0.12 * Math.cos(tilt));
      ring.rotation.x = -tilt;
    } else if (ex.has("rectLights")) {
      // eckige Scheinwerfer, die um die Ecke laufen, mit orangem Blinker
      // Hauptteil gerade nach vorne, aussen ein kurzes Eckstück, das der runden Ecke folgt.
      // Ein Messstrahl findet die Oberfläche, damit nichts im Blech verschwindet.
      const hy = noseY - 0.1, mx = sx * b.w * 0.31, ox = sx * b.w * 0.41;
      box(0.34, 0.14, 0.12, head, mx, hy, frontZ(mx, hy) - 0.03);
      box(0.38, 0.17, 0.06, trim, mx, hy, frontZ(mx, hy) - 0.07);
      const cz = frontZ(ox, hy);
      const corner = box(0.13, 0.14, 0.1, head, ox, hy, cz - 0.03);
      corner.rotation.y = sx * 0.55;
      const blink = new THREE.MeshStandardMaterial({ color: 0xff9a1a, emissive: 0xff7a00, emissiveIntensity: 0.4 });
      const bz = frontZ(ox, hy - 0.11);
      box(0.12, 0.05, 0.08, blink, ox, hy - 0.11, bz - 0.02).rotation.y = sx * 0.55;
    } else {
      box(0.42, 0.1, 0.12, head, sx * b.w * 0.32, noseY - 0.12, FZ - 0.03);
    }
  }
  if (ex.has("fastback")) box(b.w * 0.8, 0.07, 0.1, tail, 0, y1 - 0.34, RZ + 0.03);  // durchgehendes Leuchtband
  else for (const sx of [-1, 1]) box(0.42, 0.11, 0.1, tail, sx * b.w * 0.32, y1 - 0.15, RZ + 0.03);

  // --- Zusatzteile ---
  const ch = ex.has("convertible") ? 0 : b.ch;
  if (ex.has("ducktail")) {
    // fester Heckspoiler mit schwarzer Abrisskante
    const dy = ex.has("fastback") ? y1 - 0.1 : y1 + 0.02;
    box(b.w * 0.78, 0.05, 0.36, paint, 0, dy, -L + 0.22).rotation.x = 0.28;
    box(b.w * 0.76, 0.04, 0.05, trim, 0, dy + 0.05, -L + 0.06);
  }
  if (ex.has("engineGrille")) {
    // schwarzes Lüftungsgitter auf der hinteren Motorhaube, mit Lamellen
    const gz = zr - 0.18, gy = y1 - 0.025;
    const base = box(b.w * 0.46, 0.02, 0.3, trim, 0, gy, gz);
    base.rotation.x = -0.2;
    for (let k = -2; k <= 2; k++) {
      const sl = box(b.w * 0.44, 0.015, 0.025, seam, 0, gy + 0.012 + k * 0.012, gz + k * 0.055);
      sl.rotation.x = -0.2;
    }
  }
  if (ex.has("towHooks")) {
    // rote Abschleppösen vorne und hinten
    const red = new THREE.MeshStandardMaterial({ color: 0xd0101e, roughness: 0.4, metalness: 0.3 });
    const f = add(new THREE.TorusGeometry(0.06, 0.018, 8, 16), red, b.w * 0.36, y0 + 0.1, FZ + 0.03);
    const r = add(new THREE.TorusGeometry(0.06, 0.018, 8, 16), red, -b.w * 0.36, y0 + 0.1, RZ - 0.03);
    f.rotation.x = r.rotation.x = Math.PI / 2;
  }
  if (ex.has("porscheBadge")) {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 64;
    const g = c.getContext("2d");
    g.font = "700 46px system-ui, sans-serif";
    g.textAlign = "center";
    g.fillStyle = "#1a1a1a";
    g.fillText("P O R S C H E", 256, 48);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const pl = add(new THREE.PlaneGeometry(0.62, 0.078), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4 }), 0, y1 - 0.42, RZ - 0.012);
    pl.rotation.y = Math.PI;
    pl.castShadow = false;
  }
  if (ex.has("spoiler")) box(b.w * 0.88, 0.05, 0.32, paint, 0, y1 + 0.06, -L + 0.2).rotation.x = 0.12;
  // Echter Heckflügel: Flügelprofil (runde Vorderkante, dünne Hinterkante),
  // schräge Stützen, abgerundete Endplatten und eine kleine Abrisskante.
  const buildWing = (height, chord, span, mat, standMat) => {
    const wz = -L + 0.08 + chord * 0.6;          // Mitte des Flügels über dem Kofferraum
    const wy = y1 + height;
    // Profil im Seitenschnitt (u = vorne/hinten, v = oben/unten), Vorderkante zeigt nach vorne (+u)
    const t = chord * 0.13;
    const af = new THREE.Shape();
    af.moveTo(-chord / 2, 0);                                            // Hinterkante
    af.bezierCurveTo(-chord * 0.1, t * 0.9, chord * 0.3, t * 1.1, chord / 2, t * 0.25); // Oberseite
    af.quadraticCurveTo(chord / 2 + t * 0.35, -t * 0.25, chord * 0.42, -t * 0.4);       // runde Nase
    af.bezierCurveTo(chord * 0.2, -t * 0.55, -chord * 0.15, -t * 0.2, -chord / 2, 0);   // Unterseite
    const blade = extrude(af, span, mat, 0.012);
    blade.position.set(0, wy, wz);
    blade.rotation.x = 0.14;                       // Anstellwinkel: hinten höher
    // Abrisskante (Gurney-Flap) an der Hinterkante
    const gf = box(span * 0.98, 0.03, 0.008, mat, 0, wy + 0.06 * chord + 0.012, wz - chord / 2 + 0.01);
    gf.rotation.x = 0.14;
    // Stützen: schräg nach hinten, oben schmaler
    const st = new THREE.Shape();
    st.moveTo(0.12, 0);
    st.lineTo(-0.1, 0);
    st.lineTo(-0.06, height - 0.01);
    st.quadraticCurveTo(0.0, height + 0.02, 0.05, height - 0.01);
    st.closePath();
    for (const sx of [-1, 1]) {
      extrude(st, 0.035, standMat, 0.008).position.set(sx * span * 0.33, y1 - 0.01, wz + 0.01);
      // Endplatte
      const ep = new THREE.Shape();
      const el = chord * 1.15, eh = 0.15;
      ep.moveTo(-el / 2, -eh * 0.45);
      ep.lineTo(el / 2 - 0.05, -eh * 0.45);
      ep.quadraticCurveTo(el / 2, -eh * 0.45, el / 2, -eh * 0.2);
      ep.lineTo(el / 2 - 0.06, eh * 0.4);
      ep.lineTo(-el / 2 + 0.03, eh * 0.55);
      ep.quadraticCurveTo(-el / 2, eh * 0.55, -el / 2, eh * 0.4);
      ep.closePath();
      const plate = extrude(ep, 0.014, mat, 0.004);
      plate.position.set(sx * (span / 2 + 0.008), wy + 0.01, wz);
    }
  };
  if (ex.has("tallWing")) buildWing(0.2, 0.3, b.w * 0.9, accent, accent);    // 22B: in Wagenfarbe, nicht zu hoch
  else if (ex.has("wing")) buildWing(0.4, 0.38, b.w * 0.95, accent, trim);
  if (ex.has("rack")) {
    const ry = top + ch + 0.16;
    for (const sx of [-1, 1]) box(0.05, 0.05, b.cl * 0.85, trim, sx * b.w * 0.38, ry, b.cz);
    for (const z of [-0.35, 0, 0.35]) box(b.w * 0.8, 0.04, 0.05, trim, 0, ry, b.cz + z * b.cl);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.05, 0.12, 0.05, trim, sx * b.w * 0.38, ry - 0.08, b.cz + sz * b.cl * 0.4);
  }
  if (ex.has("lightbar")) {
    const ly = top + ch + (ex.has("rack") ? 0.28 : 0.14);
    for (const x of [-0.5, -0.17, 0.17, 0.5]) {
      const l = add(new THREE.CylinderGeometry(0.11, 0.11, 0.1, 16), head, x * b.w * 0.75, ly, b.cz + b.cl * 0.4);
      l.rotation.x = Math.PI / 2;
      const rim = add(new THREE.CylinderGeometry(0.125, 0.125, 0.08, 16), trim, x * b.w * 0.75, ly, b.cz + b.cl * 0.4 - 0.04);
      rim.rotation.x = Math.PI / 2;
    }
  }
  if (ex.has("cladding")) {
    // schwarze Radlauf-Verbreiterungen und Seitenschweller
    for (const sx of [-1, 1]) for (const cz of [-b.wb / 2, b.wb / 2]) {
      const fl = cz > 0 ? flareF : flareR;
      const f = add(new THREE.TorusGeometry(ar + 0.02, 0.07, 6, 18, Math.PI), trim, sx * (b.w / 2 * (1 + fl) + 0.02), b.wr, cz);
      f.rotation.y = Math.PI / 2;
    }
    for (const sx of [-1, 1]) box(0.08, 0.14, b.wb - 2 * ar - 0.1, trim, sx * (b.w / 2 + 0.02), y0 + 0.1, 0);
  }
  if (ex.has("flares")) {
    // breite, lackierte Kotflügel-Verbreiterungen (wie beim Impreza 22B)
    for (const sx of [-1, 1]) for (const cz of [-b.wb / 2, b.wb / 2]) {
      const f = add(new THREE.TorusGeometry(ar + 0.03, 0.1, 8, 20, Math.PI), paint, sx * (b.w / 2 + 0.02), b.wr, cz);
      f.rotation.y = Math.PI / 2;
      f.scale.set(1, 1, 0.8);
    }
  }
  if (ex.has("boxFlares")) {
    // eckig ausgestellte Kotflügel: ein Blech mit Radausschnitt, aussen auf die Karosserie gesetzt
    for (const cz of [-b.wb / 2, b.wb / 2]) {
      const fr = ar + 0.02;
      const x0 = cz - fr - 0.3, x1 = cz + fr + 0.3, yb = y0 + 0.05, yt = Math.min(y1 - 0.07, b.wr + fr + 0.1);
      const fs = new THREE.Shape();
      fs.moveTo(x0, yb);
      fs.lineTo(x0, yt - 0.12);
      fs.quadraticCurveTo(x0, yt, x0 + 0.2, yt);
      fs.lineTo(x1 - 0.2, yt);
      fs.quadraticCurveTo(x1, yt, x1, yt - 0.12);
      fs.lineTo(x1, yb);
      const a = Math.asin(Math.min(0.9, Math.max(0, (yb - b.wr) / fr)));
      fs.lineTo(cz + fr * Math.cos(a), yb);
      fs.absarc(cz, b.wr, fr, a, Math.PI - a, false);
      fs.closePath();
      for (const sx of [-1, 1]) extrude(fs, 0.18, paint, 0.06).position.x = sx * (b.w / 2 + 0.01);
    }
  }
  if (ex.has("skirts")) {
    for (const sx of [-1, 1]) box(0.08, 0.1, b.wb - 2 * ar - 0.3, paint, sx * (b.w / 2 + 0.02), y0 + 0.07, 0);
  }
  if (ex.has("hoodScoop")) {
    // Lufthutze auf der Motorhaube, vorne offen
    const zs = zf + (L - zf) * 0.32;
    const sc = box(0.72, 0.11, 0.56, paint, 0, y1 - 0.0, zs);
    sc.rotation.x = 0.07;
    box(0.6, 0.075, 0.03, seam, 0, y1 + 0.015, zs + 0.27);
  }
  if (ex.has("mudflaps")) {
    for (const sx of [-1, 1]) for (const cz of [-b.wb / 2, b.wb / 2]) {
      box(b.ww + 0.04, 0.24, 0.012, seam, sx * (b.w / 2 - b.ww / 2 + 0.1), y0 + 0.02, cz - ar - 0.04);
    }
  }
  if (ex.has("exhaust")) {
    const ex1 = add(new THREE.CylinderGeometry(0.055, 0.06, 0.2, 18), chrome, b.w * 0.3, y0 + 0.12, RZ + 0.02);
    ex1.rotation.x = Math.PI / 2;
    const ex2 = add(new THREE.CylinderGeometry(0.045, 0.045, 0.21, 18), seam, b.w * 0.3, y0 + 0.12, RZ + 0.02);
    ex2.rotation.x = Math.PI / 2;
  }
  if (ex.has("badge22b")) {
    const c = document.createElement("canvas");
    c.width = 256; c.height = 64;
    const g = c.getContext("2d");
    g.font = "italic 900 44px system-ui, sans-serif";
    g.fillStyle = "#e8e8e8"; g.fillText("22B", 18, 48);
    g.fillStyle = "#ff3d8b"; g.fillText("STi", 128, 48);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const badge = add(new THREE.PlaneGeometry(0.34, 0.085), new THREE.MeshStandardMaterial({ map: t, transparent: true, metalness: 0.6, roughness: 0.3 }),
      -b.w * 0.25, y1 - 0.08, RZ - 0.01);
    badge.rotation.y = Math.PI;
    badge.castShadow = false;
  }
  if (ex.has("fogLights")) {
    for (const sx of [-1, 1]) {
      const l = add(new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16), head, sx * b.w * 0.37, y0 + 0.12, FZ + 0.01);
      l.rotation.x = Math.PI / 2;
    }
  }
  if (ex.has("rallye")) {
    // Dakar-Rallye-Design: blaue und rote Streifen unten, Startnummer auf der Tür
    const blue = new THREE.MeshStandardMaterial({ color: 0x1c5bd6, roughness: 0.4 });
    const red = new THREE.MeshStandardMaterial({ color: 0xd0101e, roughness: 0.4 });
    const len = b.wb - 2 * ar - 0.15;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
    g.lineWidth = 6; g.strokeStyle = "#1c5bd6"; g.stroke();
    g.fillStyle = "#111"; g.font = "900 58px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("176", 64, 68);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const numMat = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.4 });
    const ny = y0 + (y1 - y0) * 0.62, nz = zf - 0.75;
    for (const sx of [-1, 1]) {
      box(0.015, 0.06, len, blue, sx * (sideX(y0 + 0.3, 0.05) + 0.006), y0 + 0.3, 0.05);
      box(0.015, 0.04, len, red, sx * (sideX(y0 + 0.235, 0.05) + 0.006), y0 + 0.235, 0.05);
      const num = add(new THREE.CircleGeometry(0.17, 32), numMat, sx * (sideX(ny, nz) + 0.01), ny, nz);
      num.rotation.y = sx * Math.PI / 2;
      num.castShadow = false;
    }
  }
  if (ex.has("stripe")) {
    for (const sx of [-1, 1]) box(0.02, 0.1, b.wb - 2 * ar - 0.1, accent, sx * (sideX(y0 + (y1 - y0) * 0.5, 0) + 0.01), y0 + (y1 - y0) * 0.5, 0);
  }
  if (ex.has("hoodStripes") && ch > 0) {
    for (const x of [-0.18, 0.18]) box(0.16, 0.012, b.cl * 0.8, accent, x, top + ch + 0.06, b.cz);
  }
  if (ex.has("bed")) {
    // Ladefläche des Pick-ups
    const bl = L + zr - 0.15, bz = zr - bl / 2 - 0.05;
    box(b.w * 0.86, 0.04, bl, trim, 0, top + 0.02, bz);
    for (const sx of [-1, 1]) box(0.08, 0.32, bl, paint, sx * b.w * 0.45, top + 0.16, bz);
    box(b.w * 0.9, 0.32, 0.08, paint, 0, top + 0.16, -L + 0.06);
  }
  if (ex.has("bullbar")) {
    box(b.w * 0.75, 0.07, 0.07, trim, 0, y0 + (y1 - y0) * 0.8, FZ + 0.12);
    box(b.w * 0.75, 0.07, 0.07, trim, 0, y0 + 0.2, FZ + 0.12);
    for (const sx of [-1, 1]) box(0.07, (y1 - y0) * 0.7, 0.07, trim, sx * b.w * 0.3, y0 + (y1 - y0) * 0.5, FZ + 0.12);
  }

  // Tieferlegung: die ganze Karosserie sinkt, die Räder bleiben
  if (b.drop) for (const part of group.children) part.position.y -= b.drop;

  // --- Räder: pivot (lenkt) -> spin (dreht sich) -> Reifen + Felge ---
  // Reifen mit runden Flanken: ein Querschnitt, der um die Achse gedreht wird
  const R = b.wr, W = b.ww / 2, rIn = R * 0.66;
  const tireGeo = new THREE.LatheGeometry([
    new THREE.Vector2(rIn, -W), new THREE.Vector2(R - 0.05, -W), new THREE.Vector2(R - 0.015, -W + 0.02),
    new THREE.Vector2(R, -W + 0.05), new THREE.Vector2(R, W - 0.05), new THREE.Vector2(R - 0.015, W - 0.02),
    new THREE.Vector2(R - 0.05, W), new THREE.Vector2(rIn, W),
  ], 40);
  tireGeo.rotateZ(Math.PI / 2);
  const barrelGeo = new THREE.CylinderGeometry(rIn, rIn, b.ww + 0.006, 24, 1, true);
  barrelGeo.rotateZ(Math.PI / 2);
  const lipGeo = new THREE.TorusGeometry(rIn - 0.01, 0.014, 6, 32);
  lipGeo.rotateY(Math.PI / 2);
  const discGeo = new THREE.CylinderGeometry(rIn * 0.85, rIn * 0.85, 0.025, 28);
  discGeo.rotateZ(Math.PI / 2);
  const caliperGeo = new THREE.BoxGeometry(0.07, rIn * 0.55, rIn * 0.75);
  const nSpokes = spec.spokes || 5;
  const spokeGeo = new THREE.BoxGeometry(0.03, rIn * 1.9, nSpokes > 5 ? 0.038 : 0.07);
  const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ map: treadTexture(!!spec.offroadTires), roughness: 0.95 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
  const discMat = new THREE.MeshStandardMaterial({ color: 0x7d8288, metalness: 0.9, roughness: 0.35 });
  const caliperMat = new THREE.MeshStandardMaterial({ color: spec.caliper ?? 0x3a3d42, metalness: 0.3, roughness: 0.45 });
  const wheels = [];
  for (const sz of [1, -1]) for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    const axleOut = (b.w / 2) * Math.max(0, (sz > 0 ? flareF : flareR) - 0.02) * 0.9;
    pivot.position.set(sx * (b.w / 2 - b.ww / 2 + 0.04 + axleOut), b.wr, sz * b.wb / 2);
    // Bremssattel dreht sich nicht mit, er sitzt fest am Radträger
    const caliper = new THREE.Mesh(caliperGeo, caliperMat);
    caliper.position.set(sx * (b.ww / 2 - 0.07), rIn * 0.42, -rIn * 0.3 * sz);
    pivot.add(caliper);
    const spin = new THREE.Group();
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.x = sx * (b.ww / 2 - 0.11);
    const lip = new THREE.Mesh(lipGeo, rimMat);
    lip.position.x = sx * (b.ww / 2);
    const parts = [new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(barrelGeo, barrelMat), disc, lip];
    for (let k = 0; k < nSpokes; k++) {
      const sp = new THREE.Mesh(spokeGeo, rimMat);
      sp.rotation.x = (k / nSpokes) * Math.PI;
      sp.position.x = sx * (b.ww / 2 - 0.02);
      parts.push(sp);
    }
    const hub = new THREE.Mesh(hubGeo, rimMat);
    hub.position.x = sx * (b.ww / 2 + 0.01);
    parts.push(hub);
    for (const p of parts) { p.castShadow = true; spin.add(p); }
    pivot.add(spin);
    group.add(pivot);
    wheels.push({ pivot, spin, front: sz > 0 });
  }

  // Bodenschatten
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(b.w * 1.4, b.l * 1.2),
    new THREE.MeshBasicMaterial({ map: CAR_BLOB, transparent: true, depthWrite: false, opacity: 0.9 }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.05;
  blob.renderOrder = 1;
  group.add(blob);

  return { group, wheels, tail, radius: b.wr };
}
