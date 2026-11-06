// Tiny synthesized sound effects (no audio files needed).
let ac = null, noiseBuf = null, master = null;
let muted = false;
try { muted = localStorage.getItem('stm-muted') === '1'; } catch {}

export function unlockAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.35; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch { ac = null; }
}
export function setMuted(m) { muted = m; try { localStorage.setItem('stm-muted', m ? '1' : '0'); } catch {} }
export function isMuted() { return muted; }

function tone(type, f0, f1, dur, vol = 0.5) {
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.5, freq = 1000, q = 1) {
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
}

const last = {};
export function sfx(n) {
  if (!ac || muted) return;
  const now = performance.now();
  if (last[n] && now - last[n] < 45) return; // throttle spam
  last[n] = now;
  switch (n) {
    case 'hit': noise(0.12, 0.7, 900, 0.8); tone('square', 220, 80, 0.1, 0.25); break;
    case 'swing': noise(0.1, 0.25, 2500, 2); break;
    case 'shoot': tone('square', 900, 200, 0.08, 0.15); break;
    case 'launch': noise(0.25, 0.4, 400, 0.6); break;
    case 'flame': noise(0.08, 0.15, 600, 0.5); break;
    case 'boom': noise(0.5, 0.9, 150, 0.5); tone('sine', 120, 30, 0.4, 0.6); break;
    case 'ko': tone('sawtooth', 400, 50, 0.6, 0.4); noise(0.6, 0.6, 200, 0.4); break;
    case 'jump': tone('sine', 300, 600, 0.1, 0.15); break;
    case 'pad': tone('sine', 200, 1200, 0.25, 0.3); break;
    case 'skill': tone('triangle', 500, 1200, 0.18, 0.25); break;
    case 'pickup': tone('square', 600, 1200, 0.12, 0.2); break;
    case 'heal': tone('sine', 500, 1000, 0.3, 0.25); break;
    case 'block': tone('triangle', 1400, 900, 0.1, 0.3); break;
    case 'teleport': tone('sine', 1200, 200, 0.2, 0.2); break;
    case 'thunder': noise(0.6, 0.9, 300, 0.3); break;
    case 'freeze': tone('triangle', 1800, 600, 0.3, 0.2); break;
    case 'beam': tone('sawtooth', 200, 1600, 0.3, 0.25); break;
    case 'hole': tone('sine', 300, 40, 0.8, 0.4); break;
    case 'rage': tone('sawtooth', 100, 300, 0.4, 0.3); break;
    case 'shield': tone('sine', 400, 800, 0.25, 0.25); break;
    case 'tick': tone('square', 600, 600, 0.1, 0.2); break;
    case 'go': tone('square', 900, 900, 0.3, 0.25); break;
    case 'drop': tone('sine', 800, 400, 0.2, 0.15); break;
    case 'spawn': tone('triangle', 300, 900, 0.3, 0.2); break;
    case 'wind': noise(0.8, 0.2, 500, 0.3); break;
    case 'fly': noise(0.35, 0.3, 700, 0.6); tone('sawtooth', 120, 260, 0.3, 0.12); break;
    case 'click': tone('square', 700, 700, 0.04, 0.15); break;
  }
}
