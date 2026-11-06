import { WEAPONS } from './weapons.js';
import { STAGES, W, H, platAt } from './stages.js';
import { MAX_HP } from './game.js';
import { sfx } from './audio.js';

export const PCOL = ['#ff4d5e', '#3da5ff'];

// ---------- weapon drawing (local coords: hand at origin, pointing +x) ----------
export function drawWeapon(ctx, id, scale = 1) {
  const wp = WEAPONS[id];
  if (!wp) return;
  const c = wp.color;
  const s = (wp.size || 1) * scale;
  ctx.save();
  ctx.scale(s, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const line = (x1, y1, x2, y2, col, lw) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  const fill = (col) => { ctx.fillStyle = col; ctx.fill(); };
  const dark = '#3e2723', metal = '#90a4ae';
  switch (wp.shape) {
    case 'fist': break;
    case 'sword':
      line(-6, 0, 6, 0, dark, 5); line(6, -8, 6, 8, '#ffd54f', 4);
      ctx.beginPath(); ctx.moveTo(8, -3.5); ctx.lineTo(48, -3.5); ctx.lineTo(56, 0); ctx.lineTo(48, 3.5); ctx.lineTo(8, 3.5); ctx.closePath(); fill(c);
      break;
    case 'katana':
      line(-8, 0, 6, 0, '#212121', 4); line(6, -5, 6, 5, '#ffd54f', 3);
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(36, 2, 60, -6); ctx.stroke();
      break;
    case 'dagger':
      line(-4, 0, 5, 0, dark, 4); line(5, -5, 5, 5, '#bdbdbd', 3);
      ctx.beginPath(); ctx.moveTo(6, -3); ctx.lineTo(24, 0); ctx.lineTo(6, 3); ctx.closePath(); fill(c);
      break;
    case 'axe':
      line(-8, 0, 46, 0, '#795548', 5);
      ctx.beginPath(); ctx.moveTo(36, -2); ctx.quadraticCurveTo(46, -22, 58, -16); ctx.lineTo(52, 0); ctx.lineTo(58, 16); ctx.quadraticCurveTo(46, 22, 36, 2); ctx.closePath(); fill(c);
      break;
    case 'halberd':
      line(-20, 0, 80, 0, '#795548', 5);
      ctx.beginPath(); ctx.moveTo(62, -2); ctx.quadraticCurveTo(70, -20, 80, -14); ctx.lineTo(76, -2); ctx.closePath(); fill(c);
      ctx.beginPath(); ctx.moveTo(80, -3); ctx.lineTo(96, 0); ctx.lineTo(80, 3); ctx.closePath(); fill(c);
      break;
    case 'pick':
      line(-8, 0, 44, 0, '#795548', 5);
      ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(30, -20); ctx.quadraticCurveTo(46, -6, 46, 0); ctx.quadraticCurveTo(46, 6, 30, 20); ctx.stroke();
      break;
    case 'hammer':
      line(-8, 0, 44, 0, '#795548', 5);
      ctx.fillStyle = c; ctx.fillRect(38, -16, 18, 32); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(38, -16, 5, 32);
      break;
    case 'club':
      ctx.beginPath(); ctx.moveTo(-6, -3); ctx.lineTo(44, -9); ctx.quadraticCurveTo(52, 0, 44, 9); ctx.lineTo(-6, 3); ctx.closePath(); fill(c);
      ctx.fillStyle = '#eee'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(20 + k * 7, (k % 2 ? 1 : -1) * 7, 2.5, 0, 7); ctx.fill(); }
      break;
    case 'nunchaku':
      line(-4, 0, 16, 0, c, 6); line(16, 0, 24, 8, '#bdbdbd', 2); line(24, 8, 42, 14, c, 6);
      break;
    case 'spear':
      line(-24, 0, 82, 0, '#a1887f', 4);
      ctx.beginPath(); ctx.moveTo(80, -6); ctx.lineTo(100, 0); ctx.lineTo(80, 6); ctx.closePath(); fill(c);
      break;
    case 'lance':
      line(-10, 0, 10, 0, '#5d4037', 5);
      ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(110, 0); ctx.lineTo(10, 10); ctx.closePath(); fill(c);
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'trident':
      line(-20, 0, 74, 0, '#78909c', 4);
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath();
      ctx.moveTo(74, -12); ctx.lineTo(74, 12); ctx.moveTo(74, -12); ctx.lineTo(92, -12); ctx.moveTo(74, 0); ctx.lineTo(96, 0); ctx.moveTo(74, 12); ctx.lineTo(92, 12); ctx.stroke();
      break;
    case 'scythe':
      line(-20, 0, 72, 0, '#4e342e', 5);
      ctx.beginPath(); ctx.moveTo(70, -2); ctx.quadraticCurveTo(70, -40, 30, -44); ctx.quadraticCurveTo(58, -30, 62, 2); ctx.closePath(); fill(c);
      ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.5; ctx.stroke();
      break;
    case 'staff':
      line(-24, 0, 58, 0, '#8d6e63', 4);
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(64, 0, 8, 0, 7); fill(c); ctx.restore();
      break;
    case 'wand':
      line(-4, 0, 26, 0, '#5d4037', 3);
      ctx.save(); ctx.translate(30, 0); ctx.shadowColor = c; ctx.shadowBlur = 12; star(ctx, 0, 0, 5, 9, 4); fill(c); ctx.restore();
      break;
    case 'whip':
      ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(30, -18, 50, 18, 80, 4); ctx.stroke();
      line(-6, 0, 4, 0, dark, 5);
      break;
    case 'gauntlet':
      ctx.beginPath(); ctx.arc(4, 0, 10, 0, 7); fill(c); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 2; ctx.stroke();
      break;
    case 'chainsaw':
      ctx.fillStyle = c; ctx.fillRect(-6, -9, 22, 16);
      ctx.fillStyle = metal; ctx.fillRect(16, -5, 40, 9);
      ctx.fillStyle = '#424242'; for (let k = 0; k < 8; k++) ctx.fillRect(17 + k * 5, -7, 2, 13);
      break;
    case 'pistol': case 'smg':
      ctx.fillStyle = '#263238'; ctx.fillRect(-4, -2, 7, 12);
      ctx.fillStyle = c; ctx.fillRect(-4, -7, wp.shape === 'smg' ? 30 : 24, 7);
      if (wp.shape === 'smg') { ctx.fillStyle = '#263238'; ctx.fillRect(10, 0, 5, 12); }
      break;
    case 'rifle':
      ctx.fillStyle = '#5d4037'; ctx.fillRect(-18, -4, 16, 9);
      ctx.fillStyle = c; ctx.fillRect(-4, -6, 50, 7); ctx.fillRect(-2, 0, 6, 9);
      ctx.fillStyle = '#212121'; ctx.fillRect(8, -11, 14, 4);
      break;
    case 'shotgun':
      ctx.fillStyle = '#5d4037'; ctx.fillRect(-18, -3, 20, 9);
      ctx.fillStyle = c; ctx.fillRect(0, -7, 42, 5); ctx.fillStyle = '#424242'; ctx.fillRect(0, -2, 42, 4);
      break;
    case 'launcher': case 'flamer':
      ctx.fillStyle = c; ctx.fillRect(-20, -10, 62, 14);
      ctx.fillStyle = '#212121'; ctx.fillRect(38, -12, 8, 18); ctx.fillRect(0, 4, 6, 9);
      if (wp.shape === 'flamer') { ctx.fillStyle = '#ffab00'; ctx.beginPath(); ctx.arc(-8, 12, 7, 0, 7); ctx.fill(); }
      break;
    case 'bow':
      ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-6, 0, 30, -1.2, 1.2); ctx.stroke();
      ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-6 + 30 * Math.cos(-1.2), 30 * Math.sin(-1.2)); ctx.lineTo(-6 + 30 * Math.cos(1.2), 30 * Math.sin(1.2)); ctx.stroke();
      break;
    case 'crossbow':
      ctx.fillStyle = c; ctx.fillRect(-10, -3, 44, 6);
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(20, 0, 20, -1.3, 1.3); ctx.stroke();
      break;
    case 'shuriken':
      ctx.save(); ctx.translate(8, 0); star(ctx, 0, 0, 4, 12, 4); fill(c); ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill(); ctx.restore();
      break;
    case 'boomerang':
      ctx.strokeStyle = c; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(22, -16); ctx.lineTo(4, 0); ctx.lineTo(22, 16); ctx.stroke();
      break;
    case 'chakram':
      ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(14, 0, 13, 0, 7); ctx.stroke();
      break;
    case 'slingshot':
      line(-4, 0, 10, 0, '#795548', 5); line(10, 0, 22, -12, '#795548', 4); line(10, 0, 22, 12, '#795548', 4);
      line(22, -12, 16, 0, '#d7ccc8', 1.5); line(22, 12, 16, 0, '#d7ccc8', 1.5);
      break;
    case 'fan':
      ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 36, -0.9, 0.9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#004d40'; ctx.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(36 * Math.cos(k * 0.3), 36 * Math.sin(k * 0.3)); ctx.stroke(); }
      break;
    case 'orb':
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(14, -14, 11, 0, 7); fill(c); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(10, -18, 4, 0, 7); ctx.fill();
      break;
  }
  ctx.restore();
}

function star(ctx, x, y, n, ro, ri) {
  ctx.beginPath();
  for (let k = 0; k < n * 2; k++) {
    const r = k % 2 ? ri : ro, a = (k / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.closePath();
}

// icon for menus
export function weaponIcon(id, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size * 2;
  const ctx = c.getContext('2d');
  ctx.scale(2, 2);
  const wp = WEAPONS[id];
  const len = { spear: 100, lance: 110, halberd: 96, trident: 96, scythe: 72, staff: 72 }[wp.shape] || 60;
  const sc = Math.min(1.2, (size * 0.95) / (len * (wp.size || 1) + 20));
  ctx.translate(size * 0.22, size * 0.62);
  ctx.rotate(-0.55);
  if (wp.shape === 'fist') {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(size * 0.25, -4, size * 0.18, 0, 7); ctx.fill();
  } else drawWeapon(ctx, id, sc);
  return c;
}

// ---------- renderer ----------
export class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.parts = [];
    this.texts = [];
    this.shake = 0;
    this.banner = null;
    this.deco = {};
    this.resize();
    addEventListener('resize', () => this.resize());
  }
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.cv.width = Math.round(innerWidth * dpr);
    this.cv.height = Math.round(innerHeight * dpr);
    this.dpr = dpr;
  }

  // consume fx events from the sim
  events(list, me) {
    for (const e of list) {
      switch (e.t) {
        case 'hit':
          this.burst(e.x, e.y, e.small ? 3 : 10, e.c, 5);
          this.texts.push({ x: e.x + (Math.random() - 0.5) * 20, y: e.y - 20, s: '-' + e.d, c: e.small ? e.c : '#fff', life: 45 });
          if (!e.small) { this.shake = Math.max(this.shake, Math.min(10, 2 + e.d * 0.4)); sfx('hit'); }
          break;
        case 'boom':
          this.parts.push({ k: 'ring', x: e.x, y: e.y, r: 5, mr: e.r, life: 20, max: 20, c: e.c });
          this.burst(e.x, e.y, 22, e.c, 9); this.burst(e.x, e.y, 10, '#555', 4, 'smoke');
          this.shake = Math.max(this.shake, e.r / 10); sfx('boom');
          break;
        case 'ko':
          this.parts.push({ k: 'ring', x: e.x, y: e.y, r: 10, mr: 260, life: 30, max: 30, c: PCOL[e.i] });
          this.burst(e.x, e.y, 40, PCOL[e.i], 12);
          this.shake = 18; sfx('ko');
          this.banner = { s: 'K.O.!', c: PCOL[e.i], life: 70 };
          break;
        case 'win': this.banner = null; break;
        case 'spark': this.burst(e.x, e.y, 6, '#fff59d', 5); break;
        case 'block': this.burst(e.x, e.y, 8, '#80d8ff', 6); sfx('block'); break;
        case 'smoke': this.burst(e.x, e.y, 18, '#9e9e9e', 4, 'smoke'); sfx('teleport'); break;
        case 'heal': this.burst(e.x, e.y, 16, '#69f0ae', 3, 'up'); this.texts.push({ x: e.x, y: e.y - 40, s: '+' + e.v, c: '#69f0ae', life: 50 }); sfx('heal'); break;
        case 'bolt': this.parts.push({ k: 'bolt', x: e.x, life: 14, max: 14, seed: Math.random() * 1000 }); this.burst(e.x, 700, 14, '#fff176', 8); sfx('thunder'); break;
        case 'trail': this.parts.push({ k: 'ghost', x: e.x, y: e.y, life: 12, max: 12, c: PCOL[e.i] }); break;
        case 'jump': this.burst(e.x, e.y, 4, 'rgba(255,255,255,.6)', 2, 'smoke'); sfx('jump'); break;
        case 'land': this.burst(e.x, e.y, 5, 'rgba(255,255,255,.5)', 2, 'smoke'); break;
        case 'pad': this.burst(e.x, e.y, 12, '#ff00ff', 6, 'up'); sfx('pad'); break;
        case 'dust': this.burst(e.x, e.y, 2, e.c, 4, 'up'); break;
        case 'spawn': this.burst(e.x, e.y, 20, PCOL[e.i], 5); sfx('spawn'); break;
        case 'pickup':
          this.texts.push({ x: e.x, y: e.y - 20, s: WEAPONS[e.w].name, c: '#ffe082', life: 70, big: true });
          sfx('pickup');
          break;
        case 'skill':
          this.texts.push({ x: e.x, y: e.y - 10, s: e.name + '!', c: e.c, life: 60, big: true });
          this.burst(e.x, e.y + 60, 12, e.c, 5);
          sfx('skill');
          break;
        case 'shake': this.shake = Math.max(this.shake, e.v); break;
        case 'snd': sfx(e.n); break;
      }
    }
  }

  burst(x, y, n, c, sp, k = 'dot') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = Math.random() * sp;
      this.parts.push({
        k, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (k === 'up' ? 2 : 0),
        life: 20 + Math.random() * 20, max: 40, c, s: k === 'smoke' ? 8 + Math.random() * 10 : 2 + Math.random() * 3,
      });
    }
    if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
  }

  draw(g, me, opts = {}) {
    const ctx = this.ctx, cw = this.cv.width, ch = this.cv.height;
    const st = STAGES[g.stage];
    const scale = Math.min(cw / W, ch / H);
    const ox = (cw - W * scale) / 2, oy = (ch - H * scale) / 2;
    // background fill
    const grd = ctx.createLinearGradient(0, 0, 0, ch);
    grd.addColorStop(0, st.sky[0]); grd.addColorStop(1, st.sky[1]);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = grd; ctx.fillRect(0, 0, cw, ch);

    let sx = 0, sy = 0;
    if (this.shake > 0.3) { sx = (Math.random() - 0.5) * this.shake; sy = (Math.random() - 0.5) * this.shake; this.shake *= 0.88; }
    ctx.setTransform(scale, 0, 0, scale, ox + sx * scale, oy + sy * scale);
    this.scale = scale; this.ox = ox; this.oy = oy;

    this.drawBackdrop(ctx, st, g.t);
    // platforms
    for (const pl of st.plats) {
      const p = platAt(pl, g.t);
      this.drawPlat(ctx, st, pl, p.x, p.y, g.t);
    }
    if (st.lava) {
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath(); ctx.moveTo(-400, H + 400);
      for (let x = -400; x <= W + 400; x += 40) ctx.lineTo(x, st.lava + Math.sin(x * 0.02 + g.t * 0.05) * 8);
      ctx.lineTo(W + 400, H + 400); ctx.fill();
      ctx.fillStyle = 'rgba(255,214,0,.5)'; ctx.fillRect(-400, st.lava + 14, W + 800, 6);
    }
    // zones (behind players)
    for (const z of g.zones) this.drawZone(ctx, z, g.t);
    // pickups
    for (const pk of g.pickups) {
      const bob = Math.sin(g.t * 0.08 + pk.id) * 4;
      ctx.save(); ctx.translate(pk.x, pk.y - 26 + bob);
      ctx.fillStyle = 'rgba(255,235,59,.18)'; ctx.strokeStyle = 'rgba(255,235,59,.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill(); ctx.stroke();
      if (pk.life < 180 && g.t % 10 < 5) ctx.globalAlpha = 0.4;
      ctx.rotate(-0.6); ctx.translate(-16, 0);
      if (WEAPONS[pk.w].shape === 'fist') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(16, 0, 8, 0, 7); ctx.fill(); }
      else drawWeapon(ctx, pk.w, 0.5);
      ctx.restore();
    }
    // players
    for (const p of g.players) this.drawStick(ctx, p, g.t, p.i === me);
    // projectiles
    for (const pr of g.proj) this.drawProj(ctx, pr, g.t, g);
    // particles
    this.drawParts(ctx);
    // wind streaks
    if (st.wind) {
      ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2;
      for (let k = 0; k < 18; k++) {
        const y = (k * 53) % H, x = ((g.t * 14 * g.windDir + k * 397) % (W + 200) + W + 200) % (W + 200) - 100;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - g.windDir * 60, y); ctx.stroke();
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.drawHud(ctx, g, me, cw, ch, opts);
  }

  drawBackdrop(ctx, st, t) {
    const key = st.name;
    if (!this.deco[key]) {
      const r = mulberry(key.length * 977 + key.charCodeAt(0));
      const d = { stars: [], shapes: [] };
      for (let i = 0; i < 80; i++) d.stars.push([r() * W, r() * H * 0.7, r() * 2 + 0.5]);
      for (let i = 0; i < 14; i++) d.shapes.push([r() * W, r(), r(), r()]);
      this.deco[key] = d;
    }
    const d = this.deco[key];
    const th = st.theme;
    if (['city', 'moon', 'space', 'neon', 'storm'].includes(th)) {
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (const [x, y, s] of d.stars) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.02 + x)); ctx.fillRect(x, y, s, s); }
      ctx.globalAlpha = 1;
    }
    if (th === 'city') {
      ctx.fillStyle = '#1b1e3d';
      for (const [x, a, b] of d.shapes) { const w = 60 + a * 90, h = 150 + b * 330; ctx.fillRect(x - w / 2, H - h, w, h); }
      ctx.fillStyle = 'rgba(255,235,130,.4)';
      for (const [x, a, b] of d.shapes) { const h = 150 + b * 330; for (let yy = H - h + 15; yy < H - 20; yy += 28) ctx.fillRect(x - 15, yy, 8, 10); }
      ctx.fillStyle = '#fffde7'; ctx.beginPath(); ctx.arc(1350, 140, 50, 0, 7); ctx.fill();
    } else if (th === 'volcano') {
      ctx.fillStyle = '#3e1a12'; ctx.beginPath(); ctx.moveTo(300, H); ctx.lineTo(700, 250); ctx.lineTo(900, 250); ctx.lineTo(1300, H); ctx.fill();
      ctx.fillStyle = '#ff5722'; ctx.beginPath(); ctx.ellipse(800, 252, 100, 14, 0, 0, 7); ctx.fill();
      for (const [x, a, b] of d.shapes) { ctx.fillStyle = `rgba(255,${100 + a * 100 | 0},0,.6)`; const yy = H - ((t * (1 + a) + b * H) % H); ctx.fillRect(x, yy, 3, 3); }
    } else if (th === 'sky' || th === 'desert' || th === 'jungle') {
      if (th === 'desert') {
        ctx.fillStyle = '#fff8e1'; ctx.beginPath(); ctx.arc(1300, 160, 70, 0, 7); ctx.fill();
        ctx.fillStyle = '#e6a95a'; ctx.beginPath(); ctx.moveTo(0, H); ctx.quadraticCurveTo(400, 600, 800, 800); ctx.quadraticCurveTo(1200, 600, 1600, H); ctx.fill();
        ctx.fillStyle = '#c98b45'; ctx.beginPath(); ctx.moveTo(1000, H); ctx.lineTo(1200, 560); ctx.lineTo(1400, H); ctx.fill();
      } else if (th === 'jungle') {
        for (const [x, a, b] of d.shapes) {
          ctx.fillStyle = `rgba(27,94,32,${0.4 + a * 0.4})`; ctx.fillRect(x, 0, 18 + a * 20, H);
          ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 30 * b, 0); ctx.quadraticCurveTo(x + 50, 200 + b * 200, x + 10, 380 + b * 200); ctx.stroke();
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (const [x, a, b] of d.shapes.slice(0, 6)) {
        const cx = ((x + t * (0.2 + a * 0.3)) % (W + 300)) - 150, cy = 60 + b * 250;
        ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.arc(cx + 35, cy - 10, 38, 0, 7); ctx.arc(cx + 75, cy, 28, 0, 7); ctx.fill();
      }
    } else if (th === 'ice') {
      ctx.fillStyle = 'rgba(200,240,255,.25)';
      for (const [x, a] of d.shapes) { ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x, 60 + a * 180); ctx.lineTo(x + 20, 0); ctx.fill(); }
      ctx.fillStyle = '#fff';
      for (const [x, y] of d.stars) { const yy = (y + t * 0.7) % H; ctx.fillRect((x + Math.sin(t * 0.01 + y) * 20), yy, 2, 2); }
    } else if (th === 'moon') {
      ctx.fillStyle = '#4fc3f7'; ctx.beginPath(); ctx.arc(1300, 170, 80, 0, 7); ctx.fill();
      ctx.fillStyle = '#66bb6a'; ctx.beginPath(); ctx.arc(1280, 150, 30, 0, 7); ctx.arc(1330, 200, 22, 0, 7); ctx.fill();
    } else if (th === 'factory') {
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 14;
      for (const [x, a] of d.shapes.slice(0, 6)) {
        ctx.save(); ctx.translate(x, 150 + a * 400); ctx.rotate(t * 0.01 * (a > 0.5 ? 1 : -1));
        ctx.beginPath(); ctx.arc(0, 0, 50 + a * 40, 0, 7); ctx.stroke();
        for (let k = 0; k < 8; k++) { ctx.rotate(Math.PI / 4); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(50 + a * 40, -10, 20, 20); }
        ctx.restore();
      }
    } else if (th === 'storm') {
      ctx.fillStyle = '#37474f'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(250, 380); ctx.lineTo(500, H); ctx.moveTo(1000, H); ctx.lineTo(1350, 330); ctx.lineTo(1700, H); ctx.fill();
      if ((t % 400) < 6) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-400, -400, W + 800, H + 800); }
      ctx.strokeStyle = 'rgba(180,200,255,.35)'; ctx.lineWidth = 1.5;
      for (const [x, y] of d.stars) { const yy = (y * 1.4 + t * 12) % H; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 4, yy + 16); ctx.stroke(); }
    } else if (th === 'dojo') {
      ctx.fillStyle = '#4e342e'; for (let x = 0; x < W; x += 200) ctx.fillRect(x, 0, 18, H);
      ctx.fillStyle = 'rgba(255,224,178,.15)'; for (let x = 40; x < W; x += 200) ctx.fillRect(x, 120, 140, 340);
      ctx.fillStyle = '#b71c1c'; ctx.beginPath(); ctx.arc(800, 220, 70, 0, 7); ctx.fill();
    } else if (th === 'neon') {
      ctx.strokeStyle = 'rgba(255,0,255,.25)'; ctx.lineWidth = 2;
      for (let x = -800; x < W + 800; x += 80) { ctx.beginPath(); ctx.moveTo(W / 2 + (x - W / 2) * 0.2, 520); ctx.lineTo(x, H); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const y = 520 + ((k * 50 + t) % 400); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.fillStyle = '#ff4081'; ctx.beginPath(); ctx.arc(800, 470, 120, Math.PI, 0); ctx.fill();
    } else if (th === 'space') {
      ctx.fillStyle = '#7e57c2'; ctx.beginPath(); ctx.arc(250, 200, 90, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(250, 200, 150, 28, -0.3, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(0,230,118,.15)'; ctx.fillRect(0, 820, W, 80);
    }
  }

  drawPlat(ctx, st, pl, x, y, t) {
    const h = pl.h;
    if (pl.type === 'pad') {
      ctx.fillStyle = '#212121'; ctx.fillRect(x, y, pl.w, h);
      ctx.fillStyle = `hsl(${(t * 4) % 360},100%,60%)`; ctx.fillRect(x + 6, y - 6, pl.w - 12, 10);
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      for (let k = 0; k < 3; k++) { const yy = y - 20 - ((t * 1.5 + k * 15) % 45); ctx.beginPath(); ctx.moveTo(x + pl.w / 2 - 10, yy + 8); ctx.lineTo(x + pl.w / 2, yy); ctx.lineTo(x + pl.w / 2 + 10, yy + 8); ctx.fill(); }
      return;
    }
    ctx.fillStyle = st.plat;
    roundRect(ctx, x, y, pl.w, h, 6); ctx.fill();
    ctx.fillStyle = st.platTop; ctx.fillRect(x, y, pl.w, Math.min(8, h));
    if (st.theme === 'neon') { ctx.save(); ctx.shadowColor = st.platTop; ctx.shadowBlur = 16; ctx.fillRect(x, y, pl.w, 3); ctx.restore(); }
    if (pl.move) { ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 10; k < pl.w - 10; k += 26) ctx.fillRect(x + k, y + 10, 12, 4); }
  }

  drawStick(ctx, p, t, isMe) {
    if (p.dead > 0) return;
    const col = PCOL[p.i];
    const wp = WEAPONS[p.w];
    if (p.inv > 0 && t % 8 < 4) ctx.globalAlpha = 0.45;
    ctx.save();
    ctx.translate(p.x, p.y);
    // name tag
    ctx.fillStyle = col; ctx.font = 'bold 16px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((isMe ? '▼ ' : '') + p.name, 0, -112);
    if (p.rage > 0) { ctx.save(); ctx.shadowColor = '#ff1744'; ctx.shadowBlur = 25; ctx.strokeStyle = 'rgba(255,23,68,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -42, 30, 50, 0, 0, 7); ctx.stroke(); ctx.restore(); }
    ctx.scale(p.face, 1);
    const run = p.ground && Math.abs(p.vx) > 0.6;
    const ph = p.anim * 0.09;
    let lean = run ? 0.15 : 0;
    if (p.dash > 0) lean = 0.45;
    if (p.stun > 0 && !p.frozen) lean = -0.25;
    const hipX = 0, hipY = -36;
    const neckX = Math.sin(lean) * 28, neckY = hipY - Math.cos(lean) * 28;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = col; ctx.lineWidth = 6;
    // legs
    const leg = (a, k) => {
      const kx = hipX + Math.sin(a) * 19, ky = hipY + Math.cos(a) * 19;
      const fa = a - Math.max(0, k);
      const fx = kx + Math.sin(fa) * 19, fy = ky + Math.cos(fa) * 19;
      ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
    };
    if (!p.ground) { leg(0.6, 1.2); leg(-0.2, 0.6); }
    else if (run) { const s = Math.sin(ph); leg(s * 0.8, 0.7 - s * 0.5); leg(-s * 0.8, 0.7 + s * 0.5); }
    else { leg(0.22, 0.05); leg(-0.22, 0.05); }
    // body
    ctx.beginPath(); ctx.moveTo(hipX, hipY); ctx.lineTo(neckX, neckY); ctx.stroke();
    // head
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.arc(neckX + 2, neckY - 12, 11, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(neckX + 5, neckY - 15, 4, 3);
    // headband
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(neckX - 10, neckY - 16); ctx.lineTo(neckX - 22, neckY - 10 + Math.sin(t * 0.3) * 3); ctx.stroke();
    ctx.lineWidth = 6;
    // arms
    const shX = neckX * 0.8, shY = neckY + 5;
    const arm = (a, bend) => {
      const ex = shX + Math.cos(a) * 17, ey = shY + Math.sin(a) * 17;
      const hx = ex + Math.cos(a + bend) * 17, hy = ey + Math.sin(a + bend) * 17;
      ctx.beginPath(); ctx.moveTo(shX, shY); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      return { hx, hy, a: a + bend };
    };
    const backA = run ? Math.PI / 2 - Math.sin(ph) * 0.9 : Math.PI / 2 + 0.3;
    arm(backA, -0.4);
    let fa, bend = 0;
    const melee = wp.atk.kind === 'melee';
    if (p.spin > 0) { fa = t * 0.6; }
    else if (p.uppercut > 0) { fa = -Math.PI / 2 + 0.2; }
    else if (p.dash > 0) { fa = 0; }
    else if (p.atkT > 0 && melee) {
      const k = 1 - p.atkT / 14;
      fa = -2.1 + Math.min(1, k * 1.6) * 2.9; bend = -0.2;
    } else if (!melee) { fa = -0.05 - (p.atkT > 0 ? p.atkT * 0.03 : 0); bend = 0; }
    else { fa = run ? Math.PI / 2 + Math.sin(ph) * 0.9 - 0.6 : 0.9; bend = -0.7; }
    const hand = arm(fa, bend);
    // weapon
    ctx.save(); ctx.translate(hand.hx, hand.hy); ctx.rotate(hand.a);
    if (p.w === 0) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(2, 0, 6, 0, 7); ctx.fill(); }
    drawWeapon(ctx, p.w, 0.85);
    ctx.restore();
    // melee swoosh
    if (p.atkT > 4 && melee && p.atkT < 13) {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(shX, shY, Math.min(wp.atk.range, 110), -1.6, 0.9 * (1 - p.atkT / 14) * 1.5); ctx.stroke();
    }
    if (p.spin > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(0, -40, 90, t * 0.6, t * 0.6 + 2.5); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
    // overlays (unmirrored)
    if (p.frozen > 0) {
      ctx.fillStyle = 'rgba(179,229,252,.55)'; ctx.strokeStyle = '#e1f5fe'; ctx.lineWidth = 2;
      roundRect(ctx, p.x - 30, p.y - 102, 60, 104, 8); ctx.fill(); ctx.stroke();
    }
    if (p.shield > 0) {
      ctx.save(); ctx.strokeStyle = '#80d8ff'; ctx.fillStyle = 'rgba(128,216,255,.15)'; ctx.lineWidth = 3; ctx.shadowColor = '#80d8ff'; ctx.shadowBlur = 15;
      ctx.beginPath(); ctx.arc(p.x, p.y - 45, 62 + Math.sin(t * 0.2) * 3, 0, 7); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (p.stun > 0 && !p.frozen) {
      ctx.fillStyle = '#ffeb3b';
      for (let k = 0; k < 3; k++) { const a = t * 0.2 + k * 2.1; star(ctx, p.x + Math.cos(a) * 18, p.y - 108 + Math.sin(a) * 5, 5, 5, 2); ctx.fill(); }
    }
  }

  drawProj(ctx, pr, t, g) {
    ctx.save();
    ctx.translate(pr.x, pr.y);
    const ang = Math.atan2(pr.vy, pr.vx);
    switch (pr.pk) {
      case 'bullet': ctx.rotate(ang); ctx.fillStyle = pr.c; ctx.fillRect(-8, -2, 16, 4); break;
      case 'laser': ctx.rotate(ang); ctx.shadowColor = pr.c; ctx.shadowBlur = 10; ctx.fillStyle = pr.c; ctx.fillRect(-18, -2.5, 36, 5); break;
      case 'arrow': case 'knife':
        ctx.rotate(ang); ctx.strokeStyle = pr.pk === 'arrow' ? '#8d6e63' : '#cfd8dc'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(10, 0); ctx.stroke();
        ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(8, -5); ctx.lineTo(8, 5); ctx.fill();
        break;
      case 'rocket':
        ctx.rotate(ang); ctx.fillStyle = '#556b2f'; ctx.fillRect(-12, -5, 24, 10);
        ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.moveTo(12, -5); ctx.lineTo(20, 0); ctx.lineTo(12, 5); ctx.fill();
        ctx.fillStyle = '#ffab00'; ctx.beginPath(); ctx.arc(-15, 0, 4 + Math.random() * 4, 0, 7); ctx.fill();
        break;
      case 'grenade': ctx.fillStyle = '#33691e'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#ff1744'; ctx.fillRect(-1, -10, 3, 4); break;
      case 'shuriken': ctx.rotate(t * 0.6); ctx.fillStyle = '#bdbdbd'; star(ctx, 0, 0, 4, 10, 3); ctx.fill(); break;
      case 'boomerang': ctx.rotate(t * 0.5); ctx.strokeStyle = pr.c; ctx.lineWidth = pr.r > 15 ? 12 : 7; ctx.beginPath(); ctx.moveTo(-pr.r, -pr.r * 0.8); ctx.lineTo(0, 0); ctx.lineTo(-pr.r, pr.r * 0.8); ctx.stroke(); break;
      case 'chakram': ctx.rotate(t * 0.5); ctx.strokeStyle = pr.c; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.stroke(); break;
      case 'rock': ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill(); break;
      case 'hook':
        ctx.restore(); ctx.save();
        ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.beginPath(); ctx.moveTo(pr.x, pr.y); { const ow = g.players[pr.o]; ctx.lineTo(ow.x + ow.face * 20, ow.y - 52); } ctx.stroke(); ctx.setLineDash([]);
        ctx.translate(pr.x, pr.y); ctx.rotate(ang); ctx.strokeStyle = '#eceff1'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 8, -1.5, 1.5); ctx.stroke();
        break;
      case 'flame':
        ctx.globalAlpha = Math.max(0.15, pr.life / pr.max);
        ctx.fillStyle = pr.life > pr.max * 0.6 ? '#ffeb3b' : pr.life > pr.max * 0.3 ? '#ff9800' : '#e65100';
        ctx.beginPath(); ctx.arc(0, 0, pr.r * (1.6 - pr.life / pr.max), 0, 7); ctx.fill();
        break;
      case 'wind':
        ctx.rotate(ang); ctx.strokeStyle = pr.c; ctx.lineWidth = 3;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-k * 8, 0, pr.r - k * 2, -1, 1); ctx.stroke(); }
        break;
      case 'meteor': case 'fire':
        ctx.shadowColor = '#ff6d00'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#ff6d00'; ctx.beginPath(); ctx.arc(0, 0, pr.r, 0, 7); ctx.fill();
        ctx.fillStyle = '#ffeb3b'; ctx.beginPath(); ctx.arc(0, 0, pr.r * 0.55, 0, 7); ctx.fill();
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff3d00'; ctx.beginPath(); ctx.arc(-pr.vx * 1.5, -pr.vy * 1.5, pr.r * 0.8, 0, 7); ctx.fill();
        break;
      case 'ice':
        ctx.rotate(t * 0.1); ctx.shadowColor = '#e1f5fe'; ctx.shadowBlur = 14; ctx.fillStyle = pr.c;
        star(ctx, 0, 0, 6, pr.r, pr.r * 0.45); ctx.fill();
        break;
      case 'spark':
        ctx.strokeStyle = pr.c; ctx.lineWidth = 3; ctx.shadowColor = pr.c; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(-10, 0); for (let k = 0; k < 4; k++) ctx.lineTo(-10 + k * 7, (Math.random() - 0.5) * 10); ctx.stroke();
        break;
      default: // ball
        ctx.shadowColor = pr.c; ctx.shadowBlur = 16; ctx.fillStyle = pr.c;
        ctx.beginPath(); ctx.arc(0, 0, pr.r, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(-pr.r * 0.3, -pr.r * 0.3, pr.r * 0.35, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  drawZone(ctx, z, t) {
    ctx.save();
    switch (z.k) {
      case 'bolt':
        if (z.warn > 0) {
          ctx.fillStyle = `rgba(255,241,118,${0.12 + 0.12 * Math.sin(t * 0.5)})`;
          ctx.fillRect(z.x - z.r, -400, z.r * 2, H + 800);
          ctx.strokeStyle = 'rgba(255,241,118,.7)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
          ctx.strokeRect(z.x - z.r, -400, z.r * 2, H + 800);
        }
        break;
      case 'beam': {
        const a = z.life / 22;
        ctx.shadowColor = z.c; ctx.shadowBlur = 30; ctx.fillStyle = z.c; ctx.globalAlpha = a;
        ctx.fillRect(z.x, z.y - z.r * a, z.w, z.r * 2 * a);
        ctx.fillStyle = '#fff'; ctx.fillRect(z.x, z.y - z.r * a * 0.35, z.w, z.r * a * 0.7);
        break;
      }
      case 'cloud':
        ctx.globalAlpha = Math.min(1, z.life / 40) * 0.45;
        ctx.fillStyle = z.c;
        for (let k = 0; k < 7; k++) {
          const a = k * 0.9 + t * 0.02;
          ctx.beginPath(); ctx.arc(z.x + Math.cos(a) * z.r * 0.5, z.y + Math.sin(a * 1.3) * z.r * 0.35, z.r * 0.5, 0, 7); ctx.fill();
        }
        break;
      case 'hole': {
        const g2 = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.r);
        g2.addColorStop(0, '#000'); g2.addColorStop(0.25, z.c); g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2; ctx.globalAlpha = Math.min(1, z.life / 20);
        ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(z.x, z.y, z.r * (0.3 + 0.17 * k), t * 0.15 + k, t * 0.15 + k + 1.8); ctx.stroke(); }
        break;
      }
      case 'mine':
        ctx.fillStyle = '#424242'; ctx.beginPath(); ctx.arc(z.x, z.y, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(z.x - 14, z.y, 28, 5);
        ctx.fillStyle = z.arm > 0 || t % 30 < 15 ? '#ff1744' : '#4a0000'; ctx.beginPath(); ctx.arc(z.x, z.y - 8, 3.5, 0, 7); ctx.fill();
        break;
      case 'wave':
        ctx.fillStyle = z.c; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.moveTo(z.x - 24, z.y); ctx.lineTo(z.x - 6, z.y - 50); ctx.lineTo(z.x + 4, z.y - 28); ctx.lineTo(z.x + 14, z.y - 56); ctx.lineTo(z.x + 26, z.y); ctx.fill();
        break;
      case 'tornado':
        ctx.strokeStyle = 'rgba(224,242,241,.75)'; ctx.lineWidth = 4;
        for (let k = 0; k < 9; k++) {
          const yy = z.y - k * 19, rr = 14 + k * 7;
          ctx.beginPath(); ctx.ellipse(z.x + Math.sin(t * 0.3 + k) * 8, yy, rr, 6, 0, t * 0.4 + k, t * 0.4 + k + 4.5); ctx.stroke();
        }
        break;
    }
    ctx.restore();
  }

  drawParts(ctx) {
    for (const p of this.parts) {
      p.life--;
      const a = Math.max(0, p.life / p.max);
      ctx.globalAlpha = a;
      if (p.k === 'ring') {
        p.r += (p.mr - p.r) * 0.25;
        ctx.strokeStyle = p.c; ctx.lineWidth = 6 * a + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke();
        ctx.fillStyle = p.c; ctx.globalAlpha = a * 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, 7); ctx.fill();
      } else if (p.k === 'bolt') {
        const r = mulberry(p.seed | 0);
        ctx.strokeStyle = '#fffde7'; ctx.lineWidth = 7 * a + 2; ctx.shadowColor = '#fff176'; ctx.shadowBlur = 25;
        ctx.beginPath(); let x = p.x; ctx.moveTo(x, -50);
        for (let y = 0; y < H; y += 60) { x = p.x + (r() - 0.5) * 60; ctx.lineTo(x, y); }
        ctx.stroke(); ctx.shadowBlur = 0;
      } else if (p.k === 'ghost') {
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = p.c; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 30); ctx.lineTo(p.x, p.y + 4); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y - 42, 11, 0, 7); ctx.stroke();
      } else {
        p.x += p.vx; p.y += p.vy;
        if (p.k === 'smoke') { p.vx *= 0.92; p.vy = p.vy * 0.92 - 0.1; p.s += 0.4; ctx.globalAlpha = a * 0.5; }
        else if (p.k === 'up') { p.vy -= 0.05; }
        else p.vy += 0.25;
        ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const tx of this.texts) {
      tx.life--; tx.y -= 0.8;
      ctx.globalAlpha = Math.min(1, tx.life / 20);
      ctx.font = `900 ${tx.big ? 22 : 24}px system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.strokeText(tx.s, tx.x, tx.y);
      ctx.fillStyle = tx.c; ctx.fillText(tx.s, tx.x, tx.y);
    }
    ctx.globalAlpha = 1;
    this.texts = this.texts.filter((tx) => tx.life > 0);
  }

  drawHud(ctx, g, me, cw, ch, opts) {
    const u = Math.min(cw / 900, ch / 500); // ui unit
    const pad = 12 * u;
    for (const p of g.players) {
      const right = p.i === 1;
      const bw = 230 * u, bh = 16 * u;
      const x = right ? cw - pad - bw : pad, y = pad + (opts.topInset || 0);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; roundRect(ctx, x - 6 * u, y - 6 * u, bw + 12 * u, 66 * u, 10 * u); ctx.fill();
      ctx.font = `800 ${14 * u}px system-ui, sans-serif`; ctx.textAlign = right ? 'right' : 'left'; ctx.fillStyle = PCOL[p.i];
      ctx.fillText(p.name + (p.i === me ? ' (YOU)' : ''), right ? x + bw : x, y + 10 * u);
      // hearts
      ctx.textAlign = right ? 'left' : 'right'; ctx.font = `${14 * u}px system-ui, sans-serif`;
      let hearts = '';
      for (let k = 0; k < 3; k++) hearts += k < p.lives ? '❤' : '♡';
      ctx.fillStyle = '#ff5252'; ctx.fillText(hearts, right ? x : x + bw, y + 10 * u);
      // hp bar
      const hy = y + 16 * u;
      ctx.fillStyle = '#222'; roundRect(ctx, x, hy, bw, bh, 5 * u); ctx.fill();
      const hp = Math.max(0, p.hp) / MAX_HP;
      ctx.fillStyle = hp > 0.5 ? '#4caf50' : hp > 0.25 ? '#ffc107' : '#f44336';
      const fw = bw * hp;
      roundRect(ctx, right ? x + bw - fw : x, hy, fw, bh, 5 * u); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = `700 ${11 * u}px system-ui, sans-serif`; ctx.textAlign = 'center';
      ctx.fillText(Math.max(0, Math.ceil(p.hp)) + ' HP', x + bw / 2, hy + bh * 0.78);
      // weapon + skill
      const wp = WEAPONS[p.w];
      ctx.textAlign = right ? 'right' : 'left'; ctx.font = `700 ${11.5 * u}px system-ui, sans-serif`; ctx.fillStyle = '#ffe082';
      ctx.fillText(wp.name, right ? x + bw : x, hy + bh + 14 * u);
      const ready = p.skillCd <= 0;
      ctx.fillStyle = ready ? '#69f0ae' : '#90a4ae';
      ctx.textAlign = right ? 'left' : 'right';
      ctx.fillText((ready ? '★ ' : '') + wp.skill.name + (ready ? '' : ' ' + Math.ceil(p.skillCd / 60) + 's'), right ? x : x + bw, hy + bh + 14 * u);
    }
    // countdown / banner
    ctx.textAlign = 'center';
    if (g.countdown > 0) {
      const n = Math.ceil(g.countdown / 60);
      bigText(ctx, String(n), cw / 2, ch / 2, 120 * u, '#fff');
      bigText(ctx, STAGES[g.stage].name, cw / 2, ch / 2 - 110 * u, 34 * u, '#ffe082');
    } else if (g.t >= 180 && g.t < 225) {
      bigText(ctx, 'FIGHT!', cw / 2, ch / 2, 110 * u, '#ff5252');
    }
    if (this.banner && !g.over) {
      this.banner.life--;
      bigText(ctx, this.banner.s, cw / 2, ch * 0.42, 90 * u, this.banner.c);
      if (this.banner.life <= 0) this.banner = null;
    }
    const me_ = g.players[me];
    if (me_ && me_.dead > 0 && !g.over && me_.lives > 0) {
      bigText(ctx, 'Respawning... ' + me_.lives + ' ❤ left', cw / 2, ch * 0.6, 26 * u, '#fff');
    }
    if (opts.ping != null) {
      ctx.font = `${10 * u}px system-ui`; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.textAlign = 'center';
      ctx.fillText(opts.ping + ' ms', cw / 2, 16 * u);
    }
  }
}

function bigText(ctx, s, x, y, size, col) {
  ctx.font = `900 ${size}px system-ui, sans-serif`;
  ctx.lineWidth = size / 10; ctx.strokeStyle = 'rgba(0,0,0,.8)'; ctx.strokeText(s, x, y);
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (w <= 0) return;
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function mulberry(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
