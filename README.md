# Videospiele

Öffne `index.html` im Browser und wähle ein Spiel. Du brauchst keine Installation, auch kein Internet.

## 🇨🇭 Alpenfestival (`rennspiel/`)

Ein 3D-Open-World-Rennspiel in den Schweizer Alpen, inspiriert von Festival-Rennspielen wie Forza Horizon.
Es nutzt [Three.js](https://threejs.org) mit physikalischem Himmel (`Sky.js`) sowie Nachbearbeitung und Linsenreflex (`postprocessing.js`), alles unter `lib/` mitgeliefert. Alle Texturen werden beim Start per Code erzeugt.

**Inhalt**
- Offene Welt mit Bergsee, Alpwiesen, Wäldern, Chalets, Kühen und verschneiten Gipfeln (inkl. Matterhorn)
- 12 Autos in der Garage (Taste **G**), u. a. **Porsche 911 Dakar**, **Subaru Impreza 22B STi**, Supersportwagen, Muscle-Car, Rallyeauto, Pick-up, Oldtimer
- Tuning-Werkstatt (Taste **T**): Motor, Turbo, Reifen, Fahrwerk, Leichtbau, Heckflügel, Tieferlegung, Lackierung
- Realistische Grafik: Gras im Wind, Höhennebel, Bloom, Farbabstimmung, Linsenreflex; drei Qualitätsstufen (Taste **Q**), bei Ruckeln automatisch niedriger
- Leistungsklassen D bis S2, unterschiedliche Fahrwerte für Asphalt und Gelände
- Rennen gegen 5 KI-Fahrer mit Checkpoints, Platzierung und Ergebnistabelle
- Blitzer und eine Driftzone mit Sternen und Rekorden
- Skill-Ketten (Drift, Sprung, Raser, Knapp vorbei) mit Multiplikator
- Franken (CHF) und Skillpunkte, Spielstand wird im Browser gespeichert
- Tacho, Minimap, zwei Kameras, Motorsound und Reifenqualm

**Steuerung**

| Taste | Aktion |
| --- | --- |
| W / ↑ | Gas |
| S / ↓ | Bremse / Rückwärts |
| A D / ← → | Lenken |
| Leertaste | Handbremse (Driften) |
| G | Garage |
| T | Tuning-Werkstatt |
| Q | Grafikqualität (Niedrig / Mittel / Hoch) |
| C | Kamera wechseln |
| R | Zurück auf die Strasse |
| Enter | Rennen starten (im blauen Lichtstrahl) |
| Backspace | Rennen abbrechen |
| M | Ton an/aus |
| Esc | Pause und Statistik |

**Code**
- `rennspiel/cars.js`: alle Autos (Fahrwerte und 3D-Modell). Hier kannst du neue Autos hinzufügen.
- `rennspiel/game.js`: Welt, Fahrphysik, KI, Events, HUD. Die Datei ist in nummerierte Abschnitte gegliedert.

## 🚀 Sternenjäger (`sternenjaeger/`)

Ein kleiner 2D-Weltraum-Shooter in HTML5 Canvas.
Steuerung: Pfeiltasten/WASD, Leertaste zum Schiessen, P für Pause, Enter zum Starten.
