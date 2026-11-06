import { WEAPONS, SKILL_DESC } from './weapons.js';
import { STAGES, W, H, platAt } from './stages.js';
import { createGame, step, emptyInput } from './game.js';
import { Renderer, weaponIcon, PCOL } from './render.js';
import { Input } from './input.js';
import { Net } from './net.js';
import { Bot } from './bot.js';
import { unlockAudio, sfx, setMuted, isMuted } from './audio.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

// ---------------- app state ----------------
const app = {
  mode: null,           // 'local' | 'host' | 'guest'
  net: null,
  lobby: { stage: -1, picks: [-1, -1], names: ['P1', 'P2'], connected: false },
  me: 0,
  game: null,
  running: false,
  paused: false,
  remoteIn: emptyInput(),
  bot: null,
  netFx: [],
  snaps: [],
};

const input = new Input();
const renderer = new Renderer($('cv'));

// ---------------- screens ----------------
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
  document.body.classList.toggle('ingame', id === 'game');
}
let toastT;
function toast(msg, ms = 2600) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { sfx('click'); leaveToMenu(); }));
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('click', (e) => { if (e.target.closest('.btn,.tile')) sfx('click'); }, { capture: true });
if (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) document.body.classList.add('force-touch');

// name
const nameInput = $('nameInput');
nameInput.value = store.get('stm-name', 'Stick' + Math.floor(Math.random() * 900 + 100));
nameInput.addEventListener('change', () => store.set('stm-name', nameInput.value.trim() || 'Player'));
const myName = () => (nameInput.value.trim() || 'Player').slice(0, 12);

// sound
const sndBtn = $('btnSound');
const updSnd = () => { sndBtn.textContent = isMuted() ? '🔇 Sound' : '🔊 Sound'; };
updSnd();
sndBtn.onclick = () => { setMuted(!isMuted()); updSnd(); };

// install (PWA)
let deferredPrompt = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('btnInstall').classList.remove('hidden'); });
$('btnInstall').onclick = async () => {
  if (!deferredPrompt) { toast('Use Chrome menu ⋮ → Install app'); return; }
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null; $('btnInstall').classList.add('hidden');
};
addEventListener('appinstalled', () => { $('btnInstall').classList.add('hidden'); toast('Installed! Open it from your home screen.'); });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ---------------- menu actions ----------------
$('btnHow').onclick = () => show('how');
$('btnArmory').onclick = () => { buildArmory(); show('armory'); };
$('btnJoin').onclick = () => {
  if (typeof Peer === 'undefined') { toast('Online play unavailable (library failed to load)'); return; }
  $('joinStatus').textContent = ''; $('joinStatus').classList.remove('err');
  show('join'); setTimeout(() => $('roomInput').focus(), 50);
};
$('roomInput').addEventListener('input', (e) => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5); });
$('roomInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('btnJoinGo').click(); });

$('btnPractice').onclick = () => {
  resetNet();
  app.mode = 'local'; app.me = 0;
  app.lobby = { stage: -1, picks: [-1, -1], names: [myName(), 'Bot'], connected: true };
  $('roomBox').classList.add('hidden'); $('cpuBox').classList.remove('hidden');
  openLobby();
};

$('btnCreate').onclick = () => {
  if (typeof Peer === 'undefined') { toast('Online play unavailable (library failed to load)'); return; }
  resetNet();
  app.mode = 'host'; app.me = 0;
  app.lobby = { stage: -1, picks: [-1, -1], names: [myName(), 'waiting…'], connected: false };
  $('roomBox').classList.remove('hidden'); $('cpuBox').classList.add('hidden');
  $('roomCode').textContent = '·····';
  openLobby();
  setLobbyStatus('Creating room…');
  const net = app.net = new Net();
  net.onError = (m) => { setLobbyStatus(m, true); };
  net.host((code) => {
    app.room = code;
    $('roomCode').textContent = code;
    setLobbyStatus('Share room number ' + code + ' with your friend. Waiting for them to join…');
  });
  net.onOpen = () => {};
  net.onData = hostOnData;
  net.onClose = () => onPeerLeft();
};

$('btnJoinGo').onclick = () => {
  const code = $('roomInput').value.trim();
  if (code.length !== 5) { $('joinStatus').textContent = 'Room number has 5 digits.'; $('joinStatus').classList.add('err'); return; }
  resetNet();
  app.mode = 'guest'; app.me = 1; app.room = code;
  $('joinStatus').classList.remove('err');
  $('joinStatus').textContent = 'Connecting to room ' + code + '…';
  const net = app.net = new Net();
  net.onError = (m) => { if (app.mode === 'guest' && !app.lobby.connected) { $('joinStatus').textContent = m; $('joinStatus').classList.add('err'); } else toast(m); };
  net.onOpen = () => { net.send({ t: 'hello', name: myName() }); };
  net.onData = guestOnData;
  net.onClose = () => onPeerLeft();
  net.join(code);
};

$('btnShare').onclick = async () => {
  const text = `Fight me in Stickmen PvP Arena! Room number: ${app.room}`;
  const url = location.href.split('#')[0] + '#room=' + app.room;
  try {
    if (navigator.share) await navigator.share({ title: 'Stickmen PvP Arena', text, url });
    else { await navigator.clipboard.writeText(text + ' ' + url); toast('Copied invite to clipboard'); }
  } catch {}
};

$('btnLeave').onclick = () => leaveToMenu();

function resetNet() {
  if (app.net) app.net.close();
  app.net = null; app.running = false; app.game = null; app.snaps = []; app.netFx = [];
  app.remoteIn = emptyInput();
}

function leaveToMenu() {
  resetNet();
  app.mode = null;
  $('result').classList.add('hidden'); $('pauseMenu').classList.add('hidden');
  exitFullscreen();
  show('menu');
}

function onPeerLeft() {
  if (!app.mode || app.mode === 'local') return;
  toast('Opponent disconnected', 3500);
  leaveToMenu();
}

// ---------------- lobby ----------------
function setLobbyStatus(msg, err) {
  const s = $('lobbyStatus'); s.textContent = msg; s.classList.toggle('err', !!err);
}

function openLobby() {
  show('lobby');
  buildWeaponGrid();
  buildStageGrid();
  refreshLobby();
  setLobbyStatus(app.mode === 'local' ? 'Pick your weapon and a stage, then press START.' : '');
}

function buildWeaponGrid() {
  const grid = $('weaponGrid');
  grid.innerHTML = '';
  const mk = (id, label, canvas) => {
    const d = document.createElement('div');
    d.className = 'tile'; d.dataset.w = id;
    if (canvas) d.appendChild(canvas); else { const s = document.createElement('div'); s.style.fontSize = '26px'; s.textContent = '🎲'; d.appendChild(s); }
    const l = document.createElement('span'); l.textContent = label; d.appendChild(l);
    d.onclick = () => pickWeapon(id);
    grid.appendChild(d);
  };
  mk(-1, 'Random', null);
  WEAPONS.forEach((wp, i) => mk(i, wp.name, weaponIcon(i, 44)));
}

function stageThumb(i) {
  const st = STAGES[i];
  const c = document.createElement('canvas'); c.width = 192; c.height = 108;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 108); g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, 192, 108);
  const s = 192 / W;
  if (st.lava) { ctx.fillStyle = '#ff3d00'; ctx.fillRect(0, st.lava * s, 192, 108); }
  for (const pl of st.plats) {
    ctx.fillStyle = pl.type === 'pad' ? '#ff00ff' : st.plat; ctx.fillRect(pl.x * s, pl.y * s, pl.w * s, Math.max(3, pl.h * s));
    ctx.fillStyle = st.platTop; ctx.fillRect(pl.x * s, pl.y * s, pl.w * s, 2);
  }
  return c;
}

function buildStageGrid() {
  const grid = $('stageGrid');
  grid.innerHTML = '';
  const mk = (id, label, canvas) => {
    const d = document.createElement('div');
    d.className = 'tile stage'; d.dataset.s = id;
    if (canvas) d.appendChild(canvas);
    else { const c = document.createElement('canvas'); c.width = 192; c.height = 108; const x = c.getContext('2d'); x.fillStyle = '#262b44'; x.fillRect(0, 0, 192, 108); x.font = '50px sans-serif'; x.textAlign = 'center'; x.fillText('🎲', 96, 72); d.appendChild(c); }
    const l = document.createElement('span'); l.textContent = label; d.appendChild(l);
    d.onclick = () => pickStage(id);
    grid.appendChild(d);
  };
  mk(-1, 'Random', null);
  STAGES.forEach((st, i) => {
    const tags = [st.lava && 'lava', st.ice && 'ice', st.grav && 'low-grav', st.wind && 'wind', st.walls && 'walls', st.plats.some((p) => p.type === 'pad') && 'jump pads', st.plats.some((p) => p.move) && 'moving'].filter(Boolean);
    mk(i, st.name + (tags.length ? ' · ' + tags.join(', ') : ''), stageThumb(i));
  });
}

function pickWeapon(id) {
  app.lobby.picks[app.me] = id;
  if (app.mode === 'guest') app.net.send({ t: 'pick', w: id });
  if (app.mode === 'host') sendLobby();
  refreshLobby();
}
function pickStage(id) {
  if (app.mode === 'guest') return;
  app.lobby.stage = id;
  if (app.mode === 'host') sendLobby();
  refreshLobby();
}

function refreshLobby() {
  const L = app.lobby;
  const myPick = L.picks[app.me], oppPick = L.picks[1 - app.me];
  document.querySelectorAll('#weaponGrid .tile').forEach((t) => {
    const w = +t.dataset.w;
    t.classList.toggle('sel', w === myPick);
    t.classList.toggle('opp', app.mode !== 'local' && L.connected && w === oppPick && w !== -1);
  });
  const guestView = app.mode === 'guest';
  document.querySelectorAll('#stageGrid .tile').forEach((t) => {
    t.classList.toggle('sel', +t.dataset.s === L.stage);
    t.classList.toggle('disabled', guestView);
  });
  $('stageHint').textContent = guestView ? '(host chooses)' : '';
  $('lobP1').textContent = L.names[0];
  $('lobP2').textContent = L.names[1];
  $('btnStart').classList.toggle('hidden', guestView);
  $('btnStart').disabled = !(app.mode === 'local' || (app.mode === 'host' && L.connected));
  // info
  const info = $('weaponInfo');
  if (myPick === -1) info.innerHTML = '<b>Random weapon</b><br>Get a surprise weapon. Grab more weapons that drop during the fight!';
  else {
    const wp = WEAPONS[myPick];
    const a = wp.atk;
    const atkTxt = a.kind === 'melee' ? `Melee · ${a.dmg} dmg · reach ${a.range}` : `Ranged · ${a.dmg} dmg${a.count > 1 ? ' ×' + a.count : ''}${a.explode ? ' · explosive' : ''}`;
    info.innerHTML = `<b>${wp.name}</b><span class="cat">${wp.cat}</span><br>${atkTxt} · speed ${Math.round(60 / a.cd * 10) / 10}/s<br><span class="sk">★ ${wp.skill.name}</span> – ${SKILL_DESC[wp.skill.type]} (${Math.round(wp.skill.cd / 60)}s)`;
  }
}

function sendLobby() {
  if (app.mode !== 'host') return;
  app.net.send({ t: 'lobby', L: app.lobby });
}

$('btnStart').onclick = () => {
  if (app.mode === 'guest') return;
  const L = app.lobby;
  const stage = L.stage === -1 ? Math.floor(Math.random() * STAGES.length) : L.stage;
  const rw = () => 1 + Math.floor(Math.random() * (WEAPONS.length - 1));
  const weapons = L.picks.map((p) => (p === -1 ? rw() : p));
  if (app.mode === 'local') {
    app.bot = new Bot(+$('cpuLevel').value);
    weapons[1] = app.bot.level < 0 ? 0 : rw();
    L.names[1] = app.bot.level < 0 ? 'Target' : 'Bot';
  }
  if (app.mode === 'host') app.net.send({ t: 'start', stage, weapons, names: L.names });
  startGame(stage, weapons, L.names);
};

// ---------------- network handlers ----------------
function hostOnData(d) {
  switch (d.t) {
    case 'hello':
      app.lobby.names[1] = String(d.name || 'Guest').slice(0, 12);
      app.lobby.connected = true;
      setLobbyStatus(app.lobby.names[1] + ' joined! Pick weapons and stage, then press START.');
      sendLobby(); refreshLobby(); sfx('spawn');
      break;
    case 'pick':
      app.lobby.picks[1] = d.w | 0;
      if (app.lobby.picks[1] < -1 || app.lobby.picks[1] >= WEAPONS.length) app.lobby.picks[1] = -1;
      sendLobby(); refreshLobby();
      break;
    case 'in':
      app.remoteIn = sanitizeInput(d.i);
      break;
  }
}

function sanitizeInput(i) {
  if (!i) return emptyInput();
  return { x: Math.max(-1, Math.min(1, +i.x || 0)), u: !!i.u, d: !!i.d, atk: !!i.atk, jc: i.jc | 0, ac: i.ac | 0, sc: i.sc | 0, gc: i.gc | 0 };
}

function guestOnData(d) {
  switch (d.t) {
    case 'full':
      $('joinStatus').textContent = 'That room is full.'; $('joinStatus').classList.add('err');
      break;
    case 'lobby': {
      const first = !app.lobby.connected;
      const mine = app.lobby.picks[1];
      app.lobby = d.L; app.lobby.connected = true;
      if (!first) app.lobby.picks[1] = mine;
      if (first || !document.getElementById('lobby').classList.contains('active')) {
        if (!app.running) {
          $('roomBox').classList.remove('hidden'); $('cpuBox').classList.add('hidden');
          $('roomCode').textContent = app.room;
          openLobby();
          setLobbyStatus('Connected! Pick your weapon. The host will start the match.');
        }
      }
      refreshLobby();
      break;
    }
    case 'start':
      startGame(d.stage, d.weapons, d.names);
      break;
    case 's': {
      const s = typeof d.d === 'string' ? JSON.parse(d.d) : d.d;
      app.snaps.push({ s, at: performance.now() });
      if (app.snaps.length > 3) app.snaps.shift();
      if (d.fx && d.fx.length) renderer.events(d.fx, app.me);
      app.game = s;
      break;
    }
    case 'tolobby':
      $('result').classList.add('hidden');
      app.running = false;
      exitFullscreen();
      $('roomCode').textContent = app.room;
      openLobby();
      setLobbyStatus('Rematch! Pick your weapon.');
      break;
  }
}

// ---------------- game loop ----------------
function startGame(stage, weapons, names) {
  app.game = createGame(stage, weapons, names);
  app.snaps = [];
  app.running = true; app.paused = false;
  app.remoteIn = emptyInput();
  renderer.parts = []; renderer.texts = []; renderer.banner = null;
  app.resultShown = false;
  $('result').classList.add('hidden'); $('pauseMenu').classList.add('hidden');
  show('game');
  enterFullscreen();
  renderer.resize();
  lastT = performance.now(); acc = 0; frame = 0;
  requestAnimationFrame(loop);
}

let lastT = 0, acc = 0, frame = 0, lastSend = 0, lastInStr = '';
const STEP = 1000 / 60;

function loop(now) {
  if (!app.running) return;
  requestAnimationFrame(loop);
  const g = app.game;
  if (app.mode === 'guest') {
    // send input
    const inp = input.read();
    const str = JSON.stringify(inp);
    if (str !== lastInStr || now - lastSend > 100) {
      app.net.send({ t: 'in', i: inp }); lastInStr = str; lastSend = now;
    }
    const rs = interpState(now);
    if (rs) {
      renderer.draw(rs, app.me, { ping: app.net.ping });
      updateSkillBtn(rs);
      if (rs.over) showResult(rs);
    }
    return;
  }

  // host / local: fixed timestep simulation
  acc += Math.min(250, now - lastT);
  lastT = now;
  if (app.paused) acc = 0;
  while (acc >= STEP) {
    acc -= STEP;
    const local = input.read();
    const other = app.mode === 'local' ? app.bot.update(g, 1) : app.remoteIn;
    if (!g.over || g.t < g.overT + 150) step(g, [local, other]);
    if (g.over && g.overT == null) g.overT = g.t;
    const fx = g.fx; g.fx = [];
    renderer.events(fx, app.me);
    if (app.mode === 'host') {
      app.netFx.push(...fx);
      frame++;
      if (frame % 2 === 0) {
        const snap = JSON.stringify(g, (k, v) => (k === 'fx' || k === 'li' ? undefined : typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 10) / 10 : v));
        app.net.send({ t: 's', d: snap, fx: app.netFx });
        app.netFx = [];
      }
    }
  }
  renderer.draw(g, app.me, { ping: app.mode === 'host' ? app.net && app.net.ping : null });
  updateSkillBtn(g);
  if (g.over && g.t > (g.overT || 0) + 120) showResult(g);
}

function lerp(a, b, t) { return a + (b - a) * t; }
function interpState(now) {
  const n = app.snaps.length;
  if (!n) return app.game;
  const cur = app.snaps[n - 1];
  if (n < 2) return cur.s;
  const prev = app.snaps[n - 2];
  const span = Math.max(16, cur.at - prev.at);
  const t = Math.min(1, (now - cur.at) / span);
  const s = { ...cur.s, players: cur.s.players.map((p, i) => {
    const q = prev.s.players[i];
    if (!q || Math.abs(q.x - p.x) > 200 || Math.abs(q.y - p.y) > 200) return p;
    return { ...p, x: lerp(q.x, p.x, t), y: lerp(q.y, p.y, t) };
  }) };
  const pm = new Map(prev.s.proj.map((p) => [p.id, p]));
  s.proj = cur.s.proj.map((p) => { const q = pm.get(p.id); return q ? { ...p, x: lerp(q.x, p.x, t), y: lerp(q.y, p.y, t) } : p; });
  return s;
}

function updateSkillBtn(g) {
  const p = g.players[app.me];
  const wp = WEAPONS[p.w];
  const frac = p.skillCd > 0 ? Math.min(1, p.skillCd / wp.skill.cd) : 0;
  $('skillCd').style.height = (frac * 100) + '%';
}

function showResult(g) {
  if (app.resultShown) return;
  app.resultShown = true;
  const win = g.winner === app.me;
  $('resTitle').textContent = win ? '🏆 VICTORY!' : '💀 DEFEAT';
  $('resTitle').style.color = PCOL[g.winner];
  $('resStats').innerHTML = g.players.map((p) => `<div style="border:2px solid ${PCOL[p.i]}"><b style="color:${PCOL[p.i]}">${escapeHtml(p.name)}${p.i === g.winner ? ' 👑' : ''}</b>KOs: ${p.kos}<br>Damage: ${Math.round(p.dmgDealt)}<br>Lives left: ${Math.max(0, p.lives)}<br>${WEAPONS[p.w].name}</div>`).join('');
  const isGuest = app.mode === 'guest';
  $('btnRematch').classList.toggle('hidden', isGuest);
  $('resNote').textContent = isGuest ? 'Waiting for host to start a rematch…' : '';
  $('result').classList.remove('hidden');
  sfx(win ? 'go' : 'ko');
}

$('btnRematch').onclick = () => {
  $('result').classList.add('hidden');
  app.running = false;
  exitFullscreen();
  if (app.mode === 'host') {
    app.net.send({ t: 'tolobby' });
    $('roomCode').textContent = app.room;
    openLobby();
    sendLobby();
    setLobbyStatus('Pick weapons and stage, then press START.');
  } else openLobby();
};
$('btnMenu').onclick = () => leaveToMenu();
$('btnPause').onclick = () => {
  $('pauseTitle').textContent = app.mode === 'local' ? 'Paused' : 'Menu (game keeps running)';
  if (app.mode === 'local') app.paused = true;
  $('pauseMenu').classList.remove('hidden');
};
$('btnResume').onclick = () => { app.paused = false; $('pauseMenu').classList.add('hidden'); };
$('btnQuit').onclick = () => leaveToMenu();

// ---------------- helpers ----------------
function enterFullscreen() {
  if (!document.body.classList.contains('force-touch')) return;
  const el = document.documentElement;
  try {
    const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : null;
    if (p && p.then) p.then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {});
  } catch {}
}
function exitFullscreen() {
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch {}
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function buildArmory() {
  const list = $('armoryList');
  if (list.childElementCount) return;
  WEAPONS.forEach((wp, i) => {
    if (i === 0) return;
    const d = document.createElement('div'); d.className = 'arm';
    d.appendChild(weaponIcon(i, 48));
    const a = wp.atk;
    const t = document.createElement('div');
    t.innerHTML = `<b>${i}. ${wp.name}</b><span class="cat">${wp.cat}</span><br>${a.kind === 'melee' ? 'Melee' : 'Ranged'} · ${a.dmg} dmg${a.count > 1 ? ' ×' + a.count : ''}<br><span class="sk">★ ${wp.skill.name}</span> – ${SKILL_DESC[wp.skill.type]}`;
    d.appendChild(t); list.appendChild(d);
  });
}

// join via link: index.html#room=12345
const m = location.hash.match(/room=(\d{5})/);
if (m) { $('roomInput').value = m[1]; setTimeout(() => $('btnJoin').click(), 100); }

// debug/testing hook
window.__stm = { app, step, createGame };
