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
    desc: "Höhergelegter 911 mit Dachträger und Zusatzscheinwerfern. Schnell auf der Strasse – und abseits davon unschlagbar.",
    top: 67, accel: 12.5, grip: 7, off: 0.95,
    body: { w: 1.9, l: 4.5, h: 0.62, ride: 0.5, ch: 0.5, cl: 1.9, cz: -0.35, wr: 0.43, ww: 0.36, wb: 2.45,
      extras: ["fastback", "rack", "lightbar", "cladding", "roundLights", "stripe", "ducktail"] },
  },
  {
    id: "impreza22b",
    name: "Subaru Impreza 22B STi",
    kind: "Rallye-Legende",
    color: 0x1b3fa0,
    accent: 0x1b3fa0,
    rim: 0xc9a23a,
    desc: "Die Rallye-Legende von 1998: Allradantrieb, breite Kotflügel, goldene Felgen und grosser Heckflügel. Auf Schotter und Gras kaum zu schlagen.",
    top: 69, accel: 13.6, grip: 6.8, off: 0.9,
    body: { w: 1.92, l: 4.35, h: 0.6, ride: 0.27, ch: 0.52, cl: 1.85, cz: -0.25, wr: 0.36, ww: 0.32, wb: 2.52, rake: 1.5,
      extras: ["wing", "hoodScoop", "flares", "fogLights"] },
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
  // Seitenprofil (u = Länge, v = Höhe) in die Breite ziehen und Kanten abrunden
  const extrude = (shape, width, mat, bevel) => {
    const t = Math.min(bevel, width / 4);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.01, width - 2 * t), bevelEnabled: t > 0, bevelThickness: t,
      bevelSize: t * 0.8, bevelSegments: 4, curveSegments: 16,
    });
    geo.translate(0, 0, -(width - 2 * t) / 2);
    geo.rotateY(-Math.PI / 2);
    smoothNormals(geo);
    return add(geo, mat);
  };

  const L = b.l / 2;
  const y0 = b.ride;                                   // Unterkante
  const y1 = Math.max(b.ride + b.h, 2 * b.wr + 0.16);  // Gürtellinie (Unterkante der Fenster)
  const top = y1;
  const noseY = y0 + (y1 - y0) * 0.68;
  const ar = b.wr + 0.07;                              // Radius der Radläufe
  const cf = b.cz + b.cl / 2, cr = b.cz - b.cl / 2;    // Dach vorne / hinten
  const zf = Math.min(L - 0.7, cf + b.ch * (b.rake ?? 1.25)); // Fuss der Windschutzscheibe (rake = wie flach sie ist)
  const zr = ex.has("fastback") ? -L + 0.4 : Math.max(-L + 0.3, cr - b.ch * 0.6);

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
    s.lineTo(-L + 0.3, y1 - 0.05);
    s.quadraticCurveTo(-L, y1 - 0.08, -L, y1 - 0.25);
  } else {
    s.lineTo(-L + 0.3, y1 + 0.01);
    s.quadraticCurveTo(-L, y1, -L, y1 - 0.2);
  }
  s.closePath();
  extrude(s, b.w, paint, 0.1);

  // --- Fahrgastzelle ---
  if (ex.has("convertible")) {
    const ws = box(b.w * 0.82, 0.36, 0.05, glass, 0, y1 + 0.16, zf - 0.12);
    ws.rotation.x = -0.45;
    box(b.w * 0.78, 0.1, 1.5, trim, 0, y1 - 0.02, b.cz - 0.45);               // Innenraum
    for (const x of [-0.38, 0.38]) box(0.45, 0.55, 0.12, trim, x * b.w * 0.6, y1 + 0.2, b.cz - 0.75); // Sitzlehnen
  } else {
    const ch = b.ch;
    const g = new THREE.Shape();
    g.moveTo(zr, y1 - 0.04);
    g.lineTo(zf, y1 - 0.04);
    g.lineTo(cf + 0.06, y1 + ch - 0.06);
    g.quadraticCurveTo(cf, y1 + ch, cf - 0.12, y1 + ch);
    g.lineTo(cr + 0.12, y1 + ch);
    g.quadraticCurveTo(cr, y1 + ch, cr - 0.06, y1 + ch - 0.06);
    g.closePath();
    extrude(g, b.w * 0.86, glass, 0.07);
    // Dach
    const r = new THREE.Shape();
    r.moveTo(cr - 0.02, y1 + ch - 0.03);
    r.lineTo(cf + 0.02, y1 + ch - 0.03);
    r.quadraticCurveTo(cf, y1 + ch + 0.05, cf - 0.15, y1 + ch + 0.05);
    r.lineTo(cr + 0.15, y1 + ch + 0.05);
    r.quadraticCurveTo(cr, y1 + ch + 0.05, cr - 0.02, y1 + ch - 0.03);
    extrude(r, b.w * 0.88, paint, 0.05);
    // Säulen (A vorne, C hinten, B in der Mitte) – trennen die Scheiben optisch
    const pillar = (z0, z1, x) => {
      const len = Math.hypot(z1 - z0, ch);
      const p = box(0.07, 0.06, len, paint, x, y1 + ch / 2, (z0 + z1) / 2);
      p.rotation.x = -Math.atan2(ch, z1 - z0);
      return p;
    };
    for (const sx of [-1, 1]) {
      const x = sx * b.w * 0.435;
      pillar(zf, cf, x);
      pillar(zr, cr, x);
      if (b.cl > 1.5) box(0.07, ch, 0.12, paint, x, y1 + ch / 2, b.cz + 0.05);
    }
  }

  // --- Details: Spiegel, Grill, Stossstangen, Nummernschilder ---
  for (const sx of [-1, 1]) {
    box(0.16, 0.1, 0.2, paint, sx * (b.w / 2 + 0.08), y1 + 0.1, zf - 0.2);
  }
  box(b.w * 0.5, 0.16, 0.04, trim, 0, y0 + 0.28, L + 0.07);           // Kühlergrill
  box(b.w * 0.96, 0.09, 0.25, trim, 0, y0 + 0.05, L - 0.08);          // Frontlippe
  box(b.w * 0.9, 0.1, 0.25, trim, 0, y0 + 0.06, -L + 0.1);            // Diffusor
  box(0.52, 0.12, 0.02, plate, 0, y0 + 0.4, L + 0.08);
  box(0.52, 0.12, 0.02, plate, 0, y0 + 0.42, -L - 0.08);

  // Scheinwerfer und Rücklichter
  for (const sx of [-1, 1]) {
    if (ex.has("roundLights")) {
      const l = add(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 20), head, sx * b.w * 0.32, noseY - 0.04, L - 0.06);
      l.rotation.x = Math.PI / 2 - 0.25;
      const ring = add(new THREE.TorusGeometry(0.155, 0.025, 8, 24), chrome, sx * b.w * 0.32, noseY - 0.02, L + 0.03);
      ring.rotation.x = -0.25;
    } else {
      box(0.42, 0.1, 0.12, head, sx * b.w * 0.32, noseY - 0.12, L + 0.03);
    }
  }
  if (ex.has("fastback")) box(b.w * 0.86, 0.07, 0.1, tail, 0, y1 - 0.2, -L - 0.06);   // durchgehendes Leuchtband
  else for (const sx of [-1, 1]) box(0.42, 0.11, 0.1, tail, sx * b.w * 0.32, y1 - 0.15, -L - 0.06);

  // --- Zusatzteile ---
  const ch = ex.has("convertible") ? 0 : b.ch;
  if (ex.has("ducktail")) box(b.w * 0.8, 0.06, 0.4, paint, 0, y1 + 0.02, -L + 0.3).rotation.x = 0.25;
  if (ex.has("spoiler")) box(b.w * 0.88, 0.05, 0.32, paint, 0, y1 + 0.06, -L + 0.2).rotation.x = 0.12;
  if (ex.has("wing")) {
    box(b.w * 0.95, 0.05, 0.42, accent, 0, top + 0.42, -L + 0.3).rotation.x = 0.1;
    for (const sx of [-1, 1]) {
      box(0.06, 0.4, 0.2, trim, sx * b.w * 0.3, top + 0.2, -L + 0.3);
      box(0.03, 0.18, 0.46, accent, sx * b.w * 0.48, top + 0.44, -L + 0.3);
    }
  }
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
      const f = add(new THREE.TorusGeometry(ar + 0.02, 0.07, 6, 18, Math.PI), trim, sx * (b.w / 2 + 0.03), b.wr, cz);
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
  if (ex.has("hoodScoop")) {
    // Lufthutze auf der Motorhaube
    const zs = zf + (L - zf) * 0.3;
    box(0.62, 0.1, 0.5, paint, 0, y1 - 0.01, zs).rotation.x = 0.06;
    box(0.5, 0.06, 0.04, trim, 0, y1 + 0.01, zs + 0.25);
  }
  if (ex.has("fogLights")) {
    for (const sx of [-1, 1]) {
      const l = add(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), head, sx * b.w * 0.3, y0 + 0.2, L + 0.06);
      l.rotation.x = Math.PI / 2;
    }
  }
  if (ex.has("stripe")) {
    for (const sx of [-1, 1]) box(0.02, 0.1, b.wb - 2 * ar - 0.1, accent, sx * (b.w / 2 + 0.07), y0 + (y1 - y0) * 0.5, 0);
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
    box(b.w * 0.75, 0.07, 0.07, trim, 0, y0 + (y1 - y0) * 0.8, L + 0.2);
    box(b.w * 0.75, 0.07, 0.07, trim, 0, y0 + 0.2, L + 0.2);
    for (const sx of [-1, 1]) box(0.07, (y1 - y0) * 0.7, 0.07, trim, sx * b.w * 0.3, y0 + (y1 - y0) * 0.5, L + 0.2);
  }

  // Tieferlegung: die ganze Karosserie sinkt, die Räder bleiben
  if (b.drop) for (const part of group.children) part.position.y -= b.drop;

  // --- Räder: pivot (lenkt) -> spin (dreht sich) -> Reifen + Felge ---
  const tireGeo = new THREE.CylinderGeometry(b.wr, b.wr, b.ww, 32);
  tireGeo.rotateZ(Math.PI / 2);
  const barrelGeo = new THREE.CylinderGeometry(b.wr * 0.66, b.wr * 0.66, b.ww + 0.006, 24);
  barrelGeo.rotateZ(Math.PI / 2);
  const spokeGeo = new THREE.BoxGeometry(0.03, b.wr * 1.26, 0.07);
  const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.92 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.6, roughness: 0.5 });
  const wheels = [];
  for (const sz of [1, -1]) for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * (b.w / 2 - b.ww / 2 + 0.04), b.wr, sz * b.wb / 2);
    const spin = new THREE.Group();
    const parts = [new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(barrelGeo, barrelMat)];
    for (let k = 0; k < 5; k++) {
      const sp = new THREE.Mesh(spokeGeo, rimMat);
      sp.rotation.x = (k / 5) * Math.PI;
      sp.position.x = sx * (b.ww / 2 - 0.005);
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
