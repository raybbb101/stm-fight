// Authoritative game simulation. Runs on the host (or locally in practice mode).
import { WEAPONS } from './weapons.js';
import { STAGES, W, H, platAt } from './stages.js';

export const LIVES = 3;
export const MAX_HP = 100;
const PW = 14, PH = 78; // half width, height
export const FUEL = 105; // flight time in frames (~1.75s) when holding up
const NUM_WEAPONS = WEAPONS.length;

export function emptyInput() {
  return { x: 0, u: false, d: false, atk: false, jc: 0, ac: 0, sc: 0, gc: 0 };
}

function makePlayer(i, stage, weapon, name) {
  const [sx, sy] = stage.spawns[i];
  return {
    i, name, x: sx, y: sy, vx: 0, vy: 0, face: i === 0 ? 1 : -1,
    hp: MAX_HP, lives: LIVES, w: weapon, ground: false, jumps: 1, fuel: FUEL, flying: false, upHold: 0,
    atkT: 0, atkCd: 0, skillCd: 60, stun: 0, frozen: 0, inv: 0, shield: 0, rage: 0,
    spin: 0, dash: 0, slam: false, rapid: 0, dead: 0, anim: 0, drop: 0, hitDone: true,
    uppercut: 0, lastBy: -1, kos: 0, dmgDealt: 0,
    li: { jc: 0, ac: 0, sc: 0, gc: 0 },
  };
}

export function createGame(stageId, weapons, names) {
  const stage = STAGES[stageId];
  return {
    t: 0, stage: stageId, countdown: 180, over: false, winner: -1,
    players: [makePlayer(0, stage, weapons[0], names[0]), makePlayer(1, stage, weapons[1], names[1])],
    proj: [], zones: [], pickups: [], fx: [], nid: 1, dropT: 300,
    windDir: 1,
  };
}

const fx = (g, e) => g.fx.push(e);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function playerBox(p) { return { x: p.x - PW, y: p.y - PH, w: PW * 2, h: PH }; }
function rectHit(r, p) {
  const b = playerBox(p);
  return r.x < b.x + b.w && r.x + r.w > b.x && r.y < b.y + b.h && r.y + r.h > b.y;
}
function circleHit(cx, cy, r, p) {
  const b = playerBox(p);
  const nx = clamp(cx, b.x, b.x + b.w), ny = clamp(cy, b.y, b.y + b.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
}
const alive = (p) => p.dead <= 0;

// ---------- damage ----------
function applyHit(g, target, attacker, dmg, kbx, kby, o = {}) {
  if (!alive(target) || target.inv > 0 || g.over) return false;
  if (target.shield > 0) {
    fx(g, { t: 'block', x: target.x, y: target.y - 45 });
    return false;
  }
  if (attacker && attacker.rage > 0) dmg *= 1.5;
  dmg = Math.round(dmg);
  target.hp -= dmg;
  // knockback grows as the target gets weaker
  const scale = 1 + (MAX_HP - Math.max(0, target.hp)) / MAX_HP * 0.9;
  target.vx = kbx * scale;
  target.vy = kby * scale;
  target.stun = Math.max(target.stun, Math.min(30, 8 + dmg * 0.7));
  target.atkT = 0; target.dash = 0; target.spin = 0; target.rapid = 0;
  if (o.freeze) target.frozen = Math.max(target.frozen, o.freeze);
  target.lastBy = attacker ? attacker.i : -1;
  if (attacker) attacker.dmgDealt += dmg;
  fx(g, { t: 'hit', x: target.x, y: target.y - 45, d: dmg, c: o.color || '#fff' });
  if (target.hp <= 0) loseLife(g, target, true);
  return true;
}

function loseLife(g, p, launched) {
  if (p.dead > 0) return;
  p.lives--;
  p.hp = 0;
  p.dead = 100;
  p.frozen = 0; p.stun = 0; p.shield = 0; p.rage = 0; p.spin = 0; p.dash = 0; p.rapid = 0;
  const other = g.players[1 - p.i];
  other.kos++;
  fx(g, { t: 'ko', x: clamp(p.x, 40, W - 40), y: clamp(p.y - 40, 40, H - 40), i: p.i });
  if (p.lives <= 0) {
    g.over = true;
    g.winner = other.i;
    fx(g, { t: 'win', i: other.i });
  }
}

function respawn(g, p) {
  const st = STAGES[g.stage];
  const [sx] = st.spawns[p.i];
  p.x = sx; p.y = 80; p.vx = 0; p.vy = 0; p.hp = MAX_HP; p.inv = 150; p.jumps = 1; p.fuel = FUEL; p.flying = false;
  p.skillCd = Math.min(p.skillCd, 60);
  fx(g, { t: 'spawn', x: p.x, y: p.y - 40, i: p.i });
}

function explode(g, x, y, r, dmg, owner, color) {
  fx(g, { t: 'boom', x, y, r, c: color || '#ffab40' });
  for (const p of g.players) {
    if (p.i === owner) continue;
    if (circleHit(x, y, r, p)) {
      const dx = p.x - x, dy = (p.y - 40) - y;
      const d = Math.hypot(dx, dy) || 1;
      applyHit(g, p, g.players[owner], dmg, (dx / d) * 13, Math.min(-6, (dy / d) * 13), { color });
    }
  }
}

// ---------- projectiles ----------
function spawnProj(g, owner, x, y, angle, speed, o) {
  g.proj.push({
    id: g.nid++, o: owner, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
    r: o.r ?? 5, dmg: o.dmg, kb: o.kb ?? 4, grav: o.grav ?? 0, life: o.life ?? 90, max: o.life ?? 90,
    pierce: !!o.pierce, explode: o.explode ?? 0, pk: o.pk ?? 'bullet', c: o.color || '#ffeb3b',
    freeze: o.freeze || 0, hook: !!o.hook, ret: o.pk === 'boomerang' || o.pk === 'chakram' || !!o.ret,
    hit: [], bounce: o.pk === 'grenade' ? 3 : 0,
  });
}

function handPos(p) { return { x: p.x + p.face * 22, y: p.y - 52 }; }

function aimAngle(g, p) {
  // gentle auto-aim toward opponent when they are in front
  const o = g.players[1 - p.i];
  const dx = o.x - p.x, dy = (o.y - 40) - (p.y - 52);
  if (Math.sign(dx) === p.face && Math.abs(dy) < Math.abs(dx) * 0.6 && alive(o)) {
    return Math.atan2(dy, dx);
  }
  return p.face > 0 ? 0 : Math.PI;
}

function normalAttack(g, p) {
  const wp = WEAPONS[p.w];
  const a = wp.atk;
  if (a.kind === 'melee') {
    p.atkT = 14; p.hitDone = false;
    fx(g, { t: 'snd', n: 'swing' });
  } else {
    p.atkT = 10;
    const h = handPos(p);
    const base = aimAngle(g, p);
    for (let k = 0; k < a.count; k++) {
      const off = a.count > 1 ? (k / (a.count - 1) - 0.5) * 2 * a.spread : (Math.random() - 0.5) * a.spread;
      spawnProj(g, p.i, h.x, h.y, base + off, a.speed, { ...a, color: a.color || wp.color, freeze: a.pk === 'ice' ? 20 : 0 });
    }
    fx(g, { t: 'snd', n: a.pk === 'rocket' || a.pk === 'grenade' ? 'launch' : a.pk === 'flame' ? 'flame' : 'shoot' });
  }
}

function meleeCheck(g, p) {
  const wp = WEAPONS[p.w], a = wp.atk;
  const o = g.players[1 - p.i];
  const r = p.face > 0
    ? { x: p.x - 10, y: p.y - 90, w: a.range + 10, h: 85 }
    : { x: p.x - a.range, y: p.y - 90, w: a.range + 10, h: 85 };
  if (rectHit(r, o)) {
    applyHit(g, o, p, a.dmg, p.face * a.kb, -a.kb * 0.55 - 2, { color: wp.color });
  }
  // melee can destroy enemy projectiles
  for (const pr of g.proj) {
    if (pr.o !== p.i && pr.x > r.x && pr.x < r.x + r.w && pr.y > r.y && pr.y < r.y + r.h && !pr.hook) {
      pr.life = 0; fx(g, { t: 'spark', x: pr.x, y: pr.y });
    }
  }
}

// ---------- skills ----------
function doSkill(g, p) {
  const wp = WEAPONS[p.w], s = wp.skill;
  const o = g.players[1 - p.i];
  const h = handPos(p);
  p.skillCd = s.cd;
  fx(g, { t: 'skill', i: p.i, name: s.name, x: p.x, y: p.y - 100, c: wp.color });
  switch (s.type) {
    case 'dash':
      p.dash = s.dur || 14; p.dashSpd = s.speed || 22; p.hitDone = false; p.vy = -1;
      break;
    case 'spin':
      p.spin = s.dur || 60;
      break;
    case 'slam':
      if (p.ground) slamImpact(g, p);
      else { p.slam = true; p.vy = 26; }
      break;
    case 'burst': {
      const n = s.n || 5, sp = s.spreadA ?? 0.3;
      const base = aimAngle(g, p);
      const atk = wp.atk.kind === 'shot' ? wp.atk : { speed: 16, pk: 'ball', r: 8 };
      for (let k = 0; k < n; k++) {
        const ang = base + (n > 1 ? (k / (n - 1) - 0.5) * 2 * sp : 0);
        spawnProj(g, p.i, h.x, h.y, ang, atk.speed || 16, {
          dmg: s.dmg, pk: s.pk || atk.pk, r: s.r || atk.r, grav: atk.grav, life: s.life || 70,
          color: s.color || atk.color || wp.color, kb: 6,
        });
      }
      fx(g, { t: 'snd', n: 'shoot' });
      break;
    }
    case 'fireball':
      spawnProj(g, p.i, h.x, h.y, aimAngle(g, p), 11, { dmg: s.dmg, r: 20, pk: 'fire', explode: 120, color: '#ff5722', life: 120 });
      fx(g, { t: 'snd', n: 'launch' });
      break;
    case 'lightning': {
      const n = s.n || 1;
      for (let k = 0; k < n; k++) {
        g.zones.push({ id: g.nid++, k: 'bolt', o: p.i, x: o.x + (k - (n - 1) / 2) * 140, y: 0, r: 40, life: 50 + k * 12, warn: 40 + k * 12, dmg: s.dmg, c: '#fff176', hit: false });
      }
      break;
    }
    case 'freeze':
      spawnProj(g, p.i, h.x, h.y, aimAngle(g, p), 13, { dmg: s.dmg, r: s.big ? 26 : 16, pk: 'ice', freeze: s.big ? 130 : 100, color: '#b3e5fc', life: 100, pierce: !!s.big });
      fx(g, { t: 'snd', n: 'freeze' });
      break;
    case 'teleport':
      if (alive(o)) {
        fx(g, { t: 'smoke', x: p.x, y: p.y - 40 });
        p.x = clamp(o.x - o.face * 50, 30, W - 30); p.y = o.y; p.vy = 0; p.vx = 0;
        p.face = o.x > p.x ? 1 : -1;
        fx(g, { t: 'smoke', x: p.x, y: p.y - 40 });
        p.atkT = 14;
        applyHit(g, o, p, s.dmg, p.face * 10, -7, { color: wp.color });
      }
      break;
    case 'shield':
      p.shield = s.dur || 120;
      fx(g, { t: 'snd', n: 'shield' });
      break;
    case 'heal':
      if (alive(o) && Math.hypot(o.x - p.x, o.y - p.y) < 220) applyHit(g, o, p, s.dmg, p.face * 4, -5, { color: '#ff1744' });
      p.hp = Math.min(MAX_HP, p.hp + s.heal);
      fx(g, { t: 'heal', x: p.x, y: p.y - 40, v: s.heal });
      break;
    case 'boomerang':
      spawnProj(g, p.i, h.x, h.y, p.face > 0 ? 0 : Math.PI, 17, { dmg: s.dmg, r: 22, pk: 'boomerang', pierce: true, life: 90, color: wp.color, kb: 9 });
      break;
    case 'meteor': {
      const n = s.n || 6;
      for (let k = 0; k < n; k++) {
        const x = (alive(o) ? o.x : W / 2) + rnd(-260, 260);
        spawnProj(g, p.i, x, -40 - k * 70, Math.PI / 2 + rnd(-0.1, 0.1), 9, {
          dmg: s.dmg, r: s.pk === 'meteor' ? 16 : 7, pk: s.pk || 'meteor', grav: 0.15, life: 200,
          explode: s.explode || 0, color: s.pk === 'meteor' ? '#ff7043' : wp.color, kb: 6,
        });
      }
      break;
    }
    case 'grapple':
      spawnProj(g, p.i, h.x, h.y, aimAngle(g, p), 24, { dmg: s.dmg, r: 10, pk: 'hook', hook: true, life: 32, color: '#cfd8dc' });
      break;
    case 'poison':
      g.zones.push({ id: g.nid++, k: 'cloud', o: p.i, x: p.x + p.face * 170, y: p.y - 50, r: 120, life: 240, dmg: s.dmg, c: s.color, tick: 0 });
      break;
    case 'blackhole':
      g.zones.push({ id: g.nid++, k: 'hole', o: p.i, x: clamp(p.x + p.face * 240, 100, W - 100), y: p.y - 80, r: 190, life: 160, dmg: s.dmg, c: s.color, tick: 0 });
      fx(g, { t: 'snd', n: 'hole' });
      break;
    case 'explosion':
      explode(g, p.x, p.y - 40, 150, s.dmg, p.i, wp.color);
      p.inv = Math.max(p.inv, 10);
      break;
    case 'beam': {
      const x0 = h.x, x1 = p.face > 0 ? W + 400 : -400;
      g.zones.push({ id: g.nid++, k: 'beam', o: p.i, x: Math.min(x0, x1), y: h.y, w: Math.abs(x1 - x0), r: 18, life: 22, dmg: s.dmg, c: s.color || wp.color, hit: false });
      fx(g, { t: 'snd', n: 'beam' });
      break;
    }
    case 'uppercut':
      p.vy = -17 * (STAGES[g.stage].jump || 1); p.uppercut = 18; p.hitDone = false; p.atkT = 14;
      break;
    case 'rage':
      p.rage = s.dur || 300;
      fx(g, { t: 'snd', n: 'rage' });
      break;
    case 'mines': {
      const n = s.n || 1;
      for (let k = 0; k < n; k++) {
        g.zones.push({ id: g.nid++, k: 'mine', o: p.i, x: p.x + (k - (n - 1) / 2) * 70 - p.face * 10, y: p.y - 6, r: 16, life: 900, arm: 30, dmg: s.dmg, c: '#f44336', vy: n > 1 ? -6 : 0 });
      }
      break;
    }
    case 'quake':
      if (p.ground) g.zones.push({ id: g.nid++, k: 'wave', o: p.i, x: p.x, y: p.y, vx: p.face * 13, r: 30, life: 70, dmg: s.dmg, c: wp.color, hit: false });
      else p.skillCd = 20; // must be grounded
      break;
    case 'tornado':
      g.zones.push({ id: g.nid++, k: 'tornado', o: p.i, x: p.x + p.face * 60, y: p.y, vx: p.face * 4.5, r: 70, life: 200, dmg: s.dmg, c: '#b2dfdb', tick: 0 });
      break;
    case 'rapid':
      p.rapid = s.dur || 90;
      break;
  }
}

function slamImpact(g, p) {
  const s = WEAPONS[p.w].skill;
  p.slam = false;
  fx(g, { t: 'boom', x: p.x, y: p.y - 10, r: 120, c: '#d7ccc8' });
  fx(g, { t: 'shake', v: 12 });
  const o = g.players[1 - p.i];
  if (Math.abs(o.x - p.x) < 130 && Math.abs(o.y - p.y) < 110) applyHit(g, o, p, s.dmg, Math.sign(o.x - p.x || 1) * 12, -14, { color: '#d7ccc8' });
  for (const d of [-1, 1]) g.zones.push({ id: g.nid++, k: 'wave', o: p.i, x: p.x, y: p.y, vx: d * 11, r: 26, life: 45, dmg: s.dmg * 0.5, c: '#d7ccc8', hit: false });
}

// ---------- step ----------
export function step(g, inputs) {
  const st = STAGES[g.stage];
  g.t++;
  if (g.countdown > 0) {
    g.countdown--;
    if (g.countdown % 60 === 0) fx(g, { t: 'snd', n: g.countdown === 0 ? 'go' : 'tick' });
  }
  const active = g.countdown <= 0;
  if (st.wind && g.t % 360 === 0) { g.windDir *= -1; fx(g, { t: 'snd', n: 'wind' }); }

  // platforms (current positions + deltas)
  const plats = st.plats.map((pl) => {
    const a = platAt(pl, g.t), b = platAt(pl, g.t - 1);
    return { ...pl, x: a.x, y: a.y, dx: a.x - b.x, dy: a.y - b.y };
  });

  for (let i = 0; i < 2; i++) {
    const p = g.players[i];
    const inp = inputs[i] || emptyInput();
    const o = g.players[1 - i];
    const press = (k) => inp[k] !== p.li[k];
    const pj = press('jc'), pa = press('ac'), ps = press('sc'), pg = press('gc');
    p.li = { jc: inp.jc, ac: inp.ac, sc: inp.sc, gc: inp.gc };

    if (p.dead > 0) {
      p.dead--;
      if (p.dead === 0 && !g.over) respawn(g, p);
      continue;
    }
    // timers
    if (p.atkCd > 0) p.atkCd--;
    if (p.skillCd > 0) p.skillCd--;
    if (p.atkT > 0) p.atkT--;
    if (p.inv > 0) p.inv--;
    if (p.shield > 0) p.shield--;
    if (p.rage > 0) p.rage--;
    if (p.stun > 0) p.stun--;
    if (p.frozen > 0) p.frozen--;
    if (p.drop > 0) p.drop--;
    if (p.uppercut > 0) p.uppercut--;

    const canAct = active && p.stun <= 0 && p.frozen <= 0;
    const wp = WEAPONS[p.w];
    const spdMul = p.rage > 0 ? 1.3 : 1;

    // horizontal control
    let target = 0;
    if (canAct && p.dash <= 0) {
      target = inp.x * 6.5 * spdMul;
      if (inp.x !== 0 && p.atkT <= 0 && p.spin <= 0) p.face = inp.x > 0 ? 1 : -1;
    }
    const accel = p.stun > 0 || p.frozen > 0 ? 0.04 : p.ground ? (st.ice ? 0.05 : 0.32) : 0.12;
    if (p.dash > 0) {
      p.vx = p.face * p.dashSpd; p.dash--;
      if (!p.hitDone && rectHit({ x: p.x - 30, y: p.y - 80, w: 60, h: 80 }, o)) {
        p.hitDone = true; applyHit(g, o, p, wp.skill.dmg, p.face * 13, -8, { color: wp.color });
      }
      if (p.dash % 3 === 0) fx(g, { t: 'trail', x: p.x, y: p.y - 40, i: p.i });
    } else if (p.frozen <= 0) {
      p.vx += (target - p.vx) * accel;
    } else {
      p.vx *= 0.9;
    }
    if (st.wind && active) p.vx += st.wind * g.windDir * (p.ground ? 0.6 : 1);

    // jump
    if (canAct && (pj) && p.dash <= 0) {
      if (inp.d && p.ground && p.onPlat === 'oneway') {
        p.drop = 14; p.ground = false;
      } else if (p.ground || p.jumps > 0) {
        if (!p.ground) p.jumps--;
        p.vy = -12 * (st.jump || 1); // small hop; keep holding up to fly
        p.ground = false;
        fx(g, { t: 'jump', x: p.x, y: p.y });
      }
    }
    if (canAct && inp.d && p.ground && p.onPlat === 'oneway' && inp.x === 0 && !pj && p.dropHold > 12) {
      p.drop = 14; p.ground = false;
    }
    p.dropHold = inp.d && p.ground ? (p.dropHold || 0) + 1 : 0;

    // attack
    if (canAct && p.dash <= 0) {
      const rapidFire = p.rapid > 0 && g.t % (wp.atk.kind === 'melee' ? 6 : 4) === 0;
      if (rapidFire || ((pa || inp.atk) && p.atkCd <= 0 && p.spin <= 0)) {
        normalAttack(g, p);
        p.atkCd = Math.round(wp.atk.cd * (p.rage > 0 ? 0.6 : 1));
      }
      if (ps && p.skillCd <= 0) doSkill(g, p);
    }
    if (p.rapid > 0) p.rapid--;
    if (wp.atk.kind === 'melee' && p.atkT === 9 && !p.hitDone) { p.hitDone = true; meleeCheck(g, p); }
    if (p.atkT === 0 && p.uppercut <= 0) p.hitDone = true;
    // uppercut hit
    if (p.uppercut > 0 && !p.hitDone) {
      if (rectHit({ x: p.x + (p.face > 0 ? -10 : -60), y: p.y - 120, w: 70, h: 120 }, o)) {
        p.hitDone = true; applyHit(g, o, p, wp.skill.dmg, p.face * 4, -21, { color: wp.color });
      }
    }
    // spin
    if (p.spin > 0) {
      p.spin--;
      if (p.spin % 8 === 0) {
        if (circleHit(p.x, p.y - 40, 95, o)) applyHit(g, o, p, wp.skill.dmg, Math.sign(o.x - p.x || 1) * 7, -6, { color: wp.color });
        fx(g, { t: 'snd', n: 'swing' });
      }
    }

    // grab weapon
    if (canAct && pg) {
      let best = null, bd = 80;
      for (const pk of g.pickups) {
        const d = Math.hypot(pk.x - p.x, pk.y - (p.y - 20));
        if (d < bd) { bd = d; best = pk; }
      }
      if (best) {
        const old = p.w;
        p.w = best.w; p.atkCd = 10; p.skillCd = Math.min(p.skillCd, 90); p.rapid = 0; p.spin = 0;
        g.pickups.splice(g.pickups.indexOf(best), 1);
        if (old !== 0) g.pickups.push({ id: g.nid++, w: old, x: p.x, y: p.y - 30, vy: -6, life: 900, gnd: false });
        fx(g, { t: 'pickup', x: p.x, y: p.y - 60, i: p.i, w: p.w });
      }
    }

    // gravity
    const grav = st.grav || 0.75;
    if (p.dash > 0) p.vy *= 0.5;
    else p.vy = Math.min(p.vy + grav, p.slam ? 30 : 18);

    // flight: keep holding up -> fly upward until the fuel runs out, then fall
    p.upHold = inp.u && canAct ? p.upHold + 1 : 0;
    const wasFlying = p.flying;
    p.flying = p.upHold > 8 && p.fuel > 0 && p.dash <= 0 && !p.slam && (wasFlying || p.fuel >= 25);
    if (p.flying) {
      p.fuel--;
      p.vy = Math.max(p.vy - grav - 0.8, -6 * (st.jump || 1));
      if (!wasFlying) fx(g, { t: 'snd', n: 'fly' });
    }

    // move & collide
    const prevY = p.y;
    p.x += p.vx;
    p.y += p.vy;
    const wasGround = p.ground;
    p.ground = false; p.onPlat = null;
    if (p.vy >= 0) {
      for (const pl of plats) {
        if (p.drop > 0 && pl.type === 'oneway') continue;
        if (p.x + PW * 0.5 < pl.x || p.x - PW * 0.5 > pl.x + pl.w) continue;
        const top = pl.y;
        if (prevY <= top - pl.dy + 2 && p.y >= top) {
          if (pl.type === 'pad') {
            p.y = top; p.vy = -24 * (st.jump || 1); p.jumps = 1;
            fx(g, { t: 'pad', x: p.x, y: top });
            break;
          }
          p.y = top; p.vy = 0; p.ground = true; p.onPlat = pl.type; p.jumps = 1;
          p.x += pl.dx;
          if (!wasGround && prevY < top - 6) fx(g, { t: 'land', x: p.x, y: top });
          break;
        }
      }
    }
    // solid sides (only tall 'solid' blocks) - push out horizontally
    for (const pl of plats) {
      if (pl.type !== 'solid' || pl.h < 60) continue;
      if (p.y > pl.y + 4 && p.y - PH < pl.y + pl.h && p.x + PW > pl.x && p.x - PW < pl.x + pl.w) {
        if (p.x < pl.x + pl.w / 2) p.x = pl.x - PW; else p.x = pl.x + pl.w + PW;
        p.vx *= -0.2;
      }
    }
    if (p.ground && p.slam) slamImpact(g, p);
    if (p.ground && !p.flying && !inp.u) p.fuel = Math.min(FUEL, p.fuel + 3); // recharge after landing & releasing up
    if (p.ground) p.anim += Math.abs(p.vx);
    if (st.walls) {
      if (p.x < PW) { p.x = PW; p.vx = Math.abs(p.vx) * 0.5; }
      if (p.x > W - PW) { p.x = W - PW; p.vx = -Math.abs(p.vx) * 0.5; }
      if (p.y - PH < -300) { p.y = PH - 300; p.vy = Math.abs(p.vy) * 0.3; }
    }
    // lava
    if (st.lava && p.y > st.lava && alive(p)) {
      p.vy = -21; p.y = st.lava;
      if (p.inv <= 0) { p.inv = 0; applyHit(g, p, null, 12, 0, -21, { color: '#ff5722' }); p.inv = 40; }
      fx(g, { t: 'boom', x: p.x, y: st.lava, r: 40, c: '#ff5722' });
    }
    // ring-out
    if (alive(p) && (p.y > H + 250 || p.x < -350 || p.x > W + 350 || p.y < -900)) {
      loseLife(g, p, false);
      fx(g, { t: 'shake', v: 16 });
    }
  }

  // body bump so players don't overlap completely
  const [a, b] = g.players;
  if (alive(a) && alive(b) && Math.abs(a.x - b.x) < 20 && Math.abs(a.y - b.y) < 60) {
    const push = a.x < b.x ? -1 : 1;
    a.x += push * 1.5; b.x -= push * 1.5;
  }

  stepProjectiles(g, plats);
  stepZones(g, plats);
  stepPickups(g, plats, active);
}

function stepProjectiles(g, plats) {
  const st = STAGES[g.stage];
  for (const pr of g.proj) {
    const owner = g.players[pr.o];
    pr.vy += pr.grav;
    if (pr.ret && pr.life < pr.max * 0.55) {
      // return to owner
      const dx = owner.x - pr.x, dy = (owner.y - 50) - pr.y, d = Math.hypot(dx, dy) || 1;
      pr.vx += (dx / d) * 1.6; pr.vy += (dy / d) * 1.6;
      const sp = Math.hypot(pr.vx, pr.vy);
      if (sp > 20) { pr.vx *= 20 / sp; pr.vy *= 20 / sp; }
      if (d < 30 && alive(owner)) pr.life = 0;
      if (pr.hit.length && g.t % 12 === 0) pr.hit = [];
    }
    pr.x += pr.vx; pr.y += pr.vy;
    pr.life--;
    // platform collision for heavy projectiles
    if (pr.explode || pr.pk === 'meteor' || pr.pk === 'grenade' || pr.pk === 'rock') {
      for (const pl of plats) {
        if (pr.x > pl.x && pr.x < pl.x + pl.w && pr.y + pr.r > pl.y && pr.y - pr.vy + pr.r <= pl.y + 2) {
          if (pr.bounce > 0) { pr.bounce--; pr.y = pl.y - pr.r; pr.vy *= -0.55; pr.vx *= 0.7; }
          else pr.life = 0;
          break;
        }
      }
      if (st.lava && pr.y > st.lava) pr.life = 0;
    }
    // hit players
    for (const p of g.players) {
      if (p.i === pr.o || !alive(p) || pr.hit.includes(p.i) || pr.life <= 0) continue;
      if (!circleHit(pr.x, pr.y, pr.r, p)) continue;
      if (p.shield > 0) {
        // reflect
        pr.o = p.i; pr.vx *= -1.2; pr.vy *= -0.5; pr.life = Math.max(pr.life, 50); pr.max = pr.life * 3;
        fx(g, { t: 'block', x: pr.x, y: pr.y });
        continue;
      }
      if (pr.explode) { pr.life = 0; break; }
      const dir = Math.sign(pr.vx) || (p.x > pr.x ? 1 : -1);
      if (pr.hook) {
        const dx = owner.x - p.x;
        applyHit(g, p, owner, pr.dmg, Math.sign(dx) * Math.min(22, Math.abs(dx) / 9 + 6), -8, { color: '#cfd8dc' });
        p.stun = Math.max(p.stun, 24);
        pr.life = 0;
        break;
      }
      applyHit(g, p, owner, pr.dmg, dir * pr.kb, -pr.kb * 0.5 - 1.5, { color: pr.c, freeze: pr.freeze });
      pr.hit.push(p.i);
      if (!pr.pierce) pr.life = 0;
    }
    if (pr.life <= 0 && pr.explode) explode(g, pr.x, pr.y, pr.explode, pr.dmg, pr.o, pr.c);
    if (pr.x < -500 || pr.x > W + 500 || pr.y > H + 300) pr.life = 0;
  }
  g.proj = g.proj.filter((p) => p.life > 0);
}

function stepZones(g, plats) {
  for (const z of g.zones) {
    z.life--;
    const owner = g.players[z.o];
    const o = g.players[1 - z.o];
    switch (z.k) {
      case 'bolt':
        z.warn--;
        if (z.warn === 0) {
          fx(g, { t: 'bolt', x: z.x }); fx(g, { t: 'shake', v: 8 });
          if (alive(o) && Math.abs(o.x - z.x) < z.r + PW) applyHit(g, o, owner, z.dmg, Math.sign(o.x - z.x || 1) * 5, -12, { color: '#fff176' });
        }
        break;
      case 'beam':
        if (!z.hit && alive(o) && rectHit({ x: z.x, y: z.y - z.r, w: z.w, h: z.r * 2 }, o)) {
          z.hit = true; applyHit(g, o, owner, z.dmg, Math.sign(o.x - owner.x || 1) * 14, -6, { color: z.c });
        }
        break;
      case 'cloud':
        z.tick++;
        if (alive(o) && circleHit(z.x, z.y, z.r, o)) {
          o.vx *= 0.9;
          if (z.tick % 10 === 0 && o.inv <= 0 && o.shield <= 0) {
            o.hp -= z.dmg; o.lastBy = z.o; owner.dmgDealt += z.dmg;
            fx(g, { t: 'hit', x: o.x, y: o.y - 50, d: z.dmg, c: z.c, small: true });
            if (o.hp <= 0) loseLife(g, o, true);
          }
        }
        break;
      case 'hole':
        z.tick++;
        if (alive(o) && o.shield <= 0) {
          const dx = z.x - o.x, dy = z.y - (o.y - 40), d = Math.hypot(dx, dy);
          if (d < z.r) {
            o.vx += (dx / (d || 1)) * 1.1; o.vy += (dy / (d || 1)) * 1.1 - 0.3;
            if (z.tick % 10 === 0 && o.inv <= 0) {
              o.hp -= z.dmg; o.lastBy = z.o; owner.dmgDealt += z.dmg;
              fx(g, { t: 'hit', x: o.x, y: o.y - 50, d: z.dmg, c: z.c, small: true });
              if (o.hp <= 0) loseLife(g, o, true);
            }
          }
        }
        if (z.life === 0) explode(g, z.x, z.y, 110, 10, z.o, z.c);
        break;
      case 'mine':
        if (z.vy !== 0) {
          z.vy += 0.6; z.y += z.vy;
          for (const pl of plats) if (z.x > pl.x && z.x < pl.x + pl.w && z.y >= pl.y && z.y - z.vy <= pl.y + 2) { z.y = pl.y - 6; z.vy = 0; break; }
          if (z.y > H + 100) z.life = 0;
        }
        if (z.arm > 0) z.arm--;
        else if (alive(o) && circleHit(z.x, z.y, 30, o)) { z.life = 0; explode(g, z.x, z.y, 90, z.dmg, z.o, '#ff7043'); }
        break;
      case 'wave': {
        z.x += z.vx;
        // follow ground: drop if no platform under
        let on = false;
        for (const pl of plats) if (z.x > pl.x && z.x < pl.x + pl.w && Math.abs(pl.y - z.y) < 30) { z.y = pl.y; on = true; break; }
        if (!on) z.life = 0;
        if (!z.hit && alive(o) && rectHit({ x: z.x - 20, y: z.y - 60, w: 40, h: 60 }, o)) {
          z.hit = true; applyHit(g, o, owner, z.dmg, Math.sign(z.vx) * 6, -17, { color: z.c });
        }
        if (g.t % 3 === 0) fx(g, { t: 'dust', x: z.x, y: z.y, c: z.c });
        break;
      }
      case 'tornado':
        z.tick++;
        z.x += z.vx;
        for (const pl of plats) if (z.x > pl.x && z.x < pl.x + pl.w && Math.abs(pl.y - z.y) < 40) { z.y = pl.y; break; }
        if (alive(o) && o.shield <= 0 && rectHit({ x: z.x - z.r * 0.6, y: z.y - 170, w: z.r * 1.2, h: 170 }, o)) {
          o.vy = Math.min(o.vy, -9); o.vx += (z.x - o.x) * 0.05 + z.vx * 0.2;
          if (z.tick % 8 === 0 && o.inv <= 0) {
            o.hp -= z.dmg; o.lastBy = z.o; owner.dmgDealt += z.dmg;
            fx(g, { t: 'hit', x: o.x, y: o.y - 50, d: z.dmg, c: z.c, small: true });
            if (o.hp <= 0) loseLife(g, o, true);
          }
        }
        if (z.x < -100 || z.x > W + 100) z.life = 0;
        break;
    }
  }
  g.zones = g.zones.filter((z) => z.life > 0);
}

function stepPickups(g, plats, active) {
  if (active && !g.over) {
    g.dropT--;
    if (g.dropT <= 0 && g.pickups.length < 3) {
      g.dropT = 420;
      const st = STAGES[g.stage];
      const pl = st.plats[Math.floor(Math.random() * st.plats.length)];
      const pos = platAt(pl, g.t);
      g.pickups.push({ id: g.nid++, w: 1 + Math.floor(Math.random() * (NUM_WEAPONS - 1)), x: pos.x + 30 + Math.random() * Math.max(0, pl.w - 60), y: -40, vy: 0, life: 1100, gnd: false });
      fx(g, { t: 'snd', n: 'drop' });
    } else if (g.dropT <= 0) g.dropT = 120;
  }
  for (const pk of g.pickups) {
    pk.life--;
    pk.vy = Math.min(pk.vy + 0.4, 10);
    const prevY = pk.y;
    pk.y += pk.vy;
    for (const pl of plats) {
      if (pl.type === 'pad') continue;
      if (pk.x > pl.x && pk.x < pl.x + pl.w && prevY <= pl.y - pl.dy + 1 && pk.y >= pl.y) { pk.y = pl.y; pk.vy = 0; pk.x += pl.dx; break; }
    }
    if (pk.y > H + 100) pk.life = 0;
  }
  g.pickups = g.pickups.filter((p) => p.life > 0);
}
