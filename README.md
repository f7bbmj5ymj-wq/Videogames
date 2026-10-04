# Sternenjäger

Ein kleiner Weltraum-Shooter in reinem HTML5 Canvas und JavaScript. Er braucht keine Installation und keine Bibliotheken.

## Spielen

`index.html` im Browser öffnen, fertig.

Alternativ mit einem lokalen Server:

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Steuerung

| Taste              | Aktion                 |
| ------------------ | ---------------------- |
| Pfeiltasten / WASD | Bewegen                |
| Leertaste          | Schießen               |
| P                  | Pause                  |
| Enter              | Starten / Neustart     |

## Aufbau des Codes (`game.js`)

- **Eingabe**: Tastenzustände werden im Objekt `keys` gespeichert.
- **Zustand**: `menu`, `playing`, `paused`, `gameover`.
- **`update(dt)`**: bewegt alles abhängig von der vergangenen Zeit `dt` (in Sekunden), prüft Kollisionen und erzeugt Gegner.
- **`draw()`**: zeichnet Hintergrund, Objekte und HUD.
- **`loop()`**: die Spielschleife über `requestAnimationFrame`.

## Ideen zum Erweitern

- Power-ups (Dreifachschuss, Schild, Extraleben)
- Gegner, die zurückschießen
- Ein Bossgegner alle 1000 Punkte
- Soundeffekte mit der Web Audio API
- Sprites statt einfacher Formen
- Touch-Steuerung für Handys
