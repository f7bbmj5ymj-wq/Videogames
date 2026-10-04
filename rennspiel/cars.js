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
    id: "falke",
    name: "Falke GT",
    kind: "Supersportwagen",
    color: 0xff3b30,
    desc: "Flach, breit, brutal schnell. Auf Gras allerdings ziemlich hilflos.",
    top: 92, accel: 15, grip: 8.2, off: 0.45,
    body: { w: 2.05, l: 4.6, h: 0.5, ride: 0.18, ch: 0.42, cl: 1.8, cz: -0.1, wr: 0.36, ww: 0.38, wb: 2.7,
      extras: ["wing", "fastback"] },
  },
  {
    id: "blitz",
    name: "Blitz RS",
    kind: "Sportcoupé",
    color: 0x2f80ed,
    desc: "Ausgewogener Sportwagen, gut für Anfänger und Rennen.",
    top: 80, accel: 13, grip: 7.8, off: 0.55,
    body: { w: 1.95, l: 4.4, h: 0.55, ride: 0.22, ch: 0.48, cl: 2.0, cz: -0.2, wr: 0.37, ww: 0.32, wb: 2.6,
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
    body: { w: 1.9, l: 4.4, h: 0.52, ride: 0.18, ch: 0.48, cl: 1.9, cz: -0.2, wr: 0.36, ww: 0.34, wb: 2.55,
      extras: ["wing", "stripe"] },
  },
];

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

// Baut das 3D-Modell eines Autos aus einfachen Formen.
// Das Auto schaut in +z-Richtung, der Ursprung liegt auf dem Boden.
function makeCarMesh(spec) {
  const b = spec.body;
  const ex = new Set(b.extras || []);
  const group = new THREE.Group();

  const paint = new THREE.MeshStandardMaterial({ color: spec.color, metalness: 0.35, roughness: 0.38 });
  const accent = new THREE.MeshStandardMaterial({ color: spec.accent ?? 0x222222, metalness: 0.2, roughness: 0.5 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.7, roughness: 0.12 });
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4c8, emissiveIntensity: 1.2 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 0.4 });

  function box(w, h, l, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    group.add(m);
    return m;
  }

  const top = b.ride + b.h; // Oberkante des unteren Teils
  box(b.w, b.h, b.l, paint, 0, b.ride + b.h / 2, 0);
  // Abgeschrägte Front (Motorhaube) für eine weniger kastige Form
  const nose = box(b.w * 0.98, 0.18, b.l * 0.28, paint, 0, top - 0.02, b.l * 0.36);
  nose.rotation.x = 0.12;

  // Fahrgastzelle
  if (ex.has("convertible")) {
    box(b.w * 0.85, 0.32, 0.08, glass, 0, top + 0.16, b.cz + 0.3); // Windschutzscheibe
    box(b.w * 0.8, 0.12, 1.3, dark, 0, top + 0.06, b.cz - 0.5);   // Sitze / Innenraum
  } else {
    box(b.w * 0.84, b.ch, b.cl, glass, 0, top + b.ch / 2, b.cz);
    box(b.w * 0.8, 0.07, b.cl * 0.78, paint, 0, top + b.ch + 0.03, b.cz);
  }
  if (ex.has("fastback")) {
    // schräges Heck wie beim 911: vom Dach hinunter bis ans Wagenende
    const run = b.l / 2 + (b.cz - b.cl / 2) - 0.1;
    const fb = box(b.w * 0.84, 0.08, Math.hypot(run, b.ch), paint, 0, top + b.ch / 2, b.cz - b.cl / 2 - run / 2);
    fb.rotation.x = -Math.atan2(b.ch, run);
  }
  if (ex.has("ducktail")) {
    // kleiner "Entenbürzel"-Spoiler am Heck
    box(b.w * 0.86, 0.08, 0.45, accent, 0, top + 0.12, -b.l / 2 + 0.25).rotation.x = 0.3;
  }
  if (ex.has("spoiler")) box(b.w * 0.9, 0.06, 0.35, paint, 0, top + 0.12, -b.l / 2 + 0.2);
  if (ex.has("wing")) {
    box(b.w * 0.95, 0.06, 0.45, accent, 0, top + 0.45, -b.l / 2 + 0.3);
    box(0.08, 0.4, 0.2, dark, b.w * 0.3, top + 0.22, -b.l / 2 + 0.3);
    box(0.08, 0.4, 0.2, dark, -b.w * 0.3, top + 0.22, -b.l / 2 + 0.3);
  }
  if (ex.has("rack")) {
    const ry = top + b.ch + 0.14;
    box(b.w * 0.82, 0.05, b.cl * 0.85, dark, 0, ry, b.cz);
    box(0.05, 0.12, b.cl * 0.85, dark, b.w * 0.4, ry + 0.05, b.cz);
    box(0.05, 0.12, b.cl * 0.85, dark, -b.w * 0.4, ry + 0.05, b.cz);
  }
  if (ex.has("lightbar")) {
    const ly = top + b.ch + (ex.has("rack") ? 0.28 : 0.12);
    for (const x of [-0.5, -0.17, 0.17, 0.5]) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 12), head);
      l.rotation.x = Math.PI / 2;
      l.position.set(x * b.w * 0.8, ly, b.cz + b.cl * 0.42);
      group.add(l);
    }
  }
  if (ex.has("cladding")) {
    // schwarze Radlauf-Verkleidungen
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      box(0.14, 0.22, b.wr * 2.4, dark, sx * (b.w / 2 + 0.02), b.ride + b.h * 0.75, sz * b.wb / 2);
    }
    box(b.w + 0.04, 0.16, b.l * 0.98, dark, 0, b.ride + 0.08, 0);
  }
  if (ex.has("stripe")) {
    for (const sx of [-1, 1]) box(0.02, 0.12, b.l * 0.92, accent, sx * (b.w / 2 + 0.01), b.ride + b.h * 0.45, 0);
  }
  if (ex.has("hoodStripes")) {
    for (const x of [-0.18, 0.18]) box(0.16, 0.02, b.l * 0.98, accent, x, top + 0.01, 0);
  }
  if (ex.has("bed")) {
    // Ladefläche des Pick-ups
    const bl = b.l / 2 - (b.cz - b.cl / 2) - 0.2;
    const bz = (b.cz - b.cl / 2) - bl / 2 - 0.1;
    box(b.w * 0.9, 0.04, bl, dark, 0, top + 0.02, bz);
    for (const sx of [-1, 1]) box(0.08, 0.3, bl, paint, sx * b.w * 0.45, top + 0.15, bz);
    box(b.w * 0.9, 0.3, 0.08, paint, 0, top + 0.15, bz - bl / 2);
  }
  if (ex.has("bullbar")) {
    box(b.w * 0.75, 0.08, 0.08, dark, 0, b.ride + b.h * 0.9, b.l / 2 + 0.12);
    box(b.w * 0.75, 0.08, 0.08, dark, 0, b.ride + b.h * 0.3, b.l / 2 + 0.12);
    box(0.08, b.h * 0.7, 0.08, dark, b.w * 0.3, b.ride + b.h * 0.6, b.l / 2 + 0.12);
    box(0.08, b.h * 0.7, 0.08, dark, -b.w * 0.3, b.ride + b.h * 0.6, b.l / 2 + 0.12);
  }

  // Scheinwerfer und Rücklichter
  for (const sx of [-1, 1]) {
    if (ex.has("roundLights")) {
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16), head);
      l.rotation.x = Math.PI / 2;
      l.position.set(sx * b.w * 0.33, top - 0.05, b.l / 2 + 0.02);
      group.add(l);
    } else {
      box(0.42, 0.1, 0.05, head, sx * b.w * 0.33, top - 0.12, b.l / 2 + 0.01);
    }
    box(0.4, 0.1, 0.05, tail, sx * b.w * 0.33, top - 0.12, -b.l / 2 - 0.01);
  }

  // Räder: pivot (lenkt) -> spin (dreht sich) -> Reifen + Felge
  const tireGeo = new THREE.CylinderGeometry(b.wr, b.wr, b.ww, 18);
  const rimGeo = new THREE.CylinderGeometry(b.wr * 0.6, b.wr * 0.6, b.ww + 0.02, 10);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 0.8, roughness: 0.3 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheels = [];
  for (const sz of [1, -1]) for (const sx of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(sx * (b.w / 2 - b.ww / 2 + 0.06), b.wr, sz * b.wb / 2);
    const spin = new THREE.Group();
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.z = Math.PI / 2;
    spin.add(tire, rim);
    pivot.add(spin);
    group.add(pivot);
    wheels.push({ pivot, spin, front: sz > 0 });
  }

  return { group, wheels, tail, radius: b.wr };
}
