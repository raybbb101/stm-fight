// Touch (virtual joystick + buttons) and keyboard input.
import { emptyInput } from './game.js';

export class Input {
  constructor() {
    this.s = emptyInput();
    this.keys = new Set();
    this.stick = { x: 0, y: 0, id: null, ox: 0, oy: 0 };
    this.held = { a: false };
    this.upLatch = false;
    this.bindKeyboard();
    this.bindTouch();
  }

  bindKeyboard() {
    const map = { KeyJ: 'a', KeyF: 'a', KeyK: 's', KeyG: 's', KeyL: 'g', KeyE: 'g', Space: 'j', KeyW: 'j', ArrowUp: 'j' };
    addEventListener('keydown', (e) => {
      if (e.target && e.target.tagName === 'INPUT') return;
      if (this.keys.has(e.code)) return;
      this.keys.add(e.code);
      const m = map[e.code];
      if (m) { this.press(m, true); e.preventDefault(); }
    });
    addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      const m = map[e.code];
      if (m) this.press(m, false);
    });
    addEventListener('blur', () => { this.keys.clear(); this.held.a = false; });
  }

  press(k, down) {
    if (k === 'a') { this.held.a = down; if (down) this.s.ac++; }
    else if (down) {
      if (k === 'j') this.s.jc++;
      if (k === 's') this.s.sc++;
      if (k === 'g') this.s.gc++;
    }
  }

  bindTouch() {
    const zone = document.getElementById('stickZone');
    const base = document.getElementById('stickBase');
    const knob = document.getElementById('stickKnob');
    const R = 55;
    const setKnob = () => {
      knob.style.transform = `translate(${this.stick.x * R}px, ${this.stick.y * R}px)`;
    };
    zone.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      this.stick.id = e.pointerId;
      const zr = zone.getBoundingClientRect();
      this.stick.ox = e.clientX; this.stick.oy = e.clientY;
      base.style.left = (e.clientX - zr.left) + 'px';
      base.style.top = (e.clientY - zr.top) + 'px';
      base.classList.add('active');
      this.stick.x = 0; this.stick.y = 0; setKnob();
    });
    const move = (e) => {
      if (e.pointerId !== this.stick.id) return;
      let dx = (e.clientX - this.stick.ox) / R, dy = (e.clientY - this.stick.oy) / R;
      const d = Math.hypot(dx, dy);
      if (d > 1) { dx /= d; dy /= d; }
      this.stick.x = dx; this.stick.y = dy; setKnob();
      // flick up = jump
      if (dy < -0.7 && !this.upLatch) { this.upLatch = true; this.s.jc++; }
      if (dy > -0.4) this.upLatch = false;
    };
    const end = (e) => {
      if (e.pointerId !== this.stick.id) return;
      this.stick.id = null; this.stick.x = 0; this.stick.y = 0; setKnob();
      base.classList.remove('active'); this.upLatch = false;
    };
    zone.addEventListener('pointermove', move);
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);

    document.querySelectorAll('[data-k]').forEach((b) => {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add('down'); this.press(k, true); if (navigator.vibrate) navigator.vibrate(8); });
      const up = () => { b.classList.remove('down'); this.press(k, false); };
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', up);
      b.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  read() {
    const k = this.keys;
    let x = this.stick.x;
    if (Math.abs(x) < 0.25) x = 0; else x = Math.sign(x);
    if (k.has('KeyA') || k.has('ArrowLeft')) x = -1;
    if (k.has('KeyD') || k.has('ArrowRight')) x = 1;
    const d = this.stick.y > 0.6 || k.has('KeyS') || k.has('ArrowDown');
    this.s.x = x; this.s.d = d; this.s.u = this.stick.y < -0.6;
    this.s.atk = this.held.a;
    return { ...this.s };
  }
}
