// Sternenjäger – ein kleiner Weltraum-Shooter.
// Steuerung: Pfeiltasten / A-D zum Bewegen, Leertaste zum Schießen,
// Enter zum (Neu-)Starten, P für Pause.

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

// ---------- Eingabe ----------
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === "Enter" && state !== "playing") startGame();
  if (e.code === "KeyP" && (state === "playing" || state === "paused")) {
    state = state === "playing" ? "paused" : "playing";
  }
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

// ---------- Spielzustand ----------
let state = "menu"; // "menu" | "playing" | "paused" | "gameover"
let player, bullets, enemies, particles, stars;
let score, highscore = Number(localStorage.getItem("highscore") || 0);
let spawnTimer, difficulty;

function startGame() {
  player = { x: W / 2, y: H - 70, w: 32, h: 32, speed: 300, cooldown: 0, lives: 3, invincible: 0 };
  bullets = [];
  enemies = [];
  particles = [];
  score = 0;
  spawnTimer = 0;
  difficulty = 1;
  state = "playing";
}

// Sternenhintergrund (bewegt sich auch im Menü)
stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * W,
  y: Math.random() * H,
  speed: 20 + Math.random() * 80,
  size: Math.random() < 0.2 ? 2 : 1,
}));

// ---------- Hilfsfunktionen ----------
function overlaps(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
    Math.abs(a.y - b.y) < (a.h + b.h) / 2
  );
}

function explode(x, y, color, count = 16) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 200;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5 + Math.random() * 0.4,
      color,
    });
  }
}

function spawnEnemy() {
  const size = 24 + Math.random() * 20;
  enemies.push({
    x: size / 2 + Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    speed: (60 + Math.random() * 80) * difficulty,
    wobble: Math.random() * Math.PI * 2,
    hp: size > 38 ? 2 : 1,
  });
}

// ---------- Update ----------
function update(dt) {
  for (const s of stars) {
    s.y += s.speed * dt;
    if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
  }

  if (state !== "playing") return;

  // Spieler bewegen
  let dx = 0, dy = 0;
  if (keys.ArrowLeft || keys.KeyA) dx -= 1;
  if (keys.ArrowRight || keys.KeyD) dx += 1;
  if (keys.ArrowUp || keys.KeyW) dy -= 1;
  if (keys.ArrowDown || keys.KeyS) dy += 1;
  player.x = Math.max(player.w / 2, Math.min(W - player.w / 2, player.x + dx * player.speed * dt));
  player.y = Math.max(H / 2, Math.min(H - player.h / 2, player.y + dy * player.speed * dt));

  // Schießen
  player.cooldown -= dt;
  if (keys.Space && player.cooldown <= 0) {
    bullets.push({ x: player.x, y: player.y - player.h / 2, w: 4, h: 12, speed: 600 });
    player.cooldown = 0.18;
  }
  player.invincible = Math.max(0, player.invincible - dt);

  // Schüsse
  for (const b of bullets) b.y -= b.speed * dt;
  bullets = bullets.filter((b) => b.y > -b.h);

  // Gegner erzeugen – wird mit der Zeit schneller
  difficulty += dt * 0.02;
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(0.25, 1.2 / difficulty);
  }

  // Gegner bewegen
  for (const e of enemies) {
    e.wobble += dt * 3;
    e.y += e.speed * dt;
    e.x += Math.sin(e.wobble) * 40 * dt;
  }

  // Kollision: Schuss trifft Gegner
  for (const e of enemies) {
    for (const b of bullets) {
      if (!b.dead && !e.dead && overlaps(e, b)) {
        b.dead = true;
        e.hp--;
        if (e.hp <= 0) {
          e.dead = true;
          score += Math.round(e.w);
          explode(e.x, e.y, "#ff9f43");
        } else {
          explode(b.x, b.y, "#ffffff", 4);
        }
      }
    }
  }

  // Kollision: Gegner trifft Spieler oder fliegt unten raus
  for (const e of enemies) {
    if (e.dead) continue;
    if (player.invincible <= 0 && overlaps(e, player)) {
      e.dead = true;
      hitPlayer();
    } else if (e.y - e.h / 2 > H) {
      e.dead = true;
      score = Math.max(0, score - 10);
    }
  }

  bullets = bullets.filter((b) => !b.dead);
  enemies = enemies.filter((e) => !e.dead);

  // Partikel
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }
  particles = particles.filter((p) => p.life > 0);
}

function hitPlayer() {
  player.lives--;
  player.invincible = 2;
  explode(player.x, player.y, "#4fc3f7", 30);
  if (player.lives <= 0) {
    state = "gameover";
    if (score > highscore) {
      highscore = score;
      localStorage.setItem("highscore", highscore);
    }
  }
}

// ---------- Zeichnen ----------
function drawPlayer() {
  // Blinken während der Unverwundbarkeit
  if (player.invincible > 0 && Math.floor(player.invincible * 10) % 2 === 0) return;
  const { x, y, w, h } = player;
  ctx.fillStyle = "#4fc3f7";
  ctx.beginPath();
  ctx.moveTo(x, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.lineTo(x, y + h / 4);
  ctx.lineTo(x - w / 2, y + h / 2);
  ctx.closePath();
  ctx.fill();
  // Triebwerksflamme
  ctx.fillStyle = Math.random() < 0.5 ? "#ffeb3b" : "#ff9800";
  ctx.fillRect(x - 3, y + h / 4, 6, 6 + Math.random() * 6);
}

function drawEnemy(e) {
  ctx.fillStyle = e.hp > 1 ? "#e040fb" : "#ef5350";
  ctx.beginPath();
  ctx.moveTo(e.x, e.y + e.h / 2);
  ctx.lineTo(e.x + e.w / 2, e.y - e.h / 2);
  ctx.lineTo(e.x - e.w / 2, e.y - e.h / 2);
  ctx.closePath();
  ctx.fill();
}

function centerText(text, y, size, color = "#e8ecff") {
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, y);
}

function draw() {
  ctx.fillStyle = "#0a0c1f";
  ctx.fillRect(0, 0, W, H);

  for (const s of stars) {
    ctx.fillStyle = s.size > 1 ? "#ffffff" : "#8890c0";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  if (state === "menu") {
    centerText("STERNENJÄGER", H / 2 - 60, 40, "#4fc3f7");
    centerText("Pfeiltasten / WASD: bewegen", H / 2, 16);
    centerText("Leertaste: schießen   ·   P: Pause", H / 2 + 24, 16);
    centerText("Enter drücken zum Starten", H / 2 + 80, 20, "#ffeb3b");
    if (highscore > 0) centerText(`Highscore: ${highscore}`, H / 2 + 120, 16, "#8890c0");
    return;
  }

  ctx.fillStyle = "#ffeb3b";
  for (const b of bullets) ctx.fillRect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
  for (const e of enemies) drawEnemy(e);
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  ctx.globalAlpha = 1;
  if (state !== "gameover") drawPlayer();

  // HUD
  ctx.fillStyle = "#e8ecff";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Punkte: ${score}`, 12, 28);
  ctx.textAlign = "right";
  ctx.fillText("♥".repeat(Math.max(0, player.lives)), W - 12, 28);

  if (state === "paused") {
    centerText("PAUSE", H / 2, 40);
    centerText("P drücken zum Weiterspielen", H / 2 + 36, 16);
  }
  if (state === "gameover") {
    centerText("GAME OVER", H / 2 - 30, 44, "#ef5350");
    centerText(`Punkte: ${score}   ·   Highscore: ${highscore}`, H / 2 + 10, 18);
    centerText("Enter drücken für neues Spiel", H / 2 + 50, 18, "#ffeb3b");
  }
}

// ---------- Spielschleife ----------
let last = performance.now();
function loop(now) {
  // dt begrenzen, damit nach einem Tab-Wechsel nichts "springt"
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
