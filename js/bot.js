// Simple CPU opponent for practice mode. Produces the same input shape as a human.
import { WEAPONS } from './weapons.js';
import { STAGES, platAt } from './stages.js';
import { emptyInput } from './game.js';

export class Bot {
  constructor(level = 1) {
    this.s = emptyInput();
    this.level = level; // -1 target dummy, 0 easy, 1 normal, 2 hard
    this.think = 0;
    this.plan = { x: 0 };
  }

  groundBelow(g, x, y) {
    const st = STAGES[g.stage];
    for (const pl of st.plats) {
      const p = platAt(pl, g.t);
      if (x > p.x + 5 && x < p.x + pl.w - 5 && p.y >= y - 5) return p.y;
    }
    return null;
  }

  update(g, i) {
    const me = g.players[i], o = g.players[1 - i];
    const s = this.s;
    s.atk = false;
    if (this.level < 0 || me.dead > 0 || g.countdown > 0) { s.x = 0; s.u = false; return { ...s }; }
    const react = [14, 7, 3][this.level];
    if (--this.think > 0) return { ...s };
    this.think = react;
    s.u = false;
    const wp = WEAPONS[me.w];
    const dx = o.x - me.x, dy = o.y - me.y, adx = Math.abs(dx);
    const ranged = wp.atk.kind === 'shot';
    const want = ranged ? 380 : wp.atk.range * 0.7;

    // weapon pickup nearby
    let pick = null;
    for (const pk of g.pickups) if (Math.abs(pk.x - me.x) < 400 && Math.abs(pk.y - me.y) < 200 && (me.w === 0 || Math.random() < 0.1)) pick = pk;

    let tx = o.x;
    if (pick) tx = pick.x;
    else if (ranged && adx < 200) tx = me.x - Math.sign(dx) * 200;
    let mx = Math.abs(tx - me.x) > (pick ? 10 : want) ? Math.sign(tx - me.x) : 0;
    if (!pick && !mx && o.dead <= 0) mx = 0;

    // avoid walking off ledges
    const ahead = me.x + mx * 60;
    const below = this.groundBelow(g, ahead, me.y);
    s.d = false;
    if (me.ground && mx !== 0 && below === null) {
      // only jump the gap if the target is roughly across
      if (Math.abs(tx - me.x) > 120 && this.groundBelow(g, me.x + mx * 240, me.y - 200) !== null) s.jc++;
      else mx = 0;
    }
    // recovery when off-stage
    const under = this.groundBelow(g, me.x, me.y);
    if (!me.ground && under === null) {
      const st = STAGES[g.stage];
      let best = null, bd = 1e9;
      for (const pl of st.plats) { const p = platAt(pl, g.t); const cx = p.x + pl.w / 2, d = Math.abs(cx - me.x); if (d < bd) { bd = d; best = cx; } }
      if (best !== null) mx = Math.sign(best - me.x);
      s.u = me.fuel > 0 && me.y > 300; // fly back up to the stage
      if (me.vy > 2 && me.jumps > 0) s.jc++;
      else if (me.vy > 4 && me.skillCd <= 0 && (wp.skill.type === 'uppercut' || wp.skill.type === 'dash')) s.sc++;
    }
    // chase vertically
    if (me.ground && dy < -120 && adx < 300 && Math.random() < 0.5) { s.jc++; s.u = dy < -200; }
    if (me.ground && dy > 100 && adx < 200 && me.onPlat === 'oneway') { s.d = true; s.jc++; }
    s.x = mx;

    // face and attack
    const facing = Math.sign(dx) === me.face || adx < 20;
    const inRange = ranged ? Math.abs(dy) < 90 : adx < wp.atk.range + 10 && Math.abs(dy) < 80;
    if (o.dead <= 0 && inRange) {
      if (!facing) s.x = Math.sign(dx);
      else if (Math.random() < [0.4, 0.7, 0.95][this.level]) { s.atk = true; s.ac++; }
    }
    // skill
    if (me.skillCd <= 0 && o.dead <= 0 && Math.random() < [0.05, 0.15, 0.3][this.level]) {
      const t = wp.skill.type;
      const close = adx < 200 && Math.abs(dy) < 100;
      const ok = {
        dash: close && facing, spin: close, slam: close, explosion: adx < 140, heal: me.hp < 60, shield: g.proj.some((p) => p.o !== i) || close,
        teleport: true, uppercut: adx < 90, rage: true, mines: close, rapid: inRange && facing, quake: me.ground && Math.abs(dy) < 30,
      }[t];
      if (ok === undefined ? facing || ['lightning', 'meteor', 'blackhole'].includes(t) : ok) s.sc++;
    }
    if (pick && Math.abs(pick.x - me.x) < 40) s.gc++;
    return { ...s };
  }
}
