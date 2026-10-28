// Thread — a small game for thatgamejam #02.
// You are a needle carrying one warm thread through a cold winter town.
// Touch a window to stitch it: it lights up, the thread anchors there and grows longer.
// Shutters breathe with the music (80 BPM): a closed window cannot be stitched.
'use strict';

const cv = document.getElementById('c');
const g = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
}
addEventListener('resize', resize); resize();

// ---------- music (original, generated live; F minor, 80 BPM) ----------
const BPM = 80, BEAT = 60 / BPM;
let ac = null, master = null, layers = 0, nextBar = 0, barIdx = 0;
const F = n => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz
const CHORDS = [[53, 56, 60], [49, 53, 56], [56, 60, 63], [51, 55, 58]]; // Fm Db Ab Eb
const PENTA = [65, 68, 70, 72, 75, 77, 80, 82]; // F minor pentatonic, upper voice
function tone(freq, t, dur, vol, type = 'sine', attack = 0.02) {
  const o = ac.createOscillator(), e = ac.createGain();
  o.type = type; o.frequency.value = freq;
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(vol, t + attack);
  e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(e).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
function startAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  master = ac.createGain(); master.gain.value = 0.5;
  const verb = ac.createDelay(); verb.delayTime.value = BEAT * 0.75;
  const fb = ac.createGain(); fb.gain.value = 0.32;
  master.connect(ac.destination); master.connect(verb); verb.connect(fb).connect(verb); fb.connect(ac.destination);
  nextBar = ac.currentTime + 0.1;
}
function scheduleMusic() {
  if (!ac) return;
  while (nextBar < ac.currentTime + 0.5) {
    const ch = CHORDS[barIdx % 4], t = nextBar;
    ch.forEach(n => tone(F(n), t, BEAT * 4.2, 0.05, 'triangle', 0.6)); // pad, always
    if (layers >= 2) tone(F(ch[0] - 24), t, BEAT * 3.5, 0.09, 'sine', 0.05); // bass
    if (layers >= 4) for (let b = 0; b < 4; b++) tone(F(ch[b % 3] + 12), t + b * BEAT, BEAT * 1.4, 0.035, 'sine'); // arp
    if (layers >= 7) tone(F(PENTA[(barIdx * 3) % PENTA.length] + 12), t + BEAT * 2, BEAT * 2, 0.025, 'sine'); // bell
    nextBar += BEAT * 4; barIdx++;
  }
}
function stitchSound(i) { if (ac) tone(F(PENTA[i % PENTA.length]), ac.currentTime, 1.8, 0.12, 'sine', 0.005); }
function songBeat() { return ac ? (ac.currentTime - (nextBar - BEAT * 4 * barIdx)) / BEAT : performance.now() / 1000 / BEAT; }

// ---------- levels ----------
// Window positions are fractions of the screen; shut = shutter breathes, every N beats open.
const LEVELS = [
  { line: 'The town is cold tonight.', reach: 0.32, wins: [[.30, .62], [.48, .55], [.66, .63]] },
  { line: 'Some windows only open when the song breathes in.', reach: 0.26,
    wins: [[.22, .66], [.38, .52, 1], [.55, .64], [.72, .50, 1], [.85, .66]] },
  { line: 'Further apart. You can still reach them.', reach: 0.22,
    wins: [[.15, .70], [.30, .45], [.47, .70, 1], [.62, .40], [.78, .62, 1], [.90, .38]] },
  { line: 'Everyone, together.', reach: 0.24,
    wins: [[.12, .55], [.25, .74, 1], [.38, .40], [.50, .66, 1], [.62, .36], [.74, .72, 1], [.86, .48], [.50, .22, 1]] },
];

let lv = 0, wins = [], anchors = [], reach = 0, state = 'title', stateT = 0, total = 0;
const needle = { x: 0, y: 0, tx: 0, ty: 0 };
const snow = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() * 1.6 + 0.4, v: Math.random() * 0.02 + 0.01 }));

function loadLevel(i) {
  const L = LEVELS[i];
  wins = L.wins.map(([x, y, shut]) => ({ fx: x, fy: y, shut: !!shut, lit: 0, on: false, lift: 0 }));
  anchors = [{ fx: 0.12, fy: 0.86 }];
  reach = L.reach; state = 'play'; stateT = 0;
  needle.x = needle.tx = anchors[0].fx * W; needle.y = needle.ty = anchors[0].fy * H;
}
const P = o => ({ x: o.fx * W, y: o.fy * H });
function shutterOpen(w) { return !w.shut || (songBeat() % 4) < 2; }

// ---------- input ----------
const keys = {};
addEventListener('keydown', e => { keys[e.key] = true; begin(); });
addEventListener('keyup', e => { keys[e.key] = false; });
addEventListener('pointermove', e => { needle.tx = e.clientX; needle.ty = e.clientY; });
addEventListener('pointerdown', e => { needle.tx = e.clientX; needle.ty = e.clientY; begin(); });
function begin() {
  startAudio();
  if (state === 'title') { lv = 0; loadLevel(0); }
  else if (state === 'end' && stateT > 3) { state = 'title'; stateT = 0; }
}

// ---------- autoplay (?autoplay): attract mode, also used to record the walkthrough ----------
const AUTO = /autoplay/.test(location.search);
let route = null;
function planRoute() { // same search as tests/reach.mjs: an order where each window is in reach of the last anchor
  const R0 = Math.min(W, H) * 1.6, out = [];
  const go = (at, r) => {
    if (out.length === wins.length) return true;
    for (const w of wins) {
      if (out.includes(w) || Math.hypot(w.fx * W - at.x, w.fy * H - at.y) > r * R0 + 26) continue;
      out.push(w); if (go(P(w), r + 0.03)) return true; out.pop();
    }
    return false;
  };
  go(P(anchors[0]), reach);
  return out;
}
function autopilot() {
  if (!route || route.wins !== wins) { route = planRoute(); route.wins = wins; }
  const w = route.find(w => !w.lit);
  if (!w) return;
  const p = P(w), dx = p.x - needle.tx, dy = p.y - needle.ty, d = Math.hypot(dx, dy), s = Math.min(d, 4);
  if (d > 0.5) { needle.tx += dx / d * s; needle.ty += dy / d * s; }
}

// ---------- update ----------
function update(dt) {
  stateT += dt; scheduleMusic();
  snow.forEach(s => { s.y += s.v * dt * (state === 'lift' ? -3 : 1); s.x += Math.sin(s.y * 9 + s.s) * 0.0004; if (s.y > 1) s.y = 0; if (s.y < 0) s.y = 1; });
  if (state !== 'play') {
    if (state === 'lift') {
      wins.forEach((w, i) => w.lift += dt * (0.10 + i * 0.015));
      if (stateT > 5) { if (lv + 1 < LEVELS.length) loadLevel(++lv); else { state = 'end'; stateT = 0; } }
    }
    return;
  }
  if (AUTO) autopilot();
  const k = 520 * dt;
  if (keys.ArrowLeft || keys.a) needle.tx -= k; if (keys.ArrowRight || keys.d) needle.tx += k;
  if (keys.ArrowUp || keys.w) needle.ty -= k; if (keys.ArrowDown || keys.s) needle.ty += k;
  needle.x += (needle.tx - needle.x) * Math.min(1, dt * 8);
  needle.y += (needle.ty - needle.y) * Math.min(1, dt * 8);
  // the thread is only so long: the needle cannot leave the last anchor's reach
  const a = P(anchors[anchors.length - 1]), R = reach * Math.min(W, H) * 1.6;
  const dx = needle.x - a.x, dy = needle.y - a.y, d = Math.hypot(dx, dy);
  if (d > R) { needle.x = a.x + dx / d * R; needle.y = a.y + dy / d * R; }
  wins.forEach((w, i) => {
    if (w.lit) { w.lit = Math.min(1, w.lit + dt * 1.5); return; }
    const p = P(w);
    if (Math.hypot(needle.x - p.x, needle.y - p.y) < 26 && shutterOpen(w)) {
      w.lit = 0.01; anchors.push(w); reach += 0.03; layers++; total++;
      stitchSound(total);
    }
  });
  if (wins.every(w => w.lit >= 1)) { state = 'lift'; stateT = 0; if (ac) tone(F(77), ac.currentTime, 3, 0.1); }
}

// ---------- draw ----------
function sag(a, b, amt) {
  g.moveTo(a.x, a.y);
  g.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + amt, b.x, b.y);
}
function house(p, w, warm) {
  const bw = 70, bh = 64, lift = w.lift * H;
  const x = p.x - bw / 2, y = p.y - 18 - lift;
  g.fillStyle = `rgb(${30 + warm * 40},${34 + warm * 22},${58 - warm * 10})`;
  g.fillRect(x, y, bw, bh);
  g.beginPath(); g.moveTo(x - 8, y); g.lineTo(p.x, y - 34); g.lineTo(x + bw + 8, y); g.closePath(); g.fill();
  g.fillStyle = '#e9eef7'; g.globalAlpha = 0.85; g.fillRect(x - 8, y - 4, bw + 16, 5); g.globalAlpha = 1; // snow on roof
  const open = shutterOpen(w) || w.lit;
  const glow = w.lit ? w.lit : 0;
  if (glow) {
    const r = g.createRadialGradient(p.x, p.y - lift, 2, p.x, p.y - lift, 70 + glow * 30);
    r.addColorStop(0, `rgba(255,190,110,${0.45 * glow})`); r.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = r; g.fillRect(p.x - 110, p.y - lift - 110, 220, 220);
  }
  g.fillStyle = glow ? `rgb(255,${180 + glow * 30},${100 + glow * 40})` : '#3a4466';
  g.fillRect(p.x - 13, p.y - 13 - lift, 26, 26);
  if (!open) { g.fillStyle = '#5a4a3a'; g.fillRect(p.x - 15, p.y - 15 - lift, 30, 30); g.fillStyle = '#463a2e'; g.fillRect(p.x - 1, p.y - 15 - lift, 2, 30); }
  else if (w.shut && !w.lit) { g.strokeStyle = 'rgba(255,220,160,.6)'; g.lineWidth = 2; g.strokeRect(p.x - 16, p.y - 16 - lift, 32, 32); }
}
function text(s, y, size, alpha) {
  g.globalAlpha = alpha; g.fillStyle = '#f3e6d0'; g.textAlign = 'center';
  g.font = `${size}px Georgia, 'Times New Roman', serif`; g.fillText(s, W / 2, y); g.globalAlpha = 1;
}
function draw() {
  const warmth = wins.length ? wins.filter(w => w.lit).length / wins.length : 0;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, `rgb(${11 + warmth * 30},${16 + warmth * 12},${32 + warmth * 10})`);
  sky.addColorStop(1, `rgb(${26 + warmth * 50},${30 + warmth * 25},${52})`);
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  g.fillStyle = '#dfe6f2';
  snow.forEach(s => { g.globalAlpha = 0.6; g.beginPath(); g.arc(s.x * W, s.y * H, s.s, 0, 7); g.fill(); });
  g.globalAlpha = 1;
  g.fillStyle = '#c9d3e6'; g.fillRect(0, H * 0.86, W, H * 0.14); // snowy ground

  if (state === 'title') {
    text('Thread', H * 0.42, 72, 1);
    text('one warm thread, a cold town, and the people behind its windows', H * 0.42 + 46, 20, 0.8);
    text('move with the mouse or arrow keys · click to begin', H * 0.62, 18, 0.5 + 0.3 * Math.sin(stateT * 2));
  } else {
    wins.forEach(w => house(P(w), w, w.lit));
    // stitched thread through every anchor, then the loose end to the needle
    g.strokeStyle = '#e8564a'; g.lineWidth = 2.5; g.lineCap = 'round';
    g.beginPath();
    for (let i = 1; i < anchors.length; i++) {
      const a = P(anchors[i - 1]), b = P(anchors[i]);
      a.y -= (anchors[i - 1].lift || 0) * H; b.y -= (anchors[i].lift || 0) * H;
      sag(a, b, 30);
    }
    g.stroke();
    if (state === 'play') {
      const a = P(anchors[anchors.length - 1]), R = reach * Math.min(W, H) * 1.6;
      const d = Math.hypot(needle.x - a.x, needle.y - a.y);
      g.beginPath(); sag(a, needle, Math.max(0, 40 * (1 - d / R))); g.stroke();
      g.strokeStyle = 'rgba(232,86,74,.12)'; g.lineWidth = 1; g.beginPath(); g.arc(a.x, a.y, R, 0, 7); g.stroke();
      g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(needle.x, needle.y, 5, 0, 7); g.fill();
      g.strokeStyle = '#fff4dc'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(needle.x - 9, needle.y + 9); g.lineTo(needle.x + 4, needle.y - 4); g.stroke();
      text(LEVELS[lv].line, H * 0.14, 24, Math.min(1, stateT / 1.5) * Math.max(0.25, 1 - (stateT - 6) / 4));
    }
    if (state === 'lift') text(lv + 1 < LEVELS.length ? 'warm, for now' : 'together', H * 0.14, 26, Math.min(1, stateT));
    if (state === 'end') {
      text('Thank you for staying with them.', H * 0.4, 34, Math.min(1, stateT / 2));
      text(`${total} windows stitched`, H * 0.4 + 44, 20, Math.min(1, stateT / 3) * 0.8);
      if (stateT > 3) text('click to begin again', H * 0.62, 18, 0.6);
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  update(dt); draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// test hook: lets the automated check drive the game without a mouse
window.__thread = { get state() { return state; }, get lv() { return lv; }, get wins() { return wins; }, needle, P, begin };
